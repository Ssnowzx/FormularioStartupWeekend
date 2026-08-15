package br.com.calculadora.simples

import java.math.BigDecimal
import java.math.MathContext
import java.math.RoundingMode

/**
 * A calculator that actually calculates.
 *
 * This is not decoration. The threat model says the aggressor picks up the
 * handset; a disguise that falls apart the moment someone adds two numbers is
 * worse than no disguise, because it draws attention to the one app that
 * behaves strangely.
 */
class Calculator {

    var display: String = "0"
        private set

    private var accumulator: BigDecimal? = null
    private var pendingOperator: Char? = null
    private var freshEntry = true

    /** Digits typed since the last operator, used by the hidden entrance. */
    var typedRun: String = ""
        private set

    fun digit(d: Char) {
        typedRun += d
        if (freshEntry) {
            display = if (d == '0') "0" else d.toString()
            freshEntry = false
            return
        }
        if (display == "0") { display = d.toString(); return }
        if (display.replace("-", "").replace(",", "").length < 12) display += d
    }

    fun decimal() {
        if (freshEntry) { display = "0,"; freshEntry = false; return }
        if (!display.contains(',')) display += ","
    }

    fun operator(op: Char) {
        typedRun = ""
        val current = parse(display)
        accumulator = pendingOperator?.let { apply(accumulator ?: current, current, it) } ?: current
        display = format(accumulator!!)
        pendingOperator = op
        freshEntry = true
    }

    fun equals() {
        typedRun = ""
        val op = pendingOperator ?: return
        val current = parse(display)
        val result = apply(accumulator ?: current, current, op)
        accumulator = null
        pendingOperator = null
        display = format(result)
        freshEntry = true
    }

    fun clear() {
        display = "0"
        accumulator = null
        pendingOperator = null
        freshEntry = true
        typedRun = ""
    }

    fun negate() {
        if (display == "0") return
        display = if (display.startsWith("-")) display.drop(1) else "-$display"
    }

    fun percent() {
        display = format(parse(display).divide(BigDecimal(100), MathContext(12, RoundingMode.HALF_UP)))
        freshEntry = true
    }

    private fun apply(a: BigDecimal, b: BigDecimal, op: Char): BigDecimal = when (op) {
        '+' -> a.add(b)
        '-' -> a.subtract(b)
        '*' -> a.multiply(b)
        // Dividing by zero must not crash the disguise.
        '/' -> if (b.signum() == 0) BigDecimal.ZERO
               else a.divide(b, MathContext(12, RoundingMode.HALF_UP))
        else -> b
    }

    private fun parse(text: String): BigDecimal =
        runCatching { BigDecimal(text.replace(",", ".")) }.getOrDefault(BigDecimal.ZERO)

    private fun format(value: BigDecimal): String {
        val trimmed = value.stripTrailingZeros()
        val plain = if (trimmed.scale() > 10) trimmed.setScale(10, RoundingMode.HALF_UP).stripTrailingZeros()
                    else trimmed
        return plain.toPlainString().replace(".", ",")
    }
}
