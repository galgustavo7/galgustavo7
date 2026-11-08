import { useAuthStore } from '@/store/auth.store';
import type { Rol } from '@/types';

export function useAuth() {
  const store = useAuthStore();

  const esAdmin = store.usuario?.rol === 'ADMIN' || store.usuario?.rol === 'SUPER_ADMIN';
  const esEmprendedor = store.usuario?.rol === 'EMPRENDEDOR';
  const esSuperAdmin = store.usuario?.rol === 'SUPER_ADMIN';

  const tieneRol = (roles: Rol[]) => Boolean(store.usuario && roles.includes(store.usuario.rol));

  return { ...store, esAdmin, esEmprendedor, esSuperAdmin, tieneRol };
}
