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

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  rol: Rol;
  avatar: string | null;
  emprendedorId: string | null;
  emailVerificado: boolean;
  ultimoAcceso: string | null;
  fechaCreacion: string;
  emprendedor?: {
    score_crediticio: number;
    actividad: Actividad;
    ubicacion: string | null;
    cedula: string;
  } | null;
}

export interface TotalesCredito {
  montoTotal: number;
  tasaInteres: number;
  intereses: number;
  totalPagar: number;
  montoPagado: number;
  saldoPendiente: number;
  porcentajePagado: number;
}

export interface Credito {
  id: string;
  emprendedor_id: string;
  tipo: TipoCredito;
  cantidad: number;
  valor_unitario: number;
  monto_total: number;
  tasa_interes: number;
  monto_pagado: number;
  fecha_entrega: string | null;
  fecha_vencimiento: string;
  estado: EstadoCredito;
  factura_numero: string | null;
  motivo_rechazo: string | null;
  fecha_solicitud: string;
  fecha_aprobacion: string | null;
  emprendedor_nombre?: string;
  emprendedor_cedula?: string;
  emprendedor_email?: string;
  emprendedor_telefono?: string;
  score_crediticio?: number;
  totales?: TotalesCredito;
  pagos?: Pago[];
  factura?: { id: string; numero: string; total: number; pdf_path: string | null; emitida_en: string } | null;
}

export interface Pago {
  id: string;
  monto: number;
  metodo_pago: MetodoPago;
  referencia: string | null;
  nota: string | null;
  fecha_pago: string;
  factura_numero?: string;
  emprendedor_nombre?: string;
}

export interface Emprendedor {
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
  total_creditos?: number;
  creditos_activos?: number;
  creditos_mora?: number;
  creditos_pagados?: number;
  monto_solicitado?: number;
  monto_pagado?: number;
  score?: number;
  nivel?: { etiqueta: string; color: string };
}

export interface Metricas {
  totalPrestado: number;
  totalRecuperado: number;
  pendienteCobro: number;
  interesesProyectados: number;
  creditosActivos: number;
  creditosEnMora: number;
  solicitudesPendientes: number;
  emprendedores: number;
  montoEnMora: number;
  ingresosMes: number;
  ticketPromedio: number;
  tasaRecuperacion: number;
  distribucion: { tipo: string; monto: number; cantidad: number }[];
  ingresosPorTipo: { tipo: string; monto: number; intereses: number }[];
  crypto: { valor: number; ganancia: number; gananciaPorcentaje: number; fuente: string };
}

export interface SerieMes {
  mes: string;
  etiqueta: string;
  colocado: number;
  cobrado: number;
}

export interface ActivoCrypto {
  id: string;
  simbolo: string;
  nombre: string;
  cantidad: number;
  precioCompra: number;
  precioActual: number;
  variacion24h: number;
  costo: number;
  valor: number;
  ganancia: number;
  gananciaPorcentaje: number;
  fechaRegistro: string;
}

export interface CarteraCrypto {
  activos: ActivoCrypto[];
  resumen: {
    valorTotal: number;
    costoTotal: number;
    ganancia: number;
    gananciaPorcentaje: number;
    variacion24h: number;
  };
  fuente: 'binance' | 'cache';
  actualizadoEn: string;
  mercado: { simbolo: string; nombre: string; precio: number; variacion24h: number; fuente: string }[];
}

export interface EmailLog {
  id: string;
  destinatario: string;
  asunto: string;
  tipo: string;
  estado: 'ENVIADO' | 'SIMULADO' | 'ERROR';
  creado_en: string;
  preview_path: string | null;
  mensaje_error: string | null;
  credito_id: string | null;
}

export interface MetaPaginacion {
  total: number;
  page: number;
  limit: number;
  paginas: number;
}

export interface RespuestaPaginada<T> {
  data: T[];
  meta: MetaPaginacion;
}

export interface ResumenEmprendedor {
  emprendedor: { nombre: string; score_crediticio: number; actividad: Actividad } | null;
  totales: {
    creditos: number;
    activos: number;
    enMora: number;
    pagados: number;
    pendientes: number;
    montoSolicitado: number;
    saldoPendiente: number;
    totalPagado: number;
  };
  creditos: Credito[];
}
