import { Link } from 'react-router-dom';
import { AlertTriangle, Egg, PiggyBank, Receipt, Star, Wallet } from 'lucide-react';
import { useMiResumen } from '@/hooks/queries';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader, Loader, ErrorState, EmptyState } from '@/components/ui/Feedback';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardContent, CardHeader, CardTitle, CardSubtitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EstadoBadge, TipoBadge } from '@/components/ui/Badge';
import { formatCurrency, formatDate, nivelScore } from '@/lib/format';

export function MiPanelPage() {
  const { usuario } = useAuth();
  const { data, isLoading, isError, error } = useMiResumen();

  if (isLoading) return <Loader label="Cargando tu panel..." />;
  if (isError || !data)
    return <ErrorState message={(error as Error)?.message ?? 'No se pudo cargar tu resumen'} />;

  const totales = data.totales;
  const nivel = nivelScore(data.emprendedor?.score_crediticio);

  return (
    <div>
      <PageHeader
        title={`Hola, ${usuario?.nombre?.split(' ')[0] ?? 'emprendedor'} 👋`}
        subtitle="Resumen de tus créditos y pagos"
        actions={
          <Link to="/solicitar">
            <Button icon={<Egg className="h-4 w-4" />}>Solicitar crédito</Button>
          </Link>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Mis créditos"
          value={totales.creditos}
          icon={Receipt}
          color="from-brand-600 to-brand-800"
          hint={`${totales.activos} activos · ${totales.pagados} pagados`}
        />
        <StatCard
          label="Monto solicitado"
          value={formatCurrency(totales.montoSolicitado)}
          icon={Wallet}
          color="from-accent-500 to-accent-700"
          hint={`${totales.pendientes} en revisión`}
        />
        <StatCard
          label="Saldo pendiente"
          value={formatCurrency(totales.saldoPendiente)}
          icon={AlertTriangle}
          color={totales.enMora > 0 ? 'from-rose-500 to-rose-700' : 'from-amber-500 to-amber-600'}
          hint={totales.enMora > 0 ? `${totales.enMora} crédito(s) en mora` : 'Todo al día'}
        />
        <StatCard
          label="Score crediticio"
          value={data.emprendedor?.score_crediticio ?? 0}
          icon={Star}
          color="from-emerald-500 to-emerald-700"
          hint={nivel.etiqueta}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Créditos */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Mis créditos</CardTitle>
              <CardSubtitle>Últimas solicitudes registradas</CardSubtitle>
            </div>
            <Link to="/mis-creditos" className="text-sm font-medium text-brand-600 hover:underline">
              Ver todos
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {data.creditos.length === 0 ? (
              <EmptyState
                title="Aún no tienes créditos"
                description="Solicita tu primer crédito de pollos o cerdos"
                action={
                  <Link to="/solicitar">
                    <Button>Solicitar crédito</Button>
                  </Link>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-ink-100 bg-ink-50/60">
                    <tr>
                      <th className="th">Tipo</th>
                      <th className="th">Fecha</th>
                      <th className="th">Total</th>
                      <th className="th">Saldo</th>
                      <th className="th">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {data.creditos.slice(0, 6).map((credito) => (
                      <tr key={credito.id} className="transition hover:bg-ink-50/60">
                        <td className="td">
                          <TipoBadge tipo={credito.tipo} />
                          <p className="mt-1 text-xs text-ink-500">{credito.cantidad} unidades</p>
                        </td>
                        <td className="td">{formatDate(credito.fecha_solicitud)}</td>
                        <td className="td font-semibold text-ink-900">
                          {formatCurrency(credito.totales?.totalPagar, 2)}
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
                          <EstadoBadge estado={credito.estado} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Score */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Mi score</CardTitle>
              <CardSubtitle>Calculado con tu historial de pagos</CardSubtitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div
                className="mx-auto flex h-28 w-28 items-center justify-center rounded-full text-3xl font-bold text-white"
                style={{ background: `conic-gradient(${nivel.color} ${((data.emprendedor?.score_crediticio ?? 0) / 850) * 360}deg, #F3F4F6 0deg)` }}
              >
                <span className="flex h-24 w-24 items-center justify-center rounded-full bg-white" style={{ color: nivel.color }}>
                  {data.emprendedor?.score_crediticio ?? 0}
                </span>
              </div>
              <p className="mt-3 text-lg font-semibold" style={{ color: nivel.color }}>
                {nivel.etiqueta}
              </p>
              <p className="mt-1 text-sm text-ink-500">
                Paga puntualmente para subir tu score y acceder a montos mayores.
              </p>
            </div>

            <dl className="mt-6 space-y-2 border-t border-ink-100 pt-4 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-ink-500">Créditos pagados</dt>
                <dd className="font-semibold text-ink-900">{totales.pagados}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-500">Créditos en mora</dt>
                <dd className="font-semibold text-rose-600">{totales.enMora}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-500">Total pagado</dt>
                <dd className="font-semibold text-emerald-600">{formatCurrency(totales.totalPagado)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-500">Actividad</dt>
                <dd className="font-semibold text-ink-900">{data.emprendedor?.actividad}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-5 border-brand-100 bg-brand-50/60">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl shadow-soft">
              <PiggyBank className="h-5 w-5 text-brand-700" />
            </div>
            <div>
              <p className="font-semibold text-ink-900">¿Necesitas más animales para tu producción?</p>
              <p className="text-sm text-ink-600">
                Solicita un crédito y recibe la aprobación en menos de 24 horas.
              </p>
            </div>
          </div>
          <Link to="/solicitar">
            <Button>Solicitar ahora</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
