package br.com.calculadora.simples

import android.annotation.SuppressLint
import android.content.Context
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import org.vosk.Model
import org.vosk.Recognizer
import java.io.File
import java.util.concurrent.atomic.AtomicBoolean

private const val TAG = "calc"
private const val SAMPLE_RATE = 16000

/**
 * Listens for the user's secret phrase.
 *
 * Two implementations sit behind this interface on purpose: if the offline
 * engine misbehaves on the demo handset, the platform recognizer can be
 * swapped in without touching the service, the network layer or the UI.
 */
interface KeywordDetector {
    fun start(phrase: String, onDetected: () -> Unit)
    fun stop()
}

/**
 * Offline recognition with Vosk, constrained by a grammar.
 *
 * The grammar is what makes this usable: restricted to the secret phrase plus
 * "[unk]", nearly everything else in the room collapses into [unk] instead of
 * being guessed at. The model's word error rate on free speech is poor, and
 * completely irrelevant to a two-item vocabulary.
 *
 * Nothing is sent anywhere. Recognition happens on the handset, which is what
 * lets the trigger work with no signal and no data plan (RNF-3).
 */
class VoskKeywordDetector(private val context: Context) : KeywordDetector {

    private var model: Model? = null
    private var recorder: AudioRecord? = null
    private var thread: Thread? = null
    private val running = AtomicBoolean(false)
    private var lastFired = 0L

    override fun start(phrase: String, onDetected: () -> Unit) {
        if (running.getAndSet(true)) return
        thread = Thread { loop(phrase, onDetected) }.apply { isDaemon = true; start() }
    }

    override fun stop() {
        running.set(false)
        thread?.join(1500)
        thread = null
        recorder?.runCatching { stop(); release() }
        recorder = null
        model?.close()
        model = null
    }

    @SuppressLint("MissingPermission") // the service refuses to start without RECORD_AUDIO
    private fun loop(phrase: String, onDetected: () -> Unit) {
        try {
            val loaded = model ?: Model(prepareModel().absolutePath).also { model = it }
            // Vosk takes the grammar as a bare JSON array of accepted phrases.
            // "[unk]" is the catch-all every other sound falls into.
            val grammar = JSONArray()
                .put(PhraseMatcher.normalize(phrase))
                .put("[unk]")
                .toString()
            Recognizer(loaded, SAMPLE_RATE.toFloat(), grammar).use { recognizer ->
                recognizer.setWords(true)
                listen(recognizer, phrase, onDetected)
            }
        } catch (e: Throwable) {
            Log.w(TAG, "detector parou: ${e.javaClass.simpleName}")
            running.set(false)
        }
    }

    @SuppressLint("MissingPermission")
    private fun listen(recognizer: Recognizer, phrase: String, onDetected: () -> Unit) {
        val minBuffer = AudioRecord.getMinBufferSize(
            SAMPLE_RATE, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT)
        val bufferSize = maxOf(minBuffer, SAMPLE_RATE / 2) * 2

        // VOICE_RECOGNITION applies the noise suppression the OEM ships without
        // the automatic gain that VOICE_COMMUNICATION would add.
        val record = AudioRecord(
            MediaRecorder.AudioSource.VOICE_RECOGNITION, SAMPLE_RATE,
            AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT, bufferSize)
        recorder = record
        if (record.state != AudioRecord.STATE_INITIALIZED) {
            Log.w(TAG, "microfone indisponível")
            running.set(false)
            return
        }
        record.startRecording()

        val buffer = ByteArray(bufferSize / 2)
        while (running.get()) {
            val read = record.read(buffer, 0, buffer.size)
            if (read <= 0) continue
            // Owning the AudioRecord instead of using Vosk's SpeechService is
            // what leaves room to also tee this buffer into a rolling audio
            // window later, without two components fighting over the mic.
            if (recognizer.acceptWaveForm(buffer, read)) {
                if (hit(recognizer.result, phrase)) onDetected()
            }
        }
        record.runCatching { stop(); release() }
        recorder = null
    }

    /**
     * Only final results count. Partial results flip between hypotheses while
     * a sentence is still being spoken, and acting on them means firing on a
     * guess the recognizer is about to withdraw.
     */
    private fun hit(resultJson: String, phrase: String): Boolean {
        val text = runCatching { JSONObject(resultJson).optString("text") }.getOrNull().orEmpty()
        if (text.isBlank()) return false
        if (!PhraseMatcher.matches(text, phrase)) return false
        if (!confident(resultJson)) return false

        // A single trigger is enough; sixty seconds of silence afterwards keeps
        // one long sentence from opening several alerts in a row.
        val now = System.currentTimeMillis()
        if (now - lastFired < 60_000) return false
        lastFired = now
        return true
    }

    private fun confident(resultJson: String): Boolean = runCatching {
        val words = JSONObject(resultJson).optJSONArray("result") ?: return@runCatching true
        (0 until words.length()).all { words.getJSONObject(it).optDouble("conf", 1.0) >= 0.70 }
    }.getOrDefault(true)

    /**
     * Copies the model out of the APK into private storage.
     *
     * Vosk's own StorageService.unpack writes to getExternalFilesDir, which
     * lands in /sdcard/Android/data/<pkg>/files — visible to anyone who opens
     * a file manager. A folder full of speech recognition data inside an app
     * called "Calculadora" is exactly the evidence that must not exist
     * (RNF-1, RNF-2), so the copy goes to filesDir instead.
     */
    private fun prepareModel(): File {
        val target = File(context.filesDir, "m")
        val stamp = File(target, ".ok")
        if (stamp.exists()) return target
        target.deleteRecursively()
        copyAssets("model-pt", target)
        stamp.writeText("1")
        return target
    }

    private fun copyAssets(assetPath: String, target: File) {
        val children = context.assets.list(assetPath) ?: emptyArray()
        if (children.isEmpty()) {
            target.parentFile?.mkdirs()
            context.assets.open(assetPath).use { input ->
                target.outputStream().use { output -> input.copyTo(output) }
            }
            return
        }
        target.mkdirs()
        for (child in children) copyAssets("$assetPath/$child", File(target, child))
    }
}
