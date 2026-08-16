# Como rodar a demonstração do zero

Do laptop desligado até a palavra falada chegando na central. Uns 10 minutos.

Nada aqui é decorável: o IP da rede muda a cada lugar, o código de convite serve uma vez
só, e a sessão do painel cai quando o servidor reinicia. Siga na ordem.

---

## 1. Banco

Na VPS ele já está de pé. Localmente, um container resolve:

```bash
docker start mer-db 2>/dev/null || docker run -d --name mer-db \
  -p 127.0.0.1:3311:3306 -e MARIADB_ROOT_PASSWORD=SENHA_LOCAL_DA_RAIZ mariadb:11
```

Só na primeira vez, aplique os dois esquemas e crie os usuários:

```bash
cd servidor
docker exec -i mer-db mariadb -uroot -pSENHA_LOCAL_DA_RAIZ < modules/survey/schema.sql
docker exec -i mer-db mariadb -uroot -pSENHA_LOCAL_DA_RAIZ < modules/alert/schema.sql
```

O `schema.sql` cria usuários `@'localhost'`, que é o certo na VPS, onde o Node e o banco
moram na mesma máquina. Rodando local contra um container, o Node vem de fora e precisa
dos mesmos usuários com `@'%'` — o comando está no fim deste arquivo.

## 2. Servidor

```bash
cd servidor && npm start
curl localhost:3100/api/v1/health     # {"ok":true,"db":true,...}
```

Use `npm start`, **nunca** `npm run dev` durante a demonstração: o `--watch` reinicia a
cada arquivo salvo, e reiniciar derruba o login do painel.

## 3. Descobrir por onde o celular fala com o laptop

```bash
ipconfig getifaddr en0        # ex.: 10.5.50.209
```

Esse endereço muda a cada rede. Se o celular não puder entrar no mesmo Wi-Fi, use um túnel:

```bash
ngrok http 3100
```

O plano gratuito mostra uma tela de aviso na primeira visita pelo navegador — abra o link
uma vez no celular e clique em "Visit Site" **antes** do pitch.

## 4. Compilar e servir o APK

```bash
cd app-android
./baixar-modelo.sh                                   # só na primeira vez, 51 MB
./gradlew assembleDebug -PserverUrl=http://SEU_IP:3100
```

No `.env` do servidor, deixe apontado:

```
DEMO_MODE=1
APK_PATH=../app-android/app/build/outputs/apk/debug/app-debug.apk
```

O celular baixa em `http://SEU_IP:3100/app`. O Android vai pedir para autorizar o
navegador a instalar apps desconhecidos, e o Play Protect vai avisar — "Instalar mesmo
assim". **Instale na noite anterior, nunca no palco.**

## 5. Cadastrar e vincular

Abra `http://SEU_IP:3100/cadastro` (login `OPERATOR_USER` / `OPERATOR_PASSWORD` do `.env`),
cadastre a usuária e ao menos um Anjo com telefone, e gere o código.

No celular, o app abre como **Calculadora**. Digite o código, confirme o servidor, escolha
a frase e **fale em voz alta** quando ele pedir. Só dá para concluir depois que reconhecer:
esse teste é o critério de aceitação.

Se precisar de um código novo para alguém já cadastrada, sem criar duplicata:

```bash
curl -s -b cookie.txt -X POST http://localhost:3100/api/console/users/ID/invite
```

## 6. Demonstrar

Deixe `http://SEU_IP:3100/central` aberto no telão (entre com o papel `OPERATOR_*`). Fale a frase perto do celular.

O alerta entra na fila em menos de um segundo, com a barra de 15 segundos correndo.
Clique no card para ver o trajeto e avisar o Anjo pelo WhatsApp.

Para cancelar um alerta de teste: **`C` três vezes** dentro dos 15 segundos.
Para reabrir as configurações no celular: digite **`271828`** e aperte **`=`**.

---

## Se travar

| Sintoma | Causa provável |
|---|---|
| APK não baixa | Celular em outra rede. Teste `/central` no navegador do celular primeiro |
| "Código inválido" | Cada código serve uma vez. Gere outro |
| Falou e não aconteceu nada | Ocorrência anterior ainda aberta, ou menos de 60s desde o último acionamento. Resolva no painel e espere um pouco |
| Painel pede login de novo | O servidor reiniciou. As sessões vivem em memória, de propósito |
| 403 numa tela que sempre funcionou | Você entrou com o papel errado. A pesquisa usa `RESEARCHER_*`, a central usa `OPERATOR_*` |
| "Muitas tentativas" no login | 8 por hora. Reinicie o servidor para zerar |
| Alerta demora a aparecer | Falta `proxy_buffering off` no nginx da VPS |

## Usuários de banco para desenvolvimento local

Só necessário quando o banco está num container e o Node fora dele:

```sql
CREATE USER IF NOT EXISTS 'mer_app'@'%' IDENTIFIED BY 'SENHA_LOCAL_DA_PESQUISA';
GRANT SELECT, INSERT ON mulheres_em_risco.respostas TO 'mer_app'@'%';

CREATE USER IF NOT EXISTS 'mer_alerts'@'%' IDENTIFIED BY 'SENHA_LOCAL_DOS_ALERTAS';
GRANT SELECT, INSERT ON mulheres_em_risco.protected_user TO 'mer_alerts'@'%';
GRANT UPDATE (display_name, phone_e164, city, reference_note, status, redacted_at)
  ON mulheres_em_risco.protected_user TO 'mer_alerts'@'%';
GRANT SELECT, INSERT, UPDATE ON mulheres_em_risco.device          TO 'mer_alerts'@'%';
GRANT SELECT, INSERT, UPDATE ON mulheres_em_risco.guardian        TO 'mer_alerts'@'%';
GRANT SELECT, INSERT, UPDATE ON mulheres_em_risco.guardian_link   TO 'mer_alerts'@'%';
GRANT SELECT, INSERT, UPDATE ON mulheres_em_risco.invite_code     TO 'mer_alerts'@'%';
GRANT SELECT, INSERT, UPDATE ON mulheres_em_risco.alert           TO 'mer_alerts'@'%';
GRANT SELECT, INSERT, UPDATE ON mulheres_em_risco.alert_location  TO 'mer_alerts'@'%';
GRANT SELECT, INSERT, UPDATE ON mulheres_em_risco.guardian_access TO 'mer_alerts'@'%';
GRANT SELECT, INSERT         ON mulheres_em_risco.alert_event     TO 'mer_alerts'@'%';
FLUSH PRIVILEGES;
```

`mer_alerts` não recebe nada sobre `respostas`, e `mer_app` não recebe nada sobre as
tabelas de alerta. As duas metades ficam cegas uma para a outra, e isso é proposital.
