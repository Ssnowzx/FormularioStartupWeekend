-- Mulheres em Risco — alertas
-- Roda DEPOIS de schema.sql, na mesma base. Nao altera nada do que ja existe.
--
-- DECISAO 1: NAO EXISTE COLUNA PARA A PALAVRA-CHAVE. Nem hash dela.
-- A palavra escolhida pela usuaria fica so no aparelho. O servidor recebe
-- "fui acionado" e mais nada. Nao ha rota que a receba nem lugar onde guarda-la.
--
-- DECISAO 2: toda coluna com dado pessoal e NULL-able, mesmo quando obrigatoria
-- na pratica. E isso que permite apagar dado por REDACAO (UPDATE ... SET x=NULL),
-- ja que o usuario do banco nao tem DELETE. A linha continua existindo para
-- auditoria; o dado pessoal some.
--
-- DECISAO 3: token nenhum e gravado em claro. Aparelho, convite e link do Anjo
-- vao ao banco so como sha256. O valor legivel existe uma unica vez: na resposta
-- HTTP que o cria.
--
-- Cada coluna que guarda dado pessoal traz, ao lado, a justificativa de por que
-- ela precisa existir. E regra do projeto (openspec/config.yaml): minimizacao de
-- dados e o default, e o que for persistido se justifica por escrito.

USE mulheres_em_risco;

/* ------------------------------------------------------------------ *
 *  Quem e protegida, e por qual aparelho                             *
 * ------------------------------------------------------------------ */

