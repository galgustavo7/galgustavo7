import { Link, useNavigate } from 'react-router-dom';
import { Home, LogOut, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

export function SinPermisoPage() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const volver = () => {
    navigate(usuario?.rol === 'EMPRENDEDOR' ? '/mi-panel' : '/', { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50">
          <ShieldAlert className="h-8 w-8 text-rose-500" />
        </div>
        <h1 className="text-2xl font-bold text-ink-900">Acceso restringido</h1>
        <p className="mt-2 text-ink-500">
          Tu cuenta ({usuario?.rol}) no tiene permisos para ver esta sección.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button onClick={volver} icon={<Home className="h-4 w-4" />}>
            Volver a mi panel
          </Button>
          <Button
            variant="secondary"
            icon={<LogOut className="h-4 w-4" />}
            onClick={async () => {
              await logout();
              navigate('/login', { replace: true });
            }}
          >
            Cerrar sesión
          </Button>
        </div>
        <p className="mt-4 text-xs text-ink-400">
          ¿Necesitas otro rol? Habla con el{' '}
          <Link to="/login" className="text-brand-600 hover:underline">
            administrador
          </Link>{' '}
          de la plataforma.
        </p>
      </div>
    </div>
  );
}
