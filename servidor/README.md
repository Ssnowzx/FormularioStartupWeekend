# Pesquisa de campo — subir na VPS

Node.js + MariaDB, atrás do nginx com HTTPS. Do zero até o ar: cerca de 40 minutos.

Troque `pesquisa.seudominio.com.br` pelo seu domínio em todos os comandos.

---

## 1. Banco

```bash
sudo mysql < schema.sql
```

Antes de rodar, **abra o `schema.sql` e troque `TROQUE_ESTA_SENHA`**. O usuário criado
tem permissão só de `SELECT` e `INSERT` na tabela de respostas — não pode apagar nem
alterar estrutura. Se a aplicação for invadida, o estrago é limitado.

## 2. Aplicação

```bash
cd servidor
npm install
cp .env.example .env
nano .env          # preencha DB_PASSWORD, ADMIN_USER e ADMIN_PASSWORD
openssl rand -base64 24   # use isto como ADMIN_PASSWORD
npm start
```

Teste local: `curl localhost:3000` deve devolver o HTML do formulário.

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
| `https://pesquisa.seudominio.com.br/` | O formulário. É este link que vai para as mulheres |
| `https://pesquisa.seudominio.com.br/admin` | Painel de resultados. Pede `ADMIN_USER` e `ADMIN_PASSWORD` |

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
