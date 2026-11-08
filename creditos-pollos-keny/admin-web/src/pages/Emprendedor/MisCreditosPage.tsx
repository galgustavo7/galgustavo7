import { useState } from 'react';
import { Download, Eye, Wallet } from 'lucide-react';
import { PageHeader, Loader, ErrorState, EmptyState } from '@/components/ui/Feedback';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EstadoBadge, TipoBadge } from '@/components/ui/Badge';
import { CreditoDetalle } from '@/components/creditos/CreditoDetalle';
import { PagoModal } from '@/components/creditos/PagoModal';
import { useCreditos } from '@/hooks/queries';
import { creditosApi } from '@/api/endpoints';
import { formatCurrency, formatDate, formatNumber, formatPercent, daysUntil } from '@/lib/format';
import type { Credito } from '@/types';

export function MisCreditosPage() {
  const { data, isLoading, isError, error } = useCreditos({ page: 1, limit: 50 });
  const [detalle, setDetalle] = useState<Credito | null>(null);
  const [pago, setPago] = useState<Credito | null>(null);

  if (isLoading) return <Loader label="Cargando tus créditos..." />;
  if (isError) return <ErrorState message={(error as Error)?.message ?? 'No se pudieron cargar tus créditos'} />;

  const creditos = data?.data ?? [];

  return (
    <div>
      <PageHeader title="Mis créditos" subtitle="Historial completo de tus solicitudes" />

      {creditos.length === 0 ? (
        <Card>
          <EmptyState
            title="Aún no tienes créditos"
            description="Solicita tu primer crédito y haz crecer tu producción"
            action={
              <a href="/solicitar">
                <Button>Solicitar crédito</Button>
              </a>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {creditos.map((credito) => {
            const dias = daysUntil(credito.fecha_vencimiento);
            const vencido = dias < 0 && !['PAGADO', 'RECHAZADO', 'CANCELADO'].includes(credito.estado);

            return (
              <Card key={credito.id} className="flex flex-col transition hover:shadow-lift">
                <CardContent className="flex-1 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <TipoBadge tipo={credito.tipo} />
                      <p className="mt-2 text-sm text-ink-500">
                        {formatNumber(credito.cantidad)} unidades · {formatDate(credito.fecha_solicitud)}
                      </p>
                    </div>
                    <EstadoBadge estado={credito.estado} />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-ink-500">Total a pagar</p>
                      <p className="text-lg font-bold text-ink-900">
                        {formatCurrency(credito.totales?.totalPagar, 2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-500">Saldo</p>
                      <p
                        className={`text-lg font-bold ${
                          Number(credito.totales?.saldoPendiente) > 0 ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {formatCurrency(credito.totales?.saldoPendiente, 2)}
                      </p>
                    </div>
                  </div>

                  {/* Progreso */}
                  <div className="mt-4">
                    <div className="mb-1 flex items-center justify-between text-xs text-ink-500">
                      <span>Pagado {formatPercent(credito.totales?.porcentajePagado)}</span>
                      <span className={vencido ? 'text-rose-600' : ''}>
                        {vencido ? `Vencido hace ${Math.abs(dias)}d` : `Vence en ${dias}d`}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100">
                      <div
                        className={`h-full rounded-full ${
                          Number(credito.totales?.porcentajePagado) >= 100 ? 'bg-emerald-500' : 'bg-brand-600'
                        }`}
                        style={{ width: `${Math.min(100, Number(credito.totales?.porcentajePagado ?? 0))}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setDetalle(credito)}
                      icon={<Eye className="h-3.5 w-3.5" />}
                    >
                      Detalle
                    </Button>

                    {['APROBADO', 'ENTREGADO', 'MORA'].includes(credito.estado) &&
                      Number(credito.totales?.saldoPendiente) > 0 && (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => setPago(credito)}
                          icon={<Wallet className="h-3.5 w-3.5" />}
                        >
                          Pagar
                        </Button>
                      )}

                    {credito.factura_numero && (
                      <a
                        href={creditosApi.urlFactura(credito.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 transition hover:bg-ink-50"
                      >
                        <Download className="h-3.5 w-3.5" /> Factura
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={Boolean(detalle)}
        onClose={() => setDetalle(null)}
        size="lg"
        title={`Crédito ${detalle?.factura_numero ?? detalle?.tipo ?? ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDetalle(null)}>
              Cerrar
            </Button>
            {detalle && Number(detalle.totales?.saldoPendiente) > 0 && (
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
        {detalle && (
          <CreditoDetalle
            credito={detalle}
            mostrarEmprendedor={false}
            onRegistrarPago={() => {
              setPago(detalle);
              setDetalle(null);
            }}
          />
        )}
      </Modal>

      <PagoModal credito={pago} open={Boolean(pago)} onClose={() => setPago(null)} />
    </div>
  );
}
