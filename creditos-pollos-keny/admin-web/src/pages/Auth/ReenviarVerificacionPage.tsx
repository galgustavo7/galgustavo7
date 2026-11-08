import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, Send } from 'lucide-react';
import { authApi } from '@/api/endpoints';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Form';
import { mensajeError } from '@/api/client';

export function ReenviarVerificacionPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await authApi.reenviarVerificacion(email.trim());
      setEnviado(true);
      toast.success('Te enviamos un nuevo enlace de verificación');
    } catch (error) {
      toast.error(mensajeError(error, 'No se pudo enviar el correo'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-ink-50 p-6">
      <div className="card w-full max-w-md p-8">
        {!enviado ? (
          <>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500 to-accent-700">
              <Send className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-center text-xl font-bold text-ink-900">Reenviar verificación</h2>
            <p className="mt-1 text-center text-sm text-ink-500">
              Ingresa tu correo y te enviaremos un nuevo enlace
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
                Reenviar correo
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
            <h2 className="mt-4 text-xl font-bold text-ink-900">¡Correo enviado!</h2>
            <p className="mt-2 text-sm text-ink-600">Revisa tu bandeja de entrada y haz clic en el enlace.</p>
            <Link to="/login" className="mt-6 inline-block">
              <Button>Ir al login</Button>
            </Link>
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
