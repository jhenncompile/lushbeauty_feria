import 'package:flutter_test/flutter_test.dart';
import 'package:lushbeauty/modules/sales/domain/sale.dart';

const _policy = SalePolicy(commissionBps: 3500, maxDiscountBps: 1000);

void main() {
  group('calculateSale (CP-01: lista Bs 120, descuento Bs 8)', () {
    test('cobra 112, conserva la lista y comisión sobre lista', () {
      final r = calculateSale(listCents: 12000, discountCents: 800, policy: _policy);
      expect(r.chargedCents, 11200);
      expect(r.listCents, 12000);
      expect(r.commissionCents, 4200);
      expect(r.exceedsLimit, isFalse);
      expect(r.discountBps, 667);
    });

    test('el límite exacto de 10 % no requiere aprobación; un centavo más sí', () {
      expect(calculateSale(listCents: 12000, discountCents: 1200, policy: _policy).exceedsLimit, isFalse);
      expect(calculateSale(listCents: 12000, discountCents: 1201, policy: _policy).exceedsLimit, isTrue);
    });

    test('rechaza descuento mayor que la lista o negativo', () {
      expect(() => calculateSale(listCents: 12000, discountCents: 12001, policy: _policy), throwsRangeError);
      expect(() => calculateSale(listCents: 12000, discountCents: -1, policy: _policy), throwsRangeError);
    });
  });

  test('formatPercent: un decimal con coma, sin ,0', () {
    expect(formatPercent(667), '6,7 %');
    expect(formatPercent(1000), '10 %');
    expect(formatPercent(3500), '35 %');
  });
}
