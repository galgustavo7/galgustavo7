# 📱 App móvil — Créditos Pollos Keny

App Flutter para que los **emprendedores** avícolas y porcícolas gestionen sus créditos
desde el celular.

## 🧱 Stack

| Pieza | Tecnología |
|-------|------------|
| UI | Flutter 3.19+ / Dart 3.3+ |
| Estado | `provider` (ChangeNotifier) |
| HTTP | `http` |
| Token | `flutter_secure_storage` |
| Formato | `intl` (moneda y fechas en español) |
| Tipografía | `google_fonts` (Poppins) |

## 📂 Estructura

```
mobile/
├── lib/
│   ├── main.dart               # Arranque + rutas
│   ├── config/app_config.dart  # URL de la API y parámetros de negocio
│   ├── theme/app_theme.dart    # Tema y paleta
│   ├── models/models.dart      # Usuario, Credito, Pago, Resumen + formateo
│   ├── services/api_service.dart
│   ├── providers/auth_provider.dart
│   ├── screens/               # splash, login, registro, inicio, solicitar,
│   │                          # mis créditos, detalle, perfil
│   └── widgets/widgets.dart    # StatCard, EstadoBadge, EmptyState, BarraProgreso
└── pubspec.yaml
```

## 🚀 Puesta en marcha

```bash
cd mobile
flutter pub get
flutter run
```

### Generar las carpetas nativas (solo la primera vez)

Si clonaste el repo sin las carpetas de plataforma:

```bash
flutter create --org com.polloskeny --project-name creditos_pollos_keny .
```

### Apuntar a tu API

La URL base se define por `dart-define` (por defecto `http://10.0.2.2:3000/api`,
que es `localhost` visto desde el emulador de Android):

```bash
# Android emulador
flutter run

# Dispositivo físico o iOS
flutter run --dart-define=API_BASE_URL=http://192.168.1.20:3000/api

# Producción
flutter build apk --dart-define=API_BASE_URL=https://api.polloskeny.com/api
```

En `android/app/src/main/AndroidManifest.xml` debe existir el permiso de internet:

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

## ✨ Funcionalidades

- 🔐 Login con JWT (access + refresh guardados en almacenamiento seguro)
- 📝 Registro de emprendedor con verificación de correo
- 📊 Panel con score crediticio y KPIs (solicitado, saldo, pagado)
- 🐔🐷 Solicitud de créditos de pollos o cerdos con simulación en vivo
- 📄 Listado y detalle de créditos con factura y vencimiento
- 💰 Registro de pagos (efectivo, transferencia, Binance, otro)
- 👤 Perfil con cambio de contraseña y cierre de sesión

## 🔑 Cuentas de demo

| Rol | Correo | Contraseña |
|-----|--------|------------|
| Admin | `admin@polloskeny.com` | `AdminKeny2026!` |
| Emprendedor | `maria.rodriguez@ejemplo.com` | `Emprendedor2026!` |
