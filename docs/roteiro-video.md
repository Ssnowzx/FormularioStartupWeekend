# Roteiro do vídeo de apresentação

Pronto para gravar. **2min30**, mesma duração da referência escolhida pelo time.
Narração de 372 palavras, tom documental — cerca de 145 palavras por minuto, que
é o ritmo de quem explica, não de quem vende.

**Frase de abertura, definida pelo time:**
> O medo que silencia mulheres revela uma sociedade que ainda não aprendeu a
> protegê-las.

**Uma pendência de nome.** A referência é o manual da **Todas Por Uma**, que chama
as pessoas de confiança de **"Anjos"** — mesmo termo, mesma função, concorrente
ativa há 7 anos. O roteiro abaixo diz **"rede de confiança"**. Se o time preferir
manter "Anjos", é trocar a palavra nas cenas 6 e 7.

---

## Como gerar no NotebookLM

**Fontes a subir**, nesta ordem (o NotebookLM pesa mais as primeiras):

1. `docs/roteiro-video.md` — este arquivo
2. `docs/pesquisa-dominio.md`
3. `docs/benchmark/README.md`
4. `docs/estado-do-projeto.md`

**Prompt de customização** — colar no campo de personalização do Video Overview:

> Gere um vídeo explicativo em **português do Brasil**, narração em tom sério e
> documental, seguindo exatamente a ordem, a estrutura e o texto de narração do
> arquivo `roteiro-video.md`. Use somente os números que estão nas fontes e mostre
> a fonte na tela junto de cada número. Não afirme que o produto reduz violência
> nem que a polícia responde. Trate-o como protótipo em validação. Público:
> gestor público, delegacia da mulher e imprensa. Duração alvo: 2 minutos e 30.

**Conferir na saída, antes de publicar**

- [ ] Todo número aparece com a fonte na tela
- [ ] Não diz "reduz a violência", "salva vidas" nem "a polícia chega"
- [ ] Diz "protótipo em validação" pelo menos uma vez
- [ ] A tela do celular dela nunca mostra alarme grande nem contagem regressiva
- [ ] Nenhum ícone de cadeado ou escudo, nenhuma foto de banco de imagem

---

# O ROTEIRO

---

## Cena 1 — A tese
**0:00 – 0:20 · 42 palavras**

### Narração
> Quando uma mulher decide não pedir ajuda, quase nunca é falta de coragem. É
> cálculo. Ela sabe que gritar, na frente dele, pode piorar tudo.
>
> *(pausa de um segundo)*
>
> O medo que silencia mulheres revela uma sociedade que ainda não aprendeu a
> protegê-las.

### Na tela
Fundo creme, sem imagem, sem música. Só tipografia.

A frase final entra em três tempos, uma linha por vez:
`O medo que silencia mulheres` → `revela uma sociedade que` → `ainda não aprendeu
a protegê-las.` — a última linha em roxo.

### Observação
A pausa antes da frase é o que a faz pesar. Não encher com trilha sonora.

---

## Cena 2 — O tamanho do problema
**0:20 – 0:44 · 44 palavras**

### Narração
> Em 2025 foram mil quinhentos e sessenta e oito feminicídios no Brasil. O maior
> número já registrado. Sessenta e quatro por cento delas foram mortas dentro da
> própria casa. E a cada minuto, duas ligações chegam ao 190 por violência
> doméstica.

### Na tela
Um número por vez, grande, tipografia tabular, fonte em letra pequena embaixo:

| Número | Legenda | Fonte na tela |
|---|---|---|
| `1.568` | feminicídios em 2025 | Fórum Brasileiro de Segurança Pública, 2026 |
| `64%` | mortas dentro da própria casa | Fórum Brasileiro de Segurança Pública, 2026 |
| `1,06 mi` | chamadas ao 190 em 2024 | Fórum Brasileiro de Segurança Pública |

### Observação
Nenhum desses números é nosso, e o vídeo deve dizer isso. É o que separa
apresentação de propaganda.

---

## Cena 3 — A lacuna
**0:44 – 1:08 · 52 palavras**

### Narração
> O botão do pânico existe e funciona. Mas ele chega depois da denúncia, depois da
> medida protetiva, depois de entrar no programa. E sessenta e um por cento dos
> casos nunca chegam a ser denunciados. A mulher que ainda não denunciou está
> descoberta — não porque falte tecnologia, mas porque toda a proteção que existe
> hoje começa depois de uma decisão judicial.

### Na tela
Quatro caixas em linha, acendendo uma por vez conforme a narração:

`A violência` → `A denúncia` → `A medida protetiva` → `O botão do pânico`

Quando a narração diz "sessenta e um por cento", a **segunda caixa** ganha borda
roxa e o rótulo **aqui param 61%**. As duas caixas seguintes esmaecem.

