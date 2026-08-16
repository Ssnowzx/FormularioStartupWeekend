# Arquitetura

Três produtos dentro de um processo. Eles compartilham um núcleo pequeno e mais
nada — nem pool de banco, nem sessão, nem pasta estática.

```
servidor/
├── server.js              monta os três módulos e sobe. Sem lógica de negócio.
│
├── core/                  o que os três precisam e nenhum é dono
│   ├── app.js               express, headers de segurança, /shared
│   ├── auth.js              sessões e os dois papéis
│   ├── limits.js            limite de requisição sem guardar IP
│   ├── db.js                fábrica de pool
│   └── log.js               log que não vaza segredo
│
├── modules/
│   ├── site/              LANDING PAGE — pública, comercial
│   ├── survey/            FORMULÁRIOS + DASHBOARD — pesquisa de campo
│   └── alert/             O SISTEMA — aparelho, central e Anjos
│
└── shared/web/            servido em /shared para o navegador
    ├── theme.css            tokens de cor e primitivas de interface
    └── util.js              $, esc, decorrido, fone, login
```

## A regra

**Um módulo nunca importa de outro.** Só de `core/` e `shared/`.

Se `alert` precisar de algo que está em `survey`, esse algo está no lugar errado:
ou sobe para `core/`, ou é copiado. Copiar dois helpers é mais barato que criar
uma dependência entre dois produtos que vão evoluir em ritmos diferentes.

Cada módulo exporta `mount(app, core)` e é dono de quatro coisas: seu prefixo de
URL, seu schema SQL, seu usuário de banco e sua pasta `web/`. Para desligar um,
comente uma linha no `server.js`.

## Quem é dono de quê

| | `site` | `survey` | `alert` |
|---|---|---|---|
| URLs | `/` | `/pesquisa`, `/pesquisa/painel` | `/central`, `/cadastro`, `/anjo/:token`, `/simulador` |
| API | — | `/api/survey/*` | `/api/v1/*` (aparelho), `/api/console/*` (central), `/api/guardian/*` (Anjo) |
| Banco | **nenhum** | `mer_app` → `respostas` | `mer_alerts` → 9 tabelas |
| Sessão | **nenhuma** | papel `researcher` | papel `operator` |
| Schema | — | `modules/survey/schema.sql` | `modules/alert/schema.sql` |

A landing page não recebe pool de banco nem middleware de sessão. **Não vaza
porque não tem o que vazar** — e isso é uma propriedade da estrutura, não uma
promessa de quem escreve o código.

## Os dois papéis

A pesquisadora lê respostas anônimas de campo. A operadora vê nome, telefone e
localização em tempo real de uma mulher durante uma agressão. São exposições
muito diferentes, e desde a reorganização são credenciais diferentes:
`RESEARCHER_*` e `OPERATOR_*`.

Uma sessão de pesquisa recebe **403** em qualquer rota da central, e vice-versa.
Isso espelha no código a separação que já existia no banco, onde `mer_app` e
`mer_alerts` sempre foram cegos um para o outro.

## Três prefixos de API, não um

| Prefixo | Autentica por | CORS |
|---|---|---|
| `/api/v1/*` | `Authorization: Bearer` do aparelho | aberto |
| `/api/console/*` | cookie de sessão, papel `operator` | fechado |
| `/api/guardian/*` | token na URL do link | fechado |

A separação por prefixo é o que torna **impossível, por engano**, aplicar CORS
aberto a uma rota que anda com credencial de navegador. Não é organização: é a
regra sendo imposta pela estrutura.

`/api/v1/*` é contrato publicado. Existem APKs instalados compilados contra
esses caminhos, e um celular no bolso de alguém não se atualiza sozinho.
**Não mude um caminho sob `/api/v1` sem uma versão nova.**

## O módulo do sistema por dentro

`modules/alert/` era um arquivo de 805 linhas. Hoje:

| Arquivo | O quê |
|---|---|
| `index.js` | monta e conecta as peças |
| `state.js` | ocorrências vivas: memória primeiro, banco em best-effort |
| `stream.js` | SSE para a central |
| `device.js` | API do aparelho + abrir alerta, posição, status |
| `console.js` | API da central + convites e links de Anjo |
| `guardian.js` | a página do Anjo |
| `serialize.js` | o que sai do estado para as telas |
| `pages.js` | as telas |
| `internals.js` | constantes e utilidades do módulo |

## O que ficou compartilhado, e por quê

Só entrou em `shared/web/` o que as **três** áreas usam de fato:

- **`theme.css`** — os tokens estavam copiados em seis arquivos. Trocar o coral
  era editar seis. As larguras de coluna viraram modificadores
  (`.wrap.larga`, `.wrap.celular`) porque a diferença é funcional: um
  formulário lido no celular quer linha curta; a central precisa das duas
  colunas lado a lado.
- **`util.js`** — `esc`, `decorrido`, `fone`, e a ligação da tela de login com
  a sessão do núcleo.

O que **não** subiu: regra de negócio de qualquer módulo, formato de alerta,
perguntas do questionário, texto comercial. Se só um produto usa, mora nele.

## Compatibilidade preservada

- `/admin`, `/painel` → redirecionam 301 para `/pesquisa/painel`
- `/questionario` → redireciona para `/pesquisa`
- `/api/v1/*` intocado, para os APKs já instalados
- `/anjo/:token` intocado, para os links já enviados por WhatsApp
- Sem `RESEARCHER_*`/`OPERATOR_*` no `.env`, o servidor cai para `ADMIN_*` e
  avisa no log — para uma instalação existente não cair durante a migração

## Onde acrescentar coisa nova

| O que você quer fazer | Onde mexer |
|---|---|
| Nova seção na landing page | `modules/site/web/index.html` |
| Nova pergunta no questionário | `modules/survey/` — a lista fica no `index.js` e no `form.html` |
| Novo campo na ocorrência | `modules/alert/` — schema, `state.js`, `serialize.js` |
| Algo que os três precisam | `core/` ou `shared/web/`, e só se os três precisarem mesmo |
| Um quarto produto | `modules/<nome>/index.js` com `mount(app, core)`, e uma linha no `server.js` |
