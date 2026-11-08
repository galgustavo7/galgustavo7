import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../config/app_config.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import 'home_shell.dart';
import 'registro_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _ocultarPassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _ingresar() async {
    if (!_formKey.currentState!.validate()) return;
    FocusScope.of(context).unfocus();

    final auth = context.read<AuthProvider>();
    final ok = await auth.login(_emailController.text, _passwordController.text);

    if (!mounted) return;

    if (ok) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const HomeShell()),
      );
      return;
    }

    final error = auth.error ?? 'No pudimos iniciar sesión';
    final noVerificado = error.contains('verificar');

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(error),
        backgroundColor: AppColors.danger,
        action: noVerificado
            ? SnackBarAction(
                label: 'Reenviar',
                textColor: Colors.white,
                onPressed: () async {
                  try {
                    await ApiService.instancia.post(
                      '/auth/reenviar-verificacion',
                      body: {'email': _emailController.text.trim()},
                    );
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Correo de verificación reenviado')),
                      );
                    }
                  } on ApiException catch (e) {
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.mensaje)));
                    }
                  }
                },
              )
            : null,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cargando = context.watch<AuthProvider>().cargando;

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 32),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [AppColors.accent, AppColors.accentLight]),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text('🐔', style: TextStyle(fontSize: 40)),
              ),
              const SizedBox(height: 24),
              const Text(
                'Bienvenido',
                style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 6),
              const Text(
                'Ingresa para gestionar tus créditos de pollos y cerdos',
                style: TextStyle(color: AppColors.ink500, fontSize: 14),
              ),
              const SizedBox(height: 32),

              Form(
                key: _formKey,
                child: Column(
                  children: [
                    TextFormField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(
                        labelText: 'Correo electrónico',
                        prefixIcon: Icon(Icons.mail_outline),
                      ),
                      validator: (valor) {
                        if (valor == null || valor.isEmpty) return 'Ingresa tu correo';
                        if (!valor.contains('@')) return 'Correo inválido';
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _passwordController,
                      obscureText: _ocultarPassword,
                      decoration: InputDecoration(
                        labelText: 'Contraseña',
                        prefixIcon: const Icon(Icons.lock_outline),
                        suffixIcon: IconButton(
                          icon: Icon(_ocultarPassword ? Icons.visibility_off : Icons.visibility),
                          onPressed: () => setState(() => _ocultarPassword = !_ocultarPassword),
                        ),
                      ),
                      validator: (valor) =>
                          (valor == null || valor.length < 6) ? 'Mínimo 6 caracteres' : null,
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: cargando ? null : _ingresar,
                child: cargando
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Ingresar'),
              ),

              const SizedBox(height: 16),
              TextButton(
                onPressed: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const RegistroScreen()),
                ),
                child: const RichText(
                  text: TextSpan(
                    style: TextStyle(color: AppColors.ink500, fontSize: 14),
                    children: [
                      TextSpan(text: '¿No tienes cuenta? '),
                      TextSpan(
                        text: 'Regístrate',
                        style: TextStyle(color: AppColors.brand, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.ink200.withOpacity(.4),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Cuentas de demostración',
                      style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                    ),
                    const SizedBox(height: 8),
                    const Text('admin@polloskeny.com / AdminKeny2026!', style: TextStyle(fontSize: 12)),
                    const Text('maria.rodriguez@ejemplo.com / Emprendedor2026!', style: TextStyle(fontSize: 12)),
                    const SizedBox(height: 8),
                    Text(
                      'API: ${AppConfig.apiBaseUrl}',
                      style: const TextStyle(fontSize: 11, color: AppColors.ink500),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
