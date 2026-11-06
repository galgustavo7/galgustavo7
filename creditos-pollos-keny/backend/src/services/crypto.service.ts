import crypto from 'node:crypto';
import axios from 'axios';
import { db, getAnalytics } from '../db';
import { env } from '../config/env';
import { logger } from '../lib/logger';
import { toNumber } from '../types';

interface PrecioTicker {
  simbolo: string;
  nombre: string;
  precio: number;
  variacion24h: number;
  fuente: 'binance' | 'cache';
}

const SIMBOLOS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BCHUSDT', 'BNBUSDT', 'ADAUSDT'];

const NOMBRES: Record<string, string> = {
  BTCUSDT: 'Bitcoin',
  ETHUSDT: 'Ethereum',
  SOLUSDT: 'Solana',
  BCHUSDT: 'Bitcoin Cash',
  BNBUSDT: 'BNB',
  ADAUSDT: 'Cardano',
};

/** Últimos precios conocidos: se usan si no hay salida a internet o Binance responde error. */
const CACHE_PRECIOS: Record<string, { precio: number; variacion: number }> = {
  BTCUSDT: { precio: 64250.12, variacion: 1.84 },
  ETHUSDT: { precio: 3120.45, variacion: -0.92 },
  SOLUSDT: { precio: 148.73, variacion: 3.41 },
  BCHUSDT: { precio: 402.18, variacion: 0.55 },
  BNBUSDT: { precio: 578.9, variacion: -1.12 },
  ADAUSDT: { precio: 0.6215, variacion: 2.08 },
};

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const round8 = (n: number) => Math.round((n + Number.EPSILON) * 1e8) / 1e8;

async function consultarBinance(): Promise<PrecioTicker[] | null> {
  if (!env.binance.enabled) return null;

  try {
    const response = await axios.get(`${env.binance.baseUrl}/api/v3/ticker/24hr`, {
      params: { symbols: JSON.stringify(SIMBOLOS) },
      timeout: 4_000,
      headers: env.binance.apiKey ? { 'X-MBX-APIKEY': env.binance.apiKey } : undefined,
    });

    const data = Array.isArray(response.data) ? response.data : [response.data];
    if (!data.length) return null;

    return data.map((item: Record<string, string>) => ({
      simbolo: item.symbol,
      nombre: NOMBRES[item.symbol] ?? item.symbol,
      precio: Number(item.lastPrice),
      variacion24h: Number(item.priceChangePercent),
      fuente: 'binance' as const,
    }));
  } catch (error) {
    logger.warn(`Binance no disponible (${(error as Error).message}). Se usan precios en caché.`);
    return null;
  }
}

