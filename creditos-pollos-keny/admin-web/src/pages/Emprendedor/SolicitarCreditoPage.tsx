import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Calculator, Egg, PiggyBank } from 'lucide-react';
import { PageHeader } from '@/components/ui/Feedback';
import { Card, CardContent, CardHeader, CardTitle, CardSubtitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Form';
import { useAccionesCredito } from '@/hooks/queries';
import { useQuery } from '@tanstack/react-query';
import { parametrosApi } from '@/api/endpoints';
import { mensajeError } from '@/api/client';
import { cx, formatCurrency, formatNumber } from '@/lib/format';
import type { TipoCredito } from '@/types';

export function SolicitarCreditoPage() {
  const navigate = useNavigate();
  const { solicitar } = useAccionesCredito();

  const { data: parametros } = useQuery({
    queryKey: ['parametros'],
    queryFn: () => parametrosApi.listar(),
    staleTime: 5 * 60_000,
  });

  const [tipo, setTipo] = useState<TipoCredito>('POLLOS');
  const [cantidad, setCantidad] = useState('100');
  const [notas, setNotas] = useState('');

  const precioUnitario = Number(tipo === 'POLLOS' ? parametros?.PRECIO_POLLO ?? 3.2 : parametros?.PRECIO_CERDO ?? 50);
  const tasa = Number(parametros?.TASA_INTERES ?? 8);
  const plazo = Number(parametros?.PLAZO_DIAS ?? 45);
  const maximo = Number(tipo === 'POLLOS' ? parametros?.CANTIDAD_MAX_POLLOS ?? 2000 : parametros?.CANTIDAD_MAX_CERDOS ?? 200);

  const calculo = useMemo(() => {
    const unidades = Math.max(0, Number(cantidad) || 0);
    const monto = unidades * precioUnitario;
    const intereses = monto * (tasa / 100);
    return { unidades, monto, intereses, total: monto + intereses };
  }, [cantidad, precioUnitario, tasa]);

  useEffect(() => {
    if (calculo.unidades > maximo) {
      setCantidad(String(maximo));
    }
  }, [maximo, calculo.unidades]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (calculo.unidades <= 0) {
      toast.error('Ingresa una cantidad válida');
      return;
    }

    try {
      await solicitar.mutateAsync({ tipo, cantidad: calculo.unidades, notas: notas || undefined });
      toast.success('Solicitud enviada. Te avisaremos por correo.');
      navigate('/mis-creditos');
    } catch (error) {
      toast.error(mensajeError(error, 'No se pudo enviar la solicitud'));
    }
  };

  return (
    <div>
      <PageHeader
        title="Solicitar crédito"
        subtitle="Financia pollos o cerdos para tu próxima producción"
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Datos de la solicitud</CardTitle>
              <CardSubtitle>Completa el formulario y envíala a revisión</CardSubtitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-5">
              <Field label="¿Qué vas a financiar?" required>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTipo('POLLOS')}
                    className={cx(
                      'flex items-center gap-3 rounded-xl border-2 p-4 text-left transition',
                      tipo === 'POLLOS'
                        ? 'border-accent-500 bg-accent-50'
                        : 'border-ink-200 bg-white hover:border-ink-300'
                    )}
                  >
                    <span className="text-2xl">🐔</span>
                    <span>
                      <span className="block font-semibold text-ink-900">Pollos</span>
                      <span className="block text-xs text-ink-500">
                        {formatCurrency(precioUnitario, 2)} por unidad
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipo('CERDOS')}
                    className={cx(
                      'flex items-center gap-3 rounded-xl border-2 p-4 text-left transition',
                      tipo === 'CERDOS'
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-ink-200 bg-white hover:border-ink-300'
                    )}
                  >
                    <span className="text-2xl">🐷</span>
                    <span>
                      <span className="block font-semibold text-ink-900">Cerdos</span>
                      <span className="block text-xs text-ink-500">
                        {formatCurrency(precioUnitario, 2)} por unidad
                      </span>
                    </span>
                  </button>
                </div>
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Cantidad"
                  required
                  hint={`Máximo ${formatNumber(maximo)} unidades`}
                >
                  <Input
                    type="number"
                    min="1"
                    max={maximo}
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    required
                  />
                </Field>

                <Field label="Valor unitario">
                  <Input value={`${formatCurrency(precioUnitario, 2)}`} disabled />
                </Field>
              </div>

              <Field label="Notas (opcional)">
                <Textarea
                  rows={3}
                  placeholder="Cuéntanos para qué usarás el crédito"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                />
              </Field>

              <Button type="submit" size="lg" loading={solicitar.isPending} icon={<Egg className="h-4 w-4" />}>
                Enviar solicitud
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Simulador */}
        <Card className="h-fit">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-ink-400" /> Simulación
              </CardTitle>
              <CardSubtitle>Cálculo automático de tu crédito</CardSubtitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Linea label={`${formatNumber(calculo.unidades)} ${tipo === 'POLLOS' ? 'pollos' : 'cerdos'}`} valor={formatCurrency(calculo.monto, 2)} />
            <Linea label={`Interés (${tasa}%)`} valor={formatCurrency(calculo.intereses, 2)} />
            <div className="border-t border-ink-100 pt-3">
              <Linea label="Total a pagar" valor={formatCurrency(calculo.total, 2)} destacado />
            </div>
            <Linea label="Plazo" valor={`${plazo} días`} />

            <div className="rounded-xl bg-ink-50 p-4 text-xs text-ink-500">
              <p className="mb-1 font-semibold text-ink-700">¿Cómo funciona?</p>
              <ul className="space-y-1">
                <li>1. Envías tu solicitud con la cantidad deseada.</li>
                <li>2. Validamos tu score crediticio.</li>
                <li>3. Al aprobar recibes tu factura en PDF por correo.</li>
                <li>4. Pagas en {plazo} días (puedes abonar antes).</li>
              </ul>
            </div>

            <p className="flex items-center gap-2 text-xs text-ink-400">
              <PiggyBankIcon /> Tasa fija del {tasa}% sobre el monto financiado.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Linea({ label, valor, destacado }: { label: string; valor: string; destacado?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={destacado ? 'font-semibold text-ink-900' : 'text-ink-500'}>{label}</span>
      <span className={destacado ? 'text-lg font-bold text-brand-800' : 'font-semibold text-ink-900'}>{valor}</span>
    </div>
  );
}

function PiggyBankIcon() {
  return <PiggyBank className="h-3.5 w-3.5" />;
}
