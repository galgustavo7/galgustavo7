import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { closeDatabases, connectDatabases, db } from '../db';
import { logger } from '../lib/logger';
import { addDays, toDateString, toDateTimeString } from '../lib/dates';
import { setParametro } from '../services/parametros.service';
import { CreditoService } from '../services/credito.service';
import { actualizarTodosLosScores } from '../services/scoring.service';
import { toNumber, type CreditoRow, type JwtPayload } from '../types';

const PASSWORD_EMPRENDEDOR = 'Emprendedor2026!';
const PASSWORD_ADMIN = 'AdminKeny2026!';

const ADMIN: JwtPayload = {
  userId: crypto.randomUUID(),
  email: 'admin@polloskeny.com',
  rol: 'SUPER_ADMIN',
  nombre: 'Administrador Keny',
};

interface SeedEmprendedor {
  nombre: string;
  cedula: string;
  telefono: string;
  email: string;
  ubicacion: string;
  actividad: 'AVICOLA' | 'PORCICOLA' | 'MIXTA';
}

const EMPRENDEDORES: SeedEmprendedor[] = [
  {
    nombre: 'María Rodríguez',
    cedula: 'V-12345678',
    telefono: '+58 412-1112233',
    email: 'maria.rodriguez@ejemplo.com',
    ubicacion: 'Barquisimeto, Lara',
    actividad: 'AVICOLA',
  },
  {
    nombre: 'José Pérez',
    cedula: 'V-14567890',
    telefono: '+58 414-2223344',
    email: 'jose.perez@ejemplo.com',
    ubicacion: 'Cabudare, Lara',
    actividad: 'AVICOLA',
  },
  {
    nombre: 'Luis Gómez',
    cedula: 'V-16789012',
    telefono: '+58 416-3334455',
    email: 'luis.gomez@ejemplo.com',
    ubicacion: 'Quíbor, Lara',
    actividad: 'PORCICOLA',
  },
  {
    nombre: 'Ana Torres',
    cedula: 'V-18901234',
    telefono: '+58 424-4445566',
    email: 'ana.torres@ejemplo.com',
    ubicacion: 'Yaritagua, Yaracuy',
    actividad: 'MIXTA',
  },
  {
    nombre: 'Carlos Mendoza',
    cedula: 'V-20123456',
    telefono: '+58 426-5556677',
    email: 'carlos.mendoza@ejemplo.com',
    ubicacion: 'Acarigua, Portuguesa',
    actividad: 'AVICOLA',
  },
];

interface SeedCredito {
  emprendedor: number;
  tipo: 'POLLOS' | 'CERDOS';
  cantidad: number;
  diasAtras: number;
  plazo?: number;
  accion: 'SOLICITADO' | 'APROBADO' | 'ENTREGADO' | 'MORA' | 'RECHAZADO';
  pagos?: { porcentaje: number; diasDespues: number; metodo?: string; referencia?: string }[];
  motivoRechazo?: string;
}

