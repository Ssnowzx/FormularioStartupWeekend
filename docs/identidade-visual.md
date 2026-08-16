# Mulheres em Risco — identidade visual

> Nome do produto definido em 15/08/2026. Referência visual escolhida: [todasporuma.com](https://todasporuma.com)
> — ilustração vetorial de personagens, cores claras e não agressivas.

---

## ⚠️ A regra que organiza tudo: são DUAS identidades, não uma

Este é o ponto mais importante deste documento, e ele vem direto da pesquisa
([`benchmark/fracassos-e-criticas.md`](benchmark/fracassos-e-criticas.md), RNF-1).

| Superfície | Quem vê | Aparência |
|---|---|---|
| **Institucional** — landing page, deck do pitch, redes sociais, material de imprensa | Jurados, parceiros, imprensa, apoiadoras, doadores | **Ilustrada, calorosa, afirmativa.** É aqui que a estética da referência mora |
| **Produto** — o que fica no celular da mulher | A usuária **e potencialmente o agressor** | **Neutro, discreto, sem marca.** Não pode parecer app de proteção |

> Uma landing page linda com mulheres ilustradas segurando placas é excelente para convencer um
> jurado no domingo. **A mesma estética no ícone do celular dela pode ser motivo de agressão.**

A referência é ótima — mas ela é de uma organização de **advocacy**, cujo objetivo é ser vista.
O nosso produto tem um objetivo em parte oposto: **não ser notado**. Usar a mesma linguagem visual
nas duas pontas seria copiar a forma sem entender a função.

**Consequência prática:** o time de design produz dois conjuntos. Ambos são trabalho real; o
institucional é o que vai para o telão.

---

## Paleta

> **Atualizado em 16/08/2026.** A paleta institucional foi trocada a partir da referência
> própria do time (`orange-echo-shield-safe.base44.app`), extraída com `hallmark study`.
> A anterior — azul `#2E2FB8` sobre creme — não chegou a ser implementada em lugar nenhum.

A regra das duas identidades agora tem valores concretos dos dois lados. **Não são a mesma
paleta, e isso é o ponto.**

### Institucional — landing page, deck, imprensa

Âncora em roxo, com faixas profundas alternando com papel quase branco. Valores em OKLCH
(o hex fica ao lado para quem precisar em ferramenta de design):

```css
--color-paper:       oklch(99.2% 0.001 264.5);  /* #FCFCFD */
--color-ink:         oklch(16.4% 0.010 265.6);  /* #0C0E13 */
--color-ink-soft:    oklch(48.4% 0.015 261.5);  /* #5A5F68 */
--color-accent:      oklch(58.5% 0.143 315.0);  /* #9B5EB5 — a âncora */
--color-accent-soft: oklch(77.7% 0.084 313.6);  /* #CAA7DD */
--color-deep:        oklch(34.2% 0.110 311.1);  /* #4B2361 — as faixas escuras */
--color-emergency:   oklch(67.8% 0.210 24.7);   /* #FF5252 */
```

**Sobre o roxo e a regra anti-slop.** A lista de "slop de IA" abaixo proíbe *gradiente
roxo-para-azul em tudo*, e continua valendo. O que existe aqui é diferente: uma âncora
sólida, sem gradiente, usada com disciplina — e o roxo profundo carrega o ritmo da página
através da alternância de faixas. Se aparecer gradiente roxo→azul em qualquer superfície,
é erro.

**Regra do vermelho:** `--color-emergency` aparece **uma vez** na landing inteira, no aviso
de perigo imediato do rodapé. Em qualquer outro lugar ele compete com o roxo e a página vira
alarme — o oposto de "não agressivo".

### Produto — central, cadastro, página do Anjo

Continua no creme + azul-petróleo que está em `servidor/shared/web/theme.css` e já foi
validado em tela. É a superfície operacional: quem a usa está atendendo uma emergência, não
sendo convencido de nada.

```css
--cream: #FAF1E1;  --surface: #FFFBF3;  --petrol-deep: #155E63;
--coral: #AE432B;  --good: #387043;     --ink: #1F2A2B;
```

O app no celular dela não tem marca nenhuma: aparece como calculadora.

**Contraste:** `--color-accent` sobre papel dá 4.6:1 — passa em AA para corpo de texto.
`--color-accent-soft` **não passa** sobre papel; usar só sobre as faixas escuras ou em
superfície e ilustração.

---

## Estilo de ilustração

O que caracteriza a referência, e que precisamos reproduzir com autoria própria (não copiar os
desenhos deles):

- **Vetor plano.** Sem gradiente complexo, sem sombra realista. Sombreamento por bloco de cor mais escura.
- **Contorno seletivo.** Traço preto em elementos de leitura (dedos, dobras de roupa), ausente nas silhuetas grandes.
- **Corpos reais e diversos.** A referência acerta em cheio aqui: corpos gordos, cabelo crespo, tons de pele variados. **Isso não é decoração — é o público.** A pesquisa mostra que **64% das vítimas de feminicídio no Brasil são mulheres negras**. Uma ilustração só com mulheres magras e brancas contradiz o próprio produto.
- **Postura afirmativa.** Mão na cintura, olhar direto, ocupando o quadro. Não é vitimização — é agência.
- **Fundo respirando.** Muito espaço vazio creme. A figura não preenche a tela.

### O que evitar (as marcas de "slop de IA")

- Gradiente roxo-para-azul em tudo
- Pessoas genéricas sem etnia definida ou com mãos deformadas
- Ícones de cadeado e escudo — clichê de segurança, e denuncia o app
- Glassmorphism, brilho neon, partículas flutuando
- Foto de banco de imagens com mulher sorrindo abraçando os joelhos

As skills `hallmark-anti-slop` e `kill-ai-slop` existem exatamente para varrer isso.

---

## Tipografia

Definida em 16/08/2026 e **auto-hospedada** em `servidor/shared/web/fonts/` — sem CDN, sem
Google Fonts em runtime. Três arquivos variáveis, 128 KB somados.

- **Títulos:** **Sora** 700–800, tracking fechado (−0.03em). Geométrica, peso alto
- **Corpo:** **Inter** 400–500
- **Rótulos e marcadores:** **Space Grotesk**, caixa alta, tracking aberto (0.18em)

Corpo de texto **nunca em caixa alta**. Caixa alta só em selos e chamadas curtas.

---

## Movimento

A pesquisa impõe um limite que o design precisa respeitar: **nada de animação no fluxo de
emergência**. Movimento é para a página institucional, onde ele convence — não para a tela que ela
aciona com medo. Ali, cada milissegundo de transição é atrito.

- **Institucional:** entrada suave ao rolar, ilustrações com micro-movimento (respiração, aceno), transição entre seções. Skill `web-motion` cobre isso, inclusive gravando a página com Playwright para avaliar timing quadro a quadro.
- **Produto:** transição instantânea ou quase. Feedback tátil, não visual. Skill `micro-interactions` para os estados que importam (toque confirmado, ação desfeita).

E respeitar `prefers-reduced-motion` sempre.

---

## Skills instaladas para esta frente

| Skill | Para quê |
|---|---|
| `svg-creator` | Ilustrações SVG, **personagens** e animações, com loop render-verifica-corrige |
| `web-motion` | Animação web com princípios de motion design; grava a página e analisa quadro a quadro |
| `micro-interactions` | Estados de interação e feedback |
| `hallmark-anti-slop` | Design anti-slop de IA |
| `kill-ai-slop` | Varre o projeto e remove os tiques visuais e de texto típicos de IA |
| `frontend-design` | Fundamentos de UI |
| `theme-factory` | Geração e consistência de tema |
| `brand-guidelines` | Consistência de marca |
| `canvas-design` | Arte visual em PNG/PDF |
| `algorithmic-art` | Geração de arte por código (padrões de fundo, texturas) |
| `web-artifacts-builder` | Protótipo navegável rápido |

---

## Pendência

Falta definir o **logotipo** e o **nome de fachada do app** — o rótulo neutro sob o qual o produto
aparece no celular. "Mulheres em Risco" é o nome institucional, e é forte para o pitch; **não pode
ser o que aparece na tela inicial dela.**