export const CryptoService = {
  /** Precios de mercado (Binance si hay red, si no caché local). */
  async precios(): Promise<{ precios: PrecioTicker[]; fuente: 'binance' | 'cache'; actualizadoEn: string }> {
    const live = await consultarBinance();

    if (live) {
      return { precios: live, fuente: 'binance', actualizadoEn: new Date().toISOString() };
    }

    return {
      precios: SIMBOLOS.map((simbolo) => ({
        simbolo,
        nombre: NOMBRES[simbolo] ?? simbolo,
        precio: CACHE_PRECIOS[simbolo]?.precio ?? 0,
        variacion24h: CACHE_PRECIOS[simbolo]?.variacion ?? 0,
        fuente: 'cache' as const,
      })),
      fuente: 'cache',
      actualizadoEn: new Date().toISOString(),
    };
  },

  /** Cartera valorizada a precios actuales. */
  async cartera() {
    const { precios, fuente, actualizadoEn } = await this.precios();
    const holdings = await db.all<{
      id: string;
      simbolo: string;
      nombre: string;
      cantidad: number | string;
      precio_compra_usd: number | string;
      fecha_registro: string;
    }>('SELECT * FROM crypto_portfolio ORDER BY fecha_registro DESC');

    const mapa = new Map(precios.map((p) => [p.simbolo, p]));
    const valoraciones = holdings.map((h) => {
      const simbolo = h.simbolo.endsWith('USDT') ? h.simbolo : `${h.simbolo}USDT`;
      const precioActual = mapa.get(simbolo)?.precio ?? toNumber(h.precio_compra_usd);
      const cantidad = toNumber(h.cantidad);
      const costo = round2(cantidad * toNumber(h.precio_compra_usd));
      const valor = round2(cantidad * precioActual);

      return {
        id: h.id,
        simbolo: h.simbolo,
        nombre: h.nombre,
        cantidad: round8(cantidad),
        precioCompra: round2(toNumber(h.precio_compra_usd)),
        precioActual: round2(precioActual),
        variacion24h: mapa.get(simbolo)?.variacion24h ?? 0,
        costo,
        valor,
        ganancia: round2(valor - costo),
        gananciaPorcentaje: costo > 0 ? round2(((valor - costo) / costo) * 100) : 0,
        fechaRegistro: h.fecha_registro,
      };
    });

    const valorTotal = round2(valoraciones.reduce((sum, item) => sum + item.valor, 0));
    const costoTotal = round2(valoraciones.reduce((sum, item) => sum + item.costo, 0));

    return {
      activos: valoraciones,
      resumen: {
        valorTotal,
        costoTotal,
        ganancia: round2(valorTotal - costoTotal),
        gananciaPorcentaje: costoTotal > 0 ? round2(((valorTotal - costoTotal) / costoTotal) * 100) : 0,
        variacion24h:
          valorTotal > 0
            ? round2(valoraciones.reduce((sum, item) => sum + item.valor * (item.variacion24h / 100), 0) / valorTotal * 100)
            : 0,
      },
      fuente,
      actualizadoEn,
      mercado: precios,
    };
  },

  async agregar(data: { simbolo: string; nombre?: string; cantidad: number; precioCompra: number }) {
    const simbolo = String(data.simbolo).toUpperCase().replace('USDT', '');
    const id = crypto.randomUUID();

    await db.run(
      `INSERT INTO crypto_portfolio (id, simbolo, nombre, cantidad, precio_compra_usd)
       VALUES (?, ?, ?, ?, ?)`,
      [id, simbolo, data.nombre ?? NOMBRES[`${simbolo}USDT`] ?? simbolo, data.cantidad, data.precioCompra]
    );

    return { id, simbolo, cantidad: data.cantidad, precioCompra: data.precioCompra };
  },

  async actualizar(id: string, data: { cantidad?: number; precioCompra?: number; nombre?: string }) {
    const campos: string[] = [];
    const params: unknown[] = [];

    if (data.cantidad !== undefined) {
      campos.push('cantidad = ?');
      params.push(data.cantidad);
    }
    if (data.precioCompra !== undefined) {
      campos.push('precio_compra_usd = ?');
      params.push(data.precioCompra);
    }
    if (data.nombre !== undefined) {
      campos.push('nombre = ?');
      params.push(data.nombre);
    }

    if (campos.length === 0) return { actualizado: false };

    params.push(id);
    const result = await db.run(`UPDATE crypto_portfolio SET ${campos.join(', ')} WHERE id = ?`, params);
    if (result.changes === 0) throw new Error('Activo no encontrado');

    return { actualizado: true, id };
  },

  async eliminar(id: string) {
    const result = await db.run('DELETE FROM crypto_portfolio WHERE id = ?', [id]);
    if (result.changes === 0) throw new Error('Activo no encontrado');
    return { eliminado: true, id };
  },

  /** Guarda un snapshot de precios en PostgreSQL (analítica) si está disponible. */
  async guardarSnapshot(valorCartera?: number): Promise<void> {
    const analytics = getAnalytics();
    if (!analytics) return;

    try {
      const { precios, fuente } = await this.precios();
      for (const precio of precios) {
        await analytics.run(
          `INSERT INTO crypto_snapshots (simbolo, precio_usd, variacion_24h, valor_cartera, fuente)
           VALUES (?, ?, ?, ?, ?)`,
          [precio.simbolo, precio.precio, precio.variacion24h, valorCartera ?? null, fuente]
        );
      }
    } catch (error) {
      logger.warn(`Analytics: snapshot crypto no guardado (${(error as Error).message})`);
    }
  },
};
