# Tecnologia emergente — o que é realmente possível em 54h

> Time só de software. Cada item marcado por **viabilidade real em 54 horas**, não por elegância.
> Levantado em 15/08/2026, ~115 fetches em documentação oficial, RFCs, GitHub e páginas de produto.
> Onde o dado não pôde ser verificado ao vivo, está marcado.

---

## 1. IA/ML aplicada ao domínio

| Tecnologia | O que faz | Maturidade | 54h? | Observação |
|---|---|---|---|---|
| **YAMNet + MediaPipe Audio Classifier** (Google) | Classifica áudio em **521 classes do AudioSet** — grito, vidro quebrando, tiro. **Latência de ~12 ms num Pixel 6** | Produção | **Sim, parcial** | Usar o modelo pré-treinado via MediaPipe, sem treinar nada. O trabalho é só orquestração. **Roda apenas com o app em primeiro/segundo plano**, não fechado |
| **Danger Assessment** (Jacquelyn Campbell) | Instrumento clínico **validado** de 20 itens para avaliar risco de homicídio em relação abusiva. Usado há 25+ anos por polícia, saúde e justiça | Produção, gratuito e público | **Parcial** | **O ativo de maior credibilidade científica disponível.** Dá para construir autoavaliação inspirada nas categorias públicas, com aviso de que não substitui avaliação certificada. [dangerassessment.org](https://www.dangerassessment.org) |
| **LLM para triagem de narrativa** | Lê relato livre da vítima e mapeia para sinais de perigo estruturados | Experimental | **Sim, parcial** | Puramente prompt engineering. Ressalva ética: **não vender como substituto de instrumento clínico validado** |
| **rAInbow, Sophia bot, aimee, Amber** | Chatbots de apoio citados na literatura | **Não verificado** | — | O domínio `rainbow.chat` está **estacionado/à venda** — projeto possivelmente descontinuado. **Não citar no pitch sem confirmar**: um mentor pode checar ao vivo |
| **Modelos preditivos de letalidade** | Previsão de reincidência | Pesquisa/controverso | — | Relevante como **alerta ético**: histórico de viés documentado (paralelo ao COMPAS). Ganha-se ponto por reconhecer e evitar |

---

## 2. Privacidade — o que dá para construir

| Tecnologia | Maturidade | 54h? | Observação |
|---|---|---|---|
| **libsodium / libsodium.js** | Produção | **Sim** | Criptografia E2E real sem reinventar nada. Bindings prontos para JS/TS. [docs](https://libsodium.gitbook.io/doc/) |
| **libsignal (Signal Protocol)** | Produção | **Não** | O próprio repositório declara: *"uso fora do Signal não é suportado"*. **Licença AGPLv3** obriga abrir o código se usado comercialmente. Só como referência conceitual no pitch |
| **MLS (RFC 9420)** | Padrão IETF | **Não** | Implementações exigem engenharia real. Útil só como "arquitetura futura" num slide |
| **CRDTs — Automerge / Yjs** | Produção | **Sim** | Base de "funciona sem internet e sincroniza depois". Essencial, dado que satélite está fora de alcance no Brasil (§5) |
| **SQLite WASM + IndexedDB/OPFS criptografado** | Produção | **Sim** | Local-first criptografado sem backend. Dexie.js + libsodium |
| **PIN de coação / senha-isca** | Padrão de design | **Sim** | **Lógica de aplicação pura** — poucas horas. PIN diferente mostra UI-fachada (ex.: app de receitas). Deniability plausível se o agressor forçar a abertura |
| **Arquitetura zero-knowledge** | Padrão consolidado | **Sim, parcial** | Chave derivada da senha via Argon2 (`crypto_pwhash`), nunca enviada ao servidor. Frase de pitch forte: *"nem nós conseguimos ler os dados dela"* |
| **Dead man's switch** | Padrão simples | **Sim** | Se ela não confirmar "estou bem" em X horas, dispara alerta. Cron no Supabase resolve rápido. **Proteção passiva sem exigir ação no momento do perigo** |

---

## 3. Integridade de evidência

| Tecnologia | 54h? | Observação |
|---|---|---|
| **Hash + metadados na captura** | **Sim** | SHA-256 da foto/áudio no instante da captura, antes de qualquer edição. Elo direto com a cadeia de custódia do CPP |
| **Hash chain (estilo git/Merkle)** | **Sim** | Cada evidência inclui o hash da anterior + timestamp assinado pelo backend. **Demonstra o conceito sem a complexidade do Bitcoin** |
| **OpenTimestamps** | **Parcial** | Cliente JS existe, mas confirmação na blockchain leva **horas**. Ceticismo é correto aqui: é bônus, não caminho crítico. [opentimestamps.org](https://opentimestamps.org/) |
| **Cadeia de custódia — Lei 13.964/2019** | — | O Pacote Anticrime inseriu os arts. 158-A a 158-F no CPP formalizando cadeia de custódia digital. **Texto primário não recuperado nesta sessão** (planalto.gov.br falhou) — confirmar os artigos exatos antes de citar número de lei para uma banca com jurista |
| **DocuSAFE (NNEDV)** | — | **Achado competitivo:** não aparece mais no site atual do techsafety.org — indício de descontinuação. Um app-bandeira desse nicho saiu de circulação |

---

## 4. Disparar sem tocar na tela

**O que NÃO funciona** — e é importante saber antes de prometer:

| Tentativa | Veredito |
|---|---|
| Botão de energia via app de terceiros | **Não.** Android e iOS reservam o gesto para Assistente/SOS nativo. Usar Accessibility Service para isso **viola política da Play Store** |
| Botão lateral do iPhone | **Não.** Apple não expõe a terceiros |
| Apple Watch Fall Detection API | **Não.** Recurso nativo fechado |
| Wear OS Health Services | **Sem fall detection exposta** publicamente |
| Google Personal Safety / Android Safety Check | **Não integrável** — sem API pública de terceiros |

**O que funciona de verdade:**

| Gatilho | 54h? | Observação |
|---|---|---|
| **iOS Action Button + App Intents** | **Sim** | iPhone 15 Pro+. Apps de terceiros **podem** registrar ação customizada (iOS 16.1+). Um dos melhores gatilhos sem tela disponíveis. [HIG](https://developer.apple.com/design/human-interface-guidelines/action-button) |
| **iOS Back Tap** | **Sim** | Bater 2–3× na traseira dispara um Atalho. Recurso real desde iOS 14. Discreto e sem hardware |
| **NFC (Android e iOS)** | **Sim** | Tag de **~R$ 0,50** dispara intent/atalho. Android tem *tag dispatch* pronto, **5–15 min de setup**. ⚠️ É objeto físico, ainda que passivo — checar contra a restrição "só software" |
| **Picovoice Porcupine** (wake word) | **Sim** | Detecção de palavra-chave **100% local**, treino de frase customizada em segundos, **suporta português**. Só com app em primeiro plano. [picovoice.ai](https://picovoice.ai/platform/porcupine/) |
| **Botão de fone Bluetooth** | **Parcial** | `ACTION_MEDIA_BUTTON` no Android. Só se ela já tiver fone pareado |

> **Conclusão:** o gatilho realista para 54h **não é um sensor construído do zero** — é uma ponte para
> automações que o próprio sistema operacional já oferece.

---

## 5. Conectividade sem internet

| Tecnologia | 54h? | Achado |
|---|---|---|
| **Twilio SMS (Brasil)** | **Parcial** | Long code funciona rápido. Sender ID alfanumérico exige **~10 semanas** de pré-registro — fora do prazo. ~US$ 0,06/msg |
| **iPhone Emergency SOS via satélite** | **Não aplicável** | Lista de países **não inclui nenhum da América do Sul**. E não há API para terceiros |
| **Satélite Android 15+** | **Não** | API pública só **detecta** que está em satélite (`isUsingNonTerrestrialNetwork()`), não permite enviar |
| **Starlink Direct to Cell** | **Não** | Nenhuma parceria brasileira encontrada. Tratar como indisponível |
| **Bridgefy (mesh Bluetooth)** | **Parcial** | SDK integra rápido, mas **histórico de falhas de segurança sérias** (2020 e 2022). Licenciamento comercial não é claro. Usar como camada extra, **nunca como canal de confiança** |
| **Briar** | **Não** | **Em modo manutenção desde jul/2026**, só Android, sem SDK |
| **Meshtastic** | **Não** | Requer hardware LoRa dedicado |
| **Cell Broadcast / Defesa Civil Alerta** | **Não** | Piloto em **apenas 11 municípios**, exclusivamente governamental, sem API |

> **Consequência de arquitetura:** "sem sinal" tem que ser o cenário **normal**, não excepcional.
> Não existe atalho de satélite no Brasil em 2026.

---

## 6. PWA — os limites reais

**Veredito:** funciona bem no **Android**. No **iPhone falha estruturalmente em três frentes** para o
caso "botão silencioso com app fechado".

| Capacidade | iOS Safari | Android Chrome |
|---|---|---|
| Geolocation (primeiro plano) | Sim | Sim |
| **Geolocation em segundo plano** | **Para ao minimizar/bloquear tela** | Mais permissivo |
| Push API | Só iOS 16.4+, **exige instalação na tela de início** | Nativo |
| **Web Bluetooth** | **Nunca suportado** | Sim |
| Wake Lock | Sim (16.4+) | Sim |
| **Background Sync** | **Não** | Sim |
| Periodic Background Sync | Não | Sim |
| Instalação | Manual, sem prompt | Prompt automático |

> Se o público não for majoritariamente Android, o botão que funciona com o app fechado **exige** os
> gatilhos nativos da §4 abrindo a PWA — não a PWA sozinha.

---

## 7. Integração Brasil

| Tecnologia | 54h? | Achado |
|---|---|---|
| **Login gov.br** | **Parcial** | SSO básico integrável rápido. Acesso a dados via Conecta exige credenciamento formal de órgão — inviável |
| **Open Finance / Pix direto (Bacen)** | **Não** | Só instituições autorizadas |
| **Pix via PSP intermediário (Efí)** | **Sim, em sandbox** | Ambiente de homologação pronto, SDKs prontos. **"Cofre de fuga" prototipável de verdade**, não mockup |
| **WhatsApp Business Cloud API** | **Sim** | Número de teste provisionado automaticamente, sem cartão |

> **Achado estratégico:** o **Ligue 180 já atende por WhatsApp** — (61) 9610-0180. Posicionar o
> produto como **complemento e triagem** para o canal oficial, não como concorrente, é muito mais
> forte no pitch.

---

## As 5 combinações que ninguém está fazendo

*Ranqueadas por impacto no pitch × viabilidade em 54h.*

### 1º — Triagem por Danger Assessment conduzida por LLM + evidência com hash, como ponte para o Ligue 180 via WhatsApp
**Impacto 5 × Viabilidade 4**

Em vez de formulário estático, um LLM conduz conversa no ritmo da vítima, mapeando respostas para as
categorias do **Danger Assessment** — instrumento cientificamente validado, não heurística inventada
pelo time. Na mesma interação, grava hash-chain com timestamp da narrativa como evidência
preliminar. Tudo dentro do WhatsApp, canal que o próprio governo já usa para o 180, posicionando o
produto como **acelerador de triagem que encaminha para o serviço oficial**.

Nenhum treinamento de modelo. Prompt engineering + WhatsApp Cloud API (sandbox em minutos) + hash
local. Melhor razão ciência-validada / velocidade / narrativa.

### 2º — Ponte de gesto nativo → PWA (Action Button, Back Tap e NFC como "sensor" de um app web)
**Impacto 4 × Viabilidade 5**

Nenhum time vai conseguir um botão de pânico robusto dentro de uma PWA no iPhone. A saída que
ninguém explora é **não tentar resolver isso em JavaScript**: usar Action Button, Back Tap e NFC —
automações nativas reais e documentadas — para abrir a PWA já com payload de pânico via Web Share
Target. Em vez de "nativo vs. PWA", é **o SO como camada de sensor e a web como camada de produto**.
Engenharia de integração pura, montável em horas.

### 3º — Cofre de fuga em Pix com o mesmo PIN de coação do cofre de evidências
**Impacto 5 × Viabilidade 3**

Reaproveita a arquitetura de senha real vs. senha-isca para esconder **dinheiro**, não só conversas.
Sob o PIN de coação, saldo zero; sob o PIN real, o fundo verdadeiro, sacável num toque. Ataca a
**dependência econômica — o motivo nº 1 apontado na literatura para mulheres permanecerem**. A
maioria dos times só pensaria em aplicar duress PIN a mensagens, nunca a dinheiro.

### 4º — Fusão de dois detectores de áudio on-device como pré-alerta, não alarme
**Impacto 4 × Viabilidade 3**

Porcupine (wake word) e YAMNet (521 classes, 12 ms) em paralelo, disparando contagem regressiva de
confirmação — *"Você está bem? Toque para cancelar"* — **só quando os dois sinais convergem**. Ataca
o falso positivo, que é o que mata a credibilidade de detecção automática. Só modelos pré-treinados.

### 5º — Log de evidências offline-first (CRDT) com hash-chain desenhado para o art. 158-B do CPP
**Impacto 3 × Viabilidade 3**

Como satélite e cell broadcast estão fora de alcance, a arquitetura assume "sem sinal" como normal.
Log local-first (Automerge) gravando os campos da cadeia de custódia brasileira — quem coletou,
quando, hash, dispositivo — buscando carimbo externo só quando a rede volta. **A maioria dos apps do
setor trata print de tela com timestamp como suficiente, sem pensar em admissibilidade formal.**

---

## Referências

[MediaPipe Audio Classifier](https://developers.google.com/edge/mediapipe/solutions/audio/audio_classifier) · [YAMNet](https://www.tensorflow.org/hub/tutorials/yamnet) · [Picovoice Porcupine](https://picovoice.ai/platform/porcupine/) · [Danger Assessment](https://www.dangerassessment.org) · [libsodium](https://libsodium.gitbook.io/doc/) · [libsignal](https://github.com/signalapp/libsignal) · [RFC 9420](https://www.rfc-editor.org/rfc/rfc9420.html) · [Automerge](https://automerge.org/) · [Yjs](https://yjs.dev/) · [SQLite WASM](https://sqlite.org/wasm/doc/trunk/index.md) · [OpenTimestamps](https://opentimestamps.org/) · [techsafety.org](https://techsafety.org/) · [Apple Action Button](https://developer.apple.com/design/human-interface-guidelines/action-button) · [Android NFC](https://developer.android.com/develop/connectivity/nfc/nfc) · [Twilio SMS Brasil](https://www.twilio.com/en-us/sms/pricing/br) · [Bridgefy](https://en.wikipedia.org/wiki/Bridgefy) · [Briar](https://briarproject.org/) · [Conecta gov.br](https://www.gov.br/conecta/catalogo) · [Pix API](https://github.com/bacen/pix-api) · [Efí Pix](https://sejaefi.com.br/api-pix) · [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api/overview)