const CREDITOS: SeedCredito[] = [
  { emprendedor: 0, tipo: 'POLLOS', cantidad: 500, diasAtras: 120, accion: 'ENTREGADO', pagos: [{ porcentaje: 0.6, diasDespues: 20 }, { porcentaje: 0.4, diasDespues: 45, metodo: 'TRANSFERENCIA' }] },
  { emprendedor: 0, tipo: 'CERDOS', cantidad: 20, diasAtras: 30, accion: 'ENTREGADO', pagos: [{ porcentaje: 0.4, diasDespues: 18 }] },
  { emprendedor: 0, tipo: 'POLLOS', cantidad: 300, diasAtras: 3, accion: 'SOLICITADO' },
  { emprendedor: 1, tipo: 'POLLOS', cantidad: 800, diasAtras: 20, accion: 'APROBADO' },
  { emprendedor: 1, tipo: 'CERDOS', cantidad: 12, diasAtras: 95, accion: 'ENTREGADO', pagos: [{ porcentaje: 0.5, diasDespues: 25 }, { porcentaje: 0.5, diasDespues: 48, metodo: 'TRANSFERENCIA' }] },
  { emprendedor: 2, tipo: 'CERDOS', cantidad: 30, diasAtras: 80, plazo: 40, accion: 'MORA', pagos: [{ porcentaje: 0.35, diasDespues: 25 }] },
  { emprendedor: 2, tipo: 'POLLOS', cantidad: 600, diasAtras: 50, accion: 'ENTREGADO', pagos: [{ porcentaje: 1, diasDespues: 42, metodo: 'TRANSFERENCIA' }] },
  { emprendedor: 3, tipo: 'POLLOS', cantidad: 400, diasAtras: 15, accion: 'ENTREGADO' },
  { emprendedor: 3, tipo: 'CERDOS', cantidad: 15, diasAtras: 12, accion: 'RECHAZADO', motivoRechazo: 'Score crediticio insuficiente para el monto solicitado' },
  { emprendedor: 4, tipo: 'POLLOS', cantidad: 250, diasAtras: 5, accion: 'SOLICITADO' },
  { emprendedor: 4, tipo: 'CERDOS', cantidad: 8, diasAtras: 40, accion: 'APROBADO', pagos: [{ porcentaje: 0.5, diasDespues: 20 }] },
];

const CRIPTO = [
  { simbolo: 'BTC', nombre: 'Bitcoin', cantidad: 0.1245, precioCompra: 58000 },
  { simbolo: 'ETH', nombre: 'Ethereum', cantidad: 1.85, precioCompra: 2900 },
  { simbolo: 'SOL', nombre: 'Solana', cantidad: 45.2, precioCompra: 120.5 },
  { simbolo: 'BCH', nombre: 'Bitcoin Cash', cantidad: 8.5, precioCompra: 350 },
];

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

async function crearCredito(seed: SeedCredito, emprendedorId: string): Promise<string> {
  const valorUnitario = seed.tipo === 'POLLOS' ? 3.2 : 50;
  const tasa = 8;
  const plazo = seed.plazo ?? 45;
  const fechaSolicitud = addDays(new Date(), -seed.diasAtras);
  const id = crypto.randomUUID();

  await db.run(
    `INSERT INTO creditos
      (id, emprendedor_id, tipo, cantidad, valor_unitario, monto_total, tasa_interes,
       monto_pagado, fecha_entrega, fecha_vencimiento, estado, fecha_solicitud, fecha_actualizacion)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 'SOLICITADO', ?, ?)`,
    [
      id,
      emprendedorId,
      seed.tipo,
      seed.cantidad,
      valorUnitario,
      round2(seed.cantidad * valorUnitario),
      tasa,
      toDateString(fechaSolicitud),
      toDateString(addDays(fechaSolicitud, plazo)),
      toDateTimeString(fechaSolicitud),
      toDateTimeString(fechaSolicitud),
    ]
  );

  return id;
}

