import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../theme/app_theme.dart';

class RegistroScreen extends StatefulWidget {
  const RegistroScreen({super.key});

  @override
  State<RegistroScreen> createState() => _RegistroScreenState();
}

class _RegistroScreenState extends State<RegistroScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nombre = TextEditingController();
  final _email = TextEditingController();
  final _cedula = TextEditingController();
  final _telefono = TextEditingController();
  final _ubicacion = TextEditingController();
  final _password = TextEditingController();
  String _actividad = 'AVICOLA';
  bool _enviado = false;

  @override
  void dispose() {
    for (final controller in [_nombre, _email, _cedula, _telefono, _ubicacion, _password]) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _registrar() async {
    if (!_formKey.currentState!.validate()) return;
    FocusScope.of(context).unfocus();

    final auth = context.read<AuthProvider>();
    final ok = await auth.registrar({
      'nombre': _nombre.text.trim(),
      'email': _email.text.trim(),
      'password': _password.text,
      'cedula': _cedula.text.trim(),
      'telefono': _telefono.text.trim(),
      'ubicacion': _ubicacion.text.trim(),
      'actividad': _actividad,
    });

    if (!mounted) return;

    if (ok) {
      setState(() => _enviado = true);
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(auth.error ?? 'No se pudo completar el registro'), backgroundColor: AppColors.danger),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cargando = context.watch<AuthProvider>().cargando;

    if (_enviado) {
      return Scaffold(
        appBar: AppBar(title: const Text('Registro')),
        body: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.success.withOpacity(.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Icon(Icons.mark_email_read_outlined, size: 48, color: AppColors.success),
              ),
              const SizedBox(height: 24),
              const Text(
                '¡Revisa tu correo!',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text(
                'Te enviamos un enlace para verificar tu cuenta. Después de confirmarlo ya podrás solicitar créditos.',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.ink500),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Volver al login'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Crear cuenta')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextFormField(
                  controller: _nombre,
                  decoration: const InputDecoration(labelText: 'Nombre completo', prefixIcon: Icon(Icons.person_outline)),
                  validator: (v) => (v == null || v.trim().length < 3) ? 'Nombre obligatorio' : null,
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _email,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(labelText: 'Correo electrónico', prefixIcon: Icon(Icons.mail_outline)),
                  validator: (v) => (v == null || !v.contains('@')) ? 'Correo inválido' : null,
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _cedula,
                  decoration: const InputDecoration(labelText: 'Cédula / RIF', prefixIcon: Icon(Icons.badge_outlined)),
                  validator: (v) => (v == null || v.trim().length < 5) ? 'Cédula inválida' : null,
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _telefono,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(labelText: 'Teléfono', prefixIcon: Icon(Icons.phone_outlined)),
                  validator: (v) => (v == null || v.trim().length < 6) ? 'Teléfono inválido' : null,
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _ubicacion,
                  decoration: const InputDecoration(labelText: 'Ubicación de la granja', prefixIcon: Icon(Icons.place_outlined)),
                ),
                const SizedBox(height: 14),
                DropdownButtonFormField<String>(
                  value: _actividad,
                  decoration: const InputDecoration(labelText: 'Actividad principal'),
                  items: const [
                    DropdownMenuItem(value: 'AVICOLA', child: Text('🐔 Avícola')),
                    DropdownMenuItem(value: 'PORCICOLA', child: Text('🐷 Porcícola')),
                    DropdownMenuItem(value: 'MIXTA', child: Text('🐔🐷 Mixta')),
                  ],
                  onChanged: (valor) => setState(() => _actividad = valor ?? 'AVICOLA'),
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _password,
                  obscureText: true,
                  decoration: const InputDecoration(labelText: 'Contraseña', prefixIcon: Icon(Icons.lock_outline)),
                  validator: (v) => (v == null || v.length < 6) ? 'Mínimo 6 caracteres' : null,
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: cargando ? null : _registrar,
                  child: cargando
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Text('Crear mi cuenta'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