Fonte na tela: Mapa Nacional da Violência de Gênero.

---

## Cena 4 — A palavra
**1:08 – 1:32 · 56 palavras**

### Narração
> A nossa aposta é que ela não deveria precisar alcançar o celular. Ela escolhe uma
> frase que só ela conhece, e diz essa frase em voz alta uma vez, na hora do
> cadastro, para confirmar que o aparelho entende. A partir dali, o reconhecimento
> acontece dentro do próprio celular. Sem internet. Sem enviar áudio para lugar
> nenhum. Nem nós sabemos qual frase ela escolheu.

### Na tela
A tela real do aplicativo no momento do cadastro: a lista de frases, uma
selecionada, e o botão **"Fale agora"** com a onda reagindo.

Depois, a palavra escolhida em letras grandes, com anéis se expandindo a partir
dela — e três selos aparecendo em sequência:

`sem internet` · `sem enviar áudio` · `nem nós sabemos qual é`

### Observação
O teste em voz alta no cadastro é detalhe real do produto e vale mostrar: é o que
garante que a frase funciona **naquele** aparelho, naquela voz, antes de a mulher
precisar dela.

---

## Cena 5 — Os dois lados
**1:32 – 2:00 · 66 palavras**

### Narração
> E aqui está a parte que decide tudo. Na tela dela, nada acontece. O aplicativo é
> uma calculadora, funciona como calculadora, e continua parecendo uma calculadora
> depois do acionamento. A única marca é uma vírgula no visor, combinada com ela.
>
> Do outro lado, no mesmo segundo, a central recebe o nome, o telefone, a
> referência de endereço, a bateria do aparelho, e a localização se atualizando
> enquanto ela anda.

### Na tela
Divisão ao meio, e os dois lados acontecem **ao mesmo tempo**:

**Esquerda** — a calculadora. O `0` do visor vira `0,`. Nada mais muda.
**Direita** — a ocorrência entrando na central, o cronômetro começando do zero,
o trajeto se desenhando no mapa.

### Observação
Esta é a cena mais importante do vídeo, e a que mais separa vocês de qualquer
concorrente. O contraste precisa ser literal: se a tela dela mudar de forma
visível, o vídeo está contando a história errada.

---

## Cena 6 — Quem chega primeiro
**2:00 – 2:18 · 60 palavras**

### Narração
> Junto com a central, a rede de confiança que ela mesma aprovou recebe um link e
> pode responder "estou a caminho". Uma irmã a dois quarteirões chega antes de
> qualquer viatura, e sabe quem vai encontrar do outro lado da porta.
>
> Levantamos o que existe em quatro continentes. O gargalo nunca é o alarme. É
> quem responde.

### Na tela
O celular da pessoa de confiança recebendo o aviso, e o toque em **"Estou a
caminho"**. Em seguida, a central registrando isso na linha do tempo.

Depois, dois números com fonte:

| `189 de 1.250` | tornozeleiras em uso efetivo em São Paulo |
| `5 a 7 mil` | alertas por dia na França, para cerca de dez pessoas atendendo |

Fonte na tela: levantamento próprio, fontes públicas.

---

## Cena 7 — O que não prometemos
**2:18 – 2:30 · 52 palavras**

### Narração
> Não prometemos reduzir a violência: nenhum aplicativo no mundo tem essa
> evidência. Não classificamos risco por algoritmo. E não prometemos resposta
> policial sem parceria assinada.
>
> Isto é um protótipo em validação. Estamos procurando uma delegacia disposta a
> testar em campo.

### Na tela
As três recusas, uma por linha, sem ícone.

Fecha com o contato e uma linha só:
**Mulheres em Risco · Lages, SC**

### Observação
Terminar pelo que não se promete é incomum, e é exatamente por isso que funciona
com quem já ouviu promessa demais. A pesquisa de vocês é, em boa parte, um
catálogo de projetos que prometeram e não entregaram.

---

# Variações

## 60 segundos, para rede social
Cenas **1 → 4 → 5 → 7**. Corta os blocos de números. A tese abre, a palavra
explica, os dois lados provam, a recusa fecha.

## 45 segundos, só o mecanismo
Cena **5** inteira, precedida por uma frase de contexto e seguida pela chamada.
É a versão para quem já conhece o problema — uma delegada, por exemplo.

---

# O que não pode entrar

- Número sem fonte na tela
- "Reduz a violência", "salva vidas", "a polícia chega em X minutos"
- Tela de alarme grande e visível no celular dela — contradiz a discrição que o
  próprio vídeo acabou de prometer
- Ícone de cadeado ou escudo, e foto de banco de imagem com mulher abraçando os
  joelhos
- O nome "Mulheres em Risco" aparecendo na tela inicial do celular dela: é o nome
  institucional, e no aparelho o app é uma calculadora
