import 'package:material_ui/material_ui.dart';

/// Estado de conexión que muestran las pantallas. Lo alimenta el módulo `offline`.
class ConnectionInfo {
  const ConnectionInfo({required this.online, required this.pending});
  final bool online;
  final int pending;
}

class ConnectionScope extends InheritedWidget {
  const ConnectionScope({super.key, required this.info, required super.child});
  final ConnectionInfo info;

  static ConnectionInfo of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<ConnectionScope>();
    return scope?.info ?? const ConnectionInfo(online: true, pending: 0);
  }

  @override
  bool updateShouldNotify(ConnectionScope oldWidget) =>
      info.online != oldWidget.info.online || info.pending != oldWidget.info.pending;
}
