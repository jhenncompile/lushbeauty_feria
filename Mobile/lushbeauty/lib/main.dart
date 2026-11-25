import 'package:flutter/foundation.dart';
import 'package:material_ui/material_ui.dart';

import 'app/app.dart';
import 'modules/identity/identity.dart';

/// Para demos y capturas: `--dart-define=LUSH_DEMO_ROLE=administradora|especialista`
/// salta el ingreso con un usuario sintético. Sin el valor, la app arranca en el ingreso.
const _demoRole = String.fromEnvironment('LUSH_DEMO_ROLE');

void main() {
  final session = switch (_demoRole) {
    'administradora' => const Session('marisol', Role.administradora),
    'especialista' => const Session('paty', Role.especialista),
    _ => null,
  };
  runApp(
    LushApp(
      initialSession: session,
      // El conmutador de conexión simulada solo aparece en modo debug.
      showDevToggle: kDebugMode,
    ),
  );
}
