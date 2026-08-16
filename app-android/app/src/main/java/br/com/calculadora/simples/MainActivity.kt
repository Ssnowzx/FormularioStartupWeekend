package br.com.calculadora.simples

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.core.content.ContextCompat
import kotlin.concurrent.thread

private enum class Screen { PAIR, PHRASE, CALCULATOR, SETTINGS }

class MainActivity : ComponentActivity() {

    private lateinit var settings: Settings
    private lateinit var api: Api
    private var testDetector: KeywordDetector? = null

    private var screen by mutableStateOf(Screen.CALCULATOR)
    private var busy by mutableStateOf(false)
    private var pairError by mutableStateOf<String?>(null)
    private var testing by mutableStateOf(false)
    private var heard by mutableStateOf(false)
    private var alertActive by mutableStateOf(false)
    private var serverUrl by mutableStateOf("")

    private val stateReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) { refreshAlertState() }
    }

    private val askPermissions =
        registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { startListening() }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Blocks screenshots and blanks the thumbnail in Recents (RNF-2).
        window.setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE)

        settings = Settings(this)
        api = Api(this, settings)
        serverUrl = settings.serverUrl
        screen = when {
            !settings.isPaired -> Screen.PAIR
            settings.secretPhrase.isEmpty() -> Screen.PHRASE
            else -> Screen.CALCULATOR
        }
        refreshAlertState()

        setContent {
            MaterialTheme {
                when (screen) {
                    Screen.PAIR -> PairScreen(serverUrl, busy, pairError, ::pair)
                    Screen.PHRASE -> PhraseScreen(testing, heard, ::testPhrase, ::confirmPhrase)
                    Screen.CALCULATOR -> CalculatorScreen(
                        alertActive = alertActive,
                        onSecretCode = { screen = Screen.SETTINGS },
                        onCancelPress = ::cancelAlert
                    )
                    Screen.SETTINGS -> SettingsScreen(
                        userName = settings.userName,
                        phrase = settings.secretPhrase,
                        server = serverUrl,
                        listening = settings.isReady,
                        alertActive = alertActive,
                        onChangePhrase = { heard = false; screen = Screen.PHRASE },
                        onChangeServer = ::changeServer,
                        onWipe = ::wipe,
                        onClose = { screen = Screen.CALCULATOR }
                    )
                }
            }
        }
    }

    override fun onStart() {
        super.onStart()
        ContextCompat.registerReceiver(
            this, stateReceiver, IntentFilter(ListenerService.ACTION_STATE_CHANGED),
            ContextCompat.RECEIVER_NOT_EXPORTED)
        if (settings.isReady) startListening()
    }

    override fun onStop() {
        super.onStop()
        runCatching { unregisterReceiver(stateReceiver) }
    }

    /**
     * Leaving the app closes the hidden screens behind you.
     *
     * RNF-6: switching to another app, or handing the phone over, must never
     * leave settings or setup on screen for the next person to find.
     */
    override fun onPause() {
        super.onPause()
        stopTest()
        if (screen == Screen.SETTINGS) screen = Screen.CALCULATOR
    }

    private fun refreshAlertState() {
        alertActive = settings.activeAlertId != null
    }

    private fun missingPermissions(): Array<String> {
        val wanted = mutableListOf(Manifest.permission.RECORD_AUDIO, Manifest.permission.ACCESS_FINE_LOCATION)
        // Notification permission is requested last and treated as optional:
        // if she declines, the foreground service keeps running and the
        // notification is simply never drawn — quieter, and still legal.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            wanted += Manifest.permission.POST_NOTIFICATIONS
        }
        return wanted.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }.toTypedArray()
    }

    private fun startListening() {
        val missing = missingPermissions()
        if (missing.isNotEmpty()) { askPermissions.launch(missing); return }
        if (settings.isReady) ListenerService.start(this)
    }

    private fun pair(code: String, server: String) {
        busy = true
        pairError = null
        thread {
            val token = api.register(code, server)
            runOnUiThread {
                busy = false
                if (token == null) pairError = "Código inválido, já usado, ou servidor fora do ar."
                else { screen = Screen.PHRASE; startListening() }
            }
        }
    }

    /** Runs the real detector for real, so the test proves the real thing. */
    private fun testPhrase(phrase: String) {
        if (missingPermissions().contains(Manifest.permission.RECORD_AUDIO)) {
            askPermissions.launch(missingPermissions()); return
        }
        stopTest()
        testing = true
        heard = false
        val detector = VoskKeywordDetector(this)
        testDetector = detector
        detector.start(phrase) {
            runOnUiThread { heard = true; testing = false; stopTest() }
        }
    }

    private fun stopTest() {
        testDetector?.let { d -> thread { d.stop() } }
        testDetector = null
        testing = false
    }

    private fun confirmPhrase(phrase: String) {
        stopTest()
        settings.secretPhrase = phrase
        screen = Screen.CALCULATOR
        startListening()
    }

    private fun cancelAlert() {
        if (!alertActive) return
        if (System.currentTimeMillis() > settings.cancelUntil) return
        ListenerService.send(this, ListenerService.ACTION_CANCEL)
    }

    /**
     * The device token stays valid: it belongs to the occurrence server, not to
     * the address used to reach it. Changing the address is how the app follows
     * the team from one network to another without being paired again.
     */
    private fun changeServer(url: String) {
        if (url.isBlank()) return
        settings.serverUrl = url
        serverUrl = settings.serverUrl
    }

    private fun wipe() {
        ListenerService.send(this, ListenerService.ACTION_STOP)
        settings.wipe()
        alertActive = false
        heard = false
        screen = Screen.PAIR
    }
}
