package br.com.calculadora.simples

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private val Background = Color(0xFFF7F0E8)
private val Ink = Color(0xFF1F2A2B)
private val KeyLight = Color(0xFFFFFBF3)
private val KeyDim = Color(0xFFE7DDCE)
private val KeyAccent = Color(0xFF4A5257)

/**
 * The screen the aggressor sees.
 *
 * Deliberately unremarkable: no branding, no colour that suggests safety, no
 * lock or shield icon. It has to survive being picked up and used.
 */
@Composable
fun CalculatorScreen(
    alertActive: Boolean,
    onSecretCode: () -> Unit,
    onCancelPress: () -> Unit
) {
    val calculator = remember { Calculator() }
    var display by remember { mutableStateOf(calculator.display) }
    var clearPresses by remember { mutableStateOf(0) }

    fun refresh() { display = calculator.display }

    Column(
        modifier = Modifier.fillMaxSize().background(Background).padding(16.dp),
        verticalArrangement = Arrangement.Bottom
    ) {
        Box(modifier = Modifier.weight(1f).fillMaxWidth(), contentAlignment = Alignment.BottomEnd) {
            Text(
                // The only tell, and one she chooses to read: while an alert is
                // live the idle zero carries a trailing comma. No banner, no
                // colour, nothing an onlooker would notice.
                text = if (alertActive && display == "0") "0," else display,
                fontSize = 64.sp,
                color = Ink,
                maxLines = 1,
                textAlign = TextAlign.End,
                modifier = Modifier.fillMaxWidth().padding(bottom = 24.dp)
            )
        }

        val rows = listOf(
            listOf("C", "±", "%", "÷"),
            listOf("7", "8", "9", "×"),
            listOf("4", "5", "6", "−"),
            listOf("1", "2", "3", "+"),
            listOf("0", ",", "=")
        )

        for (row in rows) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(vertical = 5.dp),
                horizontalArrangement = Arrangement.spacedBy(9.dp)
            ) {
                for (label in row) {
                    Key(
                        label = label,
                        weight = if (label == "0") 2.09f else 1f,
                        modifier = Modifier
                    ) {
                        when (label) {
                            "C" -> {
                                calculator.clear()
                                clearPresses++
                                // Three taps on C inside the cancel window call
                                // off a false alarm. Silent by design: no sound,
                                // no vibration, nothing on screen (RNF-4).
                                if (clearPresses >= 3) { clearPresses = 0; onCancelPress() }
                            }
                            "±" -> { clearPresses = 0; calculator.negate() }
                            "%" -> { clearPresses = 0; calculator.percent() }
                            "÷" -> { clearPresses = 0; calculator.operator('/') }
                            "×" -> { clearPresses = 0; calculator.operator('*') }
                            "−" -> { clearPresses = 0; calculator.operator('-') }
                            "+" -> { clearPresses = 0; calculator.operator('+') }
                            "," -> { clearPresses = 0; calculator.decimal() }
                            "=" -> {
                                clearPresses = 0
                                if (calculator.typedRun == SECRET_CODE) onSecretCode() else calculator.equals()
                            }
                            else -> { clearPresses = 0; calculator.digit(label[0]) }
                        }
                        refresh()
                    }
                }
            }
        }
    }
}

@Composable
private fun androidx.compose.foundation.layout.RowScope.Key(
    label: String,
    weight: Float,
    modifier: Modifier,
    onClick: () -> Unit
) {
    val operators = setOf("÷", "×", "−", "+", "=")
    val functions = setOf("C", "±", "%")
    Button(
        onClick = onClick,
        shape = CircleShape,
        colors = ButtonDefaults.buttonColors(
            containerColor = when {
                operators.contains(label) -> KeyAccent
                functions.contains(label) -> KeyDim
                else -> KeyLight
            },
            contentColor = if (operators.contains(label)) Color.White else Ink
        ),
        modifier = modifier.weight(weight).then(Modifier.fillMaxWidth()),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(vertical = 20.dp)
    ) {
        Text(label, fontSize = 24.sp)
    }
}

/**
 * Typed on the keypad and confirmed with "=", this opens the hidden settings.
 * Six digits, so it is not reachable by someone idly pressing keys, and no
 * gesture that looks like a gesture.
 */
const val SECRET_CODE = "271828"
