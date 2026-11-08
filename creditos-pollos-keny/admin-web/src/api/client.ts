import axios from 'axios';

const TOKEN_KEY = 'keny_token';
const REFRESH_KEY = 'keny_refresh';

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  setRefresh: (token: string) => localStorage.setItem(REFRESH_KEY, token),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 20_000,
});

api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refrescando = false;
const cola: { resolve: (token: string) => void; reject: (error: unknown) => void }[] = [];

function procesarCola(error: unknown, token?: string): void {
  cola.forEach((peticion) => (token ? peticion.resolve(token) : peticion.reject(error)));
  cola.length = 0;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (status === 401 && original && !original._retry && tokenStorage.getRefresh()) {
      if (refrescando) {
        return new Promise((resolve, reject) => {
          cola.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token as string}`;
          return api(original);
        });
      }

      original._retry = true;
      refrescando = true;

      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL ?? '/api'}/auth/refresh`,
          { refreshToken: tokenStorage.getRefresh() },
          { headers: { 'Content-Type': 'application/json' } }
        );
        tokenStorage.set(data.accessToken);
        api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
        procesarCola(null, data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (refreshError) {
        procesarCola(refreshError);
        tokenStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        refrescando = false;
      }
    }

    return Promise.reject(error);
  }
);

/** Extrae el mensaje de error legible de una respuesta de la API. */
export function mensajeError(error: unknown, porDefecto = 'Algo salió mal'): string {
  const err = error as {
    response?: { data?: { error?: { mensaje?: string; detalles?: { mensaje: string }[] } } };
    message?: string;
    code?: string;
  };

  const detalles = err.response?.data?.error?.detalles;
  if (detalles?.length) return detalles.map((d) => d.mensaje).join(', ');

  return err.response?.data?.error?.mensaje ?? err.message ?? porDefecto;
}

export function codigoError(error: unknown): string | undefined {
  return (error as { response?: { data?: { error?: { codigo?: string } } } }).response?.data?.error
    ?.codigo;
}
