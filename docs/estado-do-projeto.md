# Estado do projeto

> Fechamento da sessão de 16/08/2026. Para retomar sem reler tudo.

---

## O que está decidido

**Produto:** *Mulheres em Risco* — nome institucional, para pitch e imprensa. No celular
da usuária o app aparece **disfarçado de calculadora**, e a calculadora funciona.

**A ideia não é um botão, é um gatilho de voz.** A mulher fala uma frase secreta
escolhida por ela; o celular reconhece **dentro do próprio aparelho, sem internet**, e
envia alerta com localização para uma central, que despacha ajuda.

**A rede de Anjos foi removida em 16/08/2026.** Quem atende é a central, e só ela. Avisar
terceiro por link de WhatsApp criava uma promessa que ninguém garantia, e o benchmark já
dizia que o gargalo é a resposta, não o número de avisados. No lugar entrou o **despacho**:
viatura, 190, ligação ou equipe, cada um registrado com hora. É de lá que sai o tempo de
resposta do relatório — e ele resolve, de quebra, a colisão de nome com a "Todas Por Uma".

**Modelo, revisto em 16/08:** o canal de entrada passa a ser **empresa de segurança
privada** (monitoramento de alarme e pronta resposta) — ela já tem central 24 h, viatura
circulando e cobrança funcionando, que é tudo que a delegacia não tem. O poder público
continua sendo o destino, financiado pelo canal privado: *a empresa paga, a Delegacia da
Mulher recebe de graça.*

**Preço em tabela** (na landing): R$ 249 / R$ 890 / R$ 2.190 por mês, para 25 / 100 / 300
mulheres, anual com 2 meses grátis. Ancorado em R$ 70 por casa monitorada — um adicional
que passe de 20% da assinatura-base morre na prateleira. A conta inteira está em
[`precificacao.md`](precificacao.md).

**Porta de entrada em Lages:** Delegacia da Mulher. Consenso do time.

**Frase da marca**, definida em 16/08:
> O medo que silencia mulheres revela uma sociedade que ainda não aprendeu a protegê-las.

---

## O que está pronto

| Onde | O quê |
|---|---|
| `docs/pesquisa-dominio.md` | O problema em números, com fontes |
| `docs/benchmark/` | Brasil, EUA, Europa e Ásia — o que existe, o que morreu e por quê |
| `docs/identidade-visual.md` | Paleta roxa na landing **e na central**; o app dela segue sem marca |
| `docs/arquitetura.md` | Como o servidor está organizado e onde acrescentar coisa nova |
| `docs/como-rodar-a-demo.md` | Do laptop desligado até a palavra chegando na central |
| `docs/roteiro-video.md` | Vídeo de 2min30 para o NotebookLM, falas prontas |
| `docs/roteiro-pitch.md` | Pitch de 4 minutos, 14 slides, com preparação para o júri |
| `docs/precificacao.md` | Custo real, canal B2B, tabela pública e ponto de equilíbrio |
| `servidor/` | Três produtos num processo: site, pesquisa e o sistema |
| `app-android/` | APK Kotlin: calculadora, Vosk offline, alerta com localização |

**O fluxo inteiro funciona.** Em 15/08 o gatilho de voz foi acionado num Android real:
a palavra foi falada, o alerta chegou à central, a ocorrência foi resolvida no painel e
o aparelho voltou a acionar com a mesma palavra.

### A central foi reconstruída em 16/08

| O que entrou | Por quê |
|---|---|
| **Cartão de alerta em tela cheia**, com sirene, anel dos 15s e mini-mapa | num telão, card discreto na coluna espera ser notado |
| **Mapa de verdade**, com ladrilhos do OpenStreetMap | sem chave de API e sem CDN; o SVG antigo era um retângulo liso |
| **Endereço por extenso**, via Nominatim | ninguém lê coordenada no rádio |
| **Despacho** com quatro botões e hora registrada | é o que substituiu os Anjos |
| **Encerramento com desfecho** | "resolvido" sozinho não vira relatório |
| **Anotação livre** na ocorrência | o que ela disse tem que caber em algum lugar |
| **Cronômetros** até assumir e até despachar | são os números que um comprador público pede |
| **Filtro da fila** (abertas / hoje / tudo) | a fila vinha com histórico de teste no telão |
| **Paleta da landing** | central e landing aparecem em sequência no pitch |

---

## ⚠️ A limitação que precisa ser resolvida antes de prometer qualquer coisa

**O reconhecimento funciona offline. O envio do alerta, não.**

