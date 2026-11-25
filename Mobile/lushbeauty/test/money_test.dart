import 'package:flutter_test/flutter_test.dart';
import 'package:lushbeauty/shared/money.dart';

void main() {
  group('formatBs', () {
    test('dos decimales con coma', () {
      expect(formatBs(11200), 'Bs 112,00');
      expect(formatBs(4200), 'Bs 42,00');
    });
    test('miles con punto', () {
      expect(formatBs(123600, decimals: 0), 'Bs 1.236');
      expect(formatBs(401170), 'Bs 4.011,70');
    });
    test('negativo con menos tipográfico', () {
      expect(formatBs(-1000), '− Bs 10,00');
    });
    test('decimals 0 conserva centavos distintos de cero', () {
      expect(formatBs(11250, decimals: 0), 'Bs 112,50');
      expect(formatBs(11200, decimals: 0), 'Bs 112');
    });
  });

  group('parseAmountToCents', () {
    test('acepta 8, 8,5, 8,50 y 8.5', () {
      expect(parseAmountToCents('8'), 800);
      expect(parseAmountToCents('8,5'), 850);
      expect(parseAmountToCents('8,50'), 850);
      expect(parseAmountToCents('8.5'), 850);
    });
    test('rechaza vacío, negativos, texto y más de 2 decimales', () {
      expect(parseAmountToCents(''), isNull);
      expect(parseAmountToCents('-8'), isNull);
      expect(parseAmountToCents('abc'), isNull);
      expect(parseAmountToCents('8,555'), isNull);
    });
    test('sin coma flotante', () {
      expect(parseAmountToCents('0,07'), 7);
      expect(parseAmountToCents('1,1'), 110);
    });
  });
}
