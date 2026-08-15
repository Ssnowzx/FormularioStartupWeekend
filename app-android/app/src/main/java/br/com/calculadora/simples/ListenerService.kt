package br.com.calculadora.simples

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.BatteryManager
import android.os.Build
import android.os.IBinder
import android.util.Log
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledFuture
import java.util.concurrent.TimeUnit

private const val TAG = "calc"
private const val CHANNEL_ID = "sync"
private const val NOTIFICATION_ID = 1

/**
 * Keeps listening while the app is open, and carries the alert once it fires.
 *
 * Android will not let a microphone foreground service start from the
 * background or from BOOT_COMPLETED, so this is always born from a visible
 * Activity. That is a platform limit with no legitimate workaround, not an
 * implementation shortcut.
 */
class ListenerService : Service() {

    private lateinit var settings: Settings
    private lateinit var api: Api
    private lateinit var tracker: LocationTracker
    private var detector: KeywordDetector? = null
    private val worker = Executors.newSingleThreadExecutor()
    private val monitor = Executors.newSingleThreadScheduledExecutor()
    private var watcher: ScheduledFuture<*>? = null
    private var alert: AlertHandle? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        settings = Settings(this)
        api = Api(this, settings)
        tracker = LocationTracker(this)
        createChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_CANCEL -> { cancelAlert(); return START_STICKY }
            ACTION_STOP -> { stopSelf(); return START_NOT_STICKY }
        }
        startForegroundListening()
        if (settings.isReady && detector == null) startDetector()
        resumeIfOpen()
        return START_STICKY
    }

    /**
     * The notification is required by the platform, so it is made as quiet as
     * the platform allows: minimum importance, no sound, no vibration, no
     * status bar icon, and the same name as the app itself. On Android 13+,
     * if the user never grants POST_NOTIFICATIONS, it is not drawn at all
     * while the service keeps running.
     */
    private fun startForegroundListening() {
        val notification = buildNotification()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    /**
     * Location is only added to the service type at the moment an alert fires.
     * Declaring it from the start would leave the location indicator lit in
     * the status bar around the clock — a permanent signal that this is not
     * the calculator it claims to be.
     */
    private fun promoteToLocation() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return
        runCatching {
            startForeground(
                NOTIFICATION_ID, buildNotification(),
                ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE or
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION)
        }
    }

    private fun createChannel() {
        val channel = NotificationChannel(CHANNEL_ID, getString(R.string.channel_name),
            NotificationManager.IMPORTANCE_MIN).apply {
            setShowBadge(false)
            enableLights(false)
            enableVibration(false)
            setSound(null, null)
            lockscreenVisibility = Notification.VISIBILITY_SECRET
        }
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }

    private fun buildNotification(): Notification {
        val open = PendingIntent.getActivity(
            this, 0, Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        return Notification.Builder(this, CHANNEL_ID)
            .setContentTitle(getString(R.string.app_name))
            .setSmallIcon(android.R.drawable.ic_menu_view)
            .setContentIntent(open)
            .setOngoing(true)
            .setShowWhen(false)
            .setForegroundServiceBehavior(Notification.FOREGROUND_SERVICE_DEFERRED)
            .build()
    }

    private fun startDetector() {
        val engine = VoskKeywordDetector(this)
        detector = engine
        engine.start(settings.secretPhrase) { onPhraseHeard() }
        Log.i(TAG, "escutando")
    }

    /**
     * The trigger. Everything below runs off the audio thread, and the alert
     * POST is the very first thing that happens — before the GPS is asked for
     * anything, before the UI is told, before anything is written to disk.
     */
    private fun onPhraseHeard() {
        if (alert != null) return
        worker.execute {
            val handle = api.openAlert(tracker.lastKnown(), batteryPercent()) ?: run {
                Log.w(TAG, "alerta não subiu; a fila tentará de novo")
                return@execute
            }
            alert = handle
            settings.activeAlertId = handle.id
            settings.cancelUntil = handle.cancelUntilMillis
            promoteToLocation()
            broadcastState()
            tracker.start { position -> worker.execute { api.sendPositions(handle.id, listOf(position)) } }
            watchUntilClosed(handle.id)
        }
    }

    /**
     * Asks the server whether the occurrence is still open.
     *
     * The console is what closes an occurrence, and nothing pushes that back
     * down here. Without this the handset stays convinced an alert is still
     * running and refuses to open the next one — she says the phrase again
     * and nothing happens, which is the worst possible failure for this
     * product.
     */
    private fun watchUntilClosed(alertId: String) {
        watcher?.cancel(false)
        watcher = monitor.scheduleWithFixedDelay({
            val status = api.alertStatus(alertId)
            if (status == "resolved" || status == "cancelled") clearAlert()
        }, 10, 10, TimeUnit.SECONDS)
    }

    private fun clearAlert() {
        alert = null
        settings.activeAlertId = null
        settings.cancelUntil = 0
        watcher?.cancel(false)
        watcher = null
        tracker.stop()
        // Frees the anti-repeat window too: once an occurrence is closed, the
        // next cry for help must not wait on a timer meant to swallow echoes
        // of the previous one.
        detector?.rearm()
        broadcastState()
        Log.i(TAG, "ocorrência encerrada; escutando de novo")
    }

    private fun cancelAlert() {
        val current = alert ?: return
        worker.execute { if (api.cancelAlert(current.id)) clearAlert() }
    }

    /** Recovers after the app was killed with an occurrence still open. */
    private fun resumeIfOpen() {
        val pending = settings.activeAlertId ?: return
        if (alert != null) return
        worker.execute {
            when (api.alertStatus(pending)) {
                "open", "in_progress" -> {
                    alert = AlertHandle(pending, settings.cancelUntil)
                    promoteToLocation()
                    tracker.start { p -> worker.execute { api.sendPositions(pending, listOf(p)) } }
                    watchUntilClosed(pending)
                }
                null -> Unit                 // sem resposta: tenta de novo no próximo start
                else -> clearAlert()
            }
        }
    }

    private fun batteryPercent(): Int? = runCatching {
        (getSystemService(Context.BATTERY_SERVICE) as BatteryManager)
            .getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
            .takeIf { it in 0..100 }
    }.getOrNull()

    private fun broadcastState() {
        sendBroadcast(Intent(ACTION_STATE_CHANGED).setPackage(packageName))
    }

    override fun onDestroy() {
        detector?.stop()
        detector = null
        tracker.stop()
        watcher?.cancel(false)
        monitor.shutdownNow()
        worker.shutdown()
        super.onDestroy()
    }

    companion object {
        const val ACTION_CANCEL = "br.com.calculadora.simples.CANCEL"
        const val ACTION_STOP = "br.com.calculadora.simples.STOP"
        const val ACTION_STATE_CHANGED = "br.com.calculadora.simples.STATE"

        fun start(context: Context) {
            val intent = Intent(context, ListenerService::class.java)
            context.startForegroundService(intent)
        }

        fun send(context: Context, action: String) {
            context.startService(Intent(context, ListenerService::class.java).setAction(action))
        }
    }
}
