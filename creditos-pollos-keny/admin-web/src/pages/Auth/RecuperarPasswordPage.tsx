import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, KeyRound, MailCheck } from 'lucide-react';
import { authApi } from '@/api/endpoints';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Form';
import { mensajeError } from '@/api/client';

export function RecuperarPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await authApi.recuperar(email.trim());
      setEnviado(true);
      toast.success('Revisa tu correo para continuar');
    } catch (error) {
      toast.error(mensajeError(error, 'No se pudo enviar el correo'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-ink-50 p-6">
      <div className="card w-full max-w-md p-8">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900">
          <KeyRound className="h-7 w-7 text-white" />
        </div>

        {!enviado ? (
          <>
            <h2 className="text-center text-xl font-bold text-ink-900">Recuperar contraseña</h2>
            <p className="mt-1 text-center text-sm text-ink-500">
              Te enviaremos un enlace para crear una nueva contraseña
            </p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <Field label="Correo electrónico" required>
                <Input
                  type="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>
              <Button type="submit" fullWidth loading={loading}>
                Enviar enlace
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <MailCheck className="mx-auto h-12 w-12 text-emerald-500" />
            <h2 className="mt-4 text-xl font-bold text-ink-900">¡Listo!</h2>
            <p className="mt-2 text-sm text-ink-600">
              Si el correo está registrado recibirás un enlace válido por 60 minutos.
            </p>
          </div>
        )}

        <Link
          to="/login"
          className="mt-6 flex items-center justify-center gap-2 text-sm text-brand-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al login
        </Link>
      </div>
    </div>
  );
}
