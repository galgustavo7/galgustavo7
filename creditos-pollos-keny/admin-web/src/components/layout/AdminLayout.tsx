import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bitcoin,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  Users,
  X,
  Mail,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { iniciales, cx } from '@/lib/format';

const LINKS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/creditos', icon: Receipt, label: 'Créditos' },
  { to: '/emprendedores', icon: Users, label: 'Emprendedores' },
  { to: '/crypto', icon: Bitcoin, label: 'Crypto' },
  { to: '/correos', icon: Mail, label: 'Correos' },
];

export function AdminLayout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [abierto, setAbierto] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const navegar = () => setAbierto(false);

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Sidebar */}
      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-ink-100 bg-white transition-transform duration-200 lg:translate-x-0',
          abierto ? 'translate-x-0 shadow-lift' : '-translate-x-full'
        )}
      >
        <div className="flex items-center gap-3 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 text-lg shadow-soft">
            🐔
          </div>
          <div>
            <p className="font-bold leading-tight text-ink-900">Pollos Keny</p>
            <p className="text-xs text-ink-500">Panel administrativo</p>
          </div>
          <button
            className="ml-auto rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 lg:hidden"
            onClick={() => setAbierto(false)}
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-thin">
          {LINKS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={navegar}
              className={({ isActive }) =>
                cx(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-brand-800 text-white shadow-soft'
                    : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
                )
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-ink-100 p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-800 text-sm font-semibold text-white">
              {iniciales(usuario?.nombre)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink-900">{usuario?.nombre}</p>
              <p className="truncate text-xs text-ink-500">
                {usuario?.rol === 'SUPER_ADMIN' ? 'Super Admin' : 'Administrador'}
              </p>
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
      </aside>

      {/* Overlay móvil */}
      {abierto && (
        <div
          className="fixed inset-0 z-30 bg-ink-900/40 lg:hidden"
          onClick={() => setAbierto(false)}
          aria-hidden
        />
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-ink-100 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <button
            onClick={() => setAbierto(true)}
            className="rounded-lg p-2 text-ink-600 hover:bg-ink-100"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
          <p className="font-semibold text-ink-900">Pollos Keny</p>
        </header>

        <main key={location.pathname} className="animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
