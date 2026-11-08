#!/usr/bin/env bash
# ============================================================
#  🐔 Créditos Pollos Keny — arranque en modo desarrollo
#  Backend (3000) + Panel web (5173) en paralelo
# ============================================================
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

verde() { printf '\033[0;32m%s\033[0m\n' "$1"; }
azul()  { printf '\033[0;34m%s\033[0m\n' "$1"; }

verde "🚀 Iniciando API y panel web..."

(cd "$ROOT/backend" && npm run dev) &
BACKEND_PID=$!

(cd "$ROOT/admin-web" && npm run dev) &
WEB_PID=$!

cleanup() {
  echo ""
  azul "🛑 Deteniendo servicios..."
  kill "$BACKEND_PID" 2>/dev/null || true
  kill "$WEB_PID" 2>/dev/null || true
  exit 0
}
trap cleanup INT TERM

wait
