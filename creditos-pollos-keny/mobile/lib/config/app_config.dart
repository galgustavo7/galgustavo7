/// Configuración global de la app.
///
/// En un emulador de Android usa `http://10.0.0.2:3000/api`.
/// En iOS Simulator y en escritorio funciona `http://localhost:3000/api`.
class AppConfig {
  const AppConfig._();

  static const String nombreApp = 'Créditos Pollos Keny';
  static const String version = '1.0.0';

  /// URL base de la API (sin barra final).
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000/api',
  );

  /// Duración máxima de las peticiones HTTP.
  static const Duration timeout = Duration(seconds: 20);

  // ---- Parámetros de negocio (se pueden sobreescribir desde /api/parametros) ----
  static const double precioPollo = 3.20;
  static const double precioCerdo = 50.00;
  static const double tasaInteres = 8.0;
  static const int plazoDias = 45;
}
