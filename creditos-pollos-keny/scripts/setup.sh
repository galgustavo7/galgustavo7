#!/usr/bin/env bash
# ============================================================
#  🐔 Créditos Pollos Keny — instalación en un solo paso
#  Uso:  bash scripts/setup.sh            (modo SQLite, sin Docker)
#        bash scripts/setup.sh --docker   (MySQL + PostgreSQL en Docker)
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

USE_DOCKER=false
[[ "${1:-}" == "--docker" ]] && USE_DOCKER=true

verde()  { printf '\033[0;32m%s\033[0m\n' "$1"; }
amarillo() { printf '\033[1;33m%s\033[0m\n' "$1"; }
rojo()   { printf '\033[0;31m%s\033[0m\n' "$1"; }

verde ""
verde "🐔 ========================================"
verde "   Créditos Pollos Keny — instalación"
verde "========================================"
verde ""

command -v node >/dev/null 2>&1 || { rojo "❌ Node.js no está instalado (se requiere v18+)."; exit 1; }
NODE_VERSION="$(node -v | cut -d. -f1 | tr -d 'v')"
[[ "$NODE_VERSION" -lt 18 ]] && { rojo "❌ Se requiere Node.js 18 o superior (tienes $(node -v))."; exit 1; }
verde "✔ Node $(node -v) / npm $(npm -v)"

# ---------- Variables de entorno ----------
if [[ ! -f .env ]]; then
  cp .env.example .env
  verde "✔ Archivo .env creado desde .env.example"
else
  amarillo "• El archivo .env ya existe, se conserva"
fi

# ---------- Bases de datos ----------
if $USE_DOCKER; then
  if command -v docker >/dev/null 2>&1; then
    amarillo "• Levantando MySQL y PostgreSQL con Docker..."
    docker compose up -d mysql postgres
    verde "✔ Contenedores en marcha (puede tardar ~30 s en estar listos)"
    sed -i.bak 's/^DB_DIALECT=.*/DB_DIALECT=mysql/' .env && rm -f .env.bak
    sed -i.bak 's/^MYSQL_HOST=.*/MYSQL_HOST=localhost/' .env && rm -f .env.bak
    sed -i.bak 's/^PG_ENABLED=.*/PG_ENABLED=true/' .env && rm -f .env.bak
    verde "✔ .env configurado para MySQL + PostgreSQL"
  else
    amarillo "⚠ Docker no está disponible. Se usará SQLite."
  fi
else
  verde "✔ Modo SQLite: no necesitas Docker ni servicios extra"
fi

# ---------- Backend ----------
amarillo ""
amarillo "• Instalando dependencias del backend..."
(cd backend && npm install --no-audit --no-fund)
(cd backend && npm run migrate)
(cd backend && npm run seed)
verde "✔ Backend listo con datos de demostración"

# ---------- Admin web ----------
amarillo "• Instalando dependencias del panel web..."
(cd admin-web && npm install --no-audit --no-fund)
verde "✔ Panel web listo"

# ---------- Resumen ----------
verde ""
verde "========================================"
verde "✅  Instalación completada"
verde "========================================"
verde ""
verde "Arranca el proyecto con:"
verde "  bash scripts/dev.sh"
verde ""
verde "O por separado:"
verde "  cd backend   && npm run dev     # API en http://localhost:3000"
verde "  cd admin-web && npm run dev     # Panel en http://localhost:5173"
verde "  cd mobile    && flutter run     # App móvil"
verde ""
verde "Credenciales:"
verde "  Admin        → admin@polloskeny.com / AdminKeny2026!"
verde "  Emprendedor  → maria.rodriguez@ejemplo.com / Emprendedor2026!"
verde ""
