import 'package:intl/intl.dart';

final NumberFormat _moneda = NumberFormat.currency(
  locale: 'es_VE',
  symbol: r'$',
  decimalDigits: 2,
);

/// Formatea un número como moneda USD.
String formatearMoneda(num valor, {int decimales = 2}) =>
    NumberFormat.currency(locale: 'es_VE', symbol: r'$', decimalDigits: decimales).format(valor);

String formatearMonedaCorta(num valor) =>
    NumberFormat.currency(locale: 'es_VE', symbol: r'$', decimalDigits: 0).format(valor);

String formatearFecha(String? iso) {
  if (iso == null || iso.isEmpty) return '—';
  final fecha = DateTime.tryParse(iso) ?? DateTime.tryParse('${iso.replaceAll(' ', 'T')}Z');
  if (fecha == null) return '—';
  return DateFormat('dd MMM yyyy', 'es').format(fecha.toLocal());
}

String formatearFechaHora(String? iso) {
  if (iso == null || iso.isEmpty) return '—';
  final fecha = DateTime.tryParse(iso) ?? DateTime.tryParse('${iso.replaceAll(' ', 'T')}Z');
  if (fecha == null) return '—';
  return DateFormat('dd/MM/yyyy HH:mm', 'es').format(fecha.toLocal());
}

/// Días restantes hasta la fecha indicada (negativo si ya venció).
int diasRestantes(String? iso) {
  if (iso == null || iso.isEmpty) return 0;
  final fecha = DateTime.tryParse(iso) ?? DateTime.tryParse('${iso.replaceAll(' ', 'T')}Z');
  if (fecha == null) return 0;
  return fecha.difference(DateTime.now()).inDays;
}

enum Rol { superAdmin, admin, emprendedor }

Rol rolFromString(String? valor) {
  switch (valor) {
    case 'SUPER_ADMIN':
      return Rol.superAdmin;
    case 'ADMIN':
      return Rol.admin;
    default:
      return Rol.emprendedor;
  }
}

class Usuario {
  final String id;
  final String nombre;
  final String email;
  final String? telefono;
  final Rol rol;
  final String? emprendedorId;
  final bool emailVerificado;
  final int? scoreCrediticio;

  const Usuario({
    required this.id,
    required this.nombre,
    required this.email,
    this.telefono,
    required this.rol,
    this.emprendedorId,
    this.emailVerificado = false,
    this.scoreCrediticio,
  });

  bool get esAdmin => rol != Rol.emprendedor;

  factory Usuario.fromJson(Map<String, dynamic> json) {
    final emprendedor = json['emprendedor'] as Map<String, dynamic>?;
    return Usuario(
      id: json['id']?.toString() ?? '',
      nombre: json['nombre']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      telefono: json['telefono']?.toString(),
      rol: rolFromString(json['rol']?.toString()),
      emprendedorId: json['emprendedorId']?.toString(),
      emailVerificado: json['emailVerificado'] == true || json['email_verificado'] == 1,
      scoreCrediticio: emprendedor?['score_crediticio'] is num
          ? (emprendedor!['score_crediticio'] as num).toInt()
          : null,
    );
  }
}

enum EstadoCredito { solicitado, aprobado, entregado, pagado, mora, rechazado, cancelado }

EstadoCredito estadoFromString(String? valor) {
  switch (valor) {
    case 'APROBADO':
      return EstadoCredito.aprobado;
    case 'ENTREGADO':
      return EstadoCredito.entregado;
    case 'PAGADO':
      return EstadoCredito.pagado;
    case 'MORA':
      return EstadoCredito.mora;
    case 'RECHAZADO':
      return EstadoCredito.rechazado;
    case 'CANCELADO':
      return EstadoCredito.cancelado;
    default:
      return EstadoCredito.solicitado;
  }
}

extension EstadoCreditoX on EstadoCredito {
  String get etiqueta => switch (this) {
        EstadoCredito.solicitado => 'Solicitado',
        EstadoCredito.aprobado => 'Aprobado',
        EstadoCredito.entregado => 'Entregado',
        EstadoCredito.pagado => 'Pagado',
        EstadoCredito.mora => 'En mora',
        EstadoCredito.rechazado => 'Rechazado',
        EstadoCredito.cancelado => 'Cancelado',
      };

  String get emoji => switch (this) {
        EstadoCredito.solicitado => '⏳',
        EstadoCredito.aprobado => '✅',
        EstadoCredito.entregado => '📦',
        EstadoCredito.pagado => '🏆',
        EstadoCredito.mora => '⚠️',
        EstadoCredito.rechazado => '❌',
        EstadoCredito.cancelado => '🚫',
      };

  int get color => switch (this) {
        EstadoCredito.solicitado => 0xFFF59E0B,
        EstadoCredito.aprobado => 0xFF1E3A8A,
        EstadoCredito.entregado => 0xFF0EA5E9,
        EstadoCredito.pagado => 0xFF10B981,
        EstadoCredito.mora => 0xFFEF4444,
        EstadoCredito.rechazado => 0xFF6B7280,
        EstadoCredito.cancelado => 0xFF9CA3AF,
      };
}

class TotalesCredito {
  final double montoTotal;
  final double tasaInteres;
  final double intereses;
  final double totalPagar;
  final double montoPagado;
  final double saldoPendiente;
  final double porcentajePagado;

  const TotalesCredito({
    required this.montoTotal,
    required this.tasaInteres,
    required this.intereses,
    required this.totalPagar,
    required this.montoPagado,
    required this.saldoPendiente,
    required this.porcentajePagado,
  });

