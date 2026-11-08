import 'package:flutter/foundation.dart';

import '../models/models.dart';
import '../services/api_service.dart';

/// Estado de autenticación de la app.
class AuthProvider with ChangeNotifier {
  final ApiService _api = ApiService.instancia;

  Usuario? _usuario;
  bool _cargando = false;
  bool _inicializado = false;
  String? _error;

  Usuario? get usuario => _usuario;
  bool get cargando => _cargando;
  bool get inicializado => _inicializado;
  String? get error => _error;
  bool get autenticado => _usuario != null;

  /// Restaura la sesión guardada al arrancar la app.
  Future<void> cargarSesion() async {
    if (_inicializado) return;

    await _api.init();
    final guardado = await _api.usuarioGuardado();

    if (guardado != null && _api.token != null) {
      _usuario = Usuario.fromJson(guardado);
      try {
        final perfil = await _api.perfil();
        _usuario = Usuario.fromJson(perfil);
      } on ApiException {
        // Si el token expiró intentamos refrescarlo una vez
        final ok = await _api.refrescarToken();
        if (!ok) await _api.cerrarSesion();
      } catch (_) {
        // Sin conexión: mantenemos los datos en caché
      }
    }

    _inicializado = true;
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _cargando = true;
    _error = null;
    notifyListeners();

    try {
      final data = await _api.login(email.trim(), password);
      final accessToken = data['accessToken']?.toString() ?? '';
      final refreshToken = data['refreshToken']?.toString();
      final usuarioJson = Map<String, dynamic>.from(data['usuario'] as Map? ?? {});

      await _api.guardarSesion(
        accessToken: accessToken,
        refreshToken: refreshToken,
        usuario: usuarioJson,
      );

      _usuario = Usuario.fromJson(usuarioJson);
      return true;
    } on ApiException catch (e) {
      _error = e.mensaje;
      return false;
    } catch (_) {
      _error = 'No pudimos conectar con el servidor. Revisa tu conexión.';
      return false;
    } finally {
      _cargando = false;
      notifyListeners();
    }
  }

  Future<bool> registrar(Map<String, dynamic> datos) async {
    _cargando = true;
    _error = null;
    notifyListeners();

    try {
      await _api.registro(datos);
      return true;
    } on ApiException catch (e) {
      _error = e.mensaje;
      return false;
    } catch (_) {
      _error = 'No pudimos conectar con el servidor.';
      return false;
    } finally {
      _cargando = false;
      notifyListeners();
    }
  }

  Future<void> actualizarPerfil() async {
    try {
      final perfil = await _api.perfil();
      _usuario = Usuario.fromJson(perfil);
      notifyListeners();
    } catch (_) {
      // silencioso
    }
  }

  Future<void> logout() async {
    await _api.cerrarSesion();
    _usuario = null;
    notifyListeners();
  }
}
