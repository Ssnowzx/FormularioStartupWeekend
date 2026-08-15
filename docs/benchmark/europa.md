# Benchmark — Europa

> Onde essa tecnologia virou política pública de Estado e mostrou o que quebra em escala.
> Levantado em 15/08/2026, 45+ buscas em inglês, espanhol e francês, cruzando fontes primárias
> (ministérios, EUR-Lex, ONGs) com jornalismo investigativo. Dados não confirmados estão marcados.

---

## 1. Espanha — a referência global e o maior estudo de caso de fracasso

### 1.1 VioGén / VioGén-2

| Campo | Detalhe |
|---|---|
| **Opera** | Ministerio del Interior, desde 2007 (exceto Catalunha e País Basco, com sistemas próprios) |
| **O que faz** | Após a denúncia, o agente preenche o formulário **VPR** (35–39 itens). O sistema devolve pontuação — *no apreciado, bajo, medio, alto, extremo* — que **determina os recursos de proteção atribuídos** |
| **Status 2026** | Reforma **VioGén-2** anunciada em 15/01/2025, piloto desde out/2024, rollout em curso. Elimina a categoria "no apreciado" (fica com 4 níveis) e recalibra o algoritmo |
| **Escala** | +5,4 milhões de avaliações desde 2007; 800 mil mulheres avaliadas. **92.000 casos ativos, dos quais 83% classificados como risco baixo ou negligenciável** (mar/2025) |
| **Técnica** | Formulário estruturado + scoring estatístico (não é ML generativo). **Código-fonte não é público nem auditável** |

**Os números que importam:**

- **Pelo menos 55 de 247 mulheres mortas** desde 2007 haviam sido classificadas como risco negligenciável ou baixo.
- Documento judicial vazado: **14 de 15 mulheres mortas em 2014** tinham risco baixo ou não especificado.
- **95% de aderência policial cega** à pontuação automática — a "recomendação" vira decisão de fato.
- **AUC preditivo de apenas 0,66–0,8** — no limiar do que se aceitaria para um teste médico, para uma decisão de vida ou morte.
- Apenas **35% das vítimas** sabiam a própria pontuação.
- O algoritmo **subvaloriza violência psicológica** frente à física.

