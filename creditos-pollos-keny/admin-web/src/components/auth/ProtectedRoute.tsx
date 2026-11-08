import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { Rol } from '@/types';
import { Loader } from '@/components/ui/Feedback';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: Rol[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { isAuthenticated, usuario, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <Loader label="Validando sesión..." />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (roles && usuario && !roles.includes(usuario.rol)) {
    return <Navigate to="/sin-permiso" replace />;
  }

  return <>{children}</>;
}

/** Redirige a los usuarios autenticados fuera de las páginas públicas. */
export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, usuario } = useAuth();

  if (isAuthenticated && usuario) {
    const destino = usuario.rol === 'EMPRENDEDOR' ? '/mi-panel' : '/';
    return <Navigate to={destino} replace />;
  }

  return <>{children}</>;
}
