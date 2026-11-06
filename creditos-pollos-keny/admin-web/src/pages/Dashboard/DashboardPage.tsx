import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  Bitcoin,
  PiggyBank,
  Receipt,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { useResumenAdmin } from '@/hooks/queries';
import { PageHeader, Loader, ErrorState, EmptyState } from '@/components/ui/Feedback';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardContent, CardHeader, CardTitle, CardSubtitle } from '@/components/ui/Card';
import { EstadoBadge, TipoBadge } from '@/components/ui/Badge';
import { TIPO_LABEL, cx, formatCurrency, formatDate, formatPercent } from '@/lib/format';

const COLORES = ['#FF6B35', '#1E3A8A', '#10B981', '#F59E0B'];

export function DashboardPage() {
  const { data, isLoading, isError, error } = useResumenAdmin();

  const metricas = data?.metricas;

  const distribucion = useMemo(() => {
    const rows = metricas?.distribucion ?? [];
    const total = rows.reduce((sum, item) => sum + Number(item.monto), 0);
    return rows.map((item) => ({
      name: TIPO_LABEL[item.tipo as 'POLLOS' | 'CERDOS']?.label ?? item.tipo,
      value: Number(item.monto),
      cantidad: item.cantidad,
      porcentaje: total > 0 ? (Number(item.monto) / total) * 100 : 0,
    }));
  }, [metricas]);

  if (isLoading) return <Loader label="Cargando métricas..." />;
  if (isError || !data)
    return (
      <div className="p-8">
        <ErrorState message={(error as Error)?.message ?? 'No se pudieron cargar las métricas'} />
      </div>
    );

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Dashboard"
        subtitle="Resumen general de la operación de créditos"
        actions={
          <Link
            to="/creditos?estado=SOLICITADO"
            className="rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-medium text-ink-700 transition hover:bg-ink-50"
          >
            Ver solicitudes pendientes ({metricas?.solicitudesPendientes ?? 0})
          </Link>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          label="Total prestado"
          value={formatCurrency(metricas?.totalPrestado)}
          icon={Wallet}
          color="from-brand-600 to-brand-800"
          hint={`${metricas?.creditosActivos ?? 0} créditos activos`}
        />
        <StatCard
          label="Recuperado"
          value={formatCurrency(metricas?.totalRecuperado)}
          icon={PiggyBank}
          color="from-emerald-500 to-emerald-700"
          hint={`${formatPercent(metricas?.tasaRecuperacion)} de recuperación`}
        />
        <StatCard
          label="Por cobrar"
          value={formatCurrency(metricas?.pendienteCobro)}
          icon={Receipt}
          color="from-accent-500 to-accent-700"
          hint={`Intereses ${formatCurrency(metricas?.interesesProyectados)}`}
        />
        <StatCard
          label="En mora"
          value={formatCurrency(metricas?.montoEnMora)}
          icon={AlertTriangle}
          color="from-rose-500 to-rose-700"
          hint={`${metricas?.creditosEnMora ?? 0} créditos vencidos`}
        />
        <StatCard
          label="Emprendedores"
          value={metricas?.emprendedores ?? 0}
          icon={Users}
          color="from-sky-500 to-sky-700"
          hint={`Ticket promedio ${formatCurrency(metricas?.ticketPromedio)}`}
        />
        <StatCard
          label="Cartera crypto"
          value={formatCurrency(metricas?.crypto?.valor)}
          icon={Bitcoin}
          color="from-purple-500 to-purple-700"
          trend={metricas?.crypto?.gananciaPorcentaje}
          hint={metricas?.crypto?.fuente === 'binance' ? 'Precios Binance' : 'Precios en caché'}
        />
      </div>

      {/* Gráficos */}
      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Colocado vs recuperado</CardTitle>
              <CardSubtitle>Últimos 6 meses</CardSubtitle>
            </div>
            <span className="chip bg-emerald-50 text-emerald-700">
              <TrendingUp className="h-3.5 w-3.5" />
              {formatCurrency(metricas?.ingresosMes)} este mes
            </span>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.serie} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="etiqueta" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="colocado" name="Colocado" fill="#1E3A8A" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="cobrado" name="Recuperado" fill="#FF6B35" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Distribución por tipo</CardTitle>
              <CardSubtitle>Monto colocado</CardSubtitle>
            </div>
          </CardHeader>
          <CardContent>
            {distribucion.length === 0 ? (
              <EmptyState title="Sin datos" description="Aún no hay créditos registrados" />
            ) : (
              <>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distribucion}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={48}
                        outerRadius={76}
                        paddingAngle={3}
                      >
                        {distribucion.map((entry, index) => (
                          <Cell key={entry.name} fill={COLORES[index % COLORES.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="mt-3 space-y-2">
                  {distribucion.map((item, index) => (
                    <li key={item.name} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-ink-600">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: COLORES[index % COLORES.length] }}
                        />
                        {item.name}
                      </span>
                      <span className="font-semibold text-ink-900">{formatCurrency(item.value)}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tablas */}
      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Últimos créditos</CardTitle>
              <CardSubtitle>Solicitudes más recientes</CardSubtitle>
            </div>
            <Link to="/creditos" className="text-sm font-medium text-brand-600 hover:underline">
              Ver todos
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-ink-100 bg-ink-50/60">
                  <tr>
                    <th className="th">Emprendedor</th>
                    <th className="th">Tipo</th>
                    <th className="th">Monto</th>
                    <th className="th">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {data.creditos.length === 0 && (
                    <tr>
                      <td colSpan={4}>
                        <EmptyState title="Sin créditos" />
                      </td>
                    </tr>
                  )}
                  {data.creditos.map((credito) => (
                    <tr key={credito.id} className="hover:bg-ink-50/60">
                      <td className="td">
                        <p className="font-medium text-ink-900">{credito.emprendedor_nombre}</p>
                        <p className="text-xs text-ink-400">{formatDate(credito.fecha_solicitud)}</p>
                      </td>
                      <td className="td">
                        <TipoBadge tipo={credito.tipo} />
                      </td>
                      <td className="td font-semibold text-ink-900">
                        {formatCurrency(credito.monto_total)}
                      </td>
                      <td className="td">
                        <EstadoBadge estado={credito.estado} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Créditos en mora</CardTitle>
              <CardSubtitle>Requieren gestión de cobranza</CardSubtitle>
            </div>
            <span className="chip bg-rose-50 text-rose-700">
              {formatCurrency(metricas?.montoEnMora)}
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-ink-100 bg-ink-50/60">
                  <tr>
                    <th className="th">Emprendedor</th>
                    <th className="th">Vencimiento</th>
                    <th className="th">Saldo</th>
                    <th className="th">Contacto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {data.morosos.length === 0 && (
                    <tr>
                      <td colSpan={4}>
                        <EmptyState title="¡Sin mora!" description="Todos los créditos están al día" />
                      </td>
                    </tr>
                  )}
                  {data.morosos.map((credito) => (
                    <tr key={credito.id} className="hover:bg-ink-50/60">
                      <td className="td">
                        <p className="font-medium text-ink-900">{credito.emprendedor_nombre}</p>
                        <p className="text-xs text-ink-400">{credito.factura_numero ?? 'Sin factura'}</p>
                      </td>
                      <td className="td">{formatDate(credito.fecha_vencimiento)}</td>
                      <td className="td font-semibold text-rose-600">
                        {formatCurrency(credito.totales?.saldoPendiente)}
                      </td>
                      <td className="td text-xs">{credito.emprendedor_telefono ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pagos recientes */}
      <Card className="mt-5">
        <CardHeader>
          <div>
            <CardTitle>Pagos recientes</CardTitle>
            <CardSubtitle>Últimos abonos registrados</CardSubtitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-ink-100 bg-ink-50/60">
                <tr>
                  <th className="th">Fecha</th>
                  <th className="th">Emprendedor</th>
                  <th className="th">Factura</th>
                  <th className="th">Método</th>
                  <th className="th text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {data.pagos.length === 0 && (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState title="Sin pagos registrados" />
                    </td>
                  </tr>
                )}
                {data.pagos.map((pago) => (
                  <tr key={pago.id} className="hover:bg-ink-50/60">
                    <td className="td">{formatDate(pago.fecha_pago)}</td>
                    <td className="td font-medium text-ink-900">{pago.emprendedor_nombre}</td>
                    <td className="td text-xs text-ink-500">{pago.factura_numero ?? '—'}</td>
                    <td className="td">
                      <span className={cx('chip bg-ink-100 text-ink-600')}>{pago.metodo_pago}</span>
                    </td>
                    <td className="td text-right font-semibold text-emerald-600">
                      {formatCurrency(pago.monto, 2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
