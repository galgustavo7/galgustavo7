import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Egg, MailCheck } from 'lucide-react';
import { authApi } from '@/api/endpoints';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Form';
import { mensajeError } from '@/api/client';
import type { Actividad } from '@/types';

const schema = z
  .object({
    nombre: z.string().min(3, 'Tu nombre completo es obligatorio'),
    email: z.string().email('Correo inválido'),
    cedula: z.string().min(5, 'Cédula inválida'),
    telefono: z.string().min(6, 'Teléfono inválido').optional().or(z.literal('')),
    ubicacion: z.string().optional().or(z.literal('')),
    actividad: z.enum(['AVICOLA', 'PORCICOLA', 'MIXTA']),
    password: z.string().min(6, 'Mínimo 6 caracteres'),
    confirmar: z.string(),
  })
  .refine((data) => data.password === data.confirmar, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmar'],
  });

type FormValues = z.infer<typeof schema>;

export function RegistroPage() {
  const navigate = useNavigate();
  const [enviado, setEnviado] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { actividad: 'AVICOLA' } });

  const onSubmit = async (values: FormValues) => {
    try {
      await authApi.registro({
        nombre: values.nombre,
        email: values.email,
        password: values.password,
        cedula: values.cedula,
        telefono: values.telefono || undefined,
        ubicacion: values.ubicacion || undefined,
        actividad: values.actividad as Actividad,
      });
      setEnviado(true);
      toast.success('Cuenta creada. Revisa tu correo para verificarla.');
    } catch (error) {
      toast.error(mensajeError(error, 'No se pudo completar el registro'));
    }
  };

  if (enviado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-ink-50 p-6">
        <div className="card w-full max-w-md p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
            <MailCheck className="h-8 w-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-ink-900">¡Revisa tu correo!</h2>
          <p className="mt-2 text-sm text-ink-600">
            Te enviamos un enlace de verificación. Si no lo ves en tu bandeja, revisa la carpeta de
            spam o solicita uno nuevo.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button onClick={() => navigate('/login')}>Ir al login</Button>
            <Button variant="ghost" onClick={() => navigate('/reenviar-verificacion')}>
              Reenviar correo de verificación
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-accent-50 p-6">
      <div className="w-full max-w-2xl">
        <Link to="/login" className="mb-6 inline-flex items-center gap-2 text-sm text-ink-500 hover:text-ink-800">
          <ArrowLeft className="h-4 w-4" /> Volver al login
        </Link>

        <div className="card p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 text-xl">
              🐔
            </div>
            <div>
              <h1 className="text-2xl font-bold text-ink-900">Crear cuenta de emprendedor</h1>
              <p className="text-sm text-ink-500">Solicita créditos para tu producción avícola o porcícola</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre completo" required error={errors.nombre?.message} className="sm:col-span-2">
              <Input placeholder="María Rodríguez" {...register('nombre')} />
            </Field>

            <Field label="Correo electrónico" required error={errors.email?.message}>
              <Input type="email" placeholder="tu@correo.com" {...register('email')} />
            </Field>

            <Field label="Cédula / RIF" required error={errors.cedula?.message}>
              <Input placeholder="V-12345678" {...register('cedula')} />
            </Field>

            <Field label="Teléfono" error={errors.telefono?.message}>
              <Input placeholder="+58 412-0000000" {...register('telefono')} />
            </Field>

            <Field label="Actividad principal" required>
              <Select {...register('actividad')}>
                <option value="AVICOLA">🐔 Avícola</option>
                <option value="PORCICOLA">🐷 Porcícola</option>
                <option value="MIXTA">🐔🐷 Mixta</option>
              </Select>
            </Field>

            <Field label="Ubicación de la granja" className="sm:col-span-2" error={errors.ubicacion?.message}>
              <Textarea rows={2} placeholder="Barquisimeto, Lara" {...register('ubicacion')} />
            </Field>

            <Field label="Contraseña" required error={errors.password?.message}>
              <Input type="password" placeholder="Mínimo 6 caracteres" {...register('password')} />
            </Field>

            <Field label="Confirmar contraseña" required error={errors.confirmar?.message}>
              <Input type="password" placeholder="Repite tu contraseña" {...register('confirmar')} />
            </Field>

            <div className="sm:col-span-2">
              <Button type="submit" size="lg" fullWidth loading={isSubmitting} icon={<Egg className="h-4 w-4" />}>
                Crear mi cuenta
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
