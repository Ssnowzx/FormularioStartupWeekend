# Benchmark — Ásia

> Varredura: Índia, China, Japão, Coreia do Sul, Sudeste Asiático. Levantado em 15/08/2026.
> Fontes primárias (governo indiano, XPRIZE, prefeitura de Seul, imprensa asiática) linkadas ao final.

**Correção de premissa:** o prêmio da Leaf Wearables foi o **Women's Safety XPRIZE**
(US$ 1 milhão, Anu & Naveen Jain) — não um prêmio Amazon Alexa. Nenhuma fonte associa a
empresa à Amazon.

---

## 1. Índia — o maior laboratório do mundo em segurança feminina

### 1.1 Governo

| Nome | Operador | O que faz | Status 2026 / escala | Problemas |
|---|---|---|---|---|
| **112 India (ERSS)** | MHA + C-DAC | Central única multicanal (ligação, SMS, e-mail, app, chatbot, WhatsApp, IoT). Recurso **SHOUT**: alerta notifica voluntários cadastrados nas proximidades, além do centro de comando | Operacional nos 36 estados/UTs, 6+ anos, app Android/iOS | Depende de cobertura de rede e de resposta policial local, historicamente desigual |
| **Panic Button obrigatório** | Min. Telecomunicações, verba do Nirbhaya Fund | Mandato de abr/2016: todo celular vendido na Índia deveria ter botão de pânico (segurar tecla 5/9 ou power 3x); GPS obrigatório em 2018 | **Fracasso clássico de implementação.** Teste de um dia em Delhi "gerou caos" por rede instável e resposta lenta. Lançamento efetivo ~4 anos após a concepção | Falhas em piloto, rede instável, resposta policial lenta |
| **Himmat App** | Polícia de Delhi | Botão de alerta com callback imediato da central + "Track Me" em tempo real | Relançado como Himmat Plus (2019/2025) para táxis/autoriquixás | **Painel parlamentar classificou oficialmente como "fracasso"** em 2018 — baixíssima adesão |
| **Safe City Project** | MHA + MWCD, Nirbhaya Fund | CFTV com IA, reconhecimento facial, video analytics, postos policiais femininos | Fase 1: 8 cidades, Rs 3.080 crore (~US$ 370M), 2018→2024 | **Lucknow (Rs 195 crore) é o caso mais documentado de fracasso**: câmeras "com IA" não geram alerta em tempo real (viram CFTV comum, usado só após o crime); muitas quebradas e autoridades escondem para não perder efeito dissuasório; falsos positivos; ignora causas estruturais (iluminação, transporte) |
| **Nirbhaya Fund** | Governo central (2013) | Financia toda a infraestrutura acima | **2014–2021: Rs 9.549 crore aprovados, apenas Rs 2.989 crore usados = 31,31% de execução.** MWCD usou só 19% do aprovado. Em mar/2025 ainda havia Rs 1.700 crore parados. "Mahila Police Volunteers": Rs 5 crore alocados em 2020-21 com **execução zero** | Subutilização crônica, criticada repetidamente por comitês parlamentares |
| **181 / Abhayam (Gujarat)** | Governo de Gujarat | Botão de pânico **ou sacudir o celular** aciona delegacia mais próxima + até 5 contatos | Estadual | — |
| **SHE Teams / Bharosa (Telangana)** | Women Safety Wing | Equipes policiais dedicadas + apps T-SAFE (monitora corridas de táxi) e tele-aconselhamento multilíngue | Ativo | — |

### 1.2 Startups e hardware

