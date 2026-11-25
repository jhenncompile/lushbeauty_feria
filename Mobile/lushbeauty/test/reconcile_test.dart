import 'package:flutter_test/flutter_test.dart';
import 'package:lushbeauty/modules/cashier/domain/reconcile.dart';

const _expected = [('Efectivo', 41200), ('QR', 20000), ('Transferencia', 8000)];

void main() {
  test('contado 402 contra 412 esperado: falta Bs 10 y total declarado 682', () {
    final r = reconcile(_expected, 40200);
    expect(r.cashDiffCents, -1000);
    expect(r.expectedTotalCents, 69200);
    expect(r.declaredTotalCents, 68200);
    expect(r.cashStatus, CashStatus.falta);
  });

  test('cuadra y sobra', () {
    expect(reconcile(_expected, 41200).cashStatus, CashStatus.conciliado);
    final over = reconcile(_expected, 41700);
    expect(over.cashStatus, CashStatus.sobra);
    expect(over.cashDiffCents, 500);
  });

  test('solo hay justificación obligatoria cuando hay diferencia', () {
    expect(requiresJustification(0), isFalse);
    expect(requiresJustification(-1), isTrue);
  });
}
