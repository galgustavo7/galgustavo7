-- ============================================================
-- Esquema transaccional SQLite — Créditos Pollos Keny
-- Equivalente al esquema MySQL (ENUM -> TEXT + CHECK)
-- ============================================================

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS emprendedores (
  id               TEXT PRIMARY KEY,
  nombre           TEXT NOT NULL,
  cedula           TEXT NOT NULL UNIQUE,
  telefono         TEXT NOT NULL,
  email            TEXT NOT NULL UNIQUE,
  ubicacion        TEXT,
  actividad        TEXT NOT NULL DEFAULT 'AVICOLA' CHECK (actividad IN ('AVICOLA','PORCICOLA','MIXTA')),
  score_crediticio INTEGER NOT NULL DEFAULT 500,
  notas            TEXT,
  activo           INTEGER NOT NULL DEFAULT 1,
  fecha_registro   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usuarios (
  id                        TEXT PRIMARY KEY,
  emprendedor_id            TEXT,
  nombre                    TEXT NOT NULL,
  email                     TEXT NOT NULL UNIQUE,
  telefono                  TEXT,
  password_hash             TEXT NOT NULL,
  rol                       TEXT NOT NULL DEFAULT 'EMPRENDEDOR'
                            CHECK (rol IN ('SUPER_ADMIN','ADMIN','EMPRENDEDOR')),
  avatar_url                TEXT,
  activo                    INTEGER NOT NULL DEFAULT 1,
  email_verificado          INTEGER NOT NULL DEFAULT 0,
  token_verificacion        TEXT,
  token_verificacion_expira TEXT,
  ultimo_acceso             TEXT,
  fecha_creacion            TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (emprendedor_id) REFERENCES emprendedores(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS creditos (
  id                  TEXT PRIMARY KEY,
  emprendedor_id      TEXT NOT NULL,
  tipo                TEXT NOT NULL CHECK (tipo IN ('POLLOS','CERDOS')),
  cantidad            INTEGER NOT NULL,
  valor_unitario      REAL NOT NULL,
  monto_total         REAL NOT NULL,
  tasa_interes        REAL NOT NULL DEFAULT 8,
  monto_pagado        REAL NOT NULL DEFAULT 0,
  fecha_entrega       TEXT,
  fecha_vencimiento   TEXT NOT NULL,
  estado              TEXT NOT NULL DEFAULT 'SOLICITADO'
                      CHECK (estado IN ('SOLICITADO','APROBADO','ENTREGADO','PAGADO','MORA','RECHAZADO','CANCELADO')),
  factura_numero      TEXT UNIQUE,
  motivo_rechazo      TEXT,
  fecha_solicitud     TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_aprobacion    TEXT,
  fecha_actualizacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (emprendedor_id) REFERENCES emprendedores(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pagos (
  id             TEXT PRIMARY KEY,
  credito_id     TEXT NOT NULL,
  monto          REAL NOT NULL,
  metodo_pago    TEXT NOT NULL DEFAULT 'EFECTIVO'
                 CHECK (metodo_pago IN ('EFECTIVO','TRANSFERENCIA','BINANCE','OTRO')),
  referencia     TEXT,
  nota           TEXT,
  registrado_por TEXT,
  fecha_pago     TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (credito_id) REFERENCES creditos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS facturas (
  id             TEXT PRIMARY KEY,
  numero         TEXT NOT NULL UNIQUE,
  credito_id     TEXT NOT NULL,
  emprendedor_id TEXT NOT NULL,
  subtotal       REAL NOT NULL DEFAULT 0,
  impuestos      REAL NOT NULL DEFAULT 0,
  total          REAL NOT NULL DEFAULT 0,
  pdf_path       TEXT,
  emitida_en     TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (credito_id) REFERENCES creditos(id) ON DELETE CASCADE,
  FOREIGN KEY (emprendedor_id) REFERENCES emprendedores(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sesiones (
  id          TEXT PRIMARY KEY,
  usuario_id  TEXT NOT NULL,
  token_hash  TEXT NOT NULL,
  dispositivo TEXT,
  ip          TEXT,
  revocada    INTEGER NOT NULL DEFAULT 0,
  expira_en   TEXT NOT NULL,
  creada_en   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS password_resets (
  id         TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  usado      INTEGER NOT NULL DEFAULT 0,
  expira_en  TEXT NOT NULL,
  creado_en  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS email_verifications (
  id         TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  tipo       TEXT NOT NULL DEFAULT 'REGISTRO' CHECK (tipo IN ('REGISTRO','REENVIADO')),
  usado      INTEGER NOT NULL DEFAULT 0,
  expira_en  TEXT NOT NULL,
  creado_en  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS email_logs (
  id             TEXT PRIMARY KEY,
  destinatario   TEXT NOT NULL,
  asunto         TEXT NOT NULL,
  tipo           TEXT NOT NULL DEFAULT 'GENERAL',
  estado         TEXT NOT NULL DEFAULT 'SIMULADO' CHECK (estado IN ('ENVIADO','SIMULADO','ERROR')),
  credito_id     TEXT,
  emprendedor_id TEXT,
  mensaje_error  TEXT,
  preview_path   TEXT,
  creado_en      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crypto_portfolio (
  id                TEXT PRIMARY KEY,
  simbolo           TEXT NOT NULL,
  nombre            TEXT NOT NULL,
  cantidad          REAL NOT NULL DEFAULT 0,
  precio_compra_usd REAL NOT NULL DEFAULT 0,
  fecha_registro    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS parametros (
  clave         TEXT PRIMARY KEY,
  valor         TEXT NOT NULL,
  descripcion   TEXT,
  actualizado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_creditos_emprendedor ON creditos(emprendedor_id);
CREATE INDEX IF NOT EXISTS idx_creditos_estado      ON creditos(estado);
CREATE INDEX IF NOT EXISTS idx_pagos_credito        ON pagos(credito_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol         ON usuarios(rol);
CREATE INDEX IF NOT EXISTS idx_sesiones_usuario     ON sesiones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_fecha     ON email_logs(creado_en);
