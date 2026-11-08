import 'package:flutter/material.dart';

import '../models/models.dart';
import '../theme/app_theme.dart';

/// Tarjeta de métrica usada en el panel.
class StatCard extends StatelessWidget {
  final String titulo;
  final String valor;
  final IconData icono;
  final Color color;
  final String? subtitulo;

  const StatCard({
    super.key,
    required this.titulo,
    required this.valor,
    required this.icono,
    required this.color,
    this.subtitulo,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withOpacity(.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icono, color: color, size: 18),
            ),
            const SizedBox(height: 10),
            Text(
              valor,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 2),
            Text(titulo, style: const TextStyle(fontSize: 12, color: AppColors.ink500)),
            if (subtitulo != null) ...[
              const SizedBox(height: 2),
              Text(subtitulo!, style: const TextStyle(fontSize: 11, color: AppColors.ink500)),
            ],
          ],
        ),
      ),
    );
  }
}

/// Chip de estado del crédito.
class EstadoBadge extends StatelessWidget {
  final EstadoCredito estado;

  const EstadoBadge({super.key, required this.estado});

  @override
  Widget build(BuildContext context) {
    final color = Color(estado.color);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        '${estado.emoji} ${estado.etiqueta}',
        style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600),
      ),
    );
  }
}

/// Estado vacío reutilizable.
class EmptyState extends StatelessWidget {
  final String titulo;
  final String? descripcion;
  final IconData icono;
  final Widget? accion;

  const EmptyState({
    super.key,
    required this.titulo,
    this.descripcion,
    this.icono = Icons.inbox_outlined,
    this.accion,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.ink200.withOpacity(.5),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(icono, size: 32, color: AppColors.ink500),
            ),
            const SizedBox(height: 16),
            Text(titulo, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
            if (descripcion != null) ...[
              const SizedBox(height: 6),
              Text(
                descripcion!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppColors.ink500, fontSize: 13),
              ),
            ],
            if (accion != null) ...[const SizedBox(height: 16), accion!],
          ],
        ),
      ),
    );
  }
}

/// Barra de progreso de pago.
class BarraProgreso extends StatelessWidget {
  final double porcentaje;
  final Color color;

  const BarraProgreso({super.key, required this.porcentaje, this.color = AppColors.brand});

  @override
  Widget build(BuildContext context) {
    final valor = porcentaje.clamp(0, 100) / 100;
    return ClipRRect(
      borderRadius: BorderRadius.circular(8),
      child: LinearProgressIndicator(
        value: valor,
        minHeight: 8,
        backgroundColor: AppColors.ink200,
        valueColor: AlwaysStoppedAnimation<Color>(valor >= 1 ? AppColors.success : color),
      ),
    );
  }
}
