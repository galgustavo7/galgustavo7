import 'package:flutter/material.dart';

import '../config/app_config.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

/// Solicitud de un nuevo crédito con simulación en vivo.
class SolicitarScreen extends StatefulWidget {
  const SolicitarScreen({super.key});

  @override
  State<SolicitarScreen> createState() => _SolicitarScreenState();
}

class _SolicitarScreenState extends State<SolicitarScreen> {
  final _formKey = GlobalKey<FormState>();
  final _cantidad = TextEditingController(text: '100');
  final _notas = TextEditingController();

  String _tipo = 'POLLOS';
  bool _enviando = false;

  @override
  void dispose() {
    _cantidad.dispose();
    _notas.dispose();
    super.dispose();
  }

  double get _precioUnitario =>
      _tipo == 'POLLOS' ? AppConfig.precioPollo : AppConfig.precioCerdo;

  int get _unidades => int.tryParse(_cantidad.text) ?? 0;
  double get _monto => _unidades * _precioUnitario;
  double get _intereses => _monto * (AppConfig.tasaInteres / 100);
  double get _total => _monto + _intereses;

  Future<void> _enviar() async {
    if (!_formKey.currentState!.validate()) return;
    FocusScope.of(context).unfocus();

    setState(() => _enviando = true);

    try {
      await ApiService.instancia.solicitarCredito(
        tipo: _tipo,
        cantidad: _unidades,
        notas: _notas.text.trim().isEmpty ? null : _notas.text.trim(),
      );

      if (!mounted) return;

      await showDialog<void>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Solicitud enviada 🎉'),
          content: Text(
            'Registramos tu solicitud de $_unidades ${_tipo == 'POLLOS' ? 'pollos' : 'cerdos'} '
            'por ${formatearMoneda(_monto)}. Te avisaremos por correo cuando sea aprobada.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Entendido'),
            ),
          ],
        ),
      );

      if (!mounted) return;
      _cantidad.text = '100';
      _notas.clear();
      setState(() {});
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.mensaje), backgroundColor: AppColors.danger),
      );
    } finally {
      if (mounted) setState(() => _enviando = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Solicitar crédito')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  '¿Qué vas a financiar?',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 12),

                Row(
                  children: [
                    Expanded(
                      child: _TipoSelector(
                        emoji: '🐔',
                        titulo: 'Pollos',
                        subtitulo: '${formatearMoneda(AppConfig.precioPollo)} c/u',
                        seleccionado: _tipo == 'POLLOS',
                        color: AppColors.accent,
                        onTap: () => setState(() => _tipo = 'POLLOS'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _TipoSelector(
                        emoji: '🐷',
                        titulo: 'Cerdos',
                        subtitulo: '${formatearMoneda(AppConfig.precioCerdo)} c/u',
                        seleccionado: _tipo == 'CERDOS',
                        color: const Color(0xFFEC4899),
                        onTap: () => setState(() => _tipo = 'CERDOS'),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 20),

                TextFormField(
                  controller: _cantidad,
                  keyboardType: TextInputType.number,
                  onChanged: (_) => setState(() {}),
                  decoration: InputDecoration(
                    labelText: 'Cantidad de ${_tipo == 'POLLOS' ? 'pollos' : 'cerdos'}',
                    prefixIcon: const Icon(Icons.numbers_outlined),
                  ),
                  validator: (valor) {
                    final numero = int.tryParse(valor ?? '');
                    if (numero == null || numero <= 0) return 'Ingresa una cantidad válida';
                    if (numero > (_tipo == 'POLLOS' ? 2000 : 200)) return 'Supera el máximo permitido';
                    return null;
                  },
                ),

                const SizedBox(height: 14),

                TextFormField(
                  controller: _notas,
                  maxLines: 3,
                  decoration: const InputDecoration(
                    labelText: 'Notas (opcional)',
                    alignLabelWithHint: true,
                    prefixIcon: Icon(Icons.notes_outlined),
                  ),
                ),

                const SizedBox(height: 20),

                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: AppColors.ink200),
                  ),
                  child: Column(
                    children: [
                      _LineaSimulacion(
                        etiqueta: '$_unidades x ${formatearMoneda(_precioUnitario)}',
                        valor: formatearMoneda(_monto),
                      ),
                      _LineaSimulacion(
                        etiqueta: 'Interés (${AppConfig.tasaInteres.toStringAsFixed(0)}%)',
                        valor: formatearMoneda(_intereses),
                      ),
                      const Divider(height: 20),
                      _LineaSimulacion(
                        etiqueta: 'Total a pagar',
                        valor: formatearMoneda(_total),
                        destacado: true,
                      ),
                      _LineaSimulacion(
                        etiqueta: 'Plazo',
                        valor: '${AppConfig.plazoDias} días',
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                ElevatedButton(
                  onPressed: _enviando ? null : _enviar,
                  child: _enviando
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Text('Enviar solicitud'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _TipoSelector extends StatelessWidget {
  final String emoji;
  final String titulo;
  final String subtitulo;
  final bool seleccionado;
  final Color color;
  final VoidCallback onTap;

  const _TipoSelector({
    required this.emoji,
    required this.titulo,
    required this.subtitulo,
    required this.seleccionado,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: seleccionado ? color.withOpacity(.10) : Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: seleccionado ? color : AppColors.ink200, width: seleccionado ? 2 : 1),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(emoji, style: const TextStyle(fontSize: 26)),
            const SizedBox(height: 6),
            Text(titulo, style: const TextStyle(fontWeight: FontWeight.w600)),
            Text(subtitulo, style: const TextStyle(fontSize: 12, color: AppColors.ink500)),
          ],
        ),
      ),
    );
  }
}

class _LineaSimulacion extends StatelessWidget {
  final String etiqueta;
  final String valor;
  final bool destacado;

  const _LineaSimulacion({
    required this.etiqueta,
    required this.valor,
    this.destacado = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
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
              fontSize: destacado ? 18 : 14,
              fontWeight: FontWeight.bold,
              color: destacado ? AppColors.brand : AppColors.ink900,
            ),
          ),
        ],
      ),
    );
  }
}
