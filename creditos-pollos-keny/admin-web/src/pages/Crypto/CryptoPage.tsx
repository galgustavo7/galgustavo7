import { useState } from 'react';
import { toast } from 'sonner';
import { Bitcoin, Plus, Trash2, TrendingDown, TrendingUp, WifiOff } from 'lucide-react';
import { PageHeader, Loader, ErrorState, EmptyState } from '@/components/ui/Feedback';
import { Card, CardContent, CardHeader, CardTitle, CardSubtitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Form';
import { Modal } from '@/components/ui/Modal';
import { useCarteraCrypto, useAccionesCrypto } from '@/hooks/queries';
import { mensajeError } from '@/api/client';
import { cx, formatCurrency, formatNumber, formatPercent } from '@/lib/format';

export function CryptoPage() {
  const { data, isLoading, isError, error } = useCarteraCrypto();
  const { agregar, eliminar } = useAccionesCrypto();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ simbolo: '', nombre: '', cantidad: '', precioCompra: '' });

  if (isLoading) return <Loader label="Consultando precios..." />;
  if (isError || !data)
    return (
      <div className="p-8">
        <ErrorState message={(error as Error)?.message ?? 'No se pudo cargar la cartera'} />
      </div>
    );

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await agregar.mutateAsync({
        simbolo: form.simbolo.toUpperCase(),
        nombre: form.nombre || undefined,
        cantidad: Number(form.cantidad),
        precioCompra: Number(form.precioCompra),
      });
      toast.success('Activo agregado a la cartera');
      setModal(false);
      setForm({ simbolo: '', nombre: '', cantidad: '', precioCompra: '' });
    } catch (err) {
      toast.error(mensajeError(err, 'No se pudo agregar el activo'));
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Portfolio Crypto"
        subtitle="Inversiones del negocio valorizadas en tiempo real"
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setModal(true)}>
            Agregar activo
          </Button>
        }
      />

      {/* Resumen */}
      <Card className="mb-5 overflow-hidden border-0 bg-gradient-to-br from-brand-800 via-brand-900 to-ink-900 text-white">
        <CardContent className="p-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="flex items-center gap-2 text-sm text-white/70">
                <Bitcoin className="h-4 w-4" /> Valor total de la cartera
              </p>
              <p className="mt-2 text-4xl font-bold">{formatCurrency(data.resumen.valorTotal, 2)}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span
                  className={cx(
                    'chip',
                    data.resumen.ganancia >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-200'
                  )}
                >
                  {data.resumen.ganancia >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  {formatPercent(data.resumen.gananciaPorcentaje)} ({formatCurrency(data.resumen.ganancia, 2)})
                </span>
                <span className="chip bg-white/10 text-white/80">
                  Costo {formatCurrency(data.resumen.costoTotal, 2)}
                </span>
                <span className="chip bg-white/10 text-white/80">
                  24h {formatPercent(data.resumen.variacion24h)}
                </span>
              </div>
            </div>

            <div className="text-right text-sm text-white/60">
              <p className="flex items-center justify-end gap-1.5">
                {data.fuente === 'binance' ? (
                  <>
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Precios en vivo (Binance)
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3.5 w-3.5" /> Precios en caché (sin conexión a Binance)
                  </>
                )}
              </p>
              <p className="mt-1 text-xs">
                Actualizado: {new Date(data.actualizadoEn).toLocaleTimeString('es-VE')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Activos */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Activos en cartera</CardTitle>
              <CardSubtitle>{data.activos.length} posiciones registradas</CardSubtitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {data.activos.length === 0 ? (
              <EmptyState
                title="Cartera vacía"
                description="Agrega tus primeras posiciones de BTC, ETH, SOL..."
                icon={<Bitcoin className="h-6 w-6" />}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-ink-100 bg-ink-50/60">
                    <tr>
                      <th className="th">Activo</th>
                      <th className="th">Cantidad</th>
                      <th className="th">Precio actual</th>
                      <th className="th">Valor</th>
                      <th className="th">Ganancia</th>
                      <th className="th text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {data.activos.map((activo) => (
                      <tr key={activo.id} className="transition hover:bg-ink-50/60">
                        <td className="td">
                          <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-900 text-xs font-bold text-white">
                              {activo.simbolo.slice(0, 3)}
                            </span>
                            <div>
                              <p className="font-medium text-ink-900">{activo.simbolo}</p>
                              <p className="text-xs text-ink-400">{activo.nombre}</p>
                            </div>
                          </div>
                        </td>
                        <td className="td">{formatNumber(activo.cantidad, 4)}</td>
                        <td className="td">
                          {formatCurrency(activo.precioActual, 2)}
                          <p
                            className={cx(
                              'text-xs',
                              activo.variacion24h >= 0 ? 'text-emerald-600' : 'text-rose-600'
                            )}
                          >
                            {activo.variacion24h >= 0 ? '▲' : '▼'} {formatPercent(activo.variacion24h)}
                          </p>
                        </td>
                        <td className="td font-semibold text-ink-900">{formatCurrency(activo.valor, 2)}</td>
                        <td className="td">
                          <span
                            className={cx(
                              'font-semibold',
                              activo.ganancia >= 0 ? 'text-emerald-600' : 'text-rose-600'
                            )}
                          >
                            {formatCurrency(activo.ganancia, 2)}
                          </span>
                          <p className="text-xs text-ink-400">{formatPercent(activo.gananciaPorcentaje)}</p>
                        </td>
                        <td className="td text-right">
                          <button
                            onClick={async () => {
                              try {
                                await eliminar.mutateAsync(activo.id);
                                toast.success('Activo eliminado');
                              } catch (err) {
                                toast.error(mensajeError(err, 'No se pudo eliminar'));
                              }
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-ink-200 text-ink-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                            title="Eliminar"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mercado */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Mercado</CardTitle>
              <CardSubtitle>Precios de referencia</CardSubtitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.mercado.map((precio) => (
              <div
                key={precio.simbolo}
                className="flex items-center justify-between rounded-xl border border-ink-100 px-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-semibold text-ink-900">{precio.simbolo.replace('USDT', '')}</p>
                  <p className="text-xs text-ink-400">{precio.nombre}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-ink-900">{formatCurrency(precio.precio, 2)}</p>
                  <p
                    className={cx(
                      'text-xs',
                      Number(precio.variacion24h) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    )}
                  >
                    {formatPercent(Number(precio.variacion24h))}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Modal agregar */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Agregar activo"
        description="Registra una posición de la cartera"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>
              Cancelar
            </Button>
            <Button form="form-crypto" type="submit" loading={agregar.isPending} icon={<Plus className="h-4 w-4" />}>
              Agregar
            </Button>
          </>
        }
      >
        <form id="form-crypto" onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Símbolo" required hint="Ej: BTC, ETH, SOL">
            <Input
              placeholder="BTC"
              value={form.simbolo}
              onChange={(e) => setForm({ ...form, simbolo: e.target.value })}
              required
            />
          </Field>
          <Field label="Nombre">
            <Input
              placeholder="Bitcoin"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
          </Field>
          <Field label="Cantidad" required>
            <Input
              type="number"
              step="any"
              placeholder="0.125"
              value={form.cantidad}
              onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
              required
            />
          </Field>
          <Field label="Precio de compra (USD)" required>
            <Input
              type="number"
              step="any"
              placeholder="58000"
              value={form.precioCompra}
              onChange={(e) => setForm({ ...form, precioCompra: e.target.value })}
              required
            />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
