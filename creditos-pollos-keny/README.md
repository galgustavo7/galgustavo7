<div align="center">

# 🐔🐷 Créditos Pollos Keny

**Plataforma integral de créditos para emprendedores avícolas y porcícolas.**
Backend + panel web + app móvil, con autenticación JWT por roles, verificación de correo,
facturación PDF, scoring crediticio, cartera crypto y analítica.

</div>

---

## 📑 Contenido

- [Stack tecnológico](#-stack-tecnológico)
- [Estructura del repositorio](#-estructura-del-repositorio)
- [Puesta en marcha](#-puesta-en-marcha)
- [Credenciales de demostración](#-credenciales-de-demostración)
- [Arquitectura](#-arquitectura)
- [Base de datos](#-base-de-datos)
- [API REST](#-api-rest)
- [Funcionalidades por rol](#-funcionalidades-por-rol)
- [Correos (modo simulado y SMTP)](#-correos-modo-simulado-y-smtp)
- [Binance / cartera crypto](#-binance--cartera-crypto)
- [Tareas programadas](#-tareas-programadas)
- [Script original `generate-project.js`](#-script-original-generate-projectjs)
- [Despliegue](#-despliegue)
- [Roadmap](#-roadmap)

---

## 🧰 Stack tecnológico

| Capa | Tecnología |
|------|------------|
| **Backend** | Node.js 20+ · Express 4 · TypeScript · Zod · JWT · bcrypt · Nodemailer · PDFKit · node-cron |
| **Bases de datos** | MySQL 8 (transaccional) · **SQLite** (desarrollo sin Docker) · PostgreSQL 15 (analítica opcional) |
| **Panel web** | React 18 · Vite 5 · TypeScript · TailwindCSS · React Query · Zustand · React Hook Form · Recharts · Sonner |
| **App móvil** | Flutter 3.19+ · Dart 3.3+ · Provider · flutter_secure_storage |

**Decisiones de diseño destacadas**

- **Capa de datos multi-motor**: el mismo código funciona con MySQL, MariaDB o SQLite gracias a un
  driver abstracto (`src/db`) que normaliza parámetros, fechas (UTC) y placeholders. Sin Docker y
  sin instalar nada, el proyecto arranca con SQLite.
- **Modo sin SMTP**: si no configuras credenciales de correo, los mensajes se guardan renderizados
  en `backend/storage/emails` y se pueden revisar desde el panel (**Correos → Ver**).
- **Binance con degradación elegante**: consulta precios reales y, si no hay red, usa una caché
  local para que el dashboard nunca se rompa.

---

## 📁 Estructura del repositorio

```
creditos-pollos-keny/
├── backend/                 # API REST (Node + Express + TypeScript)
│   ├── migrations/          # SQL por motor: mysql/ · sqlite/ · postgres/
│   ├── src/
│   │   ├── config/          # env.ts (variables) y parámetros de negocio
│   │   ├── db/              # drivers (mysql, sqlite, postgres) + migrador
│   │   ├── controllers/     # capa HTTP
│   │   ├── services/        # lógica de negocio (créditos, scoring, facturas, email, crypto)
│   │   ├── middlewares/     # auth, roles, validación, errores, rate-limit
│   │   ├── routes/          # definición de endpoints
│   │   ├── jobs/            # tareas programadas (mora, recordatorios, analítica)
│   │   └── scripts/         # migrate · seed · reset · smoke-test
│   └── storage/             # PDFs y correos generados (no se versiona)
│
├── admin-web/               # Panel administrativo (React + Vite + Tailwind)
│   └── src/
│       ├── api/             # cliente axios + endpoints tipados
│       ├── components/      # ui · layout · auth · creditos
│       ├── hooks/           # queries (React Query) y useAuth
│       ├── pages/           # Dashboard · Créditos · Emprendedores · Crypto · Correos
│       └── store/           # sesión persistida (Zustand)
│
├── mobile/                  # App Flutter del emprendedor
│   └── lib/                 # config · theme · models · services · providers · screens
│
├── scripts/                 # setup.sh (instalación) y dev.sh (arranque)
├── docker-compose.yml       # MySQL + PostgreSQL + Adminer
└── .env.example
```

---

## 🚀 Puesta en marcha

### Opción A — Rápida (sin Docker, SQLite)

```bash
# Desde la raíz del proyecto
cp .env.example .env
bash scripts/setup.sh        # instala dependencias, migra y siembra datos
bash scripts/dev.sh          # API en :3000 y panel en :5173
```

### Opción B — Con MySQL y PostgreSQL (Docker)

```bash
cp .env.example .env
bash scripts/setup.sh --docker
bash scripts/dev.sh
```

### Opción C — Manual

```bash
# 1. Backend
cd backend
npm install
npm run migrate      # crea el esquema
npm run seed         # datos de demostración
npm run dev          # http://localhost:3000

# 2. Panel web (otra terminal)
cd admin-web
npm install
npm run dev          # http://localhost:5173  (proxy /api -> :3000)

# 3. App móvil (opcional)
cd mobile
flutter pub get
flutter run --dart-define=API_BASE_URL=http://TU_IP:3000/api
```

### Comandos útiles del backend

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor en modo watch (tsx) |
| `npm run migrate` | Aplica migraciones pendientes |
| `npm run seed` | Carga datos de demo (`-- --force` los regenera) |
| `npm run reset` | Borra la base y la vuelve a crear |
| `npm run smoke` | Prueba end-to-end de los flujos principales |
| `npm run build` | Compila a `dist/` |
| `npm run typecheck` | Verificación de tipos |

---

## 🔐 Credenciales de demostración

| Rol | Correo | Contraseña |
|-----|--------|------------|
| Super Admin | `admin@polloskeny.com` | `AdminKeny2026!` |
| Admin | `cobranzas@polloskeny.com` | `AdminKeny2026!` |
| Emprendedor | `maria.rodriguez@ejemplo.com` | `Emprendedor2026!` |

> Los 5 emprendedores de demo usan la misma contraseña (`Emprendedor2026!`).

---

## 🏛 Arquitectura

```
┌───────────────┐        ┌────────────────┐        ┌──────────────────┐
│  App Flutter  │        │  Panel React   │        │  Cliente REST    │
│  (móvil)      │        │  (Vite)        │        │  (Postman, etc.) │
└──────┬────────┘        └───────┬────────┘        └────────┬─────────┘
       │  HTTP + JWT             │ /api (proxy)             │
       └─────────────┬───────────┴──────────────────────────┘
                     ▼
        ┌────────────────────────────────┐
        │  API Express (TypeScript)      │
        │  ├ auth / créditos             │
        │  ├ emprendedores / dashboard   │
        │  ├ crypto / correos / params   │
        │  └ jobs (mora, recordatorios)  │
        └───────┬───────────────┬────────┘
                ▼               ▼
        ┌──────────────┐  ┌───────────────┐
        │ MySQL/SQLite │  │ PostgreSQL    │
        │ (operación)  │  │ (analítica)   │
        └──────────────┘  └───────────────┘
                │
                ▼
        ┌──────────────────────────────┐
        │ storage/ → facturas PDF      │
        │          → correos (preview) │
        └──────────────────────────────┘
```

**Flujo de un crédito**

1. El emprendedor se registra → recibe correo de verificación.
2. Verifica su correo → ya puede iniciar sesión.
3. Solicita un crédito (`POLLOS` o `CERDOS`) → estado `SOLICITADO`.
4. El admin **aprueba** → se genera factura PDF, se envía por correo y pasa a `APROBADO`.
5. El admin **entrega** los animales → `ENTREGADO`.
6. El emprendedor **abona** (total o parcial) → se recalcula el saldo.
7. Al saldar → `PAGADO` y su **score** sube.
8. Si vence sin pagar → el cron lo marca como `MORA` y baja el score.

---

## 🗄 Base de datos

**Transaccional (MySQL / SQLite)** — `backend/migrations/{mysql,sqlite}/001_init.sql`

| Tabla | Contenido |
|-------|-----------|
| `emprendedores` | productores, actividad, score, ubicación |
| `usuarios` | credenciales, rol, verificación de correo |
| `creditos` | tipo, cantidad, montos, tasa, fechas, estado, factura |
| `pagos` | abonos con método y referencia |
| `facturas` | número, totales y ruta del PDF |
| `sesiones` | refresh tokens (hash) revocables |
| `password_resets` / `email_verifications` | tokens con expiración |
| `email_logs` | auditoría de correos enviados/simulados |
| `crypto_portfolio` | posiciones de la cartera |
| `parametros` | configuración de negocio editable |

**Analítica (PostgreSQL, opcional)** — `backend/migrations/postgres/001_analytics.sql`

`dashboard_metrics` (snapshot diario), `credito_eventos`, `crypto_snapshots`, `email_logs`.

Para activarla: `PG_ENABLED=true` y las credenciales en `.env`.

### Parámetros de negocio

| Clave | Valor por defecto | Uso |
|-------|-------------------|-----|
| `PRECIO_POLLO` | `3.20` | valor unitario financiado |
| `PRECIO_CERDO` | `50.00` | valor unitario financiado |
| `TASA_INTERES` | `8` | % aplicado al monto |
| `PLAZO_DIAS` | `45` | días para pagar |
| `CANTIDAD_MAX_POLLOS` | `2000` | tope por solicitud |
| `CANTIDAD_MAX_CERDOS` | `200` | tope por solicitud |
| `IMPUESTO_PORCENTAJE` | `0` | impuesto en la factura |
| `SCORE_MINIMO` | `420` | referencia para aprobación |

---

## 🔌 API REST

Base: `http://localhost:3000/api` · Respuestas: `{ ok: true, ... }` o `{ ok: false, error: { codigo, mensaje, detalles } }`

### Autenticación

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/auth/login` | Ingreso (devuelve access + refresh token) |
| POST | `/auth/registro` | Registro de emprendedor (envía correo de verificación) |
| POST | `/auth/refresh` | Renueva el access token |
| POST | `/auth/logout` | Revoca la sesión |
| GET | `/auth/me` | Perfil del usuario autenticado |
| POST | `/auth/verificar-email` | Confirma el correo (`token` + `id`) |
| POST | `/auth/reenviar-verificacion` | Reenvía el correo de verificación |
| POST | `/auth/recuperar` | Solicita enlace de recuperación |
| POST | `/auth/reset-password` | Define una nueva contraseña |
| POST | `/auth/cambiar-password` | Cambia la contraseña (autenticado) |

### Créditos

| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| GET | `/creditos` | todos | Listado paginado (`estado`, `tipo`, `q`, `page`, `limit`) |
| GET | `/creditos/mis-creditos` | emprendedor | Solo sus créditos |
| POST | `/creditos/solicitar` | emprendedor verificado | Crea una solicitud |
| GET | `/creditos/:id` | todos | Detalle con pagos y factura |
| POST | `/creditos/:id/aprobar` | admin | Aprueba, genera factura PDF y la envía |
| POST | `/creditos/:id/rechazar` | admin | Rechaza con motivo |
| POST | `/creditos/:id/entregar` | admin | Marca la entrega |
| POST | `/creditos/:id/cancelar` | admin | Cancela el crédito |
| POST | `/creditos/:id/pagos` | admin / dueño | Registra un abono |
| GET | `/creditos/:id/pagos` | admin / dueño | Historial de pagos |
| GET | `/creditos/:id/factura` | admin / dueño | Descarga el PDF |

### Emprendedores, dashboard, crypto y más

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET/POST | `/emprendedores` | Listar (con métricas) / crear |
| GET/PATCH | `/emprendedores/:id` | Detalle / editar |
| PATCH | `/emprendedores/:id/estado` | Activar o desactivar |
| POST | `/emprendedores/:id/recalcular-score` | Recalcula el scoring |
| GET | `/emprendedores/ranking` | Mejores scores |
| GET | `/dashboard/metricas` | KPIs generales |
| GET | `/dashboard/serie-mensual?meses=6` | Colocado vs recuperado |
| GET | `/dashboard/resumen` | Todo en una llamada (panel) |
| GET | `/dashboard/mi-resumen` | Resumen del emprendedor |
| GET | `/dashboard/morosos` | Cartera vencida |
| GET | `/crypto/cartera` | Cartera valorizada |
| GET | `/crypto/precios` | Precios de mercado |
| POST/PATCH/DELETE | `/crypto[/:id]` | Gestionar activos (admin) |
| GET | `/emails` · `/emails/:id/preview` | Bandeja de salida y vista previa |
| GET/PUT | `/parametros[/:clave]` | Parámetros de negocio |
| GET | `/health` | Estado del servicio |

---

## 👥 Funcionalidades por rol

**Super Admin / Admin**
- Dashboard con KPIs, gráficos (colocado vs recuperado, distribución) y morosos
- Aprobar / rechazar / entregar / cancelar créditos con generación de factura PDF
- Registrar pagos y ver historial por crédito
- Alta y edición de emprendedores, recálculo de score
- Cartera crypto con precios de mercado
- Bandeja de salida de correos con vista previa del HTML

**Emprendedor**
- Panel con su score, KPIs y últimos créditos
- Solicitud de crédito con simulación en vivo (monto, interés, total, plazo)
- Seguimiento de sus créditos, pagos y facturas
- Registro de abonos
- Perfil y cambio de contraseña

---

## 📧 Correos (modo simulado y SMTP)

Sin credenciales SMTP la plataforma **no se detiene**: cada correo queda registrado en
`email_logs` con estado `SIMULADO` y su HTML se guarda en `backend/storage/emails`.
Desde el panel (**Correos → Ver**) se abre la vista previa exacta del mensaje.

Para enviar correos de verdad, completa en el `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tucorreo@gmail.com
SMTP_PASS=tu_app_password_de_gmail
SMTP_FROM="Créditos Pollos Keny <no-reply@polloskeny.com>"
```

Plantillas incluidas: verificación, bienvenida, solicitud recibida, crédito aprobado (con PDF
adjunto), rechazo, pago recibido, crédito saldado, recordatorio de vencimiento y recuperación.

---

## ₿ Binance / cartera crypto

- El servicio consulta `GET /api/v3/ticker/24hr` de Binance (pública, sin claves).
- Si no hay salida a internet, usa precios en caché y lo indica en la interfaz
  (*"Precios en caché (sin conexión a Binance)"*).
- La cartera se valora contra esos precios: costo, valor, ganancia y % por activo.
- Endpoints firmados (claves `BINANCE_API_KEY` / `BINANCE_API_SECRET`) quedan listos para
  operaciones de cuenta; el modo solo-lectura funciona sin ellas.

---

## ⏰ Tareas programadas

| Frecuencia | Tarea |
|------------|-------|
| Diaria 06:00 | Marca créditos vencidos como `MORA`, envía recordatorios (5, 2 y 0 días), recalcula scores |
| Cada 6 h | Snapshot de precios crypto en PostgreSQL |
| Al arrancar | Ejecuta una pasada de mantenimiento a los 5 s |

---

## 📜 Script original `generate-project.js`

El proyecto empezó como un generador que escribía todos los archivos desde un único
archivo `.js`. Ese enfoque se descartó porque duplicaba el código y no permitía
ejecutar ni probar nada: **ahora el repositorio contiene el proyecto real**, con su
estructura de carpetas, migraciones versionadas y scripts (`scripts/setup.sh`,
`scripts/dev.sh`) que hacen el trabajo del generador de forma mantenible.

---

## 🚢 Despliegue

- **Backend**: `npm run build && npm start` detrás de Nginx o PM2; define
  `DB_DIALECT=mysql`, `PG_ENABLED=true`, `NODE_ENV=production` y secretos JWT propios.
- **Panel web**: `npm run build` → sirve `dist/` (Nginx, Vercel, Netlify…). Configura
  `VITE_API_URL=https://api.tudominio.com/api`.
- **Móvil**: `flutter build apk --dart-define=API_BASE_URL=https://api.tudominio.com/api`.

---

## 🗺 Roadmap

- [ ] Panel de configuración para editar los `parametros` desde la UI
- [ ] Exportación de reportes (Excel/CSV) y cierre mensual
- [ ] Pasarela de pagos en línea (Pago Móvil / Binance Pay)
- [ ] Notificaciones push en la app móvil (Firebase Cloud Messaging)
- [ ] Multi-moneda (USD / VES) con tasa configurable
- [ ] Auditoría completa de acciones de usuario

---

<div align="center">

Privado — © 2026 Créditos Pollos Keny 🐔

</div>
