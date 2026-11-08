-- ============================================================
-- Esquema transaccional MySQL / MariaDB — Créditos Pollos Keny
-- ============================================================

CREATE TABLE IF NOT EXISTS emprendedores (
  id               VARCHAR(36) PRIMARY KEY,
  nombre           VARCHAR(150) NOT NULL,
  cedula           VARCHAR(20)  NOT NULL UNIQUE,
  telefono         VARCHAR(30)  NOT NULL,
  email            VARCHAR(150) NOT NULL UNIQUE,
  ubicacion        VARCHAR(255),
  actividad        ENUM('AVICOLA','PORCICOLA','MIXTA') NOT NULL DEFAULT 'AVICOLA',
  score_crediticio INT NOT NULL DEFAULT 500,
  notas            TEXT,
  activo           TINYINT(1) NOT NULL DEFAULT 1,
  fecha_registro   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS usuarios (
  id                        VARCHAR(36) PRIMARY KEY,
  emprendedor_id            VARCHAR(36) NULL,
  nombre                    VARCHAR(150) NOT NULL,
  email                     VARCHAR(150) NOT NULL UNIQUE,
  telefono                  VARCHAR(30),
  password_hash             VARCHAR(255) NOT NULL,
  rol                       ENUM('SUPER_ADMIN','ADMIN','EMPRENDEDOR') NOT NULL DEFAULT 'EMPRENDEDOR',
  avatar_url                VARCHAR(500),
  activo                    TINYINT(1) NOT NULL DEFAULT 1,
  email_verificado          TINYINT(1) NOT NULL DEFAULT 0,
  token_verificacion        VARCHAR(255) NULL,
  token_verificacion_expira DATETIME NULL,
  ultimo_acceso             DATETIME NULL,
  fecha_creacion            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (emprendedor_id) REFERENCES emprendedores(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS creditos (
  id                VARCHAR(36) PRIMARY KEY,
  emprendedor_id    VARCHAR(36) NOT NULL,
  tipo              ENUM('POLLOS','CERDOS') NOT NULL,
  cantidad          INT NOT NULL,
  valor_unitario    DECIMAL(12,2) NOT NULL,
  monto_total       DECIMAL(12,2) NOT NULL,
  tasa_interes      DECIMAL(5,2) NOT NULL DEFAULT 8.00,
  monto_pagado      DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  fecha_entrega     DATE NULL,
  fecha_vencimiento DATE NOT NULL,
  estado            ENUM('SOLICITADO','APROBADO','ENTREGADO','PAGADO','MORA','RECHAZADO','CANCELADO') NOT NULL DEFAULT 'SOLICITADO',
  factura_numero    VARCHAR(60) UNIQUE,
  motivo_rechazo    VARCHAR(500),
  fecha_solicitud   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_aprobacion  DATETIME NULL,
  fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (emprendedor_id) REFERENCES emprendedores(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS pagos (
  id            VARCHAR(36) PRIMARY KEY,
  credito_id    VARCHAR(36) NOT NULL,
  monto         DECIMAL(12,2) NOT NULL,
  metodo_pago   ENUM('EFECTIVO','TRANSFERENCIA','BINANCE','OTRO') NOT NULL DEFAULT 'EFECTIVO',
  referencia    VARCHAR(120),
  nota          VARCHAR(255),
  registrado_por VARCHAR(36),
  fecha_pago    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (credito_id) REFERENCES creditos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS facturas (
  id             VARCHAR(36) PRIMARY KEY,
  numero         VARCHAR(60) NOT NULL UNIQUE,
  credito_id     VARCHAR(36) NOT NULL,
  emprendedor_id VARCHAR(36) NOT NULL,
  subtotal       DECIMAL(12,2) NOT NULL DEFAULT 0,
  impuestos      DECIMAL(12,2) NOT NULL DEFAULT 0,
  total          DECIMAL(12,2) NOT NULL DEFAULT 0,
  pdf_path       VARCHAR(500),
  emitida_en     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (credito_id) REFERENCES creditos(id) ON DELETE CASCADE,
  FOREIGN KEY (emprendedor_id) REFERENCES emprendedores(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sesiones (
  id          VARCHAR(36) PRIMARY KEY,
  usuario_id  VARCHAR(36) NOT NULL,
  token_hash  VARCHAR(255) NOT NULL,
  dispositivo VARCHAR(120),
  ip          VARCHAR(45),
  revocada    TINYINT(1) NOT NULL DEFAULT 0,
  expira_en   DATETIME NOT NULL,
  creada_en   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS password_resets (
  id          VARCHAR(36) PRIMARY KEY,
  usuario_id  VARCHAR(36) NOT NULL,
  token_hash  VARCHAR(255) NOT NULL,
  usado       TINYINT(1) NOT NULL DEFAULT 0,
  expira_en   DATETIME NOT NULL,
  creado_en   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS email_verifications (
  id          VARCHAR(36) PRIMARY KEY,
  usuario_id  VARCHAR(36) NOT NULL,
  token_hash  VARCHAR(255) NOT NULL,
  tipo        ENUM('REGISTRO','REENVIADO') NOT NULL DEFAULT 'REGISTRO',
  usado       TINYINT(1) NOT NULL DEFAULT 0,
  expira_en   DATETIME NOT NULL,
  creado_en   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS email_logs (
  id             VARCHAR(36) PRIMARY KEY,
  destinatario   VARCHAR(150) NOT NULL,
  asunto         VARCHAR(255) NOT NULL,
  tipo           VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
  estado         ENUM('ENVIADO','SIMULADO','ERROR') NOT NULL DEFAULT 'SIMULADO',
  credito_id     VARCHAR(36),
  emprendedor_id VARCHAR(36),
  mensaje_error  TEXT,
  preview_path   VARCHAR(500),
  creado_en      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS crypto_portfolio (
  id                VARCHAR(36) PRIMARY KEY,
  simbolo           VARCHAR(20) NOT NULL,
  nombre            VARCHAR(80) NOT NULL,
  cantidad          DECIMAL(20,8) NOT NULL DEFAULT 0,
  precio_compra_usd DECIMAL(15,2) NOT NULL DEFAULT 0,
  fecha_registro    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS parametros (
  clave       VARCHAR(60) PRIMARY KEY,
  valor       VARCHAR(120) NOT NULL,
  descripcion VARCHAR(255),
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_creditos_emprendedor ON creditos(emprendedor_id);
CREATE INDEX idx_creditos_estado      ON creditos(estado);
CREATE INDEX idx_pagos_credito        ON pagos(credito_id);
CREATE INDEX idx_usuarios_rol         ON usuarios(rol);
CREATE INDEX idx_sesiones_usuario     ON sesiones(usuario_id);
CREATE INDEX idx_email_logs_fecha     ON email_logs(creado_en);
