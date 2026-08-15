# Pesquisa de domínio — proteção a mulheres em situação de vulnerabilidade

> Insumo para a definição de arquitetura. Startup Weekend Women Lages 2026 (14–16/08/2026, Orion Parque Tecnológico).
> Levantado em 14/08/2026. Todas as fontes estão linkadas ao final.

---

## 1. O problema em números

| Indicador | Valor | Fonte |
|---|---|---|
| Brasileiras que sofreram violência doméstica/familiar em 2025 | **3,7 milhões** | DataSenado |
| Brasileiras que já sofreram violência no convívio familiar | **48%** | DataSenado |
| Brasileiras que **declaram** ter sofrido | **30%** | DataSenado |
| **Subnotificação estimada** | **61%** | Mapa Nacional da Violência de Gênero (Senado/DataSenado) |

**Por que não denunciam** (motivo principal declarado):
1. Preocupação com os filhos — 17%
2. Descrença na punição — 14%
3. Confiança de que seria a última agressão — 13%
4. Transversais: medo e dependência econômica

### Recorte local (Lages / Santa Catarina)

- **Rede Catarina de Proteção à Mulher** (PMSC) — programa institucional de policiamento de proximidade.
  Até jul/2022: Patrulha Maria da Penha em **123 municípios**, **27.821** ocorrências atendidas,
  **19.915** visitas preventivas, **572** prisões por descumprimento de medida protetiva e
  **476 acionamentos de botão do pânico**.
- **Lages**: em 2021 a DPCAMI registrou 139 inquéritos de jan a 15/jun (445 em todo o ano de 2020);
  a Rede Catarina acompanhava **95 mulheres com medida protetiva** no município.

> ⚠️ Os números de Lages são de 2021 — os mais recentes que a busca retornou. **Atualizar no evento**:
> o Observatório da Violência Contra a Mulher de SC (OVM/ALESC) publica painéis interativos com dados
> por município. Número atualizado no slide vale muito no pitch.

---

## 2. Estado da arte — o que JÁ existe

Isto é o que mais importa: **botão do pânico não é ideia nova, é política pública em expansão.**
Propor "um app com botão de pânico" sem diferencial vai ser confrontado pelos jurados.

| Solução | O que é | Status |
|---|---|---|
| **SP Mulher Segura** | App oficial (Android/iOS, login gov.br): registra B.O., solicita medida protetiva e — **para quem já tem a proteção judicial** — aciona botão do pânico | Em operação |
| **Programa Mulher Alerta** | Distribuição de aparelhos sinalizadores de emergência para mulheres com medida protetiva ou em risco | Aprovado na CDH do Senado em **mai/2026** |
| **PL — botão do pânico como medida protetiva** | Altera a Lei Maria da Penha para incluir monitoração eletrônica e botão do pânico entre as medidas protetivas de urgência decretáveis pelo juiz | Aprovado em comissão na Câmara |
| **Rede Catarina (PMSC)** | Patrulha Maria da Penha + botão do pânico integrado ao despacho da PM | Em operação em SC |
| **Adoção crescente** | Uso do botão do pânico cresceu **189%** no interior de MG desde set/2025 | — |

---

## 3. O GAP — onde está a oportunidade real

Todas as soluções oficiais acima compartilham **a mesma porta de entrada**:

```
    violência  →  DENÚNCIA  →  medida protetiva  →  proteção (botão do pânico)
                     ▲
                     └── 61% das mulheres NUNCA passam por aqui
```

**A mulher que ainda não denunciou está completamente descoberta.** E ela é a maioria.
As razões de não denunciar (filhos, descrença, esperança) não são resolvidas por mais um botão —
são resolvidas antes disso.

### Três frentes de diferenciação possíveis

1. **Pré-denúncia** — proteção para quem *ainda não* tem medida protetiva.
   Não depende de decisão judicial, logo não depende do Estado para funcionar.
2. **Prova** — registro de evidência íntegro e datado, que sustenta a denúncia quando ela vier.
   Ataca diretamente a "descrença na punição" (14%).
3. **Rede de confiança** — acionar quem já está perto (vizinha, irmã, colega) em vez de só o 190.
   Funciona onde o Estado demora.

> **Nota de verificação (15/08/2026).** O número do Sinal Vermelho que circula como "15 mil
> farmácias" é impreciso. O CNJ escreve: *"cerca de 15 mil farmácias, prefeituras, órgãos do
> Judiciário e agências do Banco do Brasil"* — é o total somado, e a página **não data o número**
> (a campanha é de junho/2020). Além disso, o link "clique aqui para acessar a lista de farmácias
> parceiras" **está quebrado** na página oficial: é texto em negrito sem destino. Conferido no
> navegador. Isso é evidência direta da ausência de camada digital no programa.

> Escolher **uma** dessas e fazer muito bem em 54h vale mais que tocar nas três.

---

## 4. Requisitos não-funcionais críticos do domínio

