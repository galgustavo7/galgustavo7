import 'package:flutter/material.dart';

import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/widgets.dart';
import 'detalle_credito_screen.dart';

/// Historial de créditos del emprendedor.
class MisCreditosScreen extends StatefulWidget {
  const MisCreditosScreen({super.key});

  @override
  State<MisCreditosScreen> createState() => _MisCreditosScreenState();
}

class _MisCreditosScreenState extends State<MisCreditosScreen> {
  List<CreditoItem> _creditos = [];
  bool _cargando = true;
  String? _error;
  String _filtro = 'TODOS';

  static const _filtros = ['TODOS', 'SOLICITADO', 'APROBADO', 'ENTREGADO', 'PAGADO', 'MORA', 'RECHAZADO'];

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
      final creditos = await ApiService.instancia.misCreditos(
        estado: _filtro == 'TODOS' ? null : _filtro,
      );
      if (!mounted) return;
      setState(() {
        _creditos = creditos;
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
        _error = 'No pudimos cargar tus créditos.';
        _cargando = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mis créditos'),
        actions: [IconButton(onPressed: _cargar, icon: const Icon(Icons.refresh_outlined))],
      ),
      body: Column(
        children: [
          SizedBox(
            height: 52,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              scrollDirection: Axis.horizontal,
              itemCount: _filtros.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final filtro = _filtros[index];
                final activo = filtro == _filtro;

                return ChoiceChip(
                  label: Text(filtro == 'TODOS' ? 'Todos' : filtro[0] + filtro.substring(1).toLowerCase()),
                  selected: activo,
                  onSelected: (_) {
                    setState(() => _filtro = filtro);
                    _cargar();
                  },
                );
              },
            ),
          ),
          Expanded(
            child: _cargando
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? Center(child: Text(_error!))
                    : _creditos.isEmpty
                        ? const EmptyState(
                            titulo: 'Sin créditos',
                            descripcion: 'No encontramos créditos con este filtro',
                          )
                        : RefreshIndicator(
                            onRefresh: _cargar,
                            child: ListView.separated(
                              padding: const EdgeInsets.all(16),
                              itemCount: _creditos.length,
                              separatorBuilder: (_, __) => const SizedBox(height: 12),
                              itemBuilder: (context, index) {
                                final credito = _creditos[index];
                                return _CreditoTile(credito: credito);
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }
}

class _CreditoTile extends StatelessWidget {
  final CreditoItem credito;

  const _CreditoTile({required this.credito});

  @override
  Widget build(BuildContext context) {
    final estado = estadoFromString(credito.estado);
    final porcentaje = credito.totalPagar > 0
        ? ((credito.totalPagar - credito.saldoPendiente) / credito.totalPagar) * 100
        : 0.0;

    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => DetalleCreditoScreen(creditoId: credito.id)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${credito.tipo == 'POLLOS' ? '🐔 Pollos' : '🐷 Cerdos'} x${credito.cantidad}',
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  EstadoBadge(estado: estado),
                ],
              ),
              if (credito.facturaNumero != null) ...[
                const SizedBox(height: 4),
                Text(
                  'Factura ${credito.facturaNumero}',
                  style: const TextStyle(fontSize: 12, color: AppColors.ink500),
                ),
              ],
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    formatearMoneda(credito.totalPagar),
                    style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
                  ),
                  Text(
                    'Saldo ${formatearMoneda(credito.saldoPendiente)}',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: credito.saldoPendiente > 0 ? AppColors.danger : AppColors.success,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              BarraProgreso(porcentaje: porcentaje),
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
