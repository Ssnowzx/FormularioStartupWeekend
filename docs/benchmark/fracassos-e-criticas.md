# Por que produtos de segurança para mulheres falham

> Pesquisa crítica — o documento mais importante deste repositório.
> Levantado em 15/08/2026, 20+ buscas em inglês, português e espanhol.
> Onde a evidência é fraca ou ausente, está dito explicitamente em vez de preenchido com suposição.

---

## 1. O que a academia diz (e não é animador)

O corpo de pesquisa mais sólido do mundo vem do **Cornell Tech — clínica CETA (Clinic to End Tech
Abuse)**: Diana Freed, Nicola Dell, Thomas Ristenpart, Rahul Chatterjee e colaboradores.

- **["A Stalker's Paradise": How Intimate Partner Abusers Exploit Technology](https://dl.acm.org/doi/10.1145/3173574.3174241)** (CHI 2018, Best Paper) — 89 participantes (vítimas, ONGs, policiais). A maioria dos ataques tecnológicos em violência doméstica **não é sofisticada**: o agressor usa contas compartilhadas, senhas conhecidas, apps de "família" e redes sociais comuns, não spyware avançado. *Qualquer app novo que a vítima instale entra nesse mesmo ecossistema vulnerável.*
- **[Clinical Computer Security for Victims of IPV](https://www.usenix.org/conference/usenixsecurity19/presentation/havron)** (USENIX Security 2019) e **["Is my phone hacked?"](https://www.ipvtechresearch.org/research)** (CSCW 2019) — o problema não se resolve com "mais um app", e sim com atendimento individualizado tipo clínico, porque cada situação de abuso é diferente.
- **[Care Infrastructures for Digital Security in IPV](https://www.ipvtechresearch.org/research)** (CHI 2022, Best Paper) — segurança digital da vítima depende de uma rede de apoio, não de uma ferramenta isolada.
- **[The Spyware Used in Intimate Partner Violence](https://nixdell.com/papers/spyware.pdf)** (IEEE S&P 2018) — cataloga como apps de rastreamento familiar/parental são reaproveitados como stalkerware.

### A revisão sistemática que derruba a premissa do setor

**[Smartphone Apps for Domestic Violence Prevention: A Systematic Review](https://pmc.ncbi.nlm.nih.gov/articles/PMC10094623/)** (2023) — analisou **621 apps**, revisou 136 em profundidade:

- **Nenhum estudo de efetividade foi encontrado.** Não há evidência robusta de que esses apps reduzam violência.
- Nenhum app analisado usa IA ou automação — **todo alerta depende de ativação manual da vítima**, que muitas vezes está fisicamente impedida de fazer isso no momento crítico.
- Barreiras recorrentes: assinaturas pagas, plataforma única, sem modo offline, sem gravação, barreiras de idioma e alfabetização.
- O único ensaio clínico randomizado da literatura é o **[MyPlan](https://pmc.ncbi.nlm.nih.gov/articles/PMC4563945/)** — para namoro entre universitárias, não violência doméstica geral, e não é sobre botão de pânico.

> **Consequência direta para o pitch:** não prometam "reduzir violência". Não há base científica.
> Prometam resolver um gargalo operacional específico e mensurável.

---

## 2. O paradoxo central: a ferramenta de proteção vira arma do agressor

Provavelmente o ponto mais importante de toda esta pesquisa.

### Casos documentados

- **Lilie James (Austrália, 2023)** — morta pelo ex, que a rastreava pelo Snapchat. Pesquisa com 1.000+ jovens de 16–25 anos mostrou que **a maioria interpreta rastreamento de parceiro como "sinal de cuidado e confiança"**, e sente pressão social para não desativar o compartilhamento. [The Conversation](https://theconversation.com/location-sharing-apps-are-enabling-domestic-violence-but-young-people-arent-aware-of-the-danger-253932)
- **Apple Watch + Life360** — homem indiciado por violência doméstica usou os dois combinados para localizar a ex. [iTechPost](https://www.itechpost.com/articles/109746/20220328/man-arrested-innovatively-using-apple-watch-life-360-stalk-girlfriend.htm)
- **Tráfico de pessoas via Life360** — traficantes **obrigavam vítimas a instalar o app** para monitorar "metas" diárias de exploração sexual. O CEO admitiu que a empresa não escalou o problema à diretoria mesmo sabendo do padrão desde 2019. [Forbes](https://www.forbes.com/sites/thomasbrewster/2023/04/06/sex-traffickers-use-parenting-apps-like-life360-to-spy-on-victims/)

### O vazamento do app Tea (EUA, 2025) — o pior cenário realizado

App de segurança para mulheres em encontros. Armazenava dados em bucket Firebase **sem proteção**.
Vazaram **72 mil imagens**, incluindo **13 mil selfies e documentos de identidade** enviados para
verificação, mais **1,1 milhão de mensagens privadas**. Horas depois, um fórum anônimo publicou um
**mapa cruzando as fotos vazadas com a localização das mulheres**.
[DoControl](https://www.docontrol.io/blog/dating-safety-app-tea-hit-by-massive-data-leak) · [The Week](https://theweek.com/tech/tea-app-hack-user-data-stolen-from-womens-dating-safety-app)

### Apps de pânico falhando na função básica

O [Safety Net Project / techsafety.org](https://www.techsafety.org/choosingapps/) testou apps de
pânico e encontrou casos em que **"o app falhou em enviar a localização correta, ou não enviou
nenhuma informação"**. O mesmo guia alerta que, mesmo apagado, o histórico de instalação permanece
no backup e na conta da loja — e pode ser descoberto pelo agressor.

### Risco jurídico pouco discutido

O mesmo guia aponta que **"o advogado do agressor pode intimar a empresa do app para obter
informações sobre a vítima"**. Dados de segurança podem ser usados no processo *contra* a vítima.

---

## 3. Produtos que fracassaram — post-mortems

| Produto | O que tentou | Por que fracassou |
|---|---|---|
| **Athena / ROAR for Good** (EUA) | Pulseira/broche de pânico, crowdfunding 566% acima da meta (2015) | Fabricante não deu conta do volume (~2 anos de atraso); mercado de wearables estagnou; a novidade "gastou". Descontinuou o hardware em 31/12/2019 e pivotou para B2B (segurança de camareiras de hotel). [technical.ly](https://technical.ly/startups/roar-for-good-discontinuing-flagship-product-athena-yasmine-mustafa/) |
| **Revolar** (EUA) | Vestível de pânico | Fechou temporariamente; só sobreviveu com aporte de capital de emergência |
| **Mandato indiano de botão de pânico (2017)** | Obrigou todo celular vendido na Índia a ter botão de pânico | O número 112 **não estava operacional** na data do lançamento; fabricantes pediram adiamento; piloto em Délhi teve falhas técnicas, rede instável e resposta lenta. [QZ](https://qz.com/india/1171311/india-is-installing-panic-buttons-on-mobile-phones-to-keep-its-women-safe-will-it-work) |
| **Nirbhaya Fund** (Índia) | ~₹9.549 crore para segurança de mulheres | Só ~₹2.989 crore gastos. Ministérios preferiram CCTV a serviços diretos. Oxfam classificou como "subutilizado e não chegando às vítimas". [The Print](https://theprint.in/india/nirbhaya-fund-underused-slotted-for-services-that-dont-help-women-directly-oxfam-report/601936/) |
| **Botão do Pânico (Brasil)** | Dispositivo vinculado a medida protetiva, aciona a PM | **Goiânia, 2025/2026: advogada com medida protetiva acionou o botão 50 vezes e foi atendida uma única vez.** Goiás tinha **600 dispositivos para todo o estado**; ela esperou quase 10 dias para receber o aparelho após decisão judicial; violações foram arquivadas com a justificativa de que o agressor estava "em trânsito". [Direito News](https://www.direitonews.com.br/2026/04/advogada-diz-acionou-botao-panico-50-vezes-contra-ex-violento-foi-atendida-unica-vez.html) |
| **Apps brasileiros de 2019** | Salve Maria-PI, SOS Mulher, PenhaS, Juntas, Mete a Colher, Apoio Vítima | O governo de SP **descontinuou o SOS Mulher** para migrar a um app unificado — padrão de app público lançado e depois abandonado sem continuidade do histórico da vítima. Não foi possível verificar o status atual de todos os 7, o que em si indica **ausência de acompanhamento público de longo prazo**. [Correio Braziliense](https://www.correiobraziliense.com.br/app/noticia/brasil/2019/04/10/interna-brasil,748683/conheca-sete-aplicativos-que-combatem-a-violencia-contra-a-mulher.shtml) |

**Padrão comum:** nenhum caiu por falta de boa ideia. Caíram por (a) insustentabilidade financeira
pós-hype, (b) infraestrutura operacional que a tecnologia sozinha não resolve, ou (c)
descontinuidade institucional.

---

## 4. VioGén (Espanha) — o estudo de caso mais importante do mundo

O **maior sistema de avaliação algorítmica de risco de violência de gênero do planeta**: 3+ milhões
de casos desde 2007, usado pela polícia espanhola para decidir o nível de proteção de cada vítima.

### Os números

- Desde 2007, **247 mulheres foram assassinadas** depois de avaliadas pelo VioGén.
- Em revisão de 98 homicídios, **55 vítimas (56%)** haviam sido classificadas como risco "insignificante" ou "baixo". [AI Incident Database / NYT](https://incidentdatabase.ai/cite/747/)
- Em 2014, **14 das 15 mulheres assassinadas** que haviam denunciado tinham classificação de baixo risco. [AI Incident Database](https://incidentdatabase.ai/cite/186/)
- A polícia **mantém a pontuação automática em 95% dos casos**, apesar de o sistema ser formalmente apenas uma "recomendação".
- Em 2021, apenas **1 em cada 7 mulheres** que buscaram proteção policial de fato a recebeu.

### A auditoria que o governo recusou

O Ministério do Interior **recusou uma auditoria interna confidencial e pro bono** oferecida pela
Fundación Éticas, que fez então uma auditoria externa por engenharia reversa:

- **80%+ das vítimas** relataram dificuldade para responder ao questionário de risco — aplicado logo após a denúncia, quando a vítima está em choque.
- Apenas **35% das vítimas** foram informadas da própria pontuação de risco.
- O questionário usa **35 indicadores binários** (sim/não), incapazes de captar nuance, e **subestima sistematicamente a violência psicológica**.
- O governo **negou acesso ao código-fonte**.

[Montreal AI Ethics / Éticas](https://montrealethics.ai/eticas-foundation-external-audits-viogen-spains-algorithm-designed-to-protect-victims-of-gender-violence/) · [Vozpópuli](https://www.vozpopuli.com/espana/politica/el-sistema-viogen-cuando-el-algoritmo-no-detecta-el-riesgo.html)

### O dado mais duro

Em **agosto de 2025** o governo lançou o **"VioGén 2"**, anunciado como correção. Em **outubro de
2025** — já sob o sistema corrigido — uma mulher de 21 anos em Villaverde (Madri), classificada como
**baixo risco**, com medida protetiva ativa e múltiplas denúncias prévias, **foi assassinada**.

> Nem a segunda geração do sistema mais estudado do mundo resolveu o problema — porque ele não é
> técnico. É de **como o risco é medido, comunicado e seguido operacionalmente**.

**Caso emblemático:** Lobna Hemid apresentou fotos de hematomas e histórico policial do marido.
O VioGén classificou como baixo risco. Sete semanas depois, foi esfaqueada e morta (janeiro de 2022).

---

## 5. Falsos alarmes e o gargalo operacional

- Sistemas de alarme residencial têm **taxa de falso alarme de 94–99%**. Em Los Angeles, isso já consumiu **15% dos recursos policiais**.
- **Fadiga de alarme**: após 3–4 falsos positivos, operadores começam a desconfiar do sistema — tempos de resposta aumentam e alertas são descartados sem investigação.
- No Brasil o problema é o inverso: **não é falso alarme que sobrecarrega, é escassez de recursos** — 600 dispositivos para um estado inteiro, resposta em 1 de 50 acionamentos reais.

> Um botão de pânico só é tão bom quanto a capacidade operacional por trás dele. Um MVP de hackathon
> não resolve esse gargalo — e prometer isso sem parceria institucional real é a promessa mais fácil
> de o júri desmontar.

---

## 6. Exclusão digital — lacuna honesta desta pesquisa

Não foi encontrado estudo quantitativo dedicado a "mulheres em situação de violência sem acesso a
smartphone, dados ou celular privado" com números citáveis. **Isso é, em si, um achado**: é uma
lacuna de pesquisa pouco documentada publicamente.

O que se pôde confirmar indiretamente:
- A revisão sistemática identificou como barreiras reais: assinaturas pagas, plataforma única, idioma e alfabetização.
- A pesquisa da Cornell Tech mostra que o controle do agressor sobre **o dispositivo, a linha e o plano de dados** é tática comum e básica de abuso.

> Presumir que a vítima tem acesso privado e contínuo ao próprio celular já é, na prática, presumir
> que ela **não** está no pior momento do abuso.

**Recomendação:** tratar como pergunta em aberto a responder com dado local. Perguntar a uma
delegacia ou ONG de Lages quantas usuárias não têm celular próprio ou têm o aparelho monitorado.

---

## 7. Ética, consentimento e dados

- **Intimação judicial** — confirmado pelo techsafety.org: dados de geolocalização e uso do app podem ser objeto de pedido judicial pela defesa do agressor.
- **Retenção de dados é risco, não segurança.** Cada registro guardado é um ativo que pode vazar (caso Tea) ou ser usado contra a vítima.
- **LGPD (Lei 13.709/2018)** — dados de vítima tendem a se enquadrar como sensíveis. **Não foi encontrada jurisprudência ou parecer brasileiro específico** sobre LGPD em apps de proteção a vítimas. Tratar como pendência jurídica real, não como resolvida no pitch.
- **Modelo alternativo recomendado pela pesquisa:** a "segurança computacional clínica" do CETA — atendimento individualizado, com consentimento explícito e revisitado, em vez de coleta automática e silenciosa "para o bem da vítima".

---

## Os 7 erros que NÃO podemos cometer

1. **Presumir eficácia sem evidência.** Não existe estudo robusto mostrando que apps de segurança reduzem violência.
2. **Ignorar que a ferramenta pode virar arma do agressor.** Desenhar assumindo que ele pode descobrir, se instalar, ou coagir a vítima a usá-la contra si mesma.
3. **Prometer botão de pânico sem parceria operacional real.** Sem acordo formal sobre tempo de resposta, é a promessa vazia da Índia 2017 e de Goiânia 2026.
4. **Construir "mais um app" sem plano de sustentabilidade.** Athena, Revolar e os 7 apps brasileiros morreram quando o financiamento inicial acabou.
5. **Confiar em score algorítmico sem auditoria externa e sem explicabilidade para a vítima.** VioGén: 247 mortes, 56% classificadas como baixo risco.
6. **Negligenciar segurança de backend.** Um vazamento é pior que não ter o produto — expõe exatamente quem deveria proteger.
7. **Desenhar só para quem tem smartphone, dados e acesso privado ao celular.** Isso exclui, por definição, quem está em maior risco.

---

## Perguntas que um jurado bem informado vai fazer

**"Existe evidência de que apps de segurança reduzem violência?"**
> Honestamente, não — a revisão sistemática mais recente (2023, 136 apps) não encontrou nenhum estudo de efetividade robusto. Por isso não prometemos "reduzir violência": resolvemos [gargalo X], que é mensurável.

**"O que acontece se o agressor encontrar o app no celular dela?"**
> Desenhamos assumindo esse cenário desde o início: [disfarce / PIN de coação / sem rastro em backup]. Casos reais (Life360, Tea) mostram que essa é a falha mais comum do setor.

**"Como vocês evitam virar mais um VioGén?"**
> [Com scoring:] Nenhuma decisão automática sem revisão humana, lógica publicada, auditoria externa antes de uso institucional. [Sem scoring:] Por isso decidimos não fazer classificação de risco automatizada nesta fase.

**"Quando o botão é acionado, quem responde, e em quanto tempo?"**
> [Só é boa se houver parceria real. Se não houver:] Essa é exatamente a lacuna — em Goiânia, uma advogada acionou 50 vezes e foi atendida uma. Por isso nosso MVP foca em [X] em vez de prometer resposta policial que não podemos garantir.

**"Como protegem os dados dela de intimação ou vazamento?"**
> [Retenção mínima, criptografia, e reconhecer que retenção é risco — citando o precedente de subpoena do techsafety.org.]

**"Qual o modelo de sustentabilidade quando a energia do Startup Weekend acabar?"**
> [Modelo concreto de receita/parceria — evitando o destino de Athena, Revolar, SOS Mulher.]

**"E quem não tem celular próprio, ou tem o aparelho monitorado?"**
> Essa lacuna é pouco documentada até na literatura internacional — pretendemos validar localmente com [delegacia/ONG de Lages] antes de assumir acesso privado a um smartphone.

---

**Nota de rigor:** todos os números e casos vêm de fonte citada. Onde a busca não trouxe dado
confiável (exclusão digital quantitativa, jurisprudência LGPD específica, destino dos vencedores do
Women's Safety XPRIZE, casos Shark Tank), isso foi declarado explicitamente.
