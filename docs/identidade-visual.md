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

Extraída da referência, ajustada para contraste acessível. Nomes em inglês (regra de idioma do
código); os valores são o contrato.

```css
:root {
  /* Base — creme quente, nunca branco puro */
  --bg-cream:        #FDF3ED;
  --bg-cream-deep:   #F7E9E0;
  --surface:         #FFFFFF;

  /* Azuis — cor principal da marca */
  --blue-soft:       #7B9CE3;  /* vestido: superfícies amplas, ilustração */
  --blue-deep:       #2E2FB8;  /* top: títulos, botões primários */
  --blue-ink:        #1A1A3E;  /* texto sobre creme */

  /* Acentos */
  --coral:           #E8453C;  /* haste da placa: CTA, alertas — usar com parcimônia */
  --teal:            #4FC3B0;  /* colar: destaques secundários, sucesso */
  --sand:            #E8C4A0;  /* transições suaves */

  /* Texto */
  --text-primary:    #1A1A2E;
  --text-secondary:  #55556B;
}
```

**Regra do coral:** é a única cor quente forte da paleta. Reservar para **uma** ação por tela.
Coral em tudo vira alarme visual — o oposto de "não agressivo".

**Contraste:** `--blue-deep` sobre `--bg-cream` dá contraste alto e seguro. `--blue-soft` sobre creme
**não passa** em WCAG AA para texto pequeno — usar só em superfícies e ilustração, nunca em corpo de
texto.

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

Sem-serifa geométrica e amigável, com peso alto para títulos — a placa da referência usa caixa alta
bold. Sugestões (todas com bom suporte a português):

- **Títulos:** Poppins, Outfit ou Nunito — peso 700/800
- **Corpo:** Inter ou Source Sans — peso 400/500

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
