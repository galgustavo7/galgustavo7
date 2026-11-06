import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowRight, Egg, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Form';
import { codigoError, mensajeError } from '@/api/client';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const usuario = await login(email.trim(), password);
      toast.success(`¡Bienvenido, ${usuario.nombre.split(' ')[0]}!`);
      navigate(usuario.rol === 'EMPRENDEDOR' ? '/mi-panel' : '/', { replace: true });
    } catch (error) {
      if (codigoError(error) === 'EMAIL_NO_VERIFICADO') {
        toast.error('Debes verificar tu correo antes de ingresar', {
          action: { label: 'Reenviar correo', onClick: () => navigate('/reenviar-verificacion') },
        });
      } else {
        toast.error(mensajeError(error, 'No pudimos iniciar sesión'));
      }
    } finally {
      setLoading(false);
    }
  };

  const usarDemo = (rol: 'admin' | 'emprendedor') => {
    if (rol === 'admin') {
      setEmail('admin@polloskeny.com');
      setPassword('AdminKeny2026!');
    } else {
      setEmail('maria.rodriguez@ejemplo.com');
      setPassword('Emprendedor2026!');
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Lado de marca */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-brand-800 via-brand-900 to-ink-900 lg:flex">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-accent-600/25 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-brand-500/25 blur-3xl" />

        <div className="relative z-10 flex w-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500 to-accent-700 text-2xl shadow-lg">
              🐔
            </div>
            <div>
              <p className="text-xl font-bold leading-tight">Pollos Keny</p>
              <p className="text-xs opacity-70">Créditos productivos</p>
            </div>
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight">
              Financia tu próxima
              <br />
              <span className="text-accent-400">producción avícola</span>
            </h1>
            <p className="max-w-md text-lg text-white/70">
              Solicita créditos de pollos o cerdos, recibe tu factura al instante y lleva el control
              de tus pagos desde un solo lugar.
            </p>

            <dl className="grid max-w-md grid-cols-3 gap-4 border-t border-white/10 pt-6">
              <div>
                <dt className="text-2xl font-bold">8%</dt>
                <dd className="text-xs text-white/60">Tasa fija</dd>
              </div>
              <div>
                <dt className="text-2xl font-bold">45</dt>
                <dd className="text-xs text-white/60">Días de plazo</dd>
              </div>
              <div>
                <dt className="text-2xl font-bold">24h</dt>
                <dd className="text-xs text-white/60">Aprobación</dd>
              </div>
            </dl>
          </div>

          <p className="text-xs text-white/50">© {new Date().getFullYear()} Créditos Pollos Keny</p>
        </div>
      </div>

      {/* Formulario */}
      <div className="flex flex-1 items-center justify-center bg-ink-50 p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 text-xl">
              🐔
            </div>
            <div>
              <p className="text-lg font-bold leading-tight text-ink-900">Pollos Keny</p>
              <p className="text-xs text-ink-500">Panel de créditos</p>
            </div>
          </div>

          <div className="card p-8">
            <h2 className="text-2xl font-bold text-ink-900">Iniciar sesión</h2>
            <p className="mt-1 text-sm text-ink-500">Ingresa con tus credenciales para continuar</p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <Field label="Correo electrónico" required>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                  <Input
                    type="email"
                    className="pl-10"
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </Field>

              <Field label="Contraseña" required>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    className="pl-10 pr-11"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>

              <div className="flex items-center justify-between">
                <Link to="/recuperar" className="text-xs font-medium text-brand-600 hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
                <Link to="/reenviar-verificacion" className="text-xs font-medium text-ink-500 hover:underline">
                  Reenviar verificación
                </Link>
              </div>

              <Button type="submit" loading={loading} size="lg" fullWidth icon={<ArrowRight className="h-4 w-4" />}>
                Ingresar
              </Button>
            </form>

            <div className="mt-6 rounded-xl border border-dashed border-ink-200 bg-ink-50 p-4">
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-ink-700">
                <Egg className="h-3.5 w-3.5" /> Cuentas de demostración
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="secondary" onClick={() => usarDemo('admin')}>
                  Administrador
                </Button>
                <Button type="button" size="sm" variant="secondary" onClick={() => usarDemo('emprendedor')}>
                  Emprendedor
                </Button>
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-ink-500">
              ¿Eres emprendedor y no tienes cuenta?{' '}
              <Link to="/registro" className="font-semibold text-brand-600 hover:underline">
                Regístrate
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
