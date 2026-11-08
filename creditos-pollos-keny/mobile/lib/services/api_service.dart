import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

import '../config/app_config.dart';

/// Error tipificado de la API.
class ApiException implements Exception {
  final String mensaje;
  final String? codigo;
  final int? statusCode;

  const ApiException(this.mensaje, {this.codigo, this.statusCode});

  @override
  String toString() => mensaje;
}

/// Cliente HTTP de la API de Créditos Pollos Keny.
class ApiService {
  ApiService._();

  static final ApiService instancia = ApiService._();
  static const _storage = FlutterSecureStorage();

  static const _keyToken = 'keny_token';
  static const _keyRefresh = 'keny_refresh';
  static const _keyUsuario = 'keny_usuario';

  String? _token;

  String? get token => _token;

  Future<void> init() async {
    _token = await _storage.read(key: _keyToken);
  }

  Future<void> guardarSesion({
    required String accessToken,
    String? refreshToken,
    Map<String, dynamic>? usuario,
  }) async {
    _token = accessToken;
    await _storage.write(key: _keyToken, value: accessToken);
    if (refreshToken != null) {
      await _storage.write(key: _keyRefresh, value: refreshToken);
    }
    if (usuario != null) {
      await _storage.write(key: _keyUsuario, value: jsonEncode(usuario));
    }
  }

  Future<String?> get refreshToken => _storage.read(key: _keyRefresh);

