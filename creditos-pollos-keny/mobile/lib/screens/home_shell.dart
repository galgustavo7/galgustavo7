import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import 'inicio_screen.dart';
import 'mis_creditos_screen.dart';
import 'perfil_screen.dart';
import 'solicitar_screen.dart';

/// Contenedor con navegación inferior.
class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _indice = 0;

  static const _pantallas = <Widget>[
    InicioScreen(),
    SolicitarScreen(),
    MisCreditosScreen(),
    PerfilScreen(),
  ];

  void _irACreditos() => setState(() => _indice = 2);

  @override
  Widget build(BuildContext context) {
    final usuario = context.watch<AuthProvider>().usuario;

    return Scaffold(
      body: IndexedStack(index: _indice, children: _pantallas),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _indice,
        onTap: (indice) => setState(() => _indice = indice),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_outlined), activeIcon: Icon(Icons.home), label: 'Inicio'),
          BottomNavigationBarItem(icon: Icon(Icons.egg_outlined), activeIcon: Icon(Icons.egg), label: 'Solicitar'),
          BottomNavigationBarItem(icon: Icon(Icons.receipt_long_outlined), activeIcon: Icon(Icons.receipt_long), label: 'Créditos'),
          BottomNavigationBarItem(icon: Icon(Icons.person_outline), activeIcon: Icon(Icons.person), label: 'Perfil'),
        ],
      ),
      floatingActionButton: usuario?.esAdmin == false && _indice == 0
          ? FloatingActionButton.extended(
              onPressed: _irACreditos,
              icon: const Icon(Icons.visibility_outlined),
              label: const Text('Ver mis créditos'),
            )
          : null,
    );
  }
}
