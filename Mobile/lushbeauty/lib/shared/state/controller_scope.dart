import 'package:material_ui/material_ui.dart';

/// Expone un `ChangeNotifier` a los widgets descendientes sin dependencias externas.
class ControllerScope<T extends ChangeNotifier> extends InheritedNotifier<T> {
  const ControllerScope({super.key, required T controller, required super.child})
      : super(notifier: controller);

  static T of<T extends ChangeNotifier>(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<ControllerScope<T>>();
    assert(scope != null, 'No hay ControllerScope<$T> sobre este contexto');
    return scope!.notifier!;
  }

  /// Lee el controlador sin suscribirse; válido en `initState`.
  static T read<T extends ChangeNotifier>(BuildContext context) {
    final scope = context.getInheritedWidgetOfExactType<ControllerScope<T>>();
    assert(scope != null, 'No hay ControllerScope<$T> sobre este contexto');
    return scope!.notifier!;
  }
}
