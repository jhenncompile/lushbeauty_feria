/// Contrato público de `cashier`: cierre de caja diario.
library;

import 'package:material_ui/material_ui.dart';

import '../../shared/money.dart';
import '../offline/offline.dart';
import 'domain/reconcile.dart';

export 'pages/cierre_caja_page.dart';

const closeDate = '23 nov 2026';

/// Esperado sintético del diseño; el real saldrá de las ventas confirmadas del día.
const expectedByMethod = [('Efectivo', 41200), ('QR', 20000), ('Transferencia', 8000)];

/// Cierre del día. Cerrado no se edita; cerrar exige conexión.
class CashController extends ChangeNotifier {
  CashController({required this.offline});

  final OfflineController offline;
  final counted = TextEditingController();
  final justification = TextEditingController();
  bool closed = false;
  bool _attempted = false;

  int? get countedCents => parseAmountToCents(counted.text);
  Reconciliation? get reconciliation => countedCents == null ? null : reconcile(expectedByMethod, countedCents!);
  bool get canClose => offline.online && !closed;

  String? get countedError =>
      _attempted && countedCents == null ? 'Escriba el efectivo contado, por ejemplo 402 o 402,50.' : null;
  String? get justificationError {
    final r = reconciliation;
    if (!_attempted || r == null) return null;
    return requiresJustification(r.cashDiffCents) && justification.text.trim().isEmpty
        ? 'Explique la diferencia para cerrar la caja.'
        : null;
  }

  void touch() => notifyListeners();

  bool close() {
    _attempted = true;
    final ok = canClose && countedCents != null && justificationError == null;
    if (ok) closed = true;
    notifyListeners();
    return ok;
  }

  @override
  void dispose() {
    counted.dispose();
    justification.dispose();
    super.dispose();
  }
}
