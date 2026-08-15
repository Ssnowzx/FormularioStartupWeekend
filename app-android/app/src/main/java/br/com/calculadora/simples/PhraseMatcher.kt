package br.com.calculadora.simples

import java.text.Normalizer

/**
 * Decides whether a recognized sentence contains the user's secret phrase.
 *
 * Speech recognition drops accents, swaps similar-sounding syllables and adds
 * filler words. An exact string comparison would fail exactly when it matters,
 * so matching is tolerant — but tolerant in a bounded way, because a false
 * positive sends a patrol car to someone who did not call for one.
 */
object PhraseMatcher {

    /** Lowercase, accent-free, letters and digits only. */
    fun normalize(raw: String): String =
        Normalizer.normalize(raw, Normalizer.Form.NFD)
            .replace(Regex("\\p{Mn}+"), "")
            .lowercase()
            .replace(Regex("[^a-z0-9 ]"), " ")
            .replace(Regex(" +"), " ")
            .trim()

    /**
     * Longer tokens tolerate more damage. Below four characters nothing is
     * forgiven: "sol" and "sal" are different words, and one of them is not
     * a cry for help.
     */
    private fun budgetFor(length: Int): Int = when {
        length <= 3 -> 0
        length <= 6 -> 1
        else -> 2
    }

    private fun close(a: String, b: String): Boolean {
        val budget = budgetFor(a.length)
        if (kotlin.math.abs(a.length - b.length) > budget) return false
        return levenshtein(a, b, budget) <= budget
    }

    /** Bounded edit distance: stops early once the budget is blown. */
    fun levenshtein(a: String, b: String, ceiling: Int): Int {
        if (a == b) return 0
        var previous = IntArray(b.length + 1) { it }
        for (i in 1..a.length) {
            val current = IntArray(b.length + 1)
            current[0] = i
            var best = current[0]
            for (j in 1..b.length) {
                val cost = if (a[i - 1] == b[j - 1]) 0 else 1
                current[j] = minOf(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + cost)
                best = minOf(best, current[j])
            }
            if (best > ceiling) return ceiling + 1
            previous = current
        }
        return previous[b.length]
    }

    /**
     * True when every token of [phrase] appears in [heard], in order, with at
     * most one unrelated token between them.
     *
     * Order matters: "azul abacaxi" is not the phrase. The gap allowance
     * absorbs the article or filler the recognizer sometimes inserts.
     */
    fun matches(heard: String, phrase: String): Boolean {
        val wanted = normalize(phrase).split(" ").filter { it.isNotEmpty() }
        val spoken = normalize(heard).split(" ").filter { it.isNotEmpty() }
        if (wanted.isEmpty() || spoken.size < wanted.size) return false

        var cursor = 0
        for (token in wanted) {
            var found = -1
            var index = cursor
            while (index < spoken.size && index <= cursor + 1) {
                if (close(token, spoken[index])) { found = index; break }
                index++
            }
            if (found < 0) return false
            cursor = found + 1
        }
        return true
    }
}
