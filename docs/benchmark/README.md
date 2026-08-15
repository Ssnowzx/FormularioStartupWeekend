# Benchmark — síntese transversal

> Varredura de quatro continentes sobre tecnologia de proteção a mulheres.
> Startup Weekend Women Lages 2026. Levantado em 14–15/08/2026.

## Documentos

| Arquivo | Conteúdo |
|---|---|
| [`brasil.md`](brasil.md) | Startups, apps de governo, legislação 2025–26, números do mercado, espaço vazio |
| [`europa.md`](europa.md) | Espanha (VioGén e pulseiras), França (BAR e TGD), Reino Unido, diretiva da UE |
| [`asia.md`](asia.md) | Índia, China, Japão, Coreia do Sul, Sudeste Asiático |
| [`fracassos-e-criticas.md`](fracassos-e-criticas.md) | **Leia primeiro.** Academia, o paradoxo do agressor, post-mortems, VioGén, perguntas do júri |
| [`tecnologia-emergente.md`](tecnologia-emergente.md) | O que é realmente construível em 54h — e as 5 combinações que ninguém está fazendo |
| [`eua.md`](eua.md) | O padrão de sobrevivência: o que vive, o que morreu e por quê. Inclui apps disfarçados |

> **Não coberto por esgotamento da cota de busca:** o panorama de financiamento (VC, fundos de
> impacto, editais). O agente responsável voltou majoritariamente sem verificação e **nenhum número
> de captação daquela rodada deve ser usado**. Refazer com
> `CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION=500`.

---

## Os cinco padrões que aparecem em todos os continentes

### 1. Botão de pânico é commodity global saturada

Presente em praticamente toda iniciativa mapeada — privada e pública — no Brasil, Índia, China,
Japão, Coreia, Espanha, França e Reino Unido. Interface disfarçada também é universal. **É o produto
mínimo do setor inteiro, não um diferencial.**

### 2. O gargalo nunca é técnico — é operacional

Este é o achado mais forte da varredura, e ele se repete com uma consistência que chega a ser
desconfortável:

