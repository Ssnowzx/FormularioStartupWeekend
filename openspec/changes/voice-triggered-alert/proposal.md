# Gatilho de voz → alerta → central → Anjos

> Escrita durante a implementação, 15/08/2026. Registra o que foi construído e,
> principalmente, o que foi deixado de fora e por quê.

## O que muda

Sai do papel a dinâmica inteira do produto: a mulher fala uma frase escolhida por ela, o
celular reconhece **no próprio aparelho**, abre um alerta com localização num servidor
nosso, a central vê a ocorrência em menos de um segundo e aciona os **Anjos** — pessoas de
confiança que ela mesma cadastrou.

Três peças novas:

- `app-android/` — APK Kotlin nativo, disfarçado de calculadora, com reconhecimento de voz
  offline (Vosk, modelo pt-BR de 51 MB embarcado).
- `servidor/alerts.js` + `servidor/schema_alerts.sql` — API do aparelho, da central e do
  Anjo, montada sobre o servidor da pesquisa com duas linhas de diff.
- `servidor/publico/{dispatch,enroll,guardian,simulator}.html` — central ao vivo, cadastro,
  página do Anjo e o simulador que serve de seguro para a demonstração.

## Por que isso não é só mais um botão do pânico

Três diferenças, nesta ordem de importância:

1. **O gargalo que a pesquisa encontrou em seis jurisdições não é o alarme, é a resposta.**
   São Paulo tem 1.250 tornozeleiras e 189 em uso; a França recebe 5 a 7 mil alertas por dia
   para ~10 funcionários. Um botão a mais aumenta a fila. A rede de Anjos é a tentativa de
   colocar alguém **que já se importa** a caminho em segundos, sem esperar vaga na central —
   a mesma lógica do Lethality Assessment Program de Maryland, a única iniciativa da varredura
   com redução de mortes comprovada (~40%). Lá o produto não era o score, era a ponte.
2. **Um botão exige mão livre e tela desbloqueada.** A frase falada não exige nem uma coisa
   nem outra, e funciona com o celular na bolsa.
3. **O botão do pânico oficial só chega a quem já tem medida protetiva.** 61% nunca
   denunciaram. Esta arquitetura não depende de decisão judicial para funcionar — embora o
   modelo B2G escolhido ainda entregue o aparelho pela delegacia (ver "O que continua em
   aberto").

## Avaliação contra o modelo de ameaça

| RNF | Situação |
|---|---|
| **RNF-1** discrição | **Atendido com uma ressalva grave.** O app se chama Calculadora, tem ícone de utilitário, calculadora funcional e nenhuma marca. **Mas o ponto verde do microfone fica aceso** enquanto ele escuta — no Android 12+ isso vale para qualquer abordagem e não há contorno legítimo. O disfarce protege do olhar casual, não da perícia. Mitigação honesta: dizer isso no pitch antes que perguntem; a alternativa é escuta intermitente, que degrada a função central. |
| **RNF-2** sem rastro local | **Atendido.** `allowBackup="false"` e regras de extração vazias (nada vai para o Drive nem para transferência de aparelho), `FLAG_SECURE` (sem print, miniatura em branco em Recentes), modelo de voz copiado para `filesDir` em vez do armazenamento externo, e as telas ocultas se fecham sozinhas em `onPause`. |
| **RNF-3** offline | **Atendido no reconhecimento, degradado no envio.** O Vosk roda sem rede e sem plano de dados. O POST entra numa fila JSONL em disco com backoff, e cada ponto carrega o instante em que foi capturado — a entrega tardia reconstrói o trajeto real em vez de amontoá-lo na hora da entrega. |
| **RNF-4** acionamento silencioso | **Atendido.** Sem som, sem vibração, sem tela acesa, sem banner. O Vosk foi escolhido em parte por isso: o `SpeechRecognizer` do Android emite bipe de início e fim em vários fabricantes. |
| **RNF-5** vazamento é risco de vida | **Atendido.** A palavra-chave nunca sai do celular — não há rota que a receba nem coluna onde guardá-la. Usuário de banco separado, cego para a pesquisa. Todo token vai ao banco como sha256. Nenhum `DELETE`: apagar é redação por `UPDATE`. Toda coluna pessoal tem justificativa escrita no DDL. |
| **RNF-6** saída de emergência | **Atendido.** Trocar de app fecha as telas ocultas; "Apagar tudo deste aparelho" limpa o estado local num toque. O histórico da ocorrência fica no servidor, então nenhuma prova real se perde. |
| **RNF-7** integridade da evidência | **Parcial, e declarado.** A linha do tempo é imutável por construção (`alert_event` só aceita `SELECT` e `INSERT`) e a ordenação usa o relógio do servidor, não o do aparelho. Mas **não há áudio como prova** e não há assinatura criptográfica — ver "Não-objetivos". |

## Não-objetivos

Cortados de propósito. Em 54 horas, decidir o que não fazer é a decisão mais importante.

- **Áudio ao vivo e buffer circular como prova.** É o corte mais caro e o mais fácil de
  defender: o bloco jurídico está inteiro em aberto (transmitir som ambiente ao vivo para
  órgão público esbarra em interceptação? o áudio serve como prova ou o advogado dele
  derruba?). Demonstrar mal uma coisa juridicamente frágil é pior do que dizer que ela é o
  próximo passo. O laço de captura de áudio já foi escrito de forma a permitir isso depois
  sem disputar o microfone com o reconhecimento.
- **Integração com 190 / Polícia Militar.** Não existe em 54h e não se promete parceria
  operacional que não está assinada.
- **Scoring algorítmico de risco.** A varredura mostrou o VioGén: 247 mulheres assassinadas
  após avaliação, 56% classificadas como risco baixo. Não é falta de tempo, é recusa.
- **Escuta com o app fechado ou após reiniciar o celular.** O Android proíbe iniciar
  serviço de microfone em segundo plano ou pelo boot. Limite de plataforma, não preguiça.
- **Push próprio, multi-operador, atribuição de ocorrência, papéis.** Roadmap.
- **Qualquer coisa que dependa de aprovação na Play Store.** A distribuição é por convênio.

## Custo e prazo

Coube. Toolchain Android do zero: ~15 minutos. Servidor, painel e páginas: um dia de
trabalho. O corte duro combinado — "se o `assembleDebug` não passar em 60 minutos, abandona
o APK e demonstra pelo simulador" — não precisou ser usado.

## O que continua em aberto

Os três riscos de `docs/estado-do-projeto.md` **seguem abertos** — nenhuma linha de código
resolve nenhum deles, e nenhum deve ser apresentado como resolvido:

1. **Ela consegue falar?** O gatilho depende da voz dela. A pergunta está no questionário
   (p8, p10) e o painel da pesquisa acende em vermelho se mais de 40% disserem que não.
2. **O bloco jurídico.** Sem parecer, sem jurisprudência brasileira específica.
3. **A solução gera mais alerta para uma central que já não vaza.** A rede de Anjos é a
   nossa aposta contra isso, e é uma aposta, não uma prova.

E uma tensão que nenhum documento do repositório discutia: o GAP declarado são os 61% que
nunca denunciaram, mas o modelo B2G entrega o aparelho a "mulheres já identificadas como em
risco" — exatamente a população que as soluções criticadas já cobrem. Vale ter resposta
pronta antes do júri fazer a pergunta.