| Nome | O que faz | Escala/status | Técnica |
|---|---|---|---|
| **Safetipin** | **Não é botão de pânico** — é auditoria de segurança urbana crowdsourced: usuárias avaliam 9 parâmetros (iluminação, visibilidade, transporte) gerando "safety score" por local. Modelo **B2G**: vende dados e consultoria a prefeituras | Fundada 2013 (Kalpana Viswanath). Contratada por Delhi em 2018 para auditar 600+ espaços — dados usados no programa de iluminação pública e no redesenho de patrulhamento. Expandiu para Bogotá (230 km de ciclovias), Hanói, Manila, Nairóbi | Três apps. **Muito replicável**: não depende de resposta policial, e sim de dados para política pública |
| **Leaf Wearables (SAFER)** | Chip embutível em joia; botão discreto envia alerta com localização + grava áudio | **Venceu o Women's Safety XPRIZE** (US$ 1M, 2018) entre 85 equipes de 18 países. Dezenas de milhares de unidades vendidas | **Regra da competição: custo < US$ 40, alerta < 90 segundos, e funcionamento SEM SINAL DE CELULAR.** Usa mesh Bluetooth (BLE 4.0) retransmitindo dispositivo a dispositivo até alcançar conectividade |
| **bSafe** | GPS ao vivo, SOS automático, alarme por voz, falsa ligação, follow-me | Freemium, uso global | — |
| **Smart24x7** | Alerta polícia/família/bombeiros, grava evidências | Integrado a policiamento estadual (Gurgaon, Chandigarh, Jalandhar, Jammu, Mohali, UP) | — |
| **Raksha / Rakshak / Shakti** | Botão único: SMS + ligação automática para contatos | Grátis, variantes estaduais | — |

### 1.3 Sem smartphone

Linhas **181** e **NCW (14490)** funcionam por voz em qualquer celular. Mas a busca específica por
USSD/IVR dedicado a violência doméstica não encontrou documentação pública robusta — **a resposta
nesse segmento é quase toda via linha de voz genérica.** Isso é uma lacuna, não uma ausência
comprovada.

---

## 2. China

| Nome | Operador | O que faz | Escala | Problemas |
|---|---|---|---|---|
| **怕怕 (Papa App)** | JV entre **Zhong'an Insurance**, **Ctrip/Trip.com** e Shenzhen Location Network | Compartilhamento de localização, **modo proteção cronometrado** (alerta automático se a usuária não confirmar segurança), ativação por palavra-chave de voz, botão SOS, ligações-chamariz, gravação com validade jurídica | Decolou após o assassinato de passageira da Didi (2018) — **#3 na App Store gratuita, 12+ milhões de instalações**. Monetiza via alarme físico de 120 dB e monitoramento 24h | Usuárias questionam por que WeChat/Alipay não incorporam isso nativamente, tornando apps dedicados redundantes |
| **360 手机卫士 — Centro de Proteção da Mulher** | Qihoo 360 | Ligação/voicemail falsos, lanterna, postos policiais próximos — dentro de suite de segurança já instalada | Built-in, gratuito, lançado 2020 | Marketing como "namorado 24 horas" **criticado por reforçar estereótipos** |
| **iPhone SOS nativo** | Apple | Botão físico → chamada automática à polícia + localização | Nativo | Depende de iPhone |
| **Lei Antiviolência Doméstica (2016)** | Legislação nacional | Primeira lei definindo violência doméstica e prevendo ordens de proteção | Vigor desde 01/03/2016 | Sem plataforma estatal integrada equivalente ao 112 indiano |

Pesquisa do Guokr/36Kr aponta **lacuna de oferta**: buscar segurança feminina na App Store chinesa
retorna majoritariamente apps de namoro; os existentes são mal mantidos e assumem que o risco é só
noturno, ignorando violência diurna.

---

## 3. Japão — o problema do *chikan* (assédio em trens)

| Nome | Operador | O que faz | Escala | Problemas |
|---|---|---|---|---|
| **Digi Police** | Polícia Metropolitana de Tóquio | Dispara **grito em voz alta "Pare com isso!"** ou mostra **tela cheia com "Há um assediador. Por favor, ajude"** — a vítima denuncia silenciosamente aos passageiros sem precisar falar | Lançado 2016, **470.000+ downloads** até 2019; campanha relançada em 2022 | Só **~10% das vítimas denunciam**, por vergonha — o app não resolve a subnotificação estrutural |
| **Carimbo UV anti-chikan (Shachihata)** | Fabricante privado | Selo de tinta incolor aplicado discretamente na mão do agressor; a marca só aparece sob luz UV | Lote inicial de 500 **esgotou em uma hora**. ~2.500 ienes (US$ 23,50) | Modelo de "prova forense discreta e barata", sem app nenhum |
| **Vagões femininos** | Operadoras ferroviárias | Vagões exclusivos em horário de pico | Padrão em Tóquio | Estrutural, não tecnológico |

Até 70% das jovens japonesas relatam já terem sido tocadas inadequadamente em trens.

---