| Onde | Evidência |
|---|---|
| **São Paulo** | 1.250 tornozeleiras disponíveis, **189 agressores monitorados** |
| **Goiás** | 600 dispositivos para o estado; advogada acionou **50 vezes, atendida 1** |
| **França (BAR)** | **5.000–7.000 alertas** em tempo real para **~10 funcionários** |
| **França (TGD)** | Em 2019, **2/3 dos dispositivos parados em estoque** sem atribuição |
| **Índia (Nirbhaya Fund)** | ~US$ 1 bilhão aprovado, **31% de execução** — 70% nunca virou serviço |
| **Reino Unido (Clare's Law)** | Essex Police informou **5% dos 1.940 pedidos** em 2 anos |

> Em todos os casos o recurso **existe e está parado**. Ninguém está atacando o fluxo entre polícia,
> justiça e vítima. É o espaço vazio mais bem documentado desta pesquisa.

### 3. Scoring algorítmico de risco falha — e mata

**VioGén (Espanha):** 247 mulheres assassinadas após avaliação; 56% dos casos revisados eram risco
baixo ou negligenciável; 95% de aderência policial cega à nota automática; AUC de 0,66–0,8; código
fechado. O "VioGén 2" corrigido foi lançado em ago/2025 — e em out/2025 uma mulher classificada como
baixo risco, com medida protetiva ativa, foi assassinada.

**DARA (Reino Unido):** rollout nacional baseado em piloto de **220 casos**; classificações de alto
risco **caíram** de 10% para 6% após implantação; "loteria de código postal".

**O único contraexemplo positivo de toda a varredura:** o **Lethality Assessment Program** de
Maryland está associado a **redução de ~40% em homicídios de parceiro íntimo** — porque combina
avaliação com **conexão imediata a serviço humano**, não com uma pontuação isolada.

### 4. Vazamento de dados é catastrófico, não regulatório

- **App Tea (EUA, 2025):** bucket Firebase aberto — 72 mil imagens, 13 mil selfies com documentos, 1,1 milhão de mensagens. Horas depois, publicaram um **mapa cruzando fotos com localização**.
- **Pulseiras da Espanha:** falha na migração entre operadoras apagou o histórico de localização — **dezenas de agressores absolvidos** por falta de prova. Governo sabia em jan/2024, admitiu em set/2025.
- **ICO (Reino Unido):** 7 organizações repreendidas desde jun/2022 por expor endereços seguros de vítimas.

### 5. Não existe capital de risco neste espaço

O femtech europeu (~US$ 191M em 2023) concentra-se em fertilidade e ciclo, **não em segurança**. O
Women TechEU não tem beneficiária no vertical. No Brasil, o único caso de captação encontrado é a
**Plinq (R$ 1,3 mi, 2025)** — e ela não faz botão de pânico, faz checagem de antecedentes.

O dinheiro do setor vem de **subvenção pública e parceria ONG+CSR corporativo**. Isso é argumento de
mercado — e também alerta sobre sustentabilidade.

---

### 6. Modelo de receita decide sobrevivência — mais que qualidade ou tração

O padrão americano é o mais didático de toda a varredura:

- **Circle of 6** venceu um desafio federal, chegou a **200 mil usuários em 33 países** e morreu. Os criadores recusaram monetizar por princípio: *"é importante não monetizar segurança"*.
- **myPlan** tem **~12 mil usuários/ano** e está vivo há mais de uma década — financiado por NIH, com 11 publicações revisadas por pares.

Sobrevive quem tem **receita recorrente** (Noonlight, bSafe, Life360) ou **mandato institucional**
(uSafeUS, via Lei Clery e Title IX; myPlan, via pesquisa). E as grandes empresas estão **recuando**:
ADT matou o SoSecure em mar/2026, a NNEDV matou os dois apps próprios, o Match Group abandonou
checagem de antecedentes.

> Enquanto isso, a Life360 chega a **102 milhões de usuários e US$ 489,5 mi de receita** — justamente
> **por não ser um produto de violência doméstica.**

### 7. Disfarce não é a solução que parece ser

A NNEDV e a Coalition Against Stalkerware recomendam **dispositivo separado**, não ocultação — porque
*"o histórico do download ainda existe no aparelho, em qualquer backup, ou na conta da loja"*. Apps
disfarçados comercialmente sustentados são raros; os exemplos que aparecem são **protótipos de
hackathon nunca lançados**. O padrão maduro é o **botão de saída rápida** bem desenhado.

---

## O que funcionou (e por quê)

| Caso | Por que funcionou |
|---|---|
| **Digi Police** (Tóquio) | A inovação foi de **design social, não técnica** — só toca um grito e mostra "há um assediador, ajude". Resolve a paralisia e a vergonha com fricção quase zero. 470 mil downloads |
| **Ansimi / Help Me Bell** (Seul) | Hardware de **US$ 5** + app + CFTV municipal **já existente**. Distribuição gratuita segmentada. **Resposta local escala melhor que nacional** |
| **Grab / Gojek** (Sudeste Asiático) | Segurança **embutida em produto que as pessoas já usam** — adesão muito maior que app dedicado |
| **Safetipin** (Índia) | **B2G de dados**, não de emergência. Não depende de resposta policial: alimenta política pública de iluminação e patrulhamento. Replicável em orçamento municipal pequeno |
| **Todas por Uma** (Brasil) | Gratuito para a vítima, sustentado por **parcerias institucionais**. Vivo e crescendo 7 anos depois |
| **Leaf Wearables** (XPRIZE) | < US$ 40, < 90 s, **funciona sem sinal de celular** via mesh Bluetooth |

## O que morreu (e por quê)

**Malalai** (BR) — metodologia rigorosa, morreu após o crowdfunding. **Âmago** (BR) — domínio caiu.
**Athena/ROAR** (EUA) — crowdfunding 566% acima da meta, fabricante não entregou, descontinuado em
2019. **Ask for ANI** (RU) — encerrado em nov/2024 com apenas **186 encaminhamentos em 3 anos**.
**Mandato indiano de botão de pânico** — o número 112 nem estava operacional no lançamento.
**SOS Mulher** (SP) — descontinuado para migrar a outro app.

> **Padrão:** nenhum caiu por falta de boa ideia. Caíram por insustentabilidade financeira pós-hype,
> por infraestrutura operacional que a tecnologia não resolve, ou por descontinuidade institucional.

---

## Três oportunidades que a varredura sustenta

1. **Fluxo operacional, não dispositivo.** 1.061 tornozeleiras paradas em SP é um problema de
   software de gestão e triagem, e ninguém está nele. Vende-se B2G.
2. **Digitalizar o que é analógico.** Sinal Vermelho tem ~15.000 farmácias credenciadas e **zero
   camada digital**. Nenhum mapa em tempo real, nenhuma verificação de ponto aberto.
3. **Contra-vigilância.** A Refuge documenta +258% em abuso tech-facilitado: rastreadores de £35,
   AirTags, carros conectados, anéis de fertilidade. **Nenhuma solução estatal europeia endereça
   isso** — e nem o Domestic Abuse Act britânico menciona.

---

## O que a pesquisa proíbe

Está tudo detalhado em [`fracassos-e-criticas.md`](fracassos-e-criticas.md), mas o essencial:

- **Não prometer redução de violência.** A revisão sistemática de 2023 analisou 621 apps e não achou um único estudo de efetividade.
- **Não prometer resposta policial** sem parceria formal assinada.
- **Não fazer scoring de risco automatizado** sem auditoria externa e explicabilidade para a vítima.
- **Não reter dado que não seja estritamente necessário.** Retenção é risco, não recurso — e é intimável pela defesa do agressor.
- **Não presumir que ela tem smartphone privado e seguro.** Presumir isso é presumir que ela não está no pior momento do abuso.
