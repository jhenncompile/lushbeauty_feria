import 'package:material_ui/material_ui.dart';

import '../modules/cashier/cashier.dart';
import '../modules/identity/identity.dart';
import '../modules/offline/offline.dart';
import '../modules/payroll/payroll.dart';
import '../modules/sales/sales.dart';
import '../shared/connection.dart';
import '../shared/routes.dart';
import '../shared/state/controller_scope.dart';
import '../shared/theme/theme.dart';
import '../shared/theme/tokens.dart';

/// Raíz de la app: compone los controladores de cada módulo y las rutas.
/// Los parámetros permiten a las pruebas partir de un estado conocido.
class LushApp extends StatefulWidget {
  const LushApp({super.key, this.online = true, this.initialQueue = const [], this.initialSession, this.initialRoute = Routes.login, this.showDevToggle = false});

  final bool online;
  final List<QueueItem> initialQueue;
  final Session? initialSession;
  final String initialRoute;

  /// Muestra un botón para simular la conexión (solo demos en debug).
  final bool showDevToggle;

  @override
  State<LushApp> createState() => _LushAppState();
}

class _LushAppState extends State<LushApp> {
  late final SessionController _session;
  late final OfflineController _offline;
  late final SalesController _sales;
  late final CashController _cash;

  @override
  void initState() {
    super.initState();
    _session = SessionController();
    if (widget.initialSession != null) _session.signIn(widget.initialSession!);
    _offline = OfflineController(online: widget.online, initialQueue: widget.initialQueue);
    _sales = SalesController(offline: _offline);
    _cash = CashController(offline: _offline);
  }

  @override
  void dispose() {
    _cash.dispose();
    _sales.dispose();
    _offline.dispose();
    _session.dispose();
    super.dispose();
  }

  static final _routes = <String, WidgetBuilder>{
    Routes.login: (_) => const LoginPage(),
    Routes.home: (_) => const HoyPage(),
    Routes.register: (_) => const RegistrarPage(),
    Routes.discount: (_) => const DescuentoPage(),
    Routes.saved: (_) => const GuardadoPage(),
    Routes.myPayroll: (_) => const MiLiquidacionPage(),
    Routes.cashClose: (_) => const CierreCajaPage(),
    Routes.sync: (_) => const SincronizacionPage(),
  };

  // Rutas que solo puede abrir la administradora. Una especialista vuelve a su inicio.
  static const _adminOnly = {Routes.home, Routes.cashClose};

  Route<dynamic> _onGenerateRoute(RouteSettings settings) {
    var name = settings.name ?? Routes.login;
    final role = _session.session?.role;
    if (name != Routes.login && role == null) {
      name = Routes.login;
    } else if (role == Role.especialista && _adminOnly.contains(name)) {
      name = homeRouteFor(role!);
    } else if (role == Role.administradora && name == Routes.myPayroll) {
      name = Routes.home;
    }
    return PageRouteBuilder<void>(
      settings: RouteSettings(name: name),
      pageBuilder: (context, _, _) => (_routes[name] ?? _routes[Routes.login]!)(context),
      transitionDuration: Duration.zero,
      reverseTransitionDuration: Duration.zero,
    );
  }

  @override
  Widget build(BuildContext context) {
    return ControllerScope<SessionController>(
      controller: _session,
      child: ControllerScope<OfflineController>(
        controller: _offline,
        child: ControllerScope<SalesController>(
          controller: _sales,
          child: ControllerScope<CashController>(
            controller: _cash,
            child: ListenableBuilder(
              listenable: _offline,
              builder: (context, child) => ConnectionScope(info: _offline.info, child: child!),
              child: MaterialApp(
                title: 'Lush Beauty Smart',
                debugShowCheckedModeBanner: false,
                theme: buildLushTheme(),
                initialRoute: widget.initialRoute,
                // Una sola ruta inicial: sin esto Flutter apila «/», «/registrar», etc.
                onGenerateInitialRoutes: (name) => [_onGenerateRoute(RouteSettings(name: name))],
                onGenerateRoute: _onGenerateRoute,
                builder: (context, child) => widget.showDevToggle
                    ? Stack(
                        children: [
                          child!,
                          Positioned(
                            right: 12,
                            bottom: 72,
                            child: ListenableBuilder(
                              listenable: _offline,
                              builder: (context, _) => Material(
                                color: LushColors.surface,
                                child: InkWell(
                                  onTap: () => _offline.simulateOnline(!_offline.online),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                    decoration: BoxDecoration(border: Border.all(color: LushColors.borderStrong)),
                                    child: Text(
                                      (_offline.online ? 'Simular sin conexión' : 'Restablecer conexión').toUpperCase(),
                                      style: LushText.button,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      )
                    : child!,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
