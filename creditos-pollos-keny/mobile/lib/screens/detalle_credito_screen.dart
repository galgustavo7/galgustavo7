import 'package:flutter/material.dart';

import '../models/models.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/widgets.dart';

/// Detalle de un crédito: montos, fechas, pagos y registro de abonos.
class DetalleCreditoScreen extends StatefulWidget {
  final String? creditoId;
  final Credito? credito;

  const DetalleCreditoScreen({super.key, this.creditoId, this.credito})
      : assert(creditoId != null || credito != null);

  @override
  State<DetalleCreditoScreen> createState() => _DetalleCreditoScreenState();
}

class _DetalleCreditoScreenState extends State<DetalleCreditoScreen> {
  Credito? _credito;
  bool _cargando = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    if (widget.credito != null) {
      _credito = widget.credito;
      _cargando = false;
    } else {
      _cargar();
    }
  }

  Future<void> _cargar() async {
    setState(() {
      _cargando = true;
      _error = null;
    });

    try {
      final data = await ApiService.instancia.get('/creditos/${widget.creditoId}');
      if (!mounted) return;
      setState(() {
        _credito = Credito.fromJson(Map<String, dynamic>.from((data as Map)['credito'] as Map));
        _cargando = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.mensaje;
        _cargando = false;
      });
    }
  }

  Future<void> _registrarPago() async {
    final credito = _credito;
    if (credito == null) return;

    final montoController = TextEditingController();
    final referenciaController = TextEditingController();
    String metodo = 'EFECTIVO';

    final confirmado = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(context).viewInsets.bottom + 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'Registrar pago',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 6),
              Text(
                'Saldo pendiente: ${formatearMoneda(credito.saldo)}',
                style: const TextStyle(color: AppColors.ink500),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: montoController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(
                  labelText: 'Monto',
                  prefixIcon: Icon(Icons.attach_money),
                ),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: metodo,
                decoration: const InputDecoration(labelText: 'Método de pago'),
                items: const [
                  DropdownMenuItem(value: 'EFECTIVO', child: Text('Efectivo')),
                  DropdownMenuItem(value: 'TRANSFERENCIA', child: Text('Transferencia')),
                  DropdownMenuItem(value: 'BINANCE', child: Text('Binance')),
                  DropdownMenuItem(value: 'OTRO', child: Text('Otro')),
                ],
                onChanged: (valor) => setModalState(() => metodo = valor ?? 'EFECTIVO'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: referenciaController,
                decoration: const InputDecoration(
                  labelText: 'Referencia (opcional)',
                  prefixIcon: Icon(Icons.tag),
                ),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: () => Navigator.of(context).pop(true),
                child: const Text('Confirmar pago'),
              ),
            ],
          ),
        ),
      ),
    );

    if (confirmado != true) return;

    final monto = double.tryParse(montoController.text.replaceAll(',', '.')) ?? 0;
    if (monto <= 0 || monto > credito.saldo + 0.01) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Ingresa un monto entre 0.01 y ${formatearMoneda(credito.saldo)}'),
            backgroundColor: AppColors.danger,
          ),
        );
      }
      return;
    }

    try {
      final resultado = await ApiService.instancia.registrarPago(
        creditoId: credito.id,
        monto: monto,
        metodoPago: metodo,
        referencia: referenciaController.text.trim().isEmpty ? null : referenciaController.text.trim(),
      );

      if (!mounted) return;

      final pagado = resultado['estado']?.toString() == 'PAGADO';

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(pagado ? '¡Crédito saldado por completo! 🏆' : 'Pago registrado correctamente'),
          backgroundColor: AppColors.success,
        ),
      );

      await _cargar();
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.mensaje), backgroundColor: AppColors.danger),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final credito = _credito;

    return Scaffold(
      appBar: AppBar(
        title: Text(credito?.facturaNumero != null ? 'Factura ${credito!.facturaNumero}' : 'Detalle'),
        actions: [
          if (credito != null && credito.puedePagar)
            IconButton(
              onPressed: _registrarPago,
              icon: const Icon(Icons.payments_outlined),
              tooltip: 'Registrar pago',
            ),
        ],
      ),
      body: _cargando
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : credito == null
                  ? const EmptyState(titulo: 'Crédito no disponible')
                  : ListView(
                      padding: const EdgeInsets.all(16),
                      children: [
                        Card(
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      '${credito.esPollos ? '🐔 Pollos' : '🐷 Cerdos'} x${credito.cantidad}',
                                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                                    ),
                                    EstadoBadge(estado: credito.estado),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                BarraProgreso(porcentaje: credito.totales?.porcentajePagado ?? 0),
                                const SizedBox(height: 8),
                                Text(
                                  'Pagado ${(credito.totales?.porcentajePagado ?? 0).toStringAsFixed(1)}%',
                                  style: const TextStyle(fontSize: 12, color: AppColors.ink500),
                                ),
                              ],
                            ),
                          ),
                        ),

                        const SizedBox(height: 12),

                        Card(
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              children: [
                                _Fila('Valor unitario', formatearMoneda(credito.valorUnitario)),
                                _Fila('Monto financiado', formatearMoneda(credito.totales?.montoTotal ?? credito.montoTotal)),
                                _Fila(
                                  'Interés (${credito.totales?.tasaInteres.toStringAsFixed(0) ?? credito.tasaInteres.toStringAsFixed(0)}%)',
                                  formatearMoneda(credito.totales?.intereses ?? 0),
                                ),
                                const Divider(height: 20),
                                _Fila(
                                  'Total a pagar',
                                  formatearMoneda(credito.totales?.totalPagar ?? credito.montoTotal),
                                  destacado: true,
                                ),
                                _Fila('Pagado', formatearMoneda(credito.totales?.montoPagado ?? 0)),
                                _Fila(
                                  'Saldo pendiente',
                                  formatearMoneda(credito.saldo),
                                  color: credito.saldo > 0 ? AppColors.danger : AppColors.success,
                                ),
                              ],
                            ),
                          ),
                        ),

                        const SizedBox(height: 12),

                        Card(
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              children: [
                                _Fila('Solicitud', formatearFecha(credito.fechaSolicitud)),
                                _Fila('Entrega', formatearFecha(credito.fechaEntrega)),
                                _Fila('Vencimiento', formatearFecha(credito.fechaVencimiento)),
                              ],
                            ),
                          ),
                        ),

                        if (credito.motivoRechazo != null) ...[
                          const SizedBox(height: 12),
                          Card(
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Motivo del rechazo',
                                    style: TextStyle(fontWeight: FontWeight.w600, color: AppColors.danger),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(credito.motivoRechazo!),
                                ],
                              ),
                            ),
                          ),
                        ],

                        const SizedBox(height: 20),
                        const Text(
                          'Pagos registrados',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 8),

                        if (credito.pagos.isEmpty)
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 16),
                            child: Center(child: Text('Aún no hay pagos registrados')),
                          )
                        else
                          ...credito.pagos.map(
                            (pago) => Card(
                              child: ListTile(
                                leading: const Icon(Icons.payments_outlined, color: AppColors.success),
                                title: Text(formatearMoneda(pago.monto)),
                                subtitle: Text(
                                  '${pago.metodoPago} · ${formatearFechaHora(pago.fechaPago)}'
                                  '${pago.referencia != null ? ' · ${pago.referencia}' : ''}',
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
    );
  }
}

class _Fila extends StatelessWidget {
  final String etiqueta;
  final String valor;
  final bool destacado;
  final Color? color;

  const _Fila(this.etiqueta, this.valor, {this.destacado = false, this.color});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            etiqueta,
            style: TextStyle(
              color: destacado ? AppColors.ink900 : AppColors.ink500,
              fontWeight: destacado ? FontWeight.w600 : FontWeight.normal,
              fontSize: destacado ? 15 : 13,
            ),
          ),
          Text(
            valor,
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: destacado ? 17 : 14,
              color: color ?? (destacado ? AppColors.brand : AppColors.ink900),
            ),
          ),
        ],
      ),
    );
  }
}
