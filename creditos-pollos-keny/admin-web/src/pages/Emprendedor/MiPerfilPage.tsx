import { useState } from 'react';
import { toast } from 'sonner';
import { KeyRound, LogOut, ShieldCheck, Star, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/Feedback';
import { Card, CardContent, CardHeader, CardTitle, CardSubtitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Form';
import { useAuth } from '@/hooks/useAuth';
import { authApi } from '@/api/endpoints';
import { mensajeError } from '@/api/client';
import { formatDate, formatDateTime, nivelScore } from '@/lib/format';

export function MiPerfilPage() {
  const { usuario, logout, refrescarPerfil } = useAuth();
  const navigate = useNavigate();

  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [guardando, setGuardando] = useState(false);

  const nivel = nivelScore(usuario?.emprendedor?.score_crediticio);

  const cambiarPassword = async (event: React.FormEvent) => {
    event.preventDefault();

    if (nueva.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (nueva !== confirmar) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    setGuardando(true);
    try {
      await authApi.cambiarPassword(actual, nueva);
      toast.success('Contraseña actualizada');
      setActual('');
      setNueva('');
      setConfirmar('');
    } catch (error) {
      toast.error(mensajeError(error, 'No se pudo cambiar la contraseña'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div>
      <PageHeader title="Mi perfil" subtitle="Tus datos y configuración de seguridad" />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Datos */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="h-4 w-4 text-ink-400" /> Datos personales
              </CardTitle>
              <CardSubtitle>Información registrada en la plataforma</CardSubtitle>
            </div>
            <Button size="sm" variant="secondary" onClick={() => void refrescarPerfil()}>
              Actualizar
            </Button>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Dato label="Nombre completo" value={usuario?.nombre} />
              <Dato label="Correo electrónico" value={usuario?.email} />
              <Dato label="Teléfono" value={usuario?.telefono} />
              <Dato label="Cédula / RIF" value={usuario?.emprendedor?.cedula} />
              <Dato label="Actividad" value={usuario?.emprendedor?.actividad} />
              <Dato label="Ubicación" value={usuario?.emprendedor?.ubicacion} />
              <Dato
                label="Correo verificado"
                value={usuario?.emailVerificado ? 'Sí ✅' : 'Pendiente ⏳'}
              />
              <Dato label="Último acceso" value={formatDateTime(usuario?.ultimoAcceso)} />
              <Dato label="Miembro desde" value={formatDate(usuario?.fechaCreacion)} />
              <Dato label="Rol" value={usuario?.rol} />
            </dl>
          </CardContent>
        </Card>

        {/* Score + seguridad */}
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-ink-400" /> Score crediticio
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-4xl font-bold" style={{ color: nivel.color }}>
                {usuario?.emprendedor?.score_crediticio ?? '—'}
              </p>
              <p className="mt-1 text-sm font-semibold" style={{ color: nivel.color }}>
                {nivel.etiqueta}
              </p>
              <p className="mt-3 text-xs text-ink-500">
                Se actualiza automáticamente con cada pago registrado y cada crédito vencido.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-ink-400" /> Cambiar contraseña
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={cambiarPassword} className="space-y-4">
                <Field label="Contraseña actual" required>
                  <Input
                    type="password"
                    value={actual}
                    onChange={(e) => setActual(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </Field>
                <Field label="Nueva contraseña" required>
                  <Input
                    type="password"
                    value={nueva}
                    onChange={(e) => setNueva(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                </Field>
                <Field label="Confirmar contraseña" required>
                  <Input
                    type="password"
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    placeholder="Repite la contraseña"
                    required
                  />
                </Field>
                <Button type="submit" fullWidth loading={guardando} icon={<KeyRound className="h-4 w-4" />}>
                  Guardar cambios
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <Button
                variant="secondary"
                fullWidth
                icon={<LogOut className="h-4 w-4" />}
                onClick={async () => {
                  await logout();
                  navigate('/login', { replace: true });
                }}
              >
                Cerrar sesión
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Dato({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-ink-500">{label}</dt>
      <dd className="mt-0.5 font-medium text-ink-900">{value ?? '—'}</dd>
    </div>
  );
}
