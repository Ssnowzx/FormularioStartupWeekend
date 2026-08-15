package br.com.calculadora.simples

import android.content.Context
import android.util.Log
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.util.concurrent.TimeUnit

private const val TAG = "calc"
private val JSON = "application/json; charset=utf-8".toMediaType()

/** What the device knows about an alert it opened. */
data class AlertHandle(val id: String, val cancelUntilMillis: Long)

/**
 * Talks to the server.
 *
 * The first POST of an alert is never allowed to wait on anything — not on a
 * GPS fix, not on a retry, not on the queue draining. Everything that can be
 * late is late on its own thread.
 */
class Api(private val context: Context, private val settings: Settings) {

    private val client = OkHttpClient.Builder()
        .connectTimeout(6, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .callTimeout(15, TimeUnit.SECONDS)
        .retryOnConnectionFailure(true)
        .build()

    private val queueFile: File get() = File(context.filesDir, "q.jsonl")

    private fun post(path: String, body: JSONObject, authenticated: Boolean = true): JSONObject? {
        val request = Request.Builder()
            .url(settings.serverUrl + path)
            .post(body.toString().toRequestBody(JSON))
            .apply {
                // Bearer header, never a query string: URLs end up in access
                // logs, in browser history and in the Referer header.
                if (authenticated) settings.deviceToken?.let { header("Authorization", "Bearer $it") }
            }
            .build()
        return try {
            client.newCall(request).execute().use { response ->
                val text = response.body?.string().orEmpty()
                if (!response.isSuccessful) {
                    Log.w(TAG, "POST $path -> ${response.code}")
                    return null
                }
                if (text.isBlank()) JSONObject() else JSONObject(text)
            }
        } catch (e: Exception) {
            Log.w(TAG, "POST $path falhou: ${e.javaClass.simpleName}")
            null
        }
    }

    /** Exchanges a one-time invite code for a device token. */
    fun register(inviteCode: String, serverUrl: String): String? {
        settings.serverUrl = serverUrl
        val body = JSONObject().put("invite_code", inviteCode).put("label", "celular pessoal")
        val answer = post("/api/v1/device/register", body, authenticated = false) ?: return null
        val token = answer.optString("device_token").takeIf { it.isNotEmpty() } ?: return null
        settings.deviceToken = token
        settings.userName = answer.optJSONObject("user")?.optString("display_name").orEmpty()
        return token
    }

    /**
     * Opens an alert. Sent with whatever position is already known — including
     * none. An alert without coordinates still puts the operator on the phone
     * with her, and refusing to open one would trade a life for a complete
     * data record.
     */
    fun openAlert(lastKnown: Position?, batteryPct: Int?): AlertHandle? {
        val body = JSONObject()
            .put("client_alert_id", java.util.UUID.randomUUID().toString())
            .put("trigger", "voice")
        batteryPct?.let { body.put("battery_pct", it) }
        lastKnown?.let { body.put("location", it.toJson()) }

        val answer = post("/api/v1/alerts", body) ?: return null
        val id = answer.optString("alert_id").takeIf { it.isNotEmpty() } ?: return null
        val until = runCatching {
            java.time.Instant.parse(answer.optString("cancel_until")).toEpochMilli()
        }.getOrDefault(System.currentTimeMillis() + 15_000)
        return AlertHandle(id, until)
    }

    fun cancelAlert(alertId: String): Boolean =
        post("/api/v1/alerts/$alertId/cancel", JSONObject().put("reason", "false_alarm")) != null

    /**
     * Current status as the server sees it: open, in_progress, resolved or
     * cancelled. Null when the answer could not be obtained.
     *
     * The device has to ask, because closing an occurrence happens on the
     * console and nothing pushes that back down to the handset.
     */
    fun alertStatus(alertId: String): String? {
        val request = Request.Builder()
            .url(settings.serverUrl + "/api/v1/alerts/$alertId")
            .apply { settings.deviceToken?.let { header("Authorization", "Bearer $it") } }
            .build()
        return try {
            client.newCall(request).execute().use { response ->
                // A vanished or foreign occurrence is as good as closed: either
                // way this handset should stop considering itself blocked.
                if (response.code == 404 || response.code == 403) return "resolved"
                if (!response.isSuccessful) return null
                JSONObject(response.body?.string().orEmpty()).optString("status").ifEmpty { null }
            }
        } catch (e: Exception) {
            Log.w(TAG, "status do alerta falhou: ${e.javaClass.simpleName}")
            null
        }
    }

    /**
     * Sends positions, queueing them on disk when the network is gone.
     *
     * Every point carries the instant it was recorded, so a batch that only
     * lands ten minutes later still reconstructs the real path instead of
     * collapsing onto the moment it was delivered (RNF-3).
     */
    fun sendPositions(alertId: String, positions: List<Position>) {
        if (positions.isEmpty()) return
        val pending = readQueue(alertId) + positions
        val body = JSONObject().put("points", JSONArray().apply { pending.forEach { put(it.toJson()) } })
        if (post("/api/v1/alerts/$alertId/locations", body) != null) clearQueue()
        else writeQueue(alertId, pending)
    }

    private fun readQueue(alertId: String): List<Position> = runCatching {
        if (!queueFile.exists()) return emptyList()
        queueFile.readLines().mapNotNull { line ->
            val row = JSONObject(line)
            if (row.optString("a") != alertId) null else Position.fromJson(row.getJSONObject("p"))
        }.takeLast(200)
    }.getOrDefault(emptyList())

    private fun writeQueue(alertId: String, positions: List<Position>) {
        runCatching {
            queueFile.writeText(positions.takeLast(200).joinToString("\n") {
                JSONObject().put("a", alertId).put("p", it.toJson()).toString()
            })
        }
    }

    private fun clearQueue() { runCatching { queueFile.delete() } }
}

/** A single fix. */
data class Position(
    val lat: Double,
    val lng: Double,
    val accuracyMeters: Int,
    val source: String,
    val recordedAt: String
) {
    fun toJson(): JSONObject = JSONObject()
        .put("lat", lat).put("lng", lng)
        .put("accuracy_m", accuracyMeters)
        .put("source", source)
        .put("recorded_at", recordedAt)

    companion object {
        fun fromJson(row: JSONObject) = Position(
            row.getDouble("lat"), row.getDouble("lng"),
            row.optInt("accuracy_m", 0), row.optString("source", "gps"),
            row.optString("recorded_at"))
    }
}
