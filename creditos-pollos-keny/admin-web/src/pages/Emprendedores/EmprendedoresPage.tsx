import { useState } from 'react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, RefreshCw, Search, UserPlus, Users } from 'lucide-react';
import { PageHeader, Loader, ErrorState, EmptyState } from '@/components/ui/Feedback';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Form';
import { Modal } from '@/components/ui/Modal';
import { ScoreBadge } from '@/components/ui/Badge';
import { useEmprendedores, useAccionesEmprendedor } from '@/hooks/queries';
import { mensajeError } from '@/api/client';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Actividad, Emprendedor } from '@/types';

const schema = z.object({
  nombre: z.string().min(3, 'El nombre es obligatorio'),
  cedula: z.string().min(5, 'Cédula inválida'),
  email: z.string().email('Correo inválido'),
  telefono: z.string().optional().or(z.literal('')),
  ubicacion: z.string().optional().or(z.literal('')),
  actividad: z.enum(['AVICOLA', 'PORCICOLA', 'MIXTA']),
  password: z.string().min(6, 'Mínimo 6 caracteres').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

export function EmprendedoresPage() {
  const [filtros, setFiltros] = useState<{ q?: string; actividad?: string }>({});
  const [busqueda, setBusqueda] = useState('');
  const [creando, setCreando] = useState(false);

  const { data, isLoading, isError, error } = useEmprendedores(filtros);
  const { crear, cambiarEstado, recalcularScore } = useAccionesEmprendedor();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { actividad: 'AVICOLA' } });

  const onSubmit = async (values: FormValues) => {
    try {
      const creado = await crear.mutateAsync({
        nombre: values.nombre,
        cedula: values.cedula,
        email: values.email,
        telefono: values.telefono || undefined,
        ubicacion: values.ubicacion || undefined,
        actividad: values.actividad as Actividad,
        password: values.password || undefined,
      });
      toast.success(`Emprendedor creado (clave temporal: ${creado.passwordTemporal})`, { duration: 8000 });
      setCreando(false);
      reset();
    } catch (err) {
      toast.error(mensajeError(err, 'No se pudo crear el emprendedor'));
    }
  };

  if (isLoading && !data) return <Loader label="Cargando emprendedores..." />;
  if (isError)
    return (
      <div className="p-8">
        <ErrorState message={(error as Error)?.message ?? 'No se pudieron cargar los emprendedores'} />
      </div>
    );

  const emprendedores = data ?? [];

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Emprendedores"
        subtitle="Productores avícolas y porcícolas registrados"
        actions={
          <Button icon={<UserPlus className="h-4 w-4" />} onClick={() => setCreando(true)}>
            Nuevo emprendedor
          </Button>
        }
      />

      {/* Filtros */}
      <Card className="mb-5">
        <CardContent className="p-4">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setFiltros({ q: busqueda || undefined });
            }}
            className="grid gap-3 md:grid-cols-[2fr_1fr_auto]"
          >
            <Field>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <Input
                  className="pl-10"
                  placeholder="Buscar por nombre, cédula o correo..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
            </Field>
            <Field>
              <Select
                value={filtros.actividad ?? ''}
                onChange={(e) => setFiltros((previo) => ({ ...previo, actividad: e.target.value || undefined }))}
              >
                <option value="">Todas las actividades</option>
                <option value="AVICOLA">🐔 Avícola</option>
                <option value="PORCICOLA">🐷 Porcícola</option>
                <option value="MIXTA">🐔🐷 Mixta</option>
              </Select>
            </Field>
            <Button type="submit" icon={<Search className="h-4 w-4" />}>
              Buscar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {emprendedores.length === 0 ? (
            <EmptyState
              title="Sin emprendedores"
              description="Registra el primer productor para comenzar"
              icon={<Users className="h-6 w-6" />}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-ink-100 bg-ink-50/60">
                  <tr>
                    <th className="th">Emprendedor</th>
                    <th className="th">Actividad</th>
                    <th className="th">Score</th>
                    <th className="th">Créditos</th>
                    <th className="th">Solicitado / Pagado</th>
                    <th className="th">Registro</th>
                    <th className="th text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {emprendedores.map((emp: Emprendedor) => (
                    <tr key={emp.id} className="transition hover:bg-ink-50/60">
                      <td className="td">
                        <p className="font-medium text-ink-900">{emp.nombre}</p>
                        <p className="text-xs text-ink-400">
                          {emp.cedula} · {emp.email}
                        </p>
                      </td>
                      <td className="td">
                        <span className="chip bg-ink-100 text-ink-600">
                          {emp.actividad === 'AVICOLA' ? '🐔' : emp.actividad === 'PORCICOLA' ? '🐷' : '🐔🐷'}{' '}
                          {emp.actividad}
                        </span>
                      </td>
                      <td className="td">
                        <ScoreBadge score={emp.score_crediticio} />
                      </td>
                      <td className="td">
                        <p className="text-sm">
                          <span className="font-semibold text-ink-900">{emp.creditos_activos ?? 0}</span> activos
                        </p>
                        <p className="text-xs text-ink-400">
                          {emp.creditos_pagados ?? 0} pagados ·{' '}
                          <span className={Number(emp.creditos_mora ?? 0) > 0 ? 'text-rose-500' : ''}>
                            {emp.creditos_mora ?? 0} en mora
                          </span>
                        </p>
                      </td>
                      <td className="td">
                        <p className="text-sm font-semibold text-ink-900">
                          {formatCurrency(emp.monto_solicitado)}
                        </p>
                        <p className="text-xs text-emerald-600">{formatCurrency(emp.monto_pagado)} pagado</p>
                      </td>
                      <td className="td text-xs text-ink-500">{formatDate(emp.fecha_registro)}</td>
                      <td className="td">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Recalcular score"
                            loading={recalcularScore.isPending}
                            onClick={async () => {
                              try {
                                const resultado = await recalcularScore.mutateAsync(emp.id);
                                toast.success(`Score actualizado: ${resultado.score}`);
                              } catch (err) {
                                toast.error(mensajeError(err, 'No se pudo recalcular'));
                              }
                            }}
                            icon={<RefreshCw className="h-3.5 w-3.5" />}
                          />
                          <Button
                            size="sm"
                            variant={Number(emp.activo) ? 'secondary' : 'success'}
                            onClick={async () => {
                              try {
                                await cambiarEstado.mutateAsync({ id: emp.id, activo: !Number(emp.activo) });
                                toast.success(
                                  Number(emp.activo) ? 'Emprendedor desactivado' : 'Emprendedor activado'
                                );
                              } catch (err) {
                                toast.error(mensajeError(err, 'No se pudo cambiar el estado'));
                              }
                            }}
                          >
                            {Number(emp.activo) ? 'Desactivar' : 'Activar'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal crear */}
      <Modal
        open={creando}
        onClose={() => setCreando(false)}
        title="Nuevo emprendedor"
        description="Se creará automáticamente su usuario con rol EMPRENDEDOR"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreando(false)}>
              Cancelar
            </Button>
            <Button
              form="form-emprendedor"
              type="submit"
              loading={crear.isPending}
              icon={<Plus className="h-4 w-4" />}
            >
              Crear emprendedor
            </Button>
          </>
        }
      >
        <form id="form-emprendedor" onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre completo" required error={errors.nombre?.message} className="sm:col-span-2">
            <Input placeholder="María Rodríguez" {...register('nombre')} />
          </Field>
          <Field label="Cédula / RIF" required error={errors.cedula?.message}>
            <Input placeholder="V-12345678" {...register('cedula')} />
          </Field>
          <Field label="Correo electrónico" required error={errors.email?.message}>
            <Input type="email" placeholder="correo@ejemplo.com" {...register('email')} />
          </Field>
          <Field label="Teléfono" error={errors.telefono?.message}>
            <Input placeholder="+58 412-0000000" {...register('telefono')} />
          </Field>
          <Field label="Actividad" required>
            <Select {...register('actividad')}>
              <option value="AVICOLA">🐔 Avícola</option>
              <option value="PORCICOLA">🐷 Porcícola</option>
              <option value="MIXTA">🐔🐷 Mixta</option>
            </Select>
          </Field>
          <Field label="Ubicación" error={errors.ubicacion?.message} className="sm:col-span-2">
            <Input placeholder="Barquisimeto, Lara" {...register('ubicacion')} />
          </Field>
          <Field
            label="Contraseña temporal"
            error={errors.password?.message}
            hint="Si la dejas vacía se genera automáticamente"
            className="sm:col-span-2"
          >
            <Input type="text" placeholder="Opcional" {...register('password')} />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
