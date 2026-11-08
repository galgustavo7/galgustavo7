import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, Mail, XCircle } from 'lucide-react';
import { authApi } from '@/api/endpoints';
import { Button } from '@/components/ui/Button';
import { mensajeError } from '@/api/client';

type Estado = 'verificando' | 'exitoso' | 'error';

export function VerificarEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [estado, setEstado] = useState<Estado>('verificando');
  const [mensaje, setMensaje] = useState('');

  const token = params.get('token');
  const id = params.get('id');

  useEffect(() => {
    const verificar = async () => {
      if (!token || !id) {
        setEstado('error');
        setMensaje('El enlace de verificación es inválido');
        return;
      }

      try {
        const data = await authApi.verificarEmail(token, id);
        setEstado('exitoso');
        setMensaje(data.mensaje ?? 'Correo verificado correctamente');
        setTimeout(() => navigate('/login'), 4000);
      } catch (error) {
        setEstado('error');
        setMensaje(mensajeError(error, 'No se pudo verificar el correo'));
      }
    };

    void verificar();
  }, [token, id, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-ink-50 p-6">
      <div className="card w-full max-w-md p-8 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500 to-accent-700">
          <Mail className="h-8 w-8 text-white" />
        </div>

        {estado === 'verificando' && (
          <>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-brand-600" />
            <h2 className="mt-4 text-xl font-bold text-ink-900">Verificando tu correo...</h2>
            <p className="mt-1 text-sm text-ink-500">Un momento por favor</p>
          </>
        )}

        {estado === 'exitoso' && (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
            <h2 className="mt-4 text-xl font-bold text-ink-900">¡Correo verificado!</h2>
            <p className="mt-2 text-sm text-ink-600">{mensaje}</p>
            <Link to="/login" className="mt-6 inline-block">
              <Button>Ir al login</Button>
            </Link>
            <p className="mt-3 text-xs text-ink-400">Serás redirigido automáticamente...</p>
          </>
        )}

        {estado === 'error' && (
          <>
            <XCircle className="mx-auto h-12 w-12 text-rose-500" />
            <h2 className="mt-4 text-xl font-bold text-ink-900">No se pudo verificar</h2>
            <p className="mt-2 text-sm text-ink-600">{mensaje}</p>
            <div className="mt-6 flex flex-col gap-2">
              <Link to="/reenviar-verificacion">
                <Button fullWidth>Solicitar un nuevo enlace</Button>
              </Link>
              <Link to="/login">
                <Button variant="ghost" fullWidth>
                  Volver al login
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