CREATE TABLE IF NOT EXISTS protected_user (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- PESSOAL: nome pelo qual a central vai chama-la no radio e no telefone.
  -- Sem nome o operador nao consegue despachar nem conversar. Pode ser so o primeiro.
  display_name    VARCHAR(80)  NULL,

  -- PESSOAL: telefone em E.164. E a unica forma de a central retornar contato
  -- durante a ocorrencia, e o primeiro recurso quando o GPS falha.
  phone_e164      VARCHAR(20)  NULL,

  -- PESSOAL: cidade. Define qual central/batalhao recebe. Sem isso o despacho e cego.
  city            VARCHAR(80)  NULL,

  -- PESSOAL, OPCIONAL: referencia de endereco ("Bairro Coral, proximo a escola X").
  -- Existe porque GPS urbano erra 20-50 m e a central precisa de ancora humana.
  -- E o campo de maior risco do banco: preencher SO quando a usuaria autorizar.
  reference_note  VARCHAR(200) NULL,

  status          ENUM('active','suspended') NOT NULL DEFAULT 'active',
  redacted_at     DATETIME NULL,   -- marca que os campos pessoais ja foram apagados

  PRIMARY KEY (id),
  KEY idx_protected_user_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS device (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  protected_user_id INT UNSIGNED NOT NULL,

  -- NAO E DADO PESSOAL: sha256 hex do token do aparelho.
  -- Sem IMEI, sem numero de serie, sem modelo, sem versao de Android.
  -- Nada disso e necessario para despachar socorro.
  token_hash        CHAR(64) NOT NULL,

  -- Rotulo escrito pelo cadastro ("celular pessoal"), para o operador distinguir
  -- dois aparelhos da mesma pessoa. Nao identifica o hardware.
  label             VARCHAR(40) NULL,

  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at      DATETIME NULL,   -- operacional: saber se o app ainda esta vivo
  revoked_at        DATETIME NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uq_device_token (token_hash),
  KEY idx_device_user (protected_user_id),
  CONSTRAINT fk_device_user FOREIGN KEY (protected_user_id) REFERENCES protected_user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS invite_code (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  protected_user_id INT UNSIGNED NOT NULL,

  -- sha256 do codigo. O codigo legivel aparece uma vez, na tela do cadastro,
  -- para ser digitado presencialmente. Nunca vai por mensagem para a usuaria:
  -- o agressor que le o celular dela leria a mensagem, e um codigo lido
  -- e a descoberta do app inteiro.
  code_hash         CHAR(64) NOT NULL,

  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at        DATETIME NOT NULL,
  used_at           DATETIME NULL,
  used_by_device_id INT UNSIGNED NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uq_invite (code_hash),
  KEY idx_invite_user (protected_user_id),
  CONSTRAINT fk_invite_user FOREIGN KEY (protected_user_id) REFERENCES protected_user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* ------------------------------------------------------------------ *
 *  Os Anjos — a rede de confianca aprovada pela propria usuaria       *
 * ------------------------------------------------------------------ */

CREATE TABLE IF NOT EXISTS guardian (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- PESSOAL: nome do Anjo. O operador precisa dizer a quem esta acionando,
  -- e a usuaria precisa reconhecer quem foi avisado.
  name          VARCHAR(80)  NULL,

  -- PESSOAL: telefone do Anjo em E.164. E o canal de entrega do link.
  -- Sem ele nao existe aviso — e o unico dado sem o qual a rede nao funciona.
  phone_e164    VARCHAR(20)  NULL,

  -- PESSOAL (baixo risco): "irma", "vizinha". Define ordem de acionamento
  -- e o tom da mensagem. Quem esta a 200 m vale mais que quem esta a 30 km.
  relationship  VARCHAR(40)  NULL,

  redacted_at   DATETIME NULL,

  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS guardian_link (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  protected_user_id INT UNSIGNED NOT NULL,
  guardian_id       INT UNSIGNED NOT NULL,

  -- PESSOAL POR INFERENCIA: a existencia desta linha ja revela a rede de apoio
  -- dela. Necessaria: sem o vinculo a central nao sabe quem acionar.
  -- O vinculo so nasce por aprovacao da usuaria, no cadastro.
  priority          TINYINT UNSIGNED NOT NULL DEFAULT 1,

  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at        DATETIME NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uq_link (protected_user_id, guardian_id),
  KEY idx_link_user (protected_user_id, priority),
  CONSTRAINT fk_link_user     FOREIGN KEY (protected_user_id) REFERENCES protected_user(id),
  CONSTRAINT fk_link_guardian FOREIGN KEY (guardian_id)       REFERENCES guardian(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* ------------------------------------------------------------------ *
 *  A ocorrencia                                                       *
 * ------------------------------------------------------------------ */

CREATE TABLE IF NOT EXISTS alert (
  id                    INT UNSIGNED NOT NULL AUTO_INCREMENT,

  -- Identificador opaco usado nas URLs e pelo aparelho.
  -- Impede enumerar ocorrencias por id sequencial.
  public_id             CHAR(32) NOT NULL,

  protected_user_id     INT UNSIGNED NOT NULL,
  device_id             INT UNSIGNED NULL,

  -- Idempotencia: a palavra dita duas vezes chega com o mesmo client_alert_id
  -- e devolve o mesmo alerta, em vez de abrir dois.
  client_alert_id       CHAR(36) NULL,

  status                ENUM('open','in_progress','resolved','cancelled') NOT NULL DEFAULT 'open',
  trigger_kind          ENUM('voice','manual','test') NOT NULL DEFAULT 'voice',

  opened_at             DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  -- opened_at + 15s, calculado no SERVIDOR. O relogio do aparelho nao decide
  -- ate quando ela pode cancelar.
  cancel_window_ends_at DATETIME(3) NOT NULL,
  acknowledged_at       DATETIME NULL,
  closed_at             DATETIME NULL,
  cancelled_at          DATETIME NULL,

  -- Operacional, nao e dado da vitima: quem na central fechou a ocorrencia.
  -- Existe para responsabilizacao do atendimento.
  closed_by             VARCHAR(40)  NULL,
  outcome_note          VARCHAR(255) NULL,

  -- PESSOAL (indireto): bateria no acionamento. A central precisa saber se vai
  -- perder o rastro em minutos. Opcional — o alerta abre sem ele.
  battery_pct           TINYINT UNSIGNED NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uq_alert_public (public_id),
  UNIQUE KEY uq_alert_client (device_id, client_alert_id),
  KEY idx_alert_status (status, opened_at),
  KEY idx_alert_user (protected_user_id, opened_at),
  CONSTRAINT fk_alert_user   FOREIGN KEY (protected_user_id) REFERENCES protected_user(id),
  CONSTRAINT fk_alert_device FOREIGN KEY (device_id)         REFERENCES device(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS alert_location (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  alert_id    INT UNSIGNED NOT NULL,

  -- PESSOAL DE ALTO RISCO: onde ela esta agora. E o dado que faz a viatura chegar,
  -- e o dado que mais machuca se vazar.
  -- So existe atrelado a um alerta: NAO HA RASTREAMENTO CONTINUO fora de ocorrencia.
  -- NULL-able de proposito: (a) alerta sem GPS ainda precisa abrir;
  -- (b) permite apagar por UPDATE depois do prazo de retencao.
  lat         DECIMAL(9,6) NULL,
  lng         DECIMAL(9,6) NULL,

  -- Raio de erro. O painel mostra "+-30 m" — o erro do GPS fica honesto na tela
  -- em vez de virar um ponto falsamente preciso.
  accuracy_m  SMALLINT UNSIGNED NULL,

  source      ENUM('gps','network','manual') NOT NULL DEFAULT 'gps',
  recorded_at DATETIME(3) NULL,  -- relogio do aparelho; pode vir atrasado da fila offline
  received_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),  -- relogio do servidor: manda na ordenacao

  PRIMARY KEY (id),
  KEY idx_loc_alert (alert_id, received_at),
  CONSTRAINT fk_loc_alert FOREIGN KEY (alert_id) REFERENCES alert(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS alert_event (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  alert_id   INT UNSIGNED NOT NULL,

  -- Os tres 'guardian_*' ficam pelas linhas antigas: a rede de Anjos saiu em
  -- 16/08/2026, mas ocorrencia ja gravada nao se reescreve.
  kind       ENUM('created','location','status_changed','cancelled',
                  'guardian_notified','guardian_opened','guardian_on_the_way',
                  'dispatched','note') NOT NULL,
  actor      ENUM('device','operator','guardian','system') NOT NULL,

  -- Operacional: usuario da central ou id do Anjo. Existe para auditoria de quem
  -- fez o que numa ocorrencia de risco de vida. NUNCA guarda IP.
  actor_ref  VARCHAR(64)  NULL,

  note       VARCHAR(255) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (id),
  KEY idx_event_alert (alert_id, created_at),
  CONSTRAINT fk_event_alert FOREIGN KEY (alert_id) REFERENCES alert(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS guardian_access (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  alert_id      INT UNSIGNED NOT NULL,
  guardian_id   INT UNSIGNED NOT NULL,

  -- sha256 do token. O token legivel so existe dentro do link enviado ao Anjo.
  -- O link e por OCORRENCIA, nao por pessoa: acaba junto com o alerta.
  token_hash    CHAR(64) NOT NULL,

  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at    DATETIME NOT NULL,        -- 12h; o link morre sozinho
  opened_at     DATETIME NULL,            -- primeira abertura: prova de entrega para a central
  on_the_way_at DATETIME NULL,            -- "Estou a caminho"
  revoked_at    DATETIME NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uq_access_token (token_hash),
  KEY idx_access_alert (alert_id),
  CONSTRAINT fk_access_alert    FOREIGN KEY (alert_id)    REFERENCES alert(id),
  CONSTRAINT fk_access_guardian FOREIGN KEY (guardian_id) REFERENCES guardian(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* ------------------------------------------------------------------ *
 *  Privilegios                                                        *
 * ------------------------------------------------------------------ */

-- Usuario SEPARADO do mer_app. Nenhum GRANT existente e alterado:
-- mer_app continua com so SELECT e INSERT em `respostas`, e mer_alerts nao
-- recebe grant nenhum sobre `respostas`. As duas metades do sistema ficam
-- cegas uma para a outra — quem invadir o subsistema de alertas nao le a
-- pesquisa, e quem invadir a pesquisa nao le as ocorrencias.
-- Troque a senha antes de rodar.
CREATE USER IF NOT EXISTS 'mer_alerts'@'localhost' IDENTIFIED BY 'TROQUE_ESTA_SENHA_TAMBEM';

GRANT SELECT, INSERT         ON mulheres_em_risco.protected_user  TO 'mer_alerts'@'localhost';
-- UPDATE por coluna: um bug ou uma injecao nao consegue reescrever id nem created_at.
GRANT UPDATE (display_name, phone_e164, city, reference_note, status, redacted_at)
                             ON mulheres_em_risco.protected_user  TO 'mer_alerts'@'localhost';
GRANT SELECT, INSERT, UPDATE ON mulheres_em_risco.device          TO 'mer_alerts'@'localhost';
GRANT SELECT, INSERT, UPDATE ON mulheres_em_risco.guardian        TO 'mer_alerts'@'localhost';
GRANT SELECT, INSERT, UPDATE ON mulheres_em_risco.guardian_link   TO 'mer_alerts'@'localhost';
GRANT SELECT, INSERT, UPDATE ON mulheres_em_risco.invite_code     TO 'mer_alerts'@'localhost';
GRANT SELECT, INSERT, UPDATE ON mulheres_em_risco.alert           TO 'mer_alerts'@'localhost';
GRANT SELECT, INSERT, UPDATE ON mulheres_em_risco.alert_location  TO 'mer_alerts'@'localhost';
GRANT SELECT, INSERT, UPDATE ON mulheres_em_risco.guardian_access TO 'mer_alerts'@'localhost';
-- alert_event NAO recebe UPDATE: a linha do tempo da ocorrencia e imutavel
-- por construcao, que e o que se espera de um registro de atendimento.
GRANT SELECT, INSERT         ON mulheres_em_risco.alert_event     TO 'mer_alerts'@'localhost';

FLUSH PRIVILEGES;

-- Nao existe GRANT de DELETE, DROP, ALTER nem CREATE em lugar nenhum, de proposito.
-- Apagar dado aqui e REDACAO, nao remocao de linha:
--
--   UPDATE alert_location SET lat=NULL, lng=NULL, accuracy_m=NULL
--     WHERE received_at < NOW() - INTERVAL 30 DAY;
--
--   UPDATE guardian SET name=NULL, phone_e164=NULL, redacted_at=NOW()
--     WHERE id = ?;
--
--   UPDATE protected_user SET display_name=NULL, phone_e164=NULL,
--          reference_note=NULL, status='suspended', redacted_at=NOW()
--     WHERE id = ?;

/* ------------------------------------------------------------------ *
 *  Consultas uteis para o pitch                                       *
 * ------------------------------------------------------------------ */
--
--   -- Do acionamento ate o primeiro Anjo a caminho, por ocorrencia:
--   SELECT a.public_id,
--          TIMESTAMPDIFF(SECOND, a.opened_at, MIN(ga.on_the_way_at)) segundos
--     FROM alert a JOIN guardian_access ga ON ga.alert_id = a.id
--    WHERE ga.on_the_way_at IS NOT NULL
--    GROUP BY a.id;
--
--   -- Quantos alertas foram cancelados dentro da janela (falso alarme):
--   SELECT status, COUNT(*) n FROM alert GROUP BY status;
