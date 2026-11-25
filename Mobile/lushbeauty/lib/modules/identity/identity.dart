/// Contrato público de `identity`: sesión, roles y especialistas.
library;

import 'package:material_ui/material_ui.dart';

import '../../shared/routes.dart';

export 'pages/login_page.dart';

enum Role { administradora, especialista }

class Session {
  const Session(this.userName, this.role);
  final String userName;
  final Role role;
}

class Specialist {
  const Specialist(this.id, this.name);
  final String id;
  final String name;
}

/// Nombres sintéticos del diseño; no son datos reales del salón.
List<Specialist> listSpecialists() => const [
      Specialist('paty', 'Paty'),
      Specialist('katherine', 'Katherine'),
      Specialist('marisol', 'Marisol'),
    ];

String homeRouteFor(Role role) => role == Role.administradora ? Routes.home : Routes.register;

/// Sesión en memoria (simulada). Con el backend vendrá del servidor.
class SessionController extends ChangeNotifier {
  Session? _session;
  Session? get session => _session;

  void signIn(Session session) {
    _session = session;
    notifyListeners();
  }

  void signOut() {
    _session = null;
    notifyListeners();
  }
}
