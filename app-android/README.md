# O aparelho — app Android

Kotlin nativo. Escuta uma frase escolhida por ela e, ao reconhecê-la, abre um alerta com
localização no servidor. Aparece na tela inicial como **Calculadora**, e a calculadora
funciona de verdade.

## Compilar

A máquina precisa de um **JDK 21**. O JDK 25 não roda o Gradle 8.x — o erro é
`Unsupported class file major version` e não há contorno que não seja instalar o 21.

```bash
export HOMEBREW_NO_AUTO_UPDATE=1
brew install openjdk@21 gradle@8            # keg-only: não mexem no JDK que já existe
brew install --cask android-commandlinetools

export JAVA_HOME="$(brew --prefix openjdk@21)/libexec/openjdk.jdk/Contents/Home"
export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"

yes | sdkmanager --licenses                 # antes dos pacotes, sempre
sdkmanager "platform-tools" "platforms;android-36" "build-tools;36.0.0"

./baixar-modelo.sh                          # 51 MB de modelo de voz, fora do git
./gradlew assembleDebug
```

Sai em `app/build/outputs/apk/debug/app-debug.apk`, com cerca de 55 MB.

Para apontar o app para outro servidor sem editar código:

```bash
./gradlew assembleDebug -PserverUrl=https://seu-dominio.com.br
```

O endereço também é editável dentro do app, na tela oculta de configurações — refazer o APK
só para trocar de servidor é como se perde uma demonstração.

Se o macOS reclamar que o `aapt2` não pôde ser verificado:
`xattr -dr com.apple.quarantine $ANDROID_HOME`.

## Instalar no celular

Com cabo, é mais rápido: `adb install -r app/build/outputs/apk/debug/app-debug.apk`.

Sem cabo: com `DEMO_MODE=1` e `APK_PATH` preenchidos no `.env` do servidor, o celular abre
`https://<servidor>/app`, baixa e instala. O Android vai pedir para autorizar o navegador a
instalar apps desconhecidos, e o Play Protect vai avisar — "Instalar mesmo assim".

**Instale na noite anterior à demonstração, nunca no palco.**

## Usar

1. Abrir o app. Na primeira vez ele pede o **código de vínculo** gerado em `/cadastro`.
2. Escolher a **frase secreta** numa lista e **falar em voz alta** para confirmar que o
   aparelho reconhece. Só dá para concluir depois que reconhecer de verdade — o teste é o
   critério de aceitação, não enfeite.
3. Conceder microfone e localização.
4. A partir daí é uma calculadora. Ela fica escutando enquanto o app está aberto.

**Configurações ocultas:** digitar `271828` no teclado e apertar `=`.

**Cancelar um alerta:** apertar `C` três vezes, dentro dos 15 segundos. Sem som, sem
vibração, sem nada na tela — é o que RNF-4 exige.

**Como ela sabe que o alerta saiu:** enquanto o alerta está ativo, o `0` do visor aparece
como `0,`. Nenhum banner, nenhuma cor. Uma marca que ela sabe ler e que ninguém mais nota.

## Decisões que não são estéticas

- **`allowBackup="false"`.** Sem isso, a frase secreta e o token do aparelho vão para o
  backup do Google Drive — de uma conta que, no modelo de ameaça, o agressor conhece.
- **`FLAG_SECURE`.** Bloqueia print de tela e deixa a miniatura em Recentes em branco.
- **O modelo de voz é copiado para `filesDir`, não para o armazenamento externo.** O
  `StorageService.unpack` do Vosk descompacta em `/sdcard/Android/data/<pacote>/files/`, à
  vista de qualquer gerenciador de arquivos. Uma pasta de reconhecimento de fala dentro de
  um app chamado "Calculadora" é exatamente a evidência que não pode existir.
- **A frase é escolhida numa lista, não digitada.** O reconhecimento offline só casa
  palavras que existem no vocabulário do modelo: uma palavra inventada nunca dispararia, e
  ela só descobriria na hora errada.
- **A frase tem duas palavras.** "Socorro" dispararia com a novela ligada. "Abacaxi azul"
  não aparece na televisão brasileira.
- **O primeiro POST não espera o GPS.** Sai na hora, com a última posição conhecida ou sem
  nenhuma; o rastreio começa depois, em paralelo.
- **O tipo `location` do serviço só é ligado quando o alerta dispara.** Declarado desde o
  início, o ícone de localização ficaria aceso o tempo todo na barra de status — um sinal
  permanente de que aquilo não é a calculadora que diz ser.

## O que este protótipo não faz

- **Não escuta com o app fechado.** O Android não permite iniciar um serviço de microfone
  em segundo plano nem a partir do boot, e não existe contorno legítimo. Na demonstração o
  app fica aberto, com a tela ligada.
- **Não grava áudio como prova.** Ficou fora por decisão: o bloco jurídico de transmitir
  som ambiente para um órgão público está inteiro em aberto (`docs/estado-do-projeto.md`,
  risco 2). O laço de captura já foi escrito para permitir isso depois sem disputar o
  microfone com o reconhecimento.
- **O ponto verde do microfone fica aceso.** No Android 12+ qualquer captura contínua
  acende o indicador de privacidade, e isso vale para qualquer abordagem — não há contorno
  legítimo. O disfarce protege do olhar casual, não da perícia. Vale dizer isso antes que
  perguntem.