Descoberto em 16/08, lendo o código: se ela falar a palavra **sem sinal**, o `POST` de
abertura da ocorrência falha e **o alerta se perde**. A fila em disco (`q.jsonl`) que
existe no app carrega apenas **posições**, não a abertura da ocorrência. E ela não tem
como perceber, porque a tela não muda — por projeto.

Isso contradiz o RNF-3 (caminho degradado que funcione offline) e é a pergunta mais
provável de um jurado técnico. O texto da landing foi corrigido para não prometer o que
não existe.

**O conserto** (~2 horas): persistir o alerta pendente igual às posições, tentar de novo
com backoff, e disparar quando a conectividade voltar (`ConnectivityManager.NetworkCallback`).
Depois disso a promessa vira verdadeira — e vira diferencial, porque mulher em risco no
interior costuma estar justamente onde o sinal é ruim.

---

## Os três riscos que decidem o pitch

**1. Ela consegue falar?** O gatilho depende da voz dela. Com a mão dele no pescoço, ou
com o medo travando, a palavra não sai. O próprio Jean Michel respondeu *"na ocasião
não"*. O Digi Police de Tóquio resolveu o mesmo problema ao contrário: o app **grita
pela vítima** em vez de esperar que ela grite.

**2. O bloco jurídico está inteiro em aberto.** Transmitir áudio ambiente ao vivo para
um órgão público, sem o agressor saber, esbarra em interceptação? O áudio serve como
prova? As respostas do time foram *"consulte a legislação"*. **Por isso áudio ficou fora
do MVP** — hoje o produto envia alerta e localização, não som.

**3. A solução gera mais alerta para uma central que já não vaza.** São Paulo tem 1.250
tornozeleiras e 189 em uso. A França recebe 5 a 7 mil alertas por dia com dez
funcionários. O gargalo não é o alarme — é a resposta.

**A resposta a este risco mudou em 16/08, e ficou melhor:** em vez de apostar numa rede de
voluntários, vender para quem **já tem central 24 h e viatura circulando**. A empresa de
monitoramento não é canal de venda por acaso — ela é a resposta que faltava.

---

## O quarto risco, que só apareceu ao construir

**O ponto verde do microfone.** No Android 12+, qualquer captura contínua acende o
indicador de privacidade na barra de status. Vale para o Vosk, para o reconhecedor do
Google e para qualquer abordagem — não existe contorno legítimo.

Um app disfarçado de calculadora com o ponto verde permanente é um disfarce com um furo
permanente. Ou o time assume ("protege do olhar casual, não da perícia"), ou vai para
escuta intermitente, que degrada a função central. **Decidir antes que perguntem.**

---

## A colisão de nome, descoberta e resolvida em 16/08

A referência de vídeo escolhida pelo time é o *Manual do Aplicativo* da **Todas Por
Uma** — concorrente ativa há 7 anos, com mais de 20 mil usuárias. A descrição do vídeo
delas diz: *"pessoas de confiança, pré-cadastradas como **Anjos**"*. Era o termo delas,
para a mesma função.

**Resolvida ao remover o mecanismo inteiro.** Não existe mais rede de Anjos no produto,
nem no código, nem na landing. Quem atende é a central, e o que ela faz chama-se despacho.

O diferencial continua intacto: elas resolvem por botão e dispositivo, vocês por voz.

---

## Próximos passos

1. **Implementar a fila do alerta offline.** É a lacuna que transforma uma promessa
   quebrada em diferencial.
2. **Atualizar os roteiros de pitch e vídeo**: eles ainda falam em Anjos e no preço antigo.
3. **Decidir o que dizer sobre o ponto verde do microfone.**
4. **Levar as três perguntas à Delegacia da Mulher.** É a fonte que ninguém mais tem, e
   um "sim, topamos testar" vale mais que qualquer slide.
5. **Subir na VPS**: `modules/survey/schema.sql`, `modules/alert/schema.sql`, `.env` com
   os dois papéis, e `proxy_buffering off` no nginx.
6. **Testar no celular**: tela apagada, aparelho na bolsa, e o serviço aguentando 30
   minutos no fabricante de vocês.
7. **Atualizar os números de Lages**, que são de 2021. Se não der tempo, dizer o ano em
   voz alta no pitch.

---

## O contraexemplo que vale lembrar no domingo

De toda a varredura, uma única iniciativa tem redução de mortes comprovada: o
**Lethality Assessment Program** de Maryland, com queda de ~40% em homicídios de
parceiro íntimo. A diferença é que ele não entrega uma pontuação e vai embora — ele
coloca a mulher **ao telefone com um serviço de apoio na mesma hora**, ainda na
ocorrência.

O score não era o produto. A ponte era.
