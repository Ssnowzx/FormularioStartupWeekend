# Servidor — subir na VPS

Três produtos num processo: a landing page em `/`, a pesquisa de campo em
`/pesquisa` e o sistema do produto em `/central`. A estrutura e as regras de
fronteira estão em [`docs/arquitetura.md`](../docs/arquitetura.md) — leia antes
de acrescentar coisa nova.

## Pesquisa de campo

Node.js + MariaDB, atrás do nginx com HTTPS. Do zero até o ar: cerca de 40 minutos.

Troque `pesquisa.seudominio.com.br` pelo seu domínio em todos os comandos.

---

## 1. Banco

```bash
sudo mysql < modules/survey/schema.sql
```

Antes de rodar, **abra o `modules/survey/schema.sql` e troque `TROQUE_ESTA_SENHA`**. O usuário criado
tem permissão só de `SELECT` e `INSERT` na tabela de respostas — não pode apagar nem
alterar estrutura. Se a aplicação for invadida, o estrago é limitado.

## 2. Aplicação

```bash
cd servidor
npm install
cp .env.example .env
nano .env          # preencha as senhas de banco e os dois papéis de acesso
openssl rand -base64 24   # uma para RESEARCHER_PASSWORD, outra para OPERATOR_PASSWORD
npm start
```

Teste local: `curl localhost:3000` devolve a landing page, e
`curl localhost:3000/pesquisa` o formulário.

## 3. Serviço que sobe sozinho

`/etc/systemd/system/pesquisa.service`:

```ini
[Unit]
Description=Pesquisa Mulheres em Risco
After=network.target mariadb.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/caminho/para/servidor
ExecStart=/usr/bin/node --env-file=.env server.js
Restart=always
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/caminho/para/servidor

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now pesquisa
sudo systemctl status pesquisa
```

## 4. nginx

`/etc/nginx/sites-available/pesquisa`:

```nginx
server {
    server_name pesquisa.seudominio.com.br;

    # PRIVACIDADE: não registrar IP das respondentes.
    access_log off;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        # X-Forwarded-For fica de fora de propósito: o servidor não precisa
        # do IP real, e o que ele não recebe não pode vazar.
    }

    client_max_body_size 128k;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/pesquisa /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 5. HTTPS

Aponte o DNS do domínio para o IP da VPS (registro `A`), espere propagar, e:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d pesquisa.seudominio.com.br
```

O certbot ajusta o nginx e renova sozinho. **Sem HTTPS o navegador marca "não seguro"
e a mulher desiste de responder** — além de as respostas trafegarem abertas.

## 6. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

A porta 3000 **não** deve ficar aberta para fora. Quem fala com ela é o nginx, pelo
localhost. Confirme com `sudo ufw status`.

---

## Como usar

| Endereço | O que é |
|---|---|
| `https://pesquisa.seudominio.com.br/pesquisa` | O formulário. É este link que vai para as mulheres |
| `https://pesquisa.seudominio.com.br/pesquisa/painel` | Painel de resultados. Pede `RESEARCHER_USER` e `RESEARCHER_PASSWORD` |

O painel se atualiza sozinho a cada 30 segundos, então dá para deixar aberto num
notebook durante a coleta e ver as respostas chegando. Ele destaca automaticamente
duas coisas: o percentual de respondentes pretas ou pardas (para comparar com os 64%
nacionais de vítimas de feminicídio) e o percentual que **não** falaria a palavra
secreta em voz alta — este fica vermelho se passar de 40%, porque aí o gatilho de voz
precisa ser repensado.

O botão de baixar planilha CSV fica dentro do painel.

---

## Decisões de privacidade

Não são detalhe: esta é uma pesquisa com mulheres sobre violência.

- **Nenhuma tabela guarda IP, user-agent, cookie ou identificador.** Não existe coluna para isso.
- **O nginx está com `access_log off`.** Sem isso, o IP de cada respondente ficaria em disco ao lado do horário — e cruzar horário do log com horário da resposta desanonimiza qualquer uma.
- **O limite de envios usa hash do IP com sal que troca a cada hora, só em memória.** Barra robô sem guardar nada.
- **O painel exige login.** Sessão de 8 horas em cookie HttpOnly, senha comparada em tempo constante, e no máximo 8 tentativas por hora por origem. O servidor recusa subir se a senha tiver menos de 12 caracteres.
- **O usuário do banco não pode apagar nem alterar tabelas.**

Se alguém do time sugerir "vamos guardar o IP para evitar resposta duplicada": a resposta
é não. Duplicata custa pouco. Um vazamento com IP custa muito.

## Manutenção

```bash
sudo journalctl -u pesquisa -f          # ver o que está acontecendo
sudo systemctl restart pesquisa         # reiniciar

# Backup — rode antes do pitch de domingo
mysqldump -u root mulheres_em_risco > backup-$(date +%F).sql
```

---
---

# Alertas — a central, os Anjos e o aparelho