async function pagoHistorico(
  creditoId: string,
  monto: number,
  fecha: Date,
  metodo = 'EFECTIVO',
  referencia?: string
): Promise<void> {
  await db.run(
    `INSERT INTO pagos (id, credito_id, monto, metodo_pago, referencia, registrado_por, fecha_pago)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [crypto.randomUUID(), creditoId, round2(monto), metodo, referencia ?? null, ADMIN.userId, toDateTimeString(fecha)]
  );
}

async function recalcularCredito(creditoId: string): Promise<void> {
  const credito = await db.get<CreditoRow>('SELECT * FROM creditos WHERE id = ?', [creditoId]);
  if (!credito) return;

  const pago = await db.get<{ total: number }>(
    'SELECT COALESCE(SUM(monto), 0) AS total FROM pagos WHERE credito_id = ?',
    [creditoId]
  );
  const montoTotal = toNumber(credito.monto_total);
  const tasa = toNumber(credito.tasa_interes);
  const totalPagar = round2(montoTotal * (1 + tasa / 100));
  const pagado = toNumber(pago?.total);
  const saldo = Math.max(0, round2(totalPagar - pagado));
  const estado = saldo <= 0.01 ? 'PAGADO' : credito.estado;

  await db.run('UPDATE creditos SET monto_pagado = ?, estado = ?, fecha_actualizacion = ? WHERE id = ?', [
    round2(pagado),
    estado,
    toDateTimeString(),
    creditoId,
  ]);
}

async function main(): Promise<void> {
  const forzar = process.argv.includes('--force');

  await connectDatabases({ migrate: true });

  const existente = await db.get<{ id: string }>(
    "SELECT id FROM usuarios WHERE rol IN ('ADMIN','SUPER_ADMIN') LIMIT 1"
  );
  if (existente && !forzar) {
    logger.warn('Ya existen usuarios administradores. Usa "npm run seed -- --force" para reiniciar los datos.');
    await closeDatabases();
    process.exit(0);
  }

  // ---------- Parámetros de negocio ----------
  await setParametro('PRECIO_POLLO', '3.20', 'Precio unitario de cada pollo financiado (USD)');
  await setParametro('PRECIO_CERDO', '50.00', 'Precio unitario de cada cerdo financiado (USD)');
  await setParametro('TASA_INTERES', '8', 'Tasa de interés por crédito (%)');
  await setParametro('PLAZO_DIAS', '45', 'Plazo estándar de pago en días');
  await setParametro('CANTIDAD_MAX_POLLOS', '2000', 'Cantidad máxima de pollos por crédito');
  await setParametro('CANTIDAD_MAX_CERDOS', '200', 'Cantidad máxima de cerdos por crédito');
  await setParametro('IMPUESTO_PORCENTAJE', '0', 'Impuesto aplicado en la factura (%)');
  await setParametro('SCORE_MINIMO', '420', 'Score mínimo para aprobar un crédito');
  logger.info('⚙️  Parámetros de negocio cargados');

  // ---------- Administradores ----------
  const adminId = crypto.randomUUID();
  const passwordAdmin = await bcrypt.hash(PASSWORD_ADMIN, 10);
  await db.run(
    `INSERT INTO usuarios (id, nombre, email, telefono, password_hash, rol, email_verificado, activo)
     VALUES (?, ?, ?, ?, ?, 'SUPER_ADMIN', 1, 1)`,
    [adminId, 'Administrador Keny', 'admin@polloskeny.com', '+58 412-0000000', passwordAdmin]
  );

  const admin2Id = crypto.randomUUID();
  await db.run(
    `INSERT INTO usuarios (id, nombre, email, telefono, password_hash, rol, email_verificado, activo)
     VALUES (?, ?, ?, ?, ?, 'ADMIN', 1, 1)`,
    [admin2Id, 'María Cobranzas', 'cobranzas@polloskeny.com', '+58 412-0000001', passwordAdmin]
  );
  logger.info('👤 Administradores creados');

  // ---------- Emprendedores ----------
  const passwordEmprendedor = await bcrypt.hash(PASSWORD_EMPRENDEDOR, 10);
  const idsEmprendedores: string[] = [];

  for (const emp of EMPRENDEDORES) {
    const emprendedorId = crypto.randomUUID();
    const usuarioId = crypto.randomUUID();

    await db.run(
      `INSERT INTO emprendedores (id, nombre, cedula, telefono, email, ubicacion, actividad, score_crediticio, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, 500, 1)`,
      [emprendedorId, emp.nombre, emp.cedula, emp.telefono, emp.email, emp.ubicacion, emp.actividad]
    );
    await db.run(
      `INSERT INTO usuarios (id, emprendedor_id, nombre, email, telefono, password_hash, rol, email_verificado, activo)
       VALUES (?, ?, ?, ?, ?, ?, 'EMPRENDEDOR', 1, 1)`,
      [usuarioId, emprendedorId, emp.nombre, emp.email, emp.telefono, passwordEmprendedor]
    );

    idsEmprendedores.push(emprendedorId);
  }
  logger.info(`🐔 ${EMPRENDEDORES.length} emprendedores creados`);

  // ---------- Créditos ----------
  let aprobados = 0;
  let entregados = 0;
  let rechazados = 0;

  for (const seed of CREDITOS) {
    const emprendedorId = idsEmprendedores[seed.emprendedor];
    const creditoId = await crearCredito(seed, emprendedorId);

    if (seed.accion === 'RECHAZADO') {
      await CreditoService.rechazar(creditoId, seed.motivoRechazo ?? 'No cumple los requisitos', adminId);
      rechazados++;
      continue;
    }

    if (seed.accion !== 'SOLICITADO') {
      await CreditoService.aprobar(creditoId, adminId);
      aprobados++;

      if (seed.accion === 'ENTREGADO' || seed.accion === 'MORA') {
        await CreditoService.entregar(creditoId);
        entregados++;
      }
    }

    const credito = await db.get<CreditoRow>('SELECT * FROM creditos WHERE id = ?', [creditoId]);
    const totalPagar = round2(toNumber(credito?.monto_total) * (1 + toNumber(credito?.tasa_interes) / 100));
    const fechaSolicitud = addDays(new Date(), -seed.diasAtras);

    for (const pago of seed.pagos ?? []) {
      await pagoHistorico(
        creditoId,
        totalPagar * pago.porcentaje,
        addDays(fechaSolicitud, pago.diasDespues),
        pago.metodo ?? 'EFECTIVO',
        pago.referencia
      );
    }

    await recalcularCredito(creditoId);

    if (seed.accion === 'MORA') {
      await db.run(`UPDATE creditos SET estado = 'MORA', fecha_actualizacion = ? WHERE id = ?`, [
        toDateTimeString(),
        creditoId,
      ]);
    }
  }
  logger.info(`📄 Créditos creados: ${aprobados} aprobados, ${entregados} entregados, ${rechazados} rechazados`);

  // ---------- Cartera crypto ----------
  for (const activo of CRIPTO) {
    await db.run(
      `INSERT INTO crypto_portfolio (id, simbolo, nombre, cantidad, precio_compra_usd)
       VALUES (?, ?, ?, ?, ?)`,
      [crypto.randomUUID(), activo.simbolo, activo.nombre, activo.cantidad, activo.precioCompra]
    );
  }
  logger.info(`₿ ${CRIPTO.length} activos crypto registrados`);

  // ---------- Scoring ----------
  await actualizarTodosLosScores();

  const resumen = await db.all<{ estado: string; total: number; monto: number }>(
    `SELECT estado, COUNT(*) AS total, COALESCE(SUM(monto_total), 0) AS monto FROM creditos GROUP BY estado`
  );

  console.log('\n' + '='.repeat(58));
  console.log('  🐔  SEED COMPLETADO — Créditos Pollos Keny');
  console.log('='.repeat(58));
  console.log('\n  Créditos por estado:');
  for (const fila of resumen) {
    console.log(`   • ${fila.estado.padEnd(12)} ${String(fila.total).padStart(2)}  $${Number(fila.monto).toFixed(2)}`);
  }
  console.log('\n  🔐 Credenciales de acceso');
  console.log(`   • Super admin : admin@polloskeny.com / ${PASSWORD_ADMIN}`);
  console.log(`   • Admin       : cobranzas@polloskeny.com / ${PASSWORD_ADMIN}`);
  console.log(`   • Emprendedor : maria.rodriguez@ejemplo.com / ${PASSWORD_EMPRENDEDOR}`);
  console.log('     (todos los emprendedores usan la misma contraseña)\n');

  await closeDatabases();
  process.exit(0);
}

main().catch((error) => {
  logger.error('Error ejecutando el seed', error);
  process.exit(1);
});