## 4. Coreia do Sul — *molka* e resposta municipal

| Nome | Operador | O que faz | Escala | Custo |
|---|---|---|---|---|
| **Ansimi (안심이) + Help Me Bell** | Prefeitura de Seul | Sacudir o celular, apertar botão, ou (Android) **volume 3x** → central distrital verifica **CFTV municipal ao vivo** e despacha polícia. Modos "caminho seguro" e "táxi seguro". O **Help Me Bell** é um chaveiro com alarme de 100 dB + GPS para 5 contatos; **4+ cliques = pedido silencioso** | ~110.000 bells distribuídos, ~50.000/ano; **pico de 5.700 pedidos em um único dia em 2026** após crime de repercussão | **Grátis** para grupos vulneráveis; 7.000 won (~US$ 5) para o público geral |
| **Detecção de molka** | Equipe de segurança de Seul | Inspeção manual com detectores portáteis; no Palácio Changgyeonggung, sensores térmicos de teto identificam filmagem por cima de divisórias em tempo real | Vídeos de molka: 1.100 (2010) → 6.500 (2017); 80% das vítimas são mulheres | Mandato nacional obriga **som de obturador audível** em todo smartphone vendido |
| **Apps de detecção via Bluetooth/Wi-Fi** | Terceiros | Varrem sinais por dispositivos suspeitos | Nicho | Detectam só câmeras com componente sem fio ativo |

**Limite admitido pelo próprio sistema:** o CFTV só cobre Seul — fora da cidade a integração não
funciona. O modelo depende de infraestrutura municipal cara.

---

## 5. Sudeste Asiático — segurança embutida em apps de mobilidade

| Nome | País | O que faz | Escala |
|---|---|---|---|
| **Grab** | Singapura/Malásia/Indonésia/Filipinas | Botão SOS 24h, "Share My Ride", **mascaramento de número** (−70% de ligações não solicitadas na Indonésia), verificação facial de motoristas, **AudioProtect** (gravação criptografada, só acessível se houver incidente reportado) | Corridas Grab medidas como **1,8x mais seguras contra crimes de motorista** vs. táxi comum em Singapura. Malásia lançou corridas exclusivas para mulheres em 2026 |
| **Gojek** | Indonésia | Botão liga a **Emergency Unit dedicada 24h**, reconhecimento facial, anonimização de número, treinamento de intervenção de espectador com **Hollaback! Jakarta e ONU Mulheres** | 99% dos motoristas avaliaram o treinamento como útil |
| **Vagões/ônibus femininos** | Vietnã, Malásia | — | Malásia: 60% das mulheres se sentiram mais seguras |
| **Pontos de ônibus como espaços seguros** | Tailândia | Redesenho urbano | Reduziu incidentes, segundo o ADB |

**1 em cada 3 mulheres na Tailândia** e **quase 60% em Ho Chi Minh City** já sofreram assédio no
transporte público.

---

## 6. Síntese — o que morreu e o que escalou

### Fracassos documentados

1. **Botão de pânico obrigatório (Índia)** — mandato de cima para baixo sem testar a infraestrutura
   de resposta antes de obrigar o hardware. Anos entre anúncio e lançamento real.
2. **Himmat App** — painel parlamentar o chamou oficialmente de fracasso por baixa adesão.
   *Lançar um app não basta; é preciso estratégia de aquisição.*
3. **Nirbhaya Fund** — quase US$ 1 bilhão aprovado, **70% nunca virou produto ou serviço.**
   Ter orçamento é irrelevante sem execução.
4. **Safe City Lucknow** — vigilância "com IA" sem retorno em tempo real é **teatro de segurança**.

### O que funcionou em escala

1. **Ansimi / Help Me Bell (Seul)** — hardware barato (US$ 5) + app + infraestrutura municipal já
   existente, distribuição gratuita segmentada. **Resposta local escala melhor que nacional.**
2. **Digi Police (Japão)** — a inovação não foi técnica (é só som e texto na tela), foi de **design
   social**: resolve a paralisia e a vergonha da vítima com fricção quase zero.
3. **Safetipin** — B2G que não depende de resposta de emergência, e sim de dados para política
   pública. Replicável em orçamento municipal pequeno, **inclusive Lages**.
