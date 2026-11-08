-- ============================================================
-- Almacén analítico PostgreSQL — Créditos Pollos Keny
-- Se sincroniza desde la base transaccional (dashboard + logs).
-- ============================================================

CREATE TABLE IF NOT EXISTS dashboard_metrics (
  id                SERIAL PRIMARY KEY,
  fecha             DATE NOT NULL DEFAULT CURRENT_DATE,
  total_emprendedores INT DEFAULT 0,
  creditos_activos  INT DEFAULT 0,
  creditos_mora     INT DEFAULT 0,
  total_prestado    NUMERIC(15,2) DEFAULT 0,
  total_recuperado  NUMERIC(15,2) DEFAULT 0,
  total_mora        NUMERIC(15,2) DEFAULT 0,
  ingresos_pollos   NUMERIC(15,2) DEFAULT 0,
  ingresos_cerdos   NUMERIC(15,2) DEFAULT 0,
  intereses_ganados NUMERIC(15,2) DEFAULT 0,
  creado_en         TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credito_eventos (
  id             SERIAL PRIMARY KEY,
  credito_id     VARCHAR(36) NOT NULL,
  tipo_evento    VARCHAR(40) NOT NULL,
  estado_nuevo   VARCHAR(30),
  monto          NUMERIC(15,2),
  detalle        TEXT,
  creado_en      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crypto_snapshots (
  id            SERIAL PRIMARY KEY,
  simbolo       VARCHAR(20) NOT NULL,
  precio_usd    NUMERIC(18,8) NOT NULL,
  variacion_24h NUMERIC(10,4),
  valor_cartera NUMERIC(18,2),
  fuente        VARCHAR(20) DEFAULT 'binance',
  creado_en     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_logs (
  id             SERIAL PRIMARY KEY,
  destinatario   VARCHAR(150) NOT NULL,
  asunto         VARCHAR(255) NOT NULL,
  tipo           VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
  estado         VARCHAR(20) NOT NULL DEFAULT 'SIMULADO',
  credito_id     VARCHAR(36),
  emprendedor_id VARCHAR(36),
  mensaje_error  TEXT,
  creado_en      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_fecha ON dashboard_metrics(fecha);
CREATE INDEX IF NOT EXISTS idx_credito_eventos_credito ON credito_eventos(credito_id);
CREATE INDEX IF NOT EXISTS idx_crypto_snapshots_simbolo ON crypto_snapshots(simbolo);
