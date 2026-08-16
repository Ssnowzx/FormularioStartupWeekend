# Estado do projeto

> Fechamento da sessão de 15/08/2026. Para retomar sem reler tudo.

---

## O que está decidido

**Produto:** *Mulheres em Risco* — nome institucional, para pitch e imprensa. No celular
da usuária o app aparece disfarçado, tipo calculadora.

**A ideia não é um botão, é um gatilho de voz.** A mulher fala uma palavra secreta
escolhida por ela; o celular ouve mesmo largado na bolsa e envia alerta com localização
e áudio ao vivo para uma central, que despacha a polícia durante a ocorrência. O áudio
também vira prova.

**Modelo:** B2G, para Secretaria Estadual de Segurança, que instala em mulheres já
identificadas como em risco.

**Porta de entrada em Lages:** Delegacia da Mulher. Consenso do time.

---

## O que está pronto

| Onde | O quê |
|---|---|
| `docs/pesquisa-dominio.md` | O problema em números, com fontes |
| `docs/benchmark/` | Varredura de Brasil, EUA, Europa e Ásia — o que existe, o que morreu e por quê |
| `docs/identidade-visual.md` | Paleta creme + azul-petróleo, e a regra das duas identidades |
| `docs/cabine-de-decisao.html` | Cédula do time, com a pesquisa embutida |
| `docs/pauta-de-mentoria.html` | 19 perguntas para mentores, com o porquê de cada uma |
| `docs/pesquisa-de-campo.html` | Roteiros para órgãos e para mulheres, uso interno |
| `docs/questionario-institucional.html` | Para enviar à Delegacia responder |
| `docs/questionario-mulheres.html` | Anônimo, para responder no celular do time |
| `servidor/` | Node + MariaDB: formulário, banco e painel em `/admin` |
| `servidor/alerts.js` | API do aparelho, da central e do Anjo, montada com 2 linhas de diff |
| `servidor/publico/dispatch.html` | Central ao vivo: fila, trajeto, Anjos, linha do tempo |
| `servidor/publico/guardian.html` | A página que o Anjo abre no celular dele |
| `servidor/publico/enroll.html` | Cadastro da usuária e dos Anjos, com o código de vínculo |
| `servidor/publico/simulator.html` | Finge ser o app — o seguro da demonstração |
| `app-android/` | APK Kotlin: calculadora de fachada, Vosk offline, alerta com localização |
| `docs/como-rodar-a-demo.md` | Do laptop desligado até a palavra chegando na central |

O servidor foi testado com banco real e está no GitHub, pronto para subir na VPS.
O passo a passo está em `servidor/README.md`.

**O fluxo inteiro foi verificado ponta a ponta no navegador**, com a central recebendo o
alerta em menos de um segundo, o trajeto se movendo, o Anjo abrindo o link e o "estou a
caminho" voltando: 7 segundos entre o acionamento e o Anjo confirmar.

**Funcionou num celular Android de verdade em 15/08.** A palavra foi falada em voz alta, o
alerta chegou à central, a ocorrência foi resolvida no painel e o aparelho voltou a acionar
com a mesma palavra. O ciclo inteiro fecha.

Dois bugs só apareceram nesse uso real, e valem lembrar porque nenhum teste automatizado os
pegaria: os arquivos do modelo de voz chegavam truncados em 4 MiB (asset comprimido), e o
celular ficava travado depois que a central resolvia, porque **quem encerra a ocorrência é a
central e não existe push para o aparelho — ele precisa perguntar**.

Ainda não foi testado: tela apagada, celular na bolsa, e serviço rodando por muito tempo em
aparelho de fabricante que mata processo em segundo plano.

---

## Os três riscos que decidem o pitch

**1. Ela consegue falar?** O gatilho depende da voz dela. Com a mão dele no pescoço, ou
com o medo travando, a palavra não sai. O próprio Jean Michel respondeu *"na ocasião
não"*. O Digi Police de Tóquio resolveu o mesmo problema ao contrário: o app **grita
pela vítima** em vez de esperar que ela grite.

**2. O bloco jurídico está inteiro em aberto.** Transmitir áudio ambiente ao vivo para
um órgão público, sem o agressor saber, esbarra em interceptação? O áudio serve como
prova ou o advogado dele derruba? As respostas do time foram *"consulte a legislação"*.
Um promotor ou delegada responde isso de improviso — está no roteiro dos órgãos.

**3. A solução gera mais alerta para uma central que já não vaza.** São Paulo tem 1.250
tornozeleiras e 189 em uso. A França recebe 5 a 7 mil alertas por dia com dez
funcionários. O gargalo que a pesquisa encontrou em seis jurisdições não é o alarme — é
a resposta. Nossa ideia aumenta o volume de alarme.

---

## O quarto risco, que só apareceu ao construir

**O ponto verde do microfone.** No Android 12+, qualquer captura contínua de áudio acende o
indicador de privacidade na barra de status e registra o uso no Painel de Privacidade. Isso
vale para o Vosk, para o reconhecedor do Google e para qualquer outra abordagem — não existe
contorno legítimo para um aplicativo comum.

Um app disfarçado de calculadora com o ponto verde permanente é um disfarce com um furo
permanente. Há duas saídas, e é preciso escolher uma antes do júri perguntar: assumir ("o
disfarce protege do olhar casual, não da perícia") ou passar a escutar em janelas
intermitentes, o que degrada exatamente a função central.

## Próximos passos

1. **Levar as três perguntas acima à Delegacia da Mulher.** É a fonte que ninguém mais
   tem, e um "sim, topamos testar" vale mais que qualquer slide.
3. **Subir o servidor na VPS** e trocar o link do questionário pelo endereço próprio.
   O `schema_alerts.sql` roda depois do `schema.sql`, e o nginx precisa de
   `proxy_buffering off` para o alerta não chegar atrasado na tela.
4. **Aplicar a pesquisa com mulheres** — o painel destaca sozinho o percentual que não
   falaria a palavra em voz alta. Acima de 40%, o gatilho de voz precisa ser repensado.
5. **Decidir o nome de fachada** do app. Por ora está "Calculadora", que é o que a doc já
   apontava; falta o logotipo e a decisão formal do time.

---

## O contraexemplo que vale lembrar no domingo

De toda a varredura, uma única iniciativa tem redução de mortes comprovada: o
**Lethality Assessment Program** de Maryland, com queda de ~40% em homicídios de
parceiro íntimo. A diferença é que ele não entrega uma pontuação e vai embora — ele
coloca a mulher **ao telefone com um serviço de apoio na mesma hora**, ainda na
ocorrência.

O score não era o produto. A ponte era.