Este produto tem um modelo de ameaça **incomum** e isso precisa estar explícito na arquitetura:

> **O adversário tem acesso físico e recorrente ao dispositivo da vítima, conhece suas senhas,
> e às vezes paga a conta do celular.**

Consequências diretas de arquitetura — nenhuma é opcional:

| # | Requisito | Por quê |
|---|---|---|
| **RNF-1** | **Discrição / plausible deniability** — o app não pode parecer um app de segurança | Ícone acusatório na tela inicial é motivo de agressão |
| **RNF-2** | **Sem rastro local** — histórico, notificações e prints não podem ficar legíveis no aparelho | O agressor revista o telefone |
| **RNF-3** | **Funcionar offline / sem dados** | Zona rural da serra catarinense, celular sem crédito, ou o agressor corta o acesso |
| **RNF-4** | **Acionamento silencioso** — sem som, sem vibração, sem tela acesa | Um alarme audível escala a violência |
| **RNF-5** | **Vazamento é risco de vida, não de LGPD** — criptografia fim-a-fim, mínimo de dados retidos | Uma base vazada entrega endereços de vítimas |
| **RNF-6** | **Saída de emergência** — fechar/disfarçar em um toque | Alguém entrou no cômodo |
| **RNF-7** | **Integridade da evidência** — timestamp e hash à prova de adulteração | Sem isso a prova não sustenta processo |

**Implicação de arquitetura de dados:** o padrão default (guardar tudo no servidor para "melhorar o
produto") é *ativamente perigoso* aqui. O norte é **minimização**: se o dado não existe, ele não vaza.

---

## 5. Riscos do projeto (para o pitch e para a execução)

| Risco | Mitigação |
|---|---|
| Jurado dizer "isso já existe, é o SP Mulher Segura" | Ter a resposta do GAP (§3) pronta e em um slide |
| Falsos positivos acionando a PM | Confirmação de 2 passos ou janela de cancelamento silencioso |
| Depender de integração oficial (PM/190) que não existe em 54h | Demo com rede de confiança pessoal; integração institucional vira roadmap |
| Prometer segurança que o protótipo não tem | Ser honesta: "protótipo funcional, hardening é o próximo passo" |
| Demo quebrar no palco | Roteiro de demo testado + fallback gravado |

---

## 6. Próximo passo

Rodar `/opsx:explore` para transformar isto em decisão de arquitetura — comparando as três frentes
de diferenciação (§3) sob as restrições de 54h, time só de software e os RNFs de §4.

---

## Fontes

- [DataSenado — Pesquisa Nacional de Violência contra a Mulher (via ANDES)](https://www.andes.org.br/conteudos/noticia/violencia-de-genero-atinge-3-7-milhoes-de-brasileiras1)
- [Câmara dos Deputados — Estudo do Senado aponta subnotificação de 61%](https://www.camara.leg.br/noticias/1038979-estudo-do-senado-aponta-subnotificacao-de-61-no-registro-de-violencia-contra-mulher/)
- [Fórum Brasileiro de Segurança Pública — Retrato dos Feminicídios no Brasil (nota técnica, mar/2026)](https://forumseguranca.org.br/wp-content/uploads/2026/03/nota-tecnica-dia-mulher-2026.pdf)
- [O Imparcial — Comissão do Senado aprova dispositivo de emergência (Programa Mulher Alerta, mai/2026)](https://oimparcial.com.br/noticias/2026/05/comissao-do-senado-aprova-dispositivo-de-emergencia-para-vitimas-de-violencia-domestica/)
- [Câmara dos Deputados — Comissão aprova concessão de botão do pânico](https://www.camara.leg.br/noticias/1189849-comissao-aprova-concessao-de-botao-do-panico-para-vitimas-de-violencia-domestica/)
- [Jornal Cruzeiro — Aplicativo permite denunciar violência doméstica e acionar botão do pânico (jul/2026)](https://www.jornalcruzeiro.com.br/sorocaba/regiao/2026/07/763102-aplicativo-permite-denunciar-violencia-domestica-e-acionar-botao-do-panico.html)
- [TVC Paracatu — Uso do botão do pânico cresce 189% no interior de MG (jul/2026)](https://www.tvcparacatu.com.br/2026/07/02/uso-do-botao-do-panico-para-vitimas-de-violencia-domestica-cresce-189-no-interior-de-minas/)
- [PMSC — Rede Catarina de Proteção à Mulher](https://www.pm.sc.gov.br/paginas/rede-catarina)
- [Prefeitura de Lages — Estatísticas da violência contra a mulher em SC e em Lages](https://www.lages.sc.gov.br/noticia-descricao/2430/estatisticas-recentes-tracam-o-perfil-da-violencia-contra-a-mulher-em-santa-catarina-e-em-lages-)
- [Observatório da Violência Contra a Mulher — OVM/ALESC (painéis interativos)](https://ovm.alesc.sc.gov.br/)