  factory TotalesCredito.fromJson(Map<String, dynamic> json) => TotalesCredito(
        montoTotal: (json['montoTotal'] as num?)?.toDouble() ?? 0,
        tasaInteres: (json['tasaInteres'] as num?)?.toDouble() ?? 0,
        intereses: (json['intereses'] as num?)?.toDouble() ?? 0,
        totalPagar: (json['totalPagar'] as num?)?.toDouble() ?? 0,
        montoPagado: (json['montoPagado'] as num?)?.toDouble() ?? 0,
        saldoPendiente: (json['saldoPendiente'] as num?)?.toDouble() ?? 0,
        porcentajePagado: (json['porcentajePagado'] as num?)?.toDouble() ?? 0,
      );
}

class Pago {
  final String id;
  final double monto;
  final String metodoPago;
  final String? referencia;
  final String fechaPago;

  const Pago({
    required this.id,
    required this.monto,
    required this.metodoPago,
    this.referencia,
    required this.fechaPago,
  });

  factory Pago.fromJson(Map<String, dynamic> json) => Pago(
        id: json['id']?.toString() ?? '',
        monto: (json['monto'] as num?)?.toDouble() ?? 0,
        metodoPago: json['metodo_pago']?.toString() ?? 'EFECTIVO',
        referencia: json['referencia']?.toString(),
        fechaPago: json['fecha_pago']?.toString() ?? '',
      );
}

class Credito {
  final String id;
  final String tipo;
  final int cantidad;
  final double valorUnitario;
  final double montoTotal;
  final double tasaInteres;
  final String fechaSolicitud;
  final String fechaVencimiento;
  final String? fechaEntrega;
  final EstadoCredito estado;
  final String? facturaNumero;
  final String? motivoRechazo;
  final String? emprendedorNombre;
  final TotalesCredito? totales;
  final List<Pago> pagos;

  const Credito({
    required this.id,
    required this.tipo,
    required this.cantidad,
    required this.valorUnitario,
    required this.montoTotal,
    required this.tasaInteres,
    required this.fechaSolicitud,
    required this.fechaVencimiento,
    this.fechaEntrega,
    required this.estado,
    this.facturaNumero,
    this.motivoRechazo,
    this.emprendedorNombre,
    this.totales,
    this.pagos = const [],
  });

  bool get esPollos => tipo == 'POLLOS';
  bool get tieneFactura => facturaNumero != null && facturaNumero!.isNotEmpty;
  bool get puedePagar => estado == EstadoCredito.aprobado ||
      estado == EstadoCredito.entregado ||
      estado == EstadoCredito.mora;

  double get saldo => totales?.saldoPendiente ?? montoTotal;

  factory Credito.fromJson(Map<String, dynamic> json) => Credito(
        id: json['id']?.toString() ?? '',
        tipo: json['tipo']?.toString() ?? 'POLLOS',
        cantidad: (json['cantidad'] as num?)?.toInt() ?? 0,
        valorUnitario: (json['valor_unitario'] as num?)?.toDouble() ?? 0,
        montoTotal: (json['monto_total'] as num?)?.toDouble() ?? 0,
        tasaInteres: (json['tasa_interes'] as num?)?.toDouble() ?? 0,
        fechaSolicitud: json['fecha_solicitud']?.toString() ?? '',
        fechaVencimiento: json['fecha_vencimiento']?.toString() ?? '',
        fechaEntrega: json['fecha_entrega']?.toString(),
        estado: estadoFromString(json['estado']?.toString()),
        facturaNumero: json['factura_numero']?.toString(),
        motivoRechazo: json['motivo_rechazo']?.toString(),
        emprendedorNombre: json['emprendedor_nombre']?.toString(),
        totales: json['totales'] is Map
            ? TotalesCredito.fromJson(Map<String, dynamic>.from(json['totales'] as Map))
            : null,
        pagos: (json['pagos'] as List? ?? [])
            .map((p) => Pago.fromJson(Map<String, dynamic>.from(p as Map)))
            .toList(),
      );
}

class ResumenEmprendedor {
  final int creditos;
  final int activos;
  final int enMora;
  final int pagados;
  final int pendientes;
  final double montoSolicitado;
  final double saldoPendiente;
  final double totalPagado;
  final int? score;
  final List<Credito> ultimosCreditos;

  const ResumenEmprendedor({
    required this.creditos,
    required this.activos,
    required this.enMora,
    required this.pagados,
    required this.pendientes,
    required this.montoSolicitado,
    required this.saldoPendiente,
    required this.totalPagado,
    this.score,
    required this.ultimosCreditos,
  });

  factory ResumenEmprendedor.fromJson(Map<String, dynamic> json) {
    final totales = Map<String, dynamic>.from(json['totales'] as Map? ?? {});
    return ResumenEmprendedor(
      creditos: (totales['creditos'] as num?)?.toInt() ?? 0,
      activos: (totales['activos'] as num?)?.toInt() ?? 0,
      enMora: (totales['enMora'] as num?)?.toInt() ?? 0,
      pagados: (totales['pagados'] as num?)?.toInt() ?? 0,
      pendientes: (totales['pendientes'] as num?)?.toInt() ?? 0,
      montoSolicitado: (totales['montoSolicitado'] as num?)?.toDouble() ?? 0,
      saldoPendiente: (totales['saldoPendiente'] as num?)?.toDouble() ?? 0,
      totalPagado: (totales['totalPagado'] as num?)?.toDouble() ?? 0,
      score: (json['emprendedor'] as Map?)?['score_crediticio'] is num
          ? ((json['emprendedor'] as Map)['score_crediticio'] as num).toInt()
          : null,
      ultimosCreditos: (json['creditos'] as List? ?? [])
          .map((c) => Credito.fromJson(Map<String, dynamic>.from(c as Map)))
          .toList(),
    );
  }
}
