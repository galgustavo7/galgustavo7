import { db } from '../db';

export const PARAMETROS_DEFAULT: Record<string, string> = {
  PRECIO_POLLO: '3.20',
  PRECIO_CERDO: '50.00',
  TASA_INTERES: '8',
  PLAZO_DIAS: '45',
  CANTIDAD_MAX_POLLOS: '2000',
  CANTIDAD_MAX_CERDOS: '200',
  IMPUESTO_PORCENTAJE: '0',
  SCORE_MINIMO: '420',
};

let cache: { data: Record<string, string>; expires: number } | null = null;
const TTL_MS = 60_000;

function invalidate(): void {
  cache = null;
}

export async function getParametros(): Promise<Record<string, string>> {
  if (cache && cache.expires > Date.now()) return cache.data;

  let rows: { clave: string; valor: string }[] = [];
  try {
    rows = await db.all<{ clave: string; valor: string }>('SELECT clave, valor FROM parametros');
  } catch {
    rows = [];
  }

  const data: Record<string, string> = { ...PARAMETROS_DEFAULT };
  for (const row of rows) data[row.clave] = row.valor;

  cache = { data, expires: Date.now() + TTL_MS };
  return data;
}

export async function getParametroNumero(clave: string): Promise<number> {
  const params = await getParametros();
  const value = Number(params[clave] ?? PARAMETROS_DEFAULT[clave] ?? 0);
  return Number.isFinite(value) ? value : 0;
}

export async function setParametro(clave: string, valor: string, descripcion?: string): Promise<void> {
  await db.run(
    `INSERT INTO parametros (clave, valor, descripcion, actualizado_en)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP)
     ON DUPLICATE KEY UPDATE valor = VALUES(valor), actualizado_en = CURRENT_TIMESTAMP`,
    [clave, valor, descripcion ?? null]
  ).catch(async () => {
    // SQLite no soporta ON DUPLICATE KEY UPDATE
    await db.run(
      `INSERT INTO parametros (clave, valor, descripcion) VALUES (?, ?, ?)
       ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor, actualizado_en = CURRENT_TIMESTAMP`,
      [clave, valor, descripcion ?? null]
    );
  });
  invalidate();
}
