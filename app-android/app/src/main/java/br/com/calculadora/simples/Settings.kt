package br.com.calculadora.simples

import android.content.Context
import android.content.SharedPreferences

/**
 * Local state. Everything here stays on the device.
 *
 * The secret phrase in particular NEVER leaves: there is no endpoint that
 * accepts it and no column that stores it. The server only ever learns that
 * a device fired.
 *
 * Backups are disabled at the manifest level, so none of this reaches the
 * Google account — an account the aggressor is assumed to know.
 */
class Settings(context: Context) {

    private val prefs: SharedPreferences =
        context.applicationContext.getSharedPreferences("calc", Context.MODE_PRIVATE)

    var deviceToken: String?
        get() = prefs.getString(KEY_TOKEN, null)
        set(value) = prefs.edit().putString(KEY_TOKEN, value).apply()

    var secretPhrase: String
        get() = prefs.getString(KEY_PHRASE, "") ?: ""
        set(value) = prefs.edit().putString(KEY_PHRASE, value).apply()

    var userName: String
        get() = prefs.getString(KEY_USER, "") ?: ""
        set(value) = prefs.edit().putString(KEY_USER, value).apply()

    /** Overridable at runtime so a demo does not need a rebuild to change host. */
    var serverUrl: String
        get() = prefs.getString(KEY_SERVER, null) ?: BuildConfig.SERVER_URL
        set(value) = prefs.edit().putString(KEY_SERVER, value.trimEnd('/')).apply()

    var activeAlertId: String?
        get() = prefs.getString(KEY_ALERT, null)
        set(value) = prefs.edit().putString(KEY_ALERT, value).apply()

    /** Server-computed instant after which cancelling is no longer accepted. */
    var cancelUntil: Long
        get() = prefs.getLong(KEY_CANCEL_UNTIL, 0L)
        set(value) = prefs.edit().putLong(KEY_CANCEL_UNTIL, value).apply()

    val isPaired: Boolean get() = !deviceToken.isNullOrEmpty()
    val isReady: Boolean get() = isPaired && secretPhrase.isNotEmpty()

    /**
     * RNF-6: one tap wipes the local trace. The alert history lives on the
     * server, not here, so nothing of value to the case is lost.
     */
    fun wipe() = prefs.edit().clear().apply()

    private companion object {
        const val KEY_TOKEN = "device_token"
        const val KEY_PHRASE = "phrase"
        const val KEY_USER = "user_name"
        const val KEY_SERVER = "server_url"
        const val KEY_ALERT = "active_alert"
        const val KEY_CANCEL_UNTIL = "cancel_until"
    }
}

/**
 * Phrases offered during setup.
 *
 * A curated list, not a free text field, for two reasons. Offline recognition
 * only matches words that exist in its vocabulary, so an invented word would
 * silently never fire. And two-word phrases are what keep the television from
 * triggering an alert — "socorro" is spoken on every soap opera in Brazil.
 *
 * EVERY WORD HERE WAS CHECKED AGAINST THE MODEL'S LEXICON (16/08/2026).
 * The detector feeds Vosk a grammar built from PhraseMatcher.normalize(), so a
 * word outside the ~80k lexicon of vosk-model-small-pt-0.3 is not "harder to
 * hear" — it is impossible to hear, silently. "chuva de verão" used to be on
 * this list and could never fire: the model has "cafe" but not "verao".
 *
 * To check a new phrase before adding it, dump the symbol table out of
 * assets/model-pt/Gr.fst and HCLr.fst (int32 length, bytes, int64 key) and
 * look for every normalized token.
 */
val SUGGESTED_PHRASES = listOf(
    // Primeira da lista porque é a pré-selecionada, e é a frase da demonstração.
    "orion park",
    "abacaxi azul",
    "girassol amarelo",
    "chuva de janeiro",
    "caderno verde",
    "janela aberta",
    "café frio",
    "sapato novo",
    "estrela do norte",
    "melancia doce",
    "porta da frente",
    "livro vermelho",
    "vento sul"
)
