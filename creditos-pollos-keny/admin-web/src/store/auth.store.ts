import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, tokenStorage } from '@/api/client';
import { authApi } from '@/api/endpoints';
import type { Usuario } from '@/types';

interface AuthState {
  usuario: Usuario | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<Usuario>;
  logout: () => Promise<void>;
  setUsuario: (usuario: Usuario) => void;
  refrescarPerfil: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      usuario: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const data = await authApi.login(email, password);
          tokenStorage.set(data.accessToken);
          tokenStorage.setRefresh(data.refreshToken);
          api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;

          set({
            usuario: data.usuario,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });

          return data.usuario;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authApi.logout(get().refreshToken);
        } catch {
          // Si falla el logout remoto, limpiamos la sesión local igualmente
        }
        tokenStorage.clear();
        delete api.defaults.headers.common.Authorization;
        set({
          usuario: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      setUsuario: (usuario) => set({ usuario }),

      refrescarPerfil: async () => {
        try {
          const usuario = await authApi.me();
          set({ usuario });
        } catch {
          // silencioso: si falla mantenemos el perfil en caché
        }
      },
    }),
    {
      name: 'keny-auth',
      partialize: (state) => ({
        usuario: state.usuario,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
