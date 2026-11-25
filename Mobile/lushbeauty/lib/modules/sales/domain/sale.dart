/// Reglas puras de una venta: sin Flutter, centavos enteros.
library;

class SalePolicy {
  const SalePolicy({required this.commissionBps, required this.maxDiscountBps});
  final int commissionBps;
  final int maxDiscountBps;
}

class SaleResult {
  const SaleResult({
    required this.listCents,
    required this.discountCents,
    required this.chargedCents,
    required this.discountBps,
    required this.commissionCents,
    required this.exceedsLimit,
  });
  final int listCents;
  final int discountCents;
  final int chargedCents;
  final int discountBps;
  final int commissionCents;
  final bool exceedsLimit;
}

int _roundDiv(int numerator, int denominator) => (numerator * 2 + denominator) ~/ (denominator * 2);

SaleResult calculateSale({required int listCents, required int discountCents, required SalePolicy policy}) {
  if (discountCents < 0 || discountCents > listCents) {
    throw RangeError('El descuento debe estar entre 0 y el precio de lista');
  }
  return SaleResult(
    listCents: listCents,
    discountCents: discountCents,
    chargedCents: listCents - discountCents,
    discountBps: listCents == 0 ? 0 : _roundDiv(discountCents * 10000, listCents),
    // Redondeo provisional (mitad hacia arriba): decisión abierta 1 (RN-03).
    commissionCents: _roundDiv(listCents * policy.commissionBps, 10000),
    exceedsLimit: discountCents * 10000 > policy.maxDiscountBps * listCents,
  );
}

/// 667 → «6,7 %»; 1000 → «10 %».
String formatPercent(int bps) {
  final tenths = _roundDiv(bps, 10);
  final whole = tenths ~/ 10;
  final decimal = tenths % 10;
  return '$whole${decimal != 0 ? ',$decimal' : ''} %';
}
