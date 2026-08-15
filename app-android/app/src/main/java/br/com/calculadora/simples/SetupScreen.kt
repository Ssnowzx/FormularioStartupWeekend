package br.com.calculadora.simples

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private val Background = Color(0xFFFAF1E1)
private val Surface = Color(0xFFFFFBF3)
private val Petrol = Color(0xFF155E63)
private val Coral = Color(0xFFAE432B)
private val Good = Color(0xFF387043)
private val Ink = Color(0xFF1F2A2B)
private val InkSoft = Color(0xFF55605F)

/** Step 1: pair the handset with an invite code typed in person. */
@Composable
fun PairScreen(
    defaultServer: String,
    busy: Boolean,
    error: String?,
    onPair: (code: String, server: String) -> Unit
) {
    var code by remember { mutableStateOf("") }
    var server by remember { mutableStateOf(defaultServer) }

    Column(
        modifier = Modifier.fillMaxSize().background(Background)
            .verticalScroll(rememberScrollState()).padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Text("Configuração inicial", fontSize = 26.sp, fontWeight = FontWeight.Bold, color = Petrol)
        Text(
            "Digite o código que a delegacia entregou a você. Ele só funciona uma vez.",
            fontSize = 15.sp, color = InkSoft
        )
        OutlinedTextField(
            value = code,
            onValueChange = { code = it.uppercase() },
            label = { Text("Código") },
            placeholder = { Text("XXXX-XXXX") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )
        OutlinedTextField(
            value = server,
            onValueChange = { server = it },
            label = { Text("Servidor") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )
        if (error != null) Text(error, color = Coral, fontSize = 14.sp)
        Button(
            onClick = { onPair(code.trim(), server.trim()) },
            enabled = !busy && code.length >= 8,
            colors = ButtonDefaults.buttonColors(containerColor = Petrol),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.fillMaxWidth().padding(top = 8.dp)
        ) { Text(if (busy) "Vinculando…" else "Vincular", fontSize = 16.sp) }
    }
}

/** Step 2: choose the phrase, then prove out loud that it is recognised. */
@Composable
fun PhraseScreen(
    testing: Boolean,
    heard: Boolean,
    onTest: (String) -> Unit,
    onConfirm: (String) -> Unit
) {
    var chosen by remember { mutableStateOf(SUGGESTED_PHRASES.first()) }

    Column(
        modifier = Modifier.fillMaxSize().background(Background)
            .verticalScroll(rememberScrollState()).padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Text("Sua palavra", fontSize = 26.sp, fontWeight = FontWeight.Bold, color = Petrol)
        Text(
            "Escolha uma frase que você conseguiria dizer em voz alta sem levantar suspeita. " +
                "Ela fica guardada só neste celular — nem nós sabemos qual você escolheu.",
            fontSize = 15.sp, color = InkSoft
        )

        for (phrase in SUGGESTED_PHRASES) {
            OutlinedButton(
                onClick = { chosen = phrase },
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.outlinedButtonColors(
                    containerColor = if (phrase == chosen) Surface else Color.Transparent,
                    contentColor = if (phrase == chosen) Petrol else Ink
                ),
                modifier = Modifier.fillMaxWidth()
            ) { Text(phrase, fontSize = 16.sp) }
        }

        // Testing out loud is the acceptance test: if the phrase does not fire
        // here, on this handset, in this room, it will not fire when it counts.
        Button(
            onClick = { onTest(chosen) },
            enabled = !testing,
            colors = ButtonDefaults.buttonColors(containerColor = if (heard) Good else Petrol),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.fillMaxWidth().padding(top = 10.dp)
        ) {
            Text(
                when {
                    heard -> "Reconheci. Pode continuar."
                    testing -> "Fale agora: “$chosen”"
                    else -> "Testar a frase"
                }, fontSize = 16.sp
            )
        }

        Button(
            onClick = { onConfirm(chosen) },
            enabled = heard,
            colors = ButtonDefaults.buttonColors(containerColor = Petrol),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.fillMaxWidth()
        ) { Text("Concluir", fontSize = 16.sp) }
    }
}

/** Hidden settings, reachable only through the keypad code. */
@Composable
fun SettingsScreen(
    userName: String,
    phrase: String,
    server: String,
    listening: Boolean,
    alertActive: Boolean,
    onChangePhrase: () -> Unit,
    onWipe: () -> Unit,
    onClose: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxSize().background(Background)
            .verticalScroll(rememberScrollState()).padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text("Configurações", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Petrol)
        Linha("Vinculada a", userName.ifEmpty { "—" })
        Linha("Sua frase", phrase.ifEmpty { "não definida" })
        Linha("Servidor", server)
        Linha("Escutando", if (listening) "sim" else "não")
        if (alertActive) Text("Há um alerta em andamento.", color = Coral, fontWeight = FontWeight.Bold)

        OutlinedButton(
            onClick = onChangePhrase, shape = RoundedCornerShape(12.dp),
            modifier = Modifier.fillMaxWidth().padding(top = 10.dp)
        ) { Text("Trocar a frase") }

        // RNF-6: one tap and nothing local survives. The occurrence history
        // lives on the server, so no evidence of a real alert is lost.
        OutlinedButton(
            onClick = onWipe, shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.outlinedButtonColors(contentColor = Coral),
            modifier = Modifier.fillMaxWidth()
        ) { Text("Apagar tudo deste aparelho") }

        Button(
            onClick = onClose,
            colors = ButtonDefaults.buttonColors(containerColor = Petrol),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.fillMaxWidth().padding(top = 10.dp)
        ) { Text("Voltar para a calculadora", fontSize = 16.sp) }
    }
}

@Composable
private fun Linha(rotulo: String, valor: String) {
    Column {
        Text(rotulo.uppercase(), fontSize = 11.sp, color = InkSoft, letterSpacing = 1.sp)
        Text(valor, fontSize = 16.sp, color = Ink, fontWeight = FontWeight.Medium)
    }
}
