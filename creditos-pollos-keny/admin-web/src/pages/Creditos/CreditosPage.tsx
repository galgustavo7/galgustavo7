import { useState } from 'react';
import { toast } from 'sonner';
import {
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  PackageCheck,
  Plus,
  Search,
  Wallet,
  XCircle,
} from 'lucide-react';
import { PageHeader, Loader, ErrorState, EmptyState } from '@/components/ui/Feedback';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Form';
import { Modal } from '@/components/ui/Modal';
import { EstadoBadge, TipoBadge } from '@/components/ui/Badge';
import { CreditoDetalle } from '@/components/creditos/CreditoDetalle';
import { PagoModal } from '@/components/creditos/PagoModal';
import { useCreditos, useAccionesCredito } from '@/hooks/queries';
import { creditosApi, type FiltrosCreditos } from '@/api/endpoints';
import { mensajeError } from '@/api/client';
import { ESTADO_CONFIG, formatCurrency, formatDate, formatNumber, daysUntil } from '@/lib/format';
import type { Credito, EstadoCredito, TipoCredito } from '@/types';

export function CreditosPage() {
  const [filtros, setFiltros] = useState<FiltrosCreditos>({ page: 1, limit: 10 });
  const [busqueda, setBusqueda] = useState('');
  const [detalle, setDetalle] = useState<Credito | null>(null);
  const [rechazo, setRechazo] = useState<Credito | null>(null);
  const [motivo, setMotivo] = useState('');
  const [pago, setPago] = useState<Credito | null>(null);

  const { data, isLoading, isError, error } = useCreditos(filtros);
  const { aprobar, rechazar, entregar, cancelar } = useAccionesCredito();

  const aplicarBusqueda = (event: React.FormEvent) => {
    event.preventDefault();
    setFiltros((previo) => ({ ...previo, q: busqueda || undefined, page: 1 }));
  };

  const cambiarPagina = (page: number) => setFiltros((previo) => ({ ...previo, page }));

  const ejecutar = async (accion: () => Promise<unknown>, mensaje: string) => {
    try {
      await accion();
      toast.success(mensaje);
      setDetalle(null);
    } catch (err) {
      toast.error(mensajeError(err, 'No se pudo completar la acción'));
    }
  };

  if (isLoading && !data) return <Loader label="Cargando créditos..." />;
  if (isError)
    return (
      <div className="p-8">
        <ErrorState message={(error as Error)?.message ?? 'No se pudieron cargar los créditos'} />
      </div>
    );

  const creditos = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Créditos"
        subtitle="Gestiona solicitudes, aprobaciones, entregas y pagos"
        actions={
          <span className="chip bg-brand-50 text-brand-700">
            {meta?.total ?? 0} crédito(s) en total
          </span>
        }
      />

      {/* Filtros */}
      <Card className="mb-5">
        <CardContent className="p-4">
          <form onSubmit={aplicarBusqueda} className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto]">
            <Field>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <Input
                  className="pl-10"
                  placeholder="Buscar por emprendedor, cédula o factura..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
            </Field>

            <Field>
              <Select
                value={filtros.estado ?? ''}
                onChange={(e) =>
                  setFiltros((previo) => ({
                    ...previo,
                    estado: (e.target.value || undefined) as EstadoCredito | undefined,
                    page: 1,
                  }))
                }
              >
                <option value="">Todos los estados</option>
                {Object.entries(ESTADO_CONFIG).map(([valor, config]) => (
                  <option key={valor} value={valor}>
                    {config.emoji} {config.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field>
              <Select
                value={filtros.tipo ?? ''}
                onChange={(e) =>
                  setFiltros((previo) => ({
                    ...previo,
                    tipo: (e.target.value || undefined) as TipoCredito | undefined,
                    page: 1,
                  }))
                }
              >
                <option value="">Todos los tipos</option>
                <option value="POLLOS">🐔 Pollos</option>
                <option value="CERDOS">🐷 Cerdos</option>
              </Select>
            </Field>

            <Button type="submit" icon={<Search className="h-4 w-4" />}>
              Filtrar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          {creditos.length === 0 ? (
            <EmptyState
              title="No hay créditos"
              description="Ajusta los filtros o espera nuevas solicitudes"
              icon={<Plus className="h-6 w-6" />}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-ink-100 bg-ink-50/60">
                  <tr>
                    <th className="th">Emprendedor</th>
                    <th className="th">Detalle</th>
                    <th className="th">Monto</th>
                    <th className="th">Saldo</th>
                    <th className="th">Vencimiento</th>
                    <th className="th">Estado</th>
                    <th className="th text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {creditos.map((credito) => {
                    const dias = daysUntil(credito.fecha_vencimiento);
                    const vencido = dias < 0 && !['PAGADO', 'RECHAZADO', 'CANCELADO'].includes(credito.estado);

                    return (
                      <tr key={credito.id} className="transition hover:bg-ink-50/60">
                        <td className="td">
                          <p className="font-medium text-ink-900">{credito.emprendedor_nombre}</p>
                          <p className="text-xs text-ink-400">{formatDate(credito.fecha_solicitud)}</p>
                        </td>
                        <td className="td">
                          <TipoBadge tipo={credito.tipo} />
                          <p className="mt-1 text-xs text-ink-500">
                            {formatNumber(credito.cantidad)} unidades
                          </p>
                        </td>
                        <td className="td font-semibold text-ink-900">
                          {formatCurrency(credito.monto_total)}
                          <p className="text-xs font-normal text-ink-400">
                            +{formatCurrency(credito.totales?.intereses, 2)} interés
                          </p>
                        </td>
                        <td className="td">
                          <span
                            className={
                              Number(credito.totales?.saldoPendiente) > 0
                                ? 'font-semibold text-rose-600'
                                : 'font-semibold text-emerald-600'
                            }
                          >
                            {formatCurrency(credito.totales?.saldoPendiente, 2)}
                          </span>
                        </td>
                        <td className="td">
                          {formatDate(credito.fecha_vencimiento)}
                          <p className={`text-xs ${vencido ? 'text-rose-500' : 'text-ink-400'}`}>
                            {vencido ? `Vencido (${Math.abs(dias)}d)` : `${dias} día(s)`}
                          </p>
                        </td>
                        <td className="td">
                          <EstadoBadge estado={credito.estado} />
                        </td>
                        <td className="td">
                          <div className="flex flex-wrap justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setDetalle(credito)}
                              icon={<Eye className="h-3.5 w-3.5" />}
                            >
                              Ver
                            </Button>

                            {credito.estado === 'SOLICITADO' && (
                              <>
                                <Button
                                  size="sm"
                                  loading={aprobar.isPending}
                                  onClick={() =>
                                    ejecutar(() => aprobar.mutateAsync(credito.id), 'Crédito aprobado y factura enviada')
                                  }
                                  icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                                >
                                  Aprobar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={() => {
                                    setRechazo(credito);
                                    setMotivo('');
                                  }}
                                  icon={<XCircle className="h-3.5 w-3.5" />}
                                >
                                  Rechazar
                                </Button>
                              </>
                            )}

                            {credito.estado === 'APROBADO' && (
                              <Button
                                size="sm"
                                variant="warning"
                                loading={entregar.isPending}
                                onClick={() =>
                                  ejecutar(() => entregar.mutateAsync(credito.id), 'Crédito marcado como entregado')
                                }
                                icon={<PackageCheck className="h-3.5 w-3.5" />}
                              >
                                Entregar
                              </Button>
                            )}

                            {['APROBADO', 'ENTREGADO', 'MORA'].includes(credito.estado) && (
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() => setPago(credito)}
                                icon={<Wallet className="h-3.5 w-3.5" />}
                              >
                                Pago
                              </Button>
                            )}

                            {credito.factura_numero && (
                              <a
                                href={creditosApi.urlFactura(credito.id)}
                                target="_blank"
                                rel="noreferrer"
                                title="Descargar factura"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-ink-200 text-ink-500 transition hover:bg-ink-50 hover:text-brand-700"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </a>
                            )}

                            {!['PAGADO', 'CANCELADO'].includes(credito.estado) && (
                              <button
                                onClick={() =>
                                  ejecutar(
                                    () => cancelar.mutateAsync({ id: credito.id, motivo: 'Cancelado desde el panel' }),
                                    'Crédito cancelado'
                                  )
                                }
                                title="Cancelar crédito"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-ink-200 text-ink-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                              >
                                <Ban className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginación */}
          {meta && meta.paginas > 1 && (
            <div className="flex items-center justify-between border-t border-ink-100 px-4 py-3">
              <p className="text-sm text-ink-500">
                Página {meta.page} de {meta.paginas} · {meta.total} registros
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={meta.page <= 1}
                  onClick={() => cambiarPagina(meta.page - 1)}
                  icon={<ChevronLeft className="h-4 w-4" />}
                >
                  Anterior
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={meta.page >= meta.paginas}
                  onClick={() => cambiarPagina(meta.page + 1)}
                >
                  Siguiente <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal detalle */}
      <Modal
        open={Boolean(detalle)}
        onClose={() => setDetalle(null)}
        size="lg"
        title={`Crédito ${detalle?.factura_numero ?? ''}`}
        description={detalle?.emprendedor_nombre}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDetalle(null)}>
              Cerrar
            </Button>
            {detalle && ['APROBADO', 'ENTREGADO', 'MORA'].includes(detalle.estado) && (
              <Button
                variant="success"
                onClick={() => {
                  const credito = detalle;
                  setDetalle(null);
                  setPago(credito);
                }}
                icon={<Wallet className="h-4 w-4" />}
              >
                Registrar pago
              </Button>
            )}
          </>
        }
      >
        {detalle && <CreditoDetalle credito={detalle} onRegistrarPago={() => { setPago(detalle); setDetalle(null); }} />}
      </Modal>

      {/* Modal rechazo */}
      <Modal
        open={Boolean(rechazo)}
        onClose={() => setRechazo(null)}
        title="Rechazar solicitud"
        description={rechazo ? `${rechazo.emprendedor_nombre} · ${formatCurrency(rechazo.monto_total)}` : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRechazo(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              loading={rechazar.isPending}
              onClick={async () => {
                if (!rechazo) return;
                if (motivo.trim().length < 5) {
                  toast.error('Indica el motivo del rechazo');
                  return;
                }
                await ejecutar(() => rechazar.mutateAsync({ id: rechazo.id, motivo }), 'Solicitud rechazada');
                setRechazo(null);
              }}
            >
              Rechazar solicitud
            </Button>
          </>
        }
      >
        <Field label="Motivo del rechazo" required hint="Se enviará por correo al emprendedor">
          <Textarea
            rows={4}
            placeholder="Ej: El score crediticio actual no cubre el monto solicitado"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
        </Field>
      </Modal>

      <PagoModal credito={pago} open={Boolean(pago)} onClose={() => setPago(null)} />
    </div>
  );
}