O mesmo processo Node serve três produtos independentes. Eles compartilham a porta e o
núcleo em `core/`, e mais nada — nem pool de banco, nem usuário de banco, nem tabela,
nem papel de acesso. Ver [`docs/arquitetura.md`](../docs/arquitetura.md).

## Subir

```bash
sudo mysql < modules/alert/schema.sql   # troque TROQUE_ESTA_SENHA_TAMBEM antes
nano .env                          # preencha DB_ALERTS_PASSWORD e PUBLIC_BASE_URL
sudo systemctl restart pesquisa
curl localhost:3000/api/v1/health  # deve devolver {"ok":true,"db":true,...}
```

Se `DB_ALERTS_PASSWORD` ficar vazia, o servidor **sobe do mesmo jeito** e as rotas de alerta
respondem 503. A pesquisa de campo, que já está coletando, nunca cai por causa disto.

No bloco do nginx, acrescente ao `location /` — sem isso o alerta chega atrasado na tela,
porque o nginx segura o fluxo de eventos:

```nginx
proxy_buffering off;
proxy_read_timeout 3600s;
```

## Endereços

| Endereço | Quem usa | O que é |
|---|---|---|
| `/central` | a central | Fila de ocorrências ao vivo, localização, Anjos, status |
| `/cadastro` | a central | Cadastra a usuária e os Anjos dela, e gera o código de vínculo |
| `/anjo/<token>` | o Anjo | Link que chega por WhatsApp: onde ela está e "Estou a caminho" |
| `/simulador` | o time | Finge ser o aplicativo. Só com `DEMO_MODE=1`, e só depois do login |
| `/app` | o celular | Baixa o APK. Só com `DEMO_MODE=1` e `APK_PATH` preenchido |

`/central` e `/cadastro` exigem o papel `operator`. O painel da pesquisa exige
`researcher`. Uma sessão de um recebe **403** nas rotas do outro — a mesma
separação que já existia entre os dois usuários de banco.

## O fluxo

```
palavra falada → app Android → POST /api/v1/alerts → central vê em menos de 1s
                                                   → Anjo recebe link no WhatsApp
                                                   → "Estou a caminho" volta para a central
```

Três decisões que valem entender antes de mexer:

- **A palavra-chave nunca chega ao servidor.** Não há rota que a receba nem coluna onde
  guardá-la. O aparelho manda "fui acionado" e mais nada.
- **O alerta abre sem GPS.** Recusar um alerta por falta de coordenada seria trocar vida por
  completude de dado — a central ainda chega nela pelo telefone.
- **A janela de 15 segundos não atrasa a central.** O alerta vai para a tela na hora, com a
  contagem correndo à vista. Se ela cancelar, o card fica cinza como falso alarme. Segurar o
  alerta "para ter certeza" é o tipo de otimização que mata gente.

## O código de vínculo

Oito caracteres, uso único, validade de 24 horas, guardado no banco só como hash.

**Ele não vai por mensagem para a usuária.** Aparece na tela do `/cadastro` para ela digitar
presencialmente, na delegacia. No modelo de ameaça deste produto o agressor lê o celular
dela — e um código lido entrega o aplicativo inteiro.

O link do WhatsApp existe só para o **Anjo**, cujo celular está fora do alcance dele.

## Privacidade, além do que já vale para a pesquisa

- **Usuário de banco separado.** `mer_alerts` não tem permissão nenhuma sobre `respostas`, e
  `mer_app` continua sem permissão nenhuma sobre as tabelas de alerta. As duas metades são
  cegas uma para a outra: quem invadir um lado não lê o outro.
- **Nenhum `DELETE`, `DROP` ou `ALTER` em lugar nenhum.** Apagar dado aqui é *redação*
  (`UPDATE ... SET lat=NULL`), e é por isso que toda coluna pessoal aceita `NULL`. O
  `modules/alert/schema.sql` traz as consultas prontas no rodapé.
- **`alert_event` só aceita `SELECT` e `INSERT`.** A linha do tempo da ocorrência é imutável
  por construção, que é o que se espera de um registro de atendimento.
- **Todo token vai ao banco como sha256.** O valor legível existe uma única vez: na resposta
  que o cria.
- **Toda coluna com dado pessoal tem a justificativa escrita ao lado, no DDL.** Se alguém
  acrescentar uma coluna sem justificar, está fora do padrão do arquivo.

## Se o banco cair no meio da demo

O caminho de emergência não depende do MariaDB. Os alertas abertos vivem em memória e o
banco é gravado em best-effort: o aparelho recebe `201` mesmo com o banco fora, e o painel
continua inteiro, mostrando a faixa "sem banco de dados". O custo, dito em voz alta: um
alerta criado durante a queda existe só em RAM até o próximo restart.

Ao reiniciar, o servidor recarrega os 50 alertas mais recentes do banco — o painel não
nasce vazio.

## Manutenção dos alertas

```bash
# Redação por retenção — o mecanismo existe, rode quando fizer sentido
mysql -u root mulheres_em_risco -e "
  UPDATE alert_location SET lat=NULL, lng=NULL, accuracy_m=NULL
   WHERE received_at < NOW() - INTERVAL 30 DAY;"
```