  Future<Map<String, dynamic>? usuarioGuardado() async {
    final raw = await _storage.read(key: _keyUsuario);
    if (raw == null) return null;
    try {
      return jsonDecode(raw) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  Future<void> cerrarSesion() async {
    _token = null;
    await _storage.delete(key: _keyToken);
    await _storage.delete(key: _keyRefresh);
    await _storage.delete(key: _keyUsuario);
  }

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (_token != null) 'Authorization': 'Bearer $_token',
      };

  Uri _uri(String path, [Map<String, dynamic>? query]) {
    final limpio = path.startsWith('/') ? path.substring(1) : path;
    final parametros = <String, String>{};
    query?.forEach((key, value) {
      if (value != null && value.toString().isNotEmpty) {
        parametros[key] = value.toString();
      }
    });
    return Uri.parse('${AppConfig.apiBaseUrl}/$limpio').replace(queryParameters: parametros.isEmpty ? null : parametros);
  }

  dynamic _procesar(http.Response response) {
    final cuerpo = response.body.isEmpty ? <String, dynamic>{} : jsonDecode(response.body);

    if (response.statusCode >= 400) {
      final error = cuerpo is Map ? cuerpo['error'] as Map<String, dynamic>? : null;
      String mensaje = error?['mensaje']?.toString() ?? 'Error inesperado (${response.statusCode})';

      final detalles = error?['detalles'];
      if (detalles is List && detalles.isNotEmpty) {
        mensaje = detalles
            .map((d) => (d as Map)['mensaje']?.toString() ?? '')
            .where((m) => m.isNotEmpty)
            .join('\n');
      }

      throw ApiException(
        mensaje,
        codigo: error?['codigo']?.toString(),
        statusCode: response.statusCode,
      );
    }

    return cuerpo;
  }

  Future<dynamic> get(String path, [Map<String, dynamic>? query]) async {
    final response = await http.get(_uri(path, query), headers: _headers).timeout(AppConfig.timeout);
    return _procesar(response);
  }

  Future<dynamic> post(String path, {Map<String, dynamic>? body}) async {
    final response = await http
        .post(_uri(path), headers: _headers, body: body == null ? null : jsonEncode(body))
        .timeout(AppConfig.timeout);
    return _procesar(response);
  }

  Future<dynamic> patch(String path, {Map<String, dynamic>? body}) async {
    final response = await http
        .patch(_uri(path), headers: _headers, body: jsonEncode(body ?? {}))
        .timeout(AppConfig.timeout);
    return _procesar(response);
  }

  Future<dynamic> delete(String path) async {
    final response = await http.delete(_uri(path), headers: _headers).timeout(AppConfig.timeout);
    return _procesar(response);
  }

  /// Intenta refrescar el access token. Devuelve `true` si lo consigue.
  Future<bool> refrescarToken() async {
    final refresh = await refreshToken;
    if (refresh == null) return false;

    try {
      final data = await post('/auth/refresh', body: {'refreshToken': refresh});
      final accessToken = (data as Map)['accessToken']?.toString();
      if (accessToken == null) return false;
      await guardarSesion(accessToken: accessToken, refreshToken: refresh);
      return true;
    } on ApiException {
      return false;
    }
  }

  /* ======================= Endpoints ======================= */

  Future<Map<String, dynamic>> login(String email, String password) async {
    final data = await post('/auth/login', body: {'email': email, 'password': password});
    return Map<String, dynamic>.from(data as Map);
  }

  Future<Map<String, dynamic>> registro(Map<String, dynamic> datos) async {
    final data = await post('/auth/registro', body: datos);
    return Map<String, dynamic>.from(data as Map);
  }

  Future<Map<String, dynamic>> perfil() async {
    final data = await get('/auth/me');
    return Map<String, dynamic>.from((data as Map)['usuario'] as Map);
  }

  Future<Map<String, dynamic>> miResumen() async {
    final data = await get('/dashboard/mi-resumen');
    return Map<String, dynamic>.from(data as Map);
  }

  Future<Map<String, dynamic>> solicitarCredito({
    required String tipo,
    required int cantidad,
    String? notas,
  }) async {
    final data = await post('/creditos/solicitar', body: {
      'tipo': tipo,
      'cantidad': cantidad,
      if (notas != null && notas.isNotEmpty) 'notas': notas,
    });
    return Map<String, dynamic>.from((data as Map)['credito'] as Map);
  }

  Future<List<CreditoItem>> misCreditos({String? estado}) async {
    final data = await get('/creditos', {
      'limit': 50,
      if (estado != null) 'estado': estado,
    });
    final lista = (data as Map)['data'] as List? ?? [];
    return lista.map((item) => CreditoItem.fromJson(item as Map<String, dynamic>)).toList();
  }

  Future<Map<String, dynamic>> registrarPago({
    required String creditoId,
    required double monto,
    String metodoPago = 'EFECTIVO',
    String? referencia,
  }) async {
    final data = await post('/creditos/$creditoId/pagos', body: {
      'monto': monto,
      'metodoPago': metodoPago,
      if (referencia != null) 'referencia': referencia,
    });
    return Map<String, dynamic>.from(data as Map);
  }
}

/// Elemento simple de crédito usado en los listados.
class CreditoItem {
  final String id;
  final String tipo;
  final int cantidad;
  final double montoTotal;
  final String estado;
  final String? facturaNumero;
  final String fechaVencimiento;
  final double saldoPendiente;
  final double totalPagar;

  const CreditoItem({
    required this.id,
    required this.tipo,
    required this.cantidad,
    required this.montoTotal,
    required this.estado,
    this.facturaNumero,
    required this.fechaVencimiento,
    required this.saldoPendiente,
    required this.totalPagar,
  });

  factory CreditoItem.fromJson(Map<String, dynamic> json) {
    final totales = json['totales'] as Map<String, dynamic>?;
    return CreditoItem(
      id: json['id']?.toString() ?? '',
      tipo: json['tipo']?.toString() ?? 'POLLOS',
      cantidad: (json['cantidad'] as num?)?.toInt() ?? 0,
      montoTotal: (json['monto_total'] as num?)?.toDouble() ?? 0,
      estado: json['estado']?.toString() ?? 'SOLICITADO',
      facturaNumero: json['factura_numero']?.toString(),
      fechaVencimiento: json['fecha_vencimiento']?.toString() ?? '',
      saldoPendiente: (totales?['saldoPendiente'] as num?)?.toDouble() ?? 0,
      totalPagar: (totales?['totalPagar'] as num?)?.toDouble() ?? 0,
    );
  }
}
