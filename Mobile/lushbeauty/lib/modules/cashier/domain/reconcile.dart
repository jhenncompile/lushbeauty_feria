/// Conciliación de caja en centavos. Solo el efectivo se cuenta a mano.
library;

enum CashStatus { conciliado, falta, sobra }

class ReconcileRow {
  const ReconcileRow(this.method, this.expectedCents, this.declaredCents);
  final String method;
  final int expectedCents;
  final int declaredCents;
  int get diffCents => declaredCents - expectedCents;
}

class Reconciliation {
  const Reconciliation(this.rows);
  final List<ReconcileRow> rows;

  int get expectedTotalCents => rows.fold(0, (s, r) => s + r.expectedCents);
  int get declaredTotalCents => rows.fold(0, (s, r) => s + r.declaredCents);
  int get cashDiffCents => rows.firstWhere((r) => r.method == 'Efectivo').diffCents;
  CashStatus get cashStatus =>
      cashDiffCents == 0 ? CashStatus.conciliado : (cashDiffCents < 0 ? CashStatus.falta : CashStatus.sobra);
}

Reconciliation reconcile(List<(String, int)> expected, int countedCashCents) => Reconciliation([
      for (final item in expected)
        ReconcileRow(item.$1, item.$2, item.$1 == 'Efectivo' ? countedCashCents : item.$2),
    ]);

bool requiresJustification(int diffCents) => diffCents != 0;