[Eticas Foundation](https://eticasfoundation.org/the-case-of-viogen-can-ai-solve-gender-violence/) · [AlgorithmWatch](https://algorithmwatch.org/en/viogen-algorithm-gender-violence/) · [Racism and Technology Center](https://racismandtechnology.center/2025/03/11/in-spain-an-algorithm-used-by-police-to-combat-gender-violence-determines-whether-women-live-or-die/)

### 1.2 Pulseiras antimaltrato / Sistema Cometa — o escândalo

| Campo | Detalhe |
|---|---|
| **Opera** | Ministerio de Igualdad (Centro Cometa 24h). Terceirizado: Telefónica/Securitas até 2023 → **Vodafone+Securitas desde out/2023** |
| **O que faz** | GPS/Bluetooth no agressor + telemóvel monitorado da vítima + central que aciona a polícia quando ele entra na zona de exclusão |
| **Contrato** | Anterior ~€50M. **Novo contrato jan/2026: €71,37M base, até €111M** |
| **Escala** | 4.549 mulheres protegidas (set/2025); +21.000 já usaram desde 2009 |

**O que deu errado — e é a lição de arquitetura mais importante deste documento:**

A migração de dados entre operadoras **tornou inacessível todo o histórico de localização anterior a
20/03/2024**. Sem esse histórico, os tribunais não conseguiram provar violações de ordem de
afastamento — **dezenas de agressores foram absolvidos**. O governo sabia desde **janeiro de 2024** e
só admitiu publicamente em **setembro de 2025**: quase 20 meses de silêncio institucional.

> Não foi falha de GPS. Não foi falha de algoritmo. Foi falha de **continuidade de dados numa
> transição de contrato de fornecedor.**

[Euronews](https://es.euronews.com/2025/09/18/un-fallo-informatico-en-las-pulseras-antimaltrato-en-espana-absuelve-a-decenas-de-agresore) · [Infobae](https://www.infobae.com/espana/2025/09/20/las-claves-del-fallo-tecnico-en-las-pulseras-a-maltratadores-igualdad-critica-a-la-fiscalia-por-hacer-valoraciones-sin-datos/)

### 1.3 Outros

- **ATENPRO** — Cruz Roja Española, teleassistência móvel 24h com botão de emergência. Ativo. Nenhuma falha documentada encontrada.
- **AlertCops** — Ministerio del Interior. **5 toques em 6 segundos** disparam alerta silencioso + 10 s de áudio gravado à polícia mais próxima. Ativo, nova versão maio/2026.
- **Libres** — Telefónica + Ministerio. App informativa **disfarçada com ícone falso, sem rastreamento**. Status incerto (lançada ~2016-17, sem confirmação de atualização).
- **"M8 Zaragoza"** — **NÃO ENCONTRADO.** Provável confusão com "8M" (Dia da Mulher). Não citar sem confirmar.

---

## 2. Reino Unido

| Iniciativa | O que é | Escala | Problemas |
|---|---|---|---|
| **Bright Sky** (Vodafone Foundation + Hestia) | Diretório de serviços por geolocalização, questionário de avaliação, "Journal" de evidências que **envia por e-mail** em vez de salvar localmente | **+1 milhão de usuários** (mai/2024), 13 países | Risco de o agressor descobrir o app; confusão sobre onde o diário é salvo; **o app ainda aparece no histórico de downloads da conta compartilhada** |
| **Hollie Guard** (Hollie Gazzard Trust) | Alarme por agitação/botão, envia GPS+vídeo+áudio; modo Stealth; Meeting Timer | **+45 forças policiais** (¼ do país), +700 mil downloads | Nenhuma crítica publicada encontrada — possível lacuna de cobertura |
| **Ask for ANI** (Home Office) | Protocolo social: codeword "ANI" no balcão da farmácia — **não é tech** | **ENCERRADO em 04/11/2024.** Apenas **186 pessoas** encaminhadas em ~3 anos | Women's Aid criticou falta de treinamento; baixo volume sugere baixa efetividade. Substituído pelo "Safe Spaces" (+6.000 farmácias/bancos) |
| **Clare's Law** | Direito de consultar histórico de violência de um parceiro | — | **Taxa de disclosure caiu de 47,9% (2019) para 38,5% (2023).** Essex Police informou apenas **5% dos 1.940 pedidos** em 2 anos. Prazo de 28 dias frequentemente descumprido (Merseyside: 90 dias), com vítimas sofrendo novos crimes no ínterim. **Não existe sistema nacional unificado** — é processo manual |

### Refuge — Tech Abuse Team (a fonte mais valiosa desta seção)

Equipe dedicada da maior ONG britânica do setor, liderada por Emma Pickering.

- **+258% em casos envolvendo tecnologia** (2018→2022); **72% das usuárias** já sofreram abuso tech-facilitado; **+78% em referrals** no último ano fiscal (967 vs. 542 casos).
- **Arsenal documentado do agressor:** stalkerware; rastreadores GPS **a partir de £35** escondidos em roupas e carros; Apple AirTags; câmeras e microfones ocultos; carros conectados; campainhas inteligentes; **wearables** (smartwatches, anéis Oura, Fitbits — usados até para rastrear dados de fertilidade); dispositivos de casa inteligente para desestabilização remota; deepfakes.
- **"Unsocial Spaces" (2022):** 1 em 3 mulheres já sofreu abuso online; **75% das mulheres LGBTQ+** pesquisadas; plataformas demoram semanas a meses para responder denúncias.

> *"Time and again, we see what happens when devices go to market without proper safety
> considerations for women and girls."* — Emma Pickering, Refuge

[Refuge — wearables](https://refuge.org.uk/news/refuge-exposes-alarming-new-patterns-of-abuse-involving-wearable-technology/) · [Unsocial Spaces](https://refuge.org.uk/wp-content/uploads/2022/06/Unsocial-Spaces.pdf)

**Startups privadas:** *Epowar* (Bath, 2020) — detecção de agressão via IA/smartwatch, captou ~US$ 112 mil, **todas as funções gratuitas sem monetização clara** (fragilidade estrutural). *WalkSafe* — mapa de rota segura + SOS, +560 mil downloads (pico pós-caso Sarah Everard); fonte dos dados de criminalidade não é auditável.

---

## 3. França

### Téléphone Grave Danger (TGD)

Ministério da Justiça + Orange + Allianz Partners. Telefone com botão único ligado a operador 24h.
**€8,5 milhões investidos em 2024.** Escala: 157 dispositivos (2014) → 3.629 (fev/2023) → **6.285
(jan/2025)**.

**Problemas:** cobre **"mal 2%"** das ~213 mil queixas anuais de violência doméstica. **Titulares do
TGD foram mortas mesmo com o dispositivo** — Laetitia Schmitt e Agnès Rubègue (2018), Inès Mecellem
esfaqueada em set/2025. Em 2019, cerca de **2/3 dos dispositivos estavam parados em estoque** sem
atribuição. O ônus recai sobre a vítima: carregar, testar bateria, manter acima de 70%.

### Bracelet Anti-Rapprochement (BAR) — fadiga de alarme documentada

GPS no agressor + receptor na vítima, geofencing. **2.591 decisões acumuladas (~fev/2025), mas só
770–778 ativas** — e em queda em 2024.

**O gargalo operacional:** a central recebe **5.000–7.000 alertas em tempo real com apenas ~10
funcionários**. Um magistrado relatou *"30 a 40 relatórios diários para apenas dez pulseiras
ativas"*. Os alertas disparam quando o agressor apenas passa perto da zona na rotina, não por
aproximação real — produzindo o efeito **"cri au loup"** (grito de lobo): quanto mais alarmes falsos,
menos os operadores levam a sério os reais, e a resposta policial atrasa.

Há caso documentado de homem instruído a "se afastar" **sem saber em qual direção** — a localização
da vítima é ocultada dele por design, o que cria situações sem solução em cidades pequenas.

A administração penitenciária afirma "zero reincidência", alegação autorrelatada que **contrasta com
a evidência operacional acima**. Questão parlamentar de 2026 reconhece recursos insuficientes.

[OIP.org](https://oip.org/analyse/le-bracelet-anti-rapprochement-outil-de-securisation/) · [Ministério da Justiça](https://www.justice.gouv.fr/actualites/actualite/savoir-bracelet-anti-rapprochement-bar) · [Assemblée Nationale, questão 5581](https://questions.assemblee-nationale.fr/q17/17-5581QE.htm)

**App-Elles** (associação Résonantes, 2015) — alerta via **4 toques no botão de energia**, envia áudio
ao vivo + GPS a 3 contatos. +250 mil downloads, +100 mil alertas, 11 idiomas. Endossado por quatro
ministérios. Sem avaliação independente de efetividade.

---

## 4. Alemanha, Nórdicos e Países Baixos

- **Hilfetelefon (08000 116 016)** — órgão federal BAFzA, linha 24h gratuita e anônima em **18 idiomas** + chat. Serviço federal de referência.
- **WEISSER RING** — maior ONG alemã, financiada por doações e multas judiciais. O app "NO STALK" não pôde ser confirmado como app real vs. site informativo. *[baixa confiança]*
- **Veilig Thuis** (Países Baixos) — autoridade nacional, 25 organizações regionais. **Aparentemente sem app dedicado** — só telefone e chat.
- **Tryggare Sverige, MobilSafe, Bmycity, AWARE5** — **NÃO ENCONTRADOS** em buscas extensivas. Confirmar grafia antes de citar.

---

## 5. Nível europeu

### Diretiva UE 2024/1385

Adotada em 14/05/2024, **prazo de transposição: 14/06/2027**. Criminaliza pela primeira vez em nível
de UE o compartilhamento não consensual de imagens íntimas (**inclui deepfakes**), cyberstalking e
cyberharassment. Exige avaliação individual de risco "o mais cedo possível" com revisão periódica,
ponto único de acesso online nacional e a linha harmonizada **116 016**.

A definição comum de estupro baseada em consentimento **foi retirada** após oposição de Alemanha,
França e Países Baixos. [EUR-Lex](https://eur-lex.europa.eu/eli/dir/2024/1385/oj/eng)

A **Convenção de Istambul** (UE aderiu em 01/10/2023) **não menciona violência cibernética** — foi
redigida antes da era smartphone.

### GDPR e dados de vítimas

O ICO britânico repreendeu **7 organizações desde jun/2022** por vazamentos que expuseram endereços
seguros de vítimas a agressores; um caso exigiu realocação de emergência. Casos australianos
documentados incluem indenizações de A$ 19.980 e A$ 20.000.

### Financiamento — e a lacuna de mercado

| Projeto | O que é | Valor |
|---|---|---|
| **ISEDA** | Chatbot + plataforma de detecção precoce, simulador de entrevista policial | Horizon Europe, **€2,68M** |
| **TRACE** | IA para rastrear violência tech-facilitada em contextos de deslocamento, 15 parceiros/8 países | Horizon Europe, **€3,13M** |
| **Daphne / CERV** (2021-2027) | Linha histórica da UE, chamadas anuais (CERV-2026-DAPHNE) | Porta de entrada real para financiamento **não-diluitivo** |

> **Achado estratégico:** o **Women TechEU** é setor-agnóstico e não tem nenhuma beneficiária focada
> em violência de gênero. O EIT não retornou nenhum programa nesse vertical. E o femtech europeu
> (~US$ 191M em 2023) concentra capital em **fertilidade e ciclo, não em segurança**.
>
> **Não existe um cluster maduro de safety-tech de violência de gênero financiado por VC na Europa.**
> O dinheiro flui por subvenções públicas e parcerias ONG+CSR corporativo — não por capital de risco.

**Benchmark de sustentabilidade:** *SafeYOU* (Armênia), modelo de empresa social, +60 mil usuários
entre Armênia, Geórgia e Iraque, expandiu para Polônia e Romênia com apoio da UNFPA — financiamento
misto de prêmios, ONU e governo.

---

## 6. As lições — o que quebra quando isso vira Estado

### 6.1 A automação vira decisão de fato, mesmo desenhada como "recomendação"

VioGén: **95% de aderência** à pontuação automática. E o **DARA** britânico (sucessor do DASH desde
2022) é ainda mais didático — estudo de Cambridge (Sebire & Bland, *Policing*, 2026,
DOI 10.1093/police/paag036) mostra que o rollout nacional se baseou num piloto de **apenas 220 casos
em duas forças por três meses**; após a implantação, as classificações de "alto risco" na verdade
**caíram de ~10% para ~6%**; e existe **"loteria de código postal"** — o mesmo perfil de vítima recebe
classificações diferentes conforme a força policial local.

### 6.2 Falsos negativos são o problema letal, não falsos positivos

**Contraponto positivo — o único da pesquisa:** o **Lethality Assessment Program** de Maryland (EUA)
combina avaliação de risco com **conexão imediata a serviços de apoio**, não apenas uma pontuação, e
está associado a **redução de ~40% em homicídios de parceiros íntimos**.

> O valor está na integração com serviço humano rápido, **não na pontuação isolada**.

### 6.3 O ponto mais frágil é a continuidade de dados entre fornecedores

O escândalo espanhol não foi de GPS nem de algoritmo. Qualquer sistema que dependa de terceirização
de infraestrutura crítica precisa de **plano de migração testado**, não descoberto em produção.

### 6.4 Opacidade prolonga o dano

20 meses entre saber e admitir.

### 6.5 Geofencing em escala gera fadiga de alarme fatal

França: 5.000–7.000 alertas para ~10 pessoas. Filtragem de falsos positivos precisa ser desenhada
**desde o início**, não como correção posterior.

### 6.6 O ônus tecnológico recai sobre a vítima

Carregar, testar, manter bateria. O design coloca a manutenção em quem já está em vulnerabilidade
extrema, em vez de monitorar prioritariamente o agressor.

### 6.7 A tecnologia de consumo está sendo armada contra vítimas — e ninguém acompanha

**Este é o achado de maior valor estratégico de produto.** Rastreadores de £35, AirTags, carros
conectados, campainhas inteligentes, anéis de fertilidade. Nem o Domestic Abuse Act 2021 nem os
fabricantes endereçam isso por design.

> Aponta para um nicho pouco explorado mesmo pelas soluções estatais mais avançadas da Europa:
> **detecção de rastreadores não autorizados, auditoria de dispositivos vinculados à conta da vítima,
> varredura de stalkerware.**

### 6.8 Viés algorítmico é risco sistêmico documentado

ProPublica sobre o COMPAS (2016): réus negros tinham **77% mais chance** de serem sinalizados como
alto risco; **~45% dos réus negros que não reincidiram** foram classificados erroneamente como alto
risco, contra ~23–28% dos brancos. O País Basco tem algoritmo próprio apontado pela AlgorithmWatch
como enviesado contra imigrantes.

### 6.9 Tech-solutionism

Menos de 40% dos países têm leis de cyber-harassment (1,8 bilhão de mulheres desprotegidas). O EIGE
(2020) mostra que o **próprio design das plataformas** estrutura o risco — não a ausência de um botão
de pânico. A NNEDV recomenda que sobreviventes **testem qualquer app de segurança antes de confiar
nele**, porque testes revelaram apps que falham em enviar localização ou qualquer alerta.

---

## Lacunas assumidas

"M8 Zaragoza", "MobilSafe", "Bmycity" e "AWARE5" não foram encontrados — verificar a fonte original
antes de citar. Números nacionais totais de ATENPRO e AlertCops não localizados. Crítica acadêmica em
espanhol além do VioGén não coberta por esgotamento de cota.
