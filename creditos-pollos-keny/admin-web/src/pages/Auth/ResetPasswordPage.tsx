import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ShieldCheck } from 'lucide-react';
import { authApi } from '@/api/endpoints';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Form';
import { mensajeError } from '@/api/client';

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [loading, setLoading] = useState(false);

  const token = params.get('token') ?? '';
  const id = params.get('id') ?? '';

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirmar) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(token, id, password);
      toast.success('Contraseña actualizada. Ya puedes ingresar.');
      navigate('/login');
    } catch (error) {
      toast.error(mensajeError(error, 'No se pudo actualizar la contraseña'));
    } finally {
      setLoading(false);
    }
  };

  if (!token || !id) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50 p-6">
        <div className="card max-w-md p-8 text-center">
          <h2 className="text-xl font-bold text-ink-900">Enlace inválido</h2>
          <p className="mt-2 text-sm text-ink-600">
            El enlace de recuperación no es válido. Solicita uno nuevo.
          </p>
          <Link to="/recuperar" className="mt-6 inline-block">
            <Button>Solicitar nuevo enlace</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-ink-50 p-6">
      <div className="card w-full max-w-md p-8">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900">
          <ShieldCheck className="h-7 w-7 text-white" />
        </div>

        <h2 className="text-center text-xl font-bold text-ink-900">Nueva contraseña</h2>
        <p className="mt-1 text-center text-sm text-ink-500">Elige una contraseña segura</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field label="Nueva contraseña" required>
            <Input
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
          <Field label="Confirmar contraseña" required>
            <Input
              type="password"
              placeholder="Repite la contraseña"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              required
            />
          </Field>
          <Button type="submit" fullWidth loading={loading}>
            Guardar contraseña
          </Button>
        </form>
      </div>
    </div>
  );
}
