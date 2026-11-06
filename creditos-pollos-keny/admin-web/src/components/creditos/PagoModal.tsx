import { useState } from 'react';
import { toast } from 'sonner';
import { CreditCard } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Form';
import { useAccionesCredito } from '@/hooks/queries';
import { mensajeError } from '@/api/client';
import { formatCurrency, formatNumber } from '@/lib/format';
import type { Credito, MetodoPago } from '@/types';

interface PagoModalProps {
  credito: Credito | null;
  open: boolean;
  onClose: () => void;
}

export function PagoModal({ credito, open, onClose }: PagoModalProps) {
  const { pagar } = useAccionesCredito();
  const saldo = credito?.totales?.saldoPendiente ?? 0;

  const [monto, setMonto] = useState<string>('');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('EFECTIVO');
  const [referencia, setReferencia] = useState('');
  const [nota, setNota] = useState('');

  const cerrar = () => {
    setMonto('');
    setReferencia('');
    setNota('');
    onClose();
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!credito) return;

    const valor = Number(monto);
    if (!Number.isFinite(valor) || valor <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }
    if (valor > saldo + 0.01) {
      toast.error(`El monto no puede superar el saldo (${formatCurrency(saldo, 2)})`);
      return;
    }

    try {
      const resultado = await pagar.mutateAsync({
        id: credito.id,
        payload: { monto: valor, metodoPago, referencia: referencia || undefined, nota: nota || undefined },
      });
      toast.success(
        resultado.estado === 'PAGADO'
          ? '¡Crédito saldado completamente! 🏆'
          : `Pago registrado. Saldo: ${formatCurrency(resultado.saldoPendiente, 2)}`
      );
      cerrar();
    } catch (error) {
      toast.error(mensajeError(error, 'No se pudo registrar el pago'));
    }
  };

  return (
    <Modal
      open={open}
      onClose={cerrar}
      title="Registrar pago"
      description={credito ? `${credito.emprendedor_nombre} · ${credito.factura_numero ?? 'sin factura'}` : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={cerrar}>
            Cancelar
          </Button>
          <Button type="submit" form="form-pago" loading={pagar.isPending} icon={<CreditCard className="h-4 w-4" />}>
            Registrar pago
          </Button>
        </>
      }
    >
      {credito && (
        <form id="form-pago" onSubmit={onSubmit} className="space-y-4">
          <div className="rounded-xl bg-ink-50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-500">Total a pagar</span>
              <span className="font-semibold text-ink-900">{formatCurrency(credito.totales?.totalPagar, 2)}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-sm">
              <span className="text-ink-500">Pagado</span>
              <span className="font-semibold text-emerald-600">
                {formatCurrency(credito.totales?.montoPagado, 2)}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-sm">
              <span className="text-ink-500">Saldo pendiente</span>
              <span className="font-bold text-rose-600">{formatCurrency(saldo, 2)}</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Monto" required hint={`Máximo ${formatNumber(saldo, 2)}`}>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                required
              />
            </Field>

            <Field label="Método de pago" required>
              <Select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}>
                <option value="EFECTIVO">Efectivo</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="BINANCE">Binance</option>
                <option value="OTRO">Otro</option>
              </Select>
            </Field>
          </div>

          <Field label="Referencia">
            <Input
              placeholder="N° de operación"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
            />
          </Field>

          <Field label="Nota">
            <Textarea rows={2} placeholder="Observación (opcional)" value={nota} onChange={(e) => setNota(e.target.value)} />
          </Field>

          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setMonto(String(saldo.toFixed(2)))}
            >
              Pagar saldo completo
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setMonto(String((saldo / 2).toFixed(2)))}
            >
              50%
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
