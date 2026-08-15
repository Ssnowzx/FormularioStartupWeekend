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

O servidor foi testado com banco real e está no GitHub, pronto para subir na VPS.
O passo a passo está em `servidor/README.md`.

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

## Próximos passos

1. **Levar as três perguntas acima à Delegacia da Mulher.** É a fonte que ninguém mais
   tem, e um "sim, topamos testar" vale mais que qualquer slide.
2. **Subir o servidor na VPS** e trocar o link do questionário pelo endereço próprio.
3. **Aplicar a pesquisa com mulheres** — o painel destaca sozinho o percentual que não
   falaria a palavra em voz alta. Acima de 40%, o gatilho de voz precisa ser repensado.
4. **Decidir o nome de fachada** do app — o rótulo neutro que aparece na tela dela.
   "Mulheres em Risco" é forte para o júri e perigoso para a tela inicial.

---

## O contraexemplo que vale lembrar no domingo

De toda a varredura, uma única iniciativa tem redução de mortes comprovada: o
**Lethality Assessment Program** de Maryland, com queda de ~40% em homicídios de
parceiro íntimo. A diferença é que ele não entrega uma pontuação e vai embora — ele
coloca a mulher **ao telefone com um serviço de apoio na mesma hora**, ainda na
ocorrência.

O score não era o produto. A ponte era.
