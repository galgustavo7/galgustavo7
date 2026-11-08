import { Download, FileText } from 'lucide-react';
import { EstadoBadge, TipoBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { creditosApi } from '@/api/endpoints';
import { cx, formatCurrency, formatDate, formatDateTime, formatNumber, formatPercent, daysUntil } from '@/lib/format';
import type { Credito } from '@/types';

interface CreditoDetalleProps {
  credito: Credito;
  onRegistrarPago?: () => void;
  mostrarEmprendedor?: boolean;
}

export function CreditoDetalle({ credito, onRegistrarPago, mostrarEmprendedor = true }: CreditoDetalleProps) {
  const totales = credito.totales;
  const pagos = credito.pagos ?? [];
  const dias = daysUntil(credito.fecha_vencimiento);
  const vencido = dias < 0 && !['PAGADO', 'RECHAZADO', 'CANCELADO'].includes(credito.estado);

  return (
    <div className="space-y-5">
      {/* Encabezado */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <TipoBadge tipo={credito.tipo} />
            <EstadoBadge estado={credito.estado} />
          </div>
          <p className="mt-2 text-sm text-ink-500">
            Solicitado el {formatDate(credito.fecha_solicitud)}
            {credito.factura_numero && <> · Factura {credito.factura_numero}</>}
          </p>
        </div>
        {credito.factura && (
          <a href={creditosApi.urlFactura(credito.id)} target="_blank" rel="noreferrer">
            <Button variant="secondary" size="sm" icon={<Download className="h-4 w-4" />}>
              Descargar factura
            </Button>
          </a>
        )}
      </div>

      {/* Datos del emprendedor */}
      {mostrarEmprendedor && (
        <div className="rounded-xl border border-ink-100 bg-ink-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Emprendedor</p>
          <p className="mt-1 font-semibold text-ink-900">{credito.emprendedor_nombre}</p>
          <p className="text-sm text-ink-500">
            {credito.emprendedor_cedula} · {credito.emprendedor_email}
          </p>
        </div>
      )}

      {/* Montos */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Dato label="Cantidad" value={`${formatNumber(credito.cantidad)} ${credito.tipo === 'POLLOS' ? 'pollos' : 'cerdos'}`} />
        <Dato label="Valor unitario" value={formatCurrency(credito.valor_unitario, 2)} />
        <Dato label="Monto" value={formatCurrency(totales?.montoTotal, 2)} />
        <Dato label="Interés" value={formatPercent(totales?.tasaInteres, 0)} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Dato label="Intereses" value={formatCurrency(totales?.intereses, 2)} />
        <Dato label="Total a pagar" value={formatCurrency(totales?.totalPagar, 2)} destacado />
        <Dato label="Pagado" value={formatCurrency(totales?.montoPagado, 2)} positivo />
        <Dato label="Saldo" value={formatCurrency(totales?.saldoPendiente, 2)} negativo={Number(totales?.saldoPendiente) > 0} />
      </div>

      {/* Progreso */}
      <div>
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="text-ink-500">Progreso de pago</span>
          <span className="font-semibold text-ink-900">{formatPercent(totales?.porcentajePagado)}</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink-100">
          <div
            className={cx(
              'h-full rounded-full transition-all',
              Number(totales?.porcentajePagado) >= 100 ? 'bg-emerald-500' : 'bg-brand-600'
            )}
            style={{ width: `${Math.min(100, Number(totales?.porcentajePagado ?? 0))}%` }}
          />
        </div>
      </div>

      {/* Fechas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Dato label="Entrega" value={formatDate(credito.fecha_entrega)} />
        <Dato
          label="Vencimiento"
          value={formatDate(credito.fecha_vencimiento)}
          negativo={vencido}
          extra={vencido ? `Vencido hace ${Math.abs(dias)} día(s)` : dias >= 0 ? `En ${dias} día(s)` : undefined}
        />
        <Dato label="Aprobación" value={formatDate(credito.fecha_aprobacion)} />
      </div>

      {credito.motivo_rechazo && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <p className="font-semibold">Motivo</p>
          <p>{credito.motivo_rechazo}</p>
        </div>
      )}

      {/* Pagos */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink-900">
            <FileText className="h-4 w-4 text-ink-400" /> Pagos registrados ({pagos.length})
          </p>
          {onRegistrarPago && Number(totales?.saldoPendiente) > 0 && (
            <Button size="sm" onClick={onRegistrarPago}>
              Registrar pago
            </Button>
          )}
        </div>

        {pagos.length === 0 ? (
          <p className="rounded-xl border border-dashed border-ink-200 p-4 text-center text-sm text-ink-500">
            Aún no hay pagos registrados
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-ink-100">
            <table className="w-full">
              <thead className="bg-ink-50/60">
                <tr>
                  <th className="th">Fecha</th>
                  <th className="th">Método</th>
                  <th className="th">Referencia</th>
                  <th className="th text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {pagos.map((pago) => (
                  <tr key={pago.id}>
                    <td className="td">{formatDateTime(pago.fecha_pago)}</td>
                    <td className="td">{pago.metodo_pago}</td>
                    <td className="td text-xs text-ink-500">{pago.referencia ?? '—'}</td>
                    <td className="td text-right font-semibold text-emerald-600">
                      {formatCurrency(pago.monto, 2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Dato({
  label,
  value,
  destacado,
  positivo,
  negativo,
  extra,
}: {
  label: string;
  value: string;
  destacado?: boolean;
  positivo?: boolean;
  negativo?: boolean;
  extra?: string;
}) {
  return (
    <div className="rounded-xl border border-ink-100 p-3">
      <p className="text-xs text-ink-500">{label}</p>
      <p
        className={cx(
          'mt-0.5 font-semibold',
          destacado && 'text-brand-800',
          positivo && 'text-emerald-600',
          negativo && 'text-rose-600',
          !destacado && !positivo && !negativo && 'text-ink-900'
        )}
      >
        {value}
      </p>
      {extra && <p className="text-xs text-ink-400">{extra}</p>}
    </div>
  );
}
