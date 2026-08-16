-- Mulheres em Risco — pesquisa de campo
-- MariaDB 10.2 ou superior (por causa do tipo JSON).
--
-- DECISAO DE PRIVACIDADE: nao existe coluna de IP, user-agent, sessao ou
-- qualquer identificador. Isso e deliberado. Uma pesquisa sobre violencia
-- deixa de ser anonima no instante em que o IP e guardado ao lado da resposta.

CREATE DATABASE IF NOT EXISTS mulheres_em_risco
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE mulheres_em_risco;

CREATE TABLE IF NOT EXISTS respostas (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  criado_em   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Perfil, em colunas proprias para agregar direto em SQL
  idade       VARCHAR(32)  NULL,
  etnia       VARCHAR(32)  NULL,
  civil       VARCHAR(48)  NULL,
  renda       VARCHAR(48)  NULL,
  religiao    VARCHAR(48)  NULL,
  cidade      VARCHAR(80)  NULL,

  -- As 18 perguntas, como {"p1": "...", "p8": "Nao — tenho medo", ...}
  respostas   JSON         NOT NULL,

  PRIMARY KEY (id),
  KEY idx_criado_em (criado_em),
  KEY idx_etnia (etnia),
  KEY idx_idade (idade),
  KEY idx_cidade (cidade)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Usuario da aplicacao com o minimo de permissao: le e escreve, nada mais.
-- Troque a senha antes de rodar.
CREATE USER IF NOT EXISTS 'mer_app'@'localhost' IDENTIFIED BY 'TROQUE_ESTA_SENHA';
GRANT SELECT, INSERT ON mulheres_em_risco.respostas TO 'mer_app'@'localhost';
FLUSH PRIVILEGES;

-- Consultas uteis para o pitch:
--
--   SELECT etnia, COUNT(*) n FROM respostas GROUP BY etnia ORDER BY n DESC;
--
--   SELECT JSON_UNQUOTE(JSON_EXTRACT(respostas,'$.p8')) resposta, COUNT(*) n
--     FROM respostas GROUP BY resposta ORDER BY n DESC;
--
--   SELECT COUNT(*) total,
--          SUM(JSON_EXTRACT(respostas,'$.p16') LIKE '%Incomoda%') incomoda
--     FROM respostas;
