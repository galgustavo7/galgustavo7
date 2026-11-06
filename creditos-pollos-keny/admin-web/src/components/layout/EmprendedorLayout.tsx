import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Egg, Home, LogOut, Menu, Receipt, UserRound, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cx, iniciales } from '@/lib/format';

const LINKS = [
  { to: '/mi-panel', icon: Home, label: 'Mi panel' },
  { to: '/solicitar', icon: Egg, label: 'Solicitar crédito' },
  { to: '/mis-creditos', icon: Receipt, label: 'Mis créditos' },
  { to: '/mi-perfil', icon: UserRound, label: 'Mi perfil' },
];

export function EmprendedorLayout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAbierto(!abierto)}
              className="rounded-lg p-2 text-ink-600 hover:bg-ink-100 md:hidden"
              aria-label="Menú"
            >
              {abierto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 text-lg">
              🐔
            </div>
            <div>
              <p className="font-bold leading-tight text-ink-900">Pollos Keny</p>
              <p className="text-xs text-ink-500">Panel del emprendedor</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-ink-900">{usuario?.nombre}</p>
              <p className="text-xs text-ink-500">{usuario?.email}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-800 text-sm font-semibold text-white">
              {iniciales(usuario?.nombre)}
            </div>
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="rounded-lg p-2 text-ink-400 transition hover:bg-ink-100 hover:text-rose-600"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        <nav
          className={cx(
            'mx-auto max-w-6xl gap-1 overflow-hidden px-4 md:flex',
            abierto ? 'flex flex-col pb-2' : 'hidden'
          )}
        >
          {LINKS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setAbierto(false)}
              className={({ isActive }) =>
                cx(
                  'flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition',
                  isActive
                    ? 'border-brand-800 text-brand-800'
                    : 'border-transparent text-ink-500 hover:text-ink-900'
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl animate-fade-in p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  );
}
