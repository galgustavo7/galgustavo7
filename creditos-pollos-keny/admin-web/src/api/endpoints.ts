import { api } from './client';
import type {
  Actividad,
  CarteraCrypto,
  Credito,
  EmailLog,
  Emprendedor,
  EstadoCredito,
  MetodoPago,
  Metricas,
  Pago,
  RespuestaPaginada,
  ResumenEmprendedor,
  Rol,
  SerieMes,
  TipoCredito,
  Usuario,
} from '@/types';

/* ============================ AUTH ============================ */

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  usuario: Usuario;
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },

  registro: async (payload: {
    nombre: string;
    email: string;
    password: string;
    telefono?: string;
    cedula: string;
    ubicacion?: string;
    actividad?: Actividad;
  }) => {
    const { data } = await api.post('/auth/registro', payload);
    return data;
  },

  me: async (): Promise<Usuario> => {
    const { data } = await api.get('/auth/me');
    return data.usuario;
  },

  verificarEmail: async (token: string, id: string) => {
    const { data } = await api.post('/auth/verificar-email', { token, id });
    return data;
  },

  reenviarVerificacion: async (email: string) => {
    const { data } = await api.post('/auth/reenviar-verificacion', { email });
    return data;
  },

  recuperar: async (email: string) => {
    const { data } = await api.post('/auth/recuperar', { email });
    return data;
  },

  resetPassword: async (token: string, id: string, password: string) => {
    const { data } = await api.post('/auth/reset-password', { token, id, password });
    return data;
  },

  cambiarPassword: async (passwordActual: string, passwordNueva: string) => {
    const { data } = await api.post('/auth/cambiar-password', { passwordActual, passwordNueva });
    return data;
  },

  logout: async (refreshToken?: string | null) => {
    const { data } = await api.post('/auth/logout', { refreshToken });
    return data;
  },
};

/* ========================== CRÉDITOS ========================== */

export interface FiltrosCreditos {
  estado?: EstadoCredito | '';
  tipo?: TipoCredito | '';
  q?: string;
  page?: number;
  limit?: number;
  emprendedorId?: string;
}

export const creditosApi = {
  listar: async (filtros: FiltrosCreditos = {}): Promise<RespuestaPaginada<Credito>> => {
    const { data } = await api.get('/creditos', { params: filtros });
    return data;
  },

  obtener: async (id: string): Promise<Credito> => {
    const { data } = await api.get(`/creditos/${id}`);
    return data.credito;
  },

  solicitar: async (payload: { tipo: TipoCredito; cantidad: number; notas?: string }) => {
    const { data } = await api.post('/creditos/solicitar', payload);
    return data.credito;
  },

  aprobar: async (id: string) => {
    const { data } = await api.post(`/creditos/${id}/aprobar`);
    return data.credito;
  },

  rechazar: async (id: string, motivo: string) => {
    const { data } = await api.post(`/creditos/${id}/rechazar`, { motivo });
    return data.credito;
  },

  entregar: async (id: string) => {
    const { data } = await api.post(`/creditos/${id}/entregar`);
    return data.credito;
  },

  cancelar: async (id: string, motivo: string) => {
    const { data } = await api.post(`/creditos/${id}/cancelar`, { motivo });
    return data.credito;
  },

  pagar: async (
    id: string,
    payload: { monto: number; metodoPago: MetodoPago; referencia?: string; nota?: string }
  ) => {
    const { data } = await api.post(`/creditos/${id}/pagos`, payload);
    return data;
  },

  pagos: async (id: string): Promise<Pago[]> => {
    const { data } = await api.get(`/creditos/${id}/pagos`);
    return data.pagos;
  },

  urlFactura: (id: string) => `/api/creditos/${id}/factura`,
};

/* ======================= EMPRENDEDORES ======================== */

export const emprendedoresApi = {
  listar: async (filtros: { q?: string; actividad?: string } = {}): Promise<Emprendedor[]> => {
    const { data } = await api.get('/emprendedores', { params: filtros });
    return data.emprendedores;
  },

  obtener: async (id: string): Promise<Emprendedor & { creditos: Credito[]; pagos: Pago[]; usuario: unknown }> => {
    const { data } = await api.get(`/emprendedores/${id}`);
    return data.emprendedor;
  },

  crear: async (payload: Partial<Emprendedor> & { password?: string }) => {
    const { data } = await api.post('/emprendedores', payload);
    return data.emprendedor;
  },

  actualizar: async (id: string, payload: Partial<Emprendedor>) => {
    const { data } = await api.patch(`/emprendedores/${id}`, payload);
    return data;
  },

  cambiarEstado: async (id: string, activo: boolean) => {
    const { data } = await api.patch(`/emprendedores/${id}/estado`, { activo });
    return data;
  },

  recalcularScore: async (id: string) => {
    const { data } = await api.post(`/emprendedores/${id}/recalcular-score`);
    return data;
  },

  ranking: async (): Promise<
    { id: string; nombre: string; score: number; nivel: { etiqueta: string; color: string } }[]
  > => {
    const { data } = await api.get('/emprendedores/ranking');
    return data.ranking;
  },
};

/* ========================== DASHBOARD ========================= */

export const dashboardApi = {
  metricas: async (): Promise<Metricas> => {
    const { data } = await api.get('/dashboard/metricas');
    return data.metricas;
  },

  serieMensual: async (meses = 6): Promise<SerieMes[]> => {
    const { data } = await api.get('/dashboard/serie-mensual', { params: { meses } });
    return data.serie;
  },

  resumen: async (): Promise<{
    metricas: Metricas;
    creditos: Credito[];
    pagos: Pago[];
    morosos: Credito[];
    serie: SerieMes[];
  }> => {
    const { data } = await api.get('/dashboard/resumen');
    return data;
  },

  morosos: async (): Promise<Credito[]> => {
    const { data } = await api.get('/dashboard/morosos');
    return data.morosos;
  },

  miResumen: async (): Promise<ResumenEmprendedor> => {
    const { data } = await api.get('/dashboard/mi-resumen');
    return data;
  },
};

/* =========================== CRYPTO =========================== */

export const cryptoApi = {
  cartera: async (): Promise<CarteraCrypto> => {
    const { data } = await api.get('/crypto/cartera');
    return data;
  },

  agregar: async (payload: { simbolo: string; nombre?: string; cantidad: number; precioCompra: number }) => {
    const { data } = await api.post('/crypto', payload);
    return data.activo;
  },

  actualizar: async (id: string, payload: { cantidad?: number; precioCompra?: number; nombre?: string }) => {
    const { data } = await api.patch(`/crypto/${id}`, payload);
    return data;
  },

  eliminar: async (id: string) => {
    const { data } = await api.delete(`/crypto/${id}`);
    return data;
  },
};

/* =========================== CORREOS ========================== */

export const emailsApi = {
  listar: async (limite = 50): Promise<EmailLog[]> => {
    const { data } = await api.get('/emails', { params: { limite } });
    return data.emails;
  },
  urlPreview: (id: string) => `/api/emails/${id}/preview`,
};

/* ========================= PARÁMETROS ========================= */

export const parametrosApi = {
  listar: async (): Promise<Record<string, string>> => {
    const { data } = await api.get('/parametros');
    return data.parametros;
  },
};

export const ROLES_ADMIN: Rol[] = ['SUPER_ADMIN', 'ADMIN'];
