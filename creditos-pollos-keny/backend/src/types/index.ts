export type Rol = 'SUPER_ADMIN' | 'ADMIN' | 'EMPRENDEDOR';

export type EstadoCredito =
  | 'SOLICITADO'
  | 'APROBADO'
  | 'ENTREGADO'
  | 'PAGADO'
  | 'MORA'
  | 'RECHAZADO'
  | 'CANCELADO';

export type TipoCredito = 'POLLOS' | 'CERDOS';

export type MetodoPago = 'EFECTIVO' | 'TRANSFERENCIA' | 'BINANCE' | 'OTRO';

export type Actividad = 'AVICOLA' | 'PORCICOLA' | 'MIXTA';

export interface JwtPayload {
  userId: string;
  email: string;
  rol: Rol;
  nombre: string;
  emprendedorId?: string | null;
}

export interface UsuarioRow {
  id: string;
  emprendedor_id: string | null;
  nombre: string;
  email: string;
  telefono: string | null;
  password_hash: string;
  rol: Rol;
  avatar_url: string | null;
  activo: number | boolean;
  email_verificado: number | boolean;
  token_verificacion: string | null;
  token_verificacion_expira: string | null;
  ultimo_acceso: string | null;
  fecha_creacion: string;
}

export interface EmprendedorRow {
  id: string;
  nombre: string;
  cedula: string;
  telefono: string;
  email: string;
  ubicacion: string | null;
  actividad: Actividad;
  score_crediticio: number;
  notas: string | null;
  activo: number | boolean;
  fecha_registro: string;
}

export interface CreditoRow {
  id: string;
  emprendedor_id: string;
  tipo: TipoCredito;
  cantidad: number;
  valor_unitario: number | string;
  monto_total: number | string;
  tasa_interes: number | string;
  monto_pagado: number | string;
  fecha_entrega: string | null;
  fecha_vencimiento: string;
  estado: EstadoCredito;
  factura_numero: string | null;
  motivo_rechazo: string | null;
  fecha_solicitud: string;
  fecha_aprobacion: string | null;
  fecha_actualizacion: string;
}

export interface PagoRow {
  id: string;
  credito_id: string;
  monto: number | string;
  metodo_pago: MetodoPago;
  referencia: string | null;
  nota: string | null;
  registrado_por: string | null;
  fecha_pago: string;
}

export const toBool = (value: unknown): boolean => Boolean(Number(value));

export const toNumber = (value: unknown): number => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};
