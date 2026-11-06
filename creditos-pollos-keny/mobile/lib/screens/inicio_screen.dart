import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/models.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/widgets.dart';
import 'detalle_credito_screen.dart';

/// Panel principal del emprendedor.
class InicioScreen extends StatefulWidget {
  const InicioScreen({super.key});

  @override
  State<InicioScreen> createState() => _InicioScreenState();
}

class _InicioScreenState extends State<InicioScreen> {
  ResumenEmprendedor? _resumen;
  bool _cargando = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _cargar();
  }

  Future<void> _cargar() async {
    setState(() {
      _cargando = true;
      _error = null;
    });

    try {
      final data = await ApiService.instancia.miResumen();
      if (!mounted) return;
      setState(() {
        _resumen = ResumenEmprendedor.fromJson(data);
        _cargando = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.mensaje;
        _cargando = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = 'No pudimos cargar tu resumen. Revisa tu conexión.';
        _cargando = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final usuario = context.watch<AuthProvider>().usuario;
    final resumen = _resumen;

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Hola, ${usuario?.nombre.split(' ').first ?? 'emprendedor'} 👋'),
            const Text(
              'Créditos Pollos Keny',
              style: TextStyle(fontSize: 12, color: AppColors.ink500),
            ),
          ],
        ),
        actions: [
          IconButton(onPressed: _cargar, icon: const Icon(Icons.refresh_outlined)),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _cargar,
        child: _cargando
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.wifi_off_outlined, size: 40, color: AppColors.ink500),
                          const SizedBox(height: 12),
                          Text(_error!, textAlign: TextAlign.center),
                          const SizedBox(height: 16),
                          ElevatedButton(onPressed: _cargar, child: const Text('Reintentar')),
                        ],
                      ),
                    ),
                  )
                : ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      // Tarjeta de score
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [AppColors.brand, Color(0xFF111827)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Tu score crediticio',
                                    style: TextStyle(color: Colors.white70, fontSize: 13),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '${resumen?.score ?? usuario?.scoreCrediticio ?? '—'}',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 32,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  const Text(
                                    'Paga puntual para acceder a más crédito',
                                    style: TextStyle(color: Colors.white60, fontSize: 12),
                                  ),
                                ],
                              ),
                            ),
                            const Text('🐔', style: TextStyle(fontSize: 46)),
                          ],
                        ),
                      ),

                      const SizedBox(height: 16),

                      GridView.count(
                        crossAxisCount: 2,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        mainAxisSpacing: 12,
                        crossAxisSpacing: 12,
                        childAspectRatio: 1.5,
                        children: [
                          StatCard(
                            titulo: 'Mis créditos',
                            valor: '${resumen?.creditos ?? 0}',
                            icono: Icons.receipt_long_outlined,
                            color: AppColors.brand,
                            subtitulo: '${resumen?.activos ?? 0} activos',
                          ),
                          StatCard(
                            titulo: 'Solicitado',
                            valor: formatearMonedaCorta(resumen?.montoSolicitado ?? 0),
                            icono: Icons.savings_outlined,
                            color: AppColors.accent,
                          ),
                          StatCard(
                            titulo: 'Saldo pendiente',
                            valor: formatearMonedaCorta(resumen?.saldoPendiente ?? 0),
                            icono: Icons.account_balance_wallet_outlined,
                            color: (resumen?.enMora ?? 0) > 0 ? AppColors.danger : AppColors.warning,
                            subtitulo: (resumen?.enMora ?? 0) > 0 ? '${resumen?.enMora} en mora' : 'Al día',
                          ),
                          StatCard(
                            titulo: 'Total pagado',
                            valor: formatearMonedaCorta(resumen?.totalPagado ?? 0),
                            icono: Icons.verified_outlined,
                            color: AppColors.success,
                          ),
                        ],
                      ),

                      const SizedBox(height: 24),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Últimos créditos',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                          ),
                          TextButton(
                            onPressed: () {},
                            child: const Text('Ver todos'),
                          ),
                        ],
                      ),

                      if ((resumen?.ultimosCreditos ?? []).isEmpty)
                        const EmptyState(
                          titulo: 'Aún no tienes créditos',
                          descripcion: 'Solicita tu primer crédito desde la pestaña Solicitar',
                          icono: Icons.egg_outlined,
                        )
                      else
                        ...resumen!.ultimosCreditos.take(5).map(
                              (credito) => Padding(
                                padding: const EdgeInsets.only(bottom: 10),
                                child: _CreditoResumen(credito: credito),
                              ),
                            ),
                    ],
                  ),
      ),
    );
  }
}

class _CreditoResumen extends StatelessWidget {
  final Credito credito;

  const _CreditoResumen({required this.credito});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => DetalleCreditoScreen(credito: credito)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Text(credito.esPollos ? '🐔' : '🐷', style: const TextStyle(fontSize: 20)),
                      const SizedBox(width: 8),
                      Text(
                        '${credito.esPollos ? 'Pollos' : 'Cerdos'} x${credito.cantidad}',
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                  EstadoBadge(estado: credito.estado),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    formatearMoneda(credito.totales?.totalPagar ?? credito.montoTotal),
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  Text(
                    'Saldo ${formatearMoneda(credito.saldo)}',
                    style: TextStyle(
                      fontSize: 13,
                      color: credito.saldo > 0 ? AppColors.danger : AppColors.success,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              BarraProgreso(porcentaje: credito.totales?.porcentajePagado ?? 0),
              const SizedBox(height: 8),
              Text(
                'Vence: ${formatearFecha(credito.fechaVencimiento)}',
                style: const TextStyle(fontSize: 12, color: AppColors.ink500),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