4. **Leaf Wearables / SAFER** — validação técnica mais forte de baixo custo: < US$ 40, < 90 s,
   **funcionando sem sinal de celular** via mesh Bluetooth.
5. **Grab / Gojek** — "seguro por design" embutido em produto que as pessoas **já usam** tem adesão
   muito maior que app dedicado de segurança.

### Lacuna identificada

Apesar da população gigantesca de feature phones na Ásia, a documentação pública de soluções
**USSD/IVR dedicadas a violência doméstica** é escassa — a resposta é quase toda por linha de voz
genérica. Um produto de USSD/SMS/IVR específico parece ser espaço branco **mesmo na Ásia**, e
combina diretamente com zona rural de Santa Catarina sem 4G estável.

---

## Fontes

- [Qz — India panic button, will it work?](https://qz.com/india/1171311/india-is-installing-panic-buttons-on-mobile-phones-to-keep-its-women-safe-will-it-work)
- [Accountability India — subutilização do Nirbhaya Fund](https://accountabilityindia.in/blog/nirbhaya-fund-for-women-safety-under-utilised/)
- [Tribune India — painel parlamentar sobre o Nirbhaya Fund](https://www.tribuneindia.com/news/nation/nirbhaya-fund-underutilised-panel-worried-368786)
- [Wikipedia — Himmat (app)](https://en.wikipedia.org/wiki/Himmat_(app))
- [Pulitzer Center / The Wire — fracasso do Safe City em Lucknow](https://pulitzercenter.org/stories/watched-unprotected-how-lucknows-safe-city-project-fails-women)
- [MHA — Safe City Projects](https://www.mha.gov.in/en/divisionofmha/women-safety-division/safe-city-projects)
- [112.gov.in — ERSS](https://112.gov.in/)
- [Safetipin](https://safetipin.com/about-our-company/) · [Wikipedia](https://en.wikipedia.org/wiki/Safetipin)
- [XPRIZE — SAFER / Leaf Wearables](https://xprize.org/prizes/womens-safety/articles/a-smart-necklace-that-saves-lives)
- [GeekWire — Leaf Wearables vence o XPRIZE](https://www.geekwire.com/2018/indian-startup-leaf-wearables-takes-first-place-1m-womens-safety-xprize-competition/)
- [Telangana Women Safety Wing](https://womensafetywing.telangana.gov.in/)
- [TMTPost — análise do 怕怕 App](https://www.tmtpost.com/trendmakers/419394)
- [Guokr — apps de segurança feminina na China](https://m.guokr.com/article/461692)
- [SCMP — Digi Police](https://www.scmp.com/week-asia/article/3184131/japan-hopes-anti-groping-digi-police-app-will-deter-return-train)
- [Newsweek — carimbo UV anti-chikan](https://www.newsweek.com/japan-anti-groping-stamp-1456583)
- [SCMP — detecção de molka em Seul](https://www.scmp.com/week-asia/lifestyle-culture/article/3305971/seoul-palace-installs-spy-cam-detection-public-toilet-combat-illegal-molka-filming)
- [Seul — Ansimi](https://ssa.seoul.go.kr/Ansimi_API/en/info.view) · [Help Me Bell](https://english.seoul.go.kr/seoul-policy-archive/seoul-help-me-bell/)
- [Asia Business Daily — pico de pedidos no Ansimi em 2026](https://www.asiae.co.kr/en/article/2026051111172011456)
- [Grab — recursos de segurança](https://www.grab.com/inside-grab/stories/drivers-and-passengers-finding-safety-tools/)
- [Jakarta Post — Grab Indonésia e segurança feminina](https://www.thejakartapost.com/news/2018/12/03/grab-indonesia-wants-you-to-know-it-cares-about-womens-safety)
- [Gojek — #UninstallKhawatir](https://www.gojek.com/blog/gojek/Safety-features)
- [ADB Blog — por que mulheres se sentem inseguras no transporte público](https://blogs.adb.org/blog/why-women-feel-unsafe-public-transport)

**Nota metodológica:** o orçamento de WebSearch da sessão esgotou no meio da varredura. As últimas
buscas foram feitas via WebFetch em buscadores alternativos, com sucesso parcial. Tópicos com
cobertura mais fina: USSD dedicado, Ojesy (Indonésia), wearables Xiaomi, apps VAWC das Filipinas —
sinalizados como lacunas, não como inexistência.
