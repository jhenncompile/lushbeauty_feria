/// Dinero en centavos enteros (nunca `double`). El redondeo de moneda es una
/// decisión abierta (RN-03): aquí solo se formatea y se lee.
library;

const _minus = '−';

String _group(String digits) =>
    digits.replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (_) => '.');

/// `formatBs(11200)` → `Bs 112,00`; `formatBs(123600, decimals: 0)` → `Bs 1.236`.
/// Con `decimals: 0` los centavos solo se omiten si son cero.
String formatBs(int cents, {int decimals = 2}) {
  final negative = cents < 0;
  final abs = cents.abs();
  final whole = abs ~/ 100;
  final fraction = abs % 100;
  final showFraction = decimals == 2 || fraction != 0;
  final body =
      'Bs ${_group('$whole')}${showFraction ? ',${fraction.toString().padLeft(2, '0')}' : ''}';
  return negative ? '$_minus $body' : body;
}

final _amount = RegExp(r'^(\d+)(?:[.,](\d{1,2}))?$');

/// Lee «8», «8,5», «8,50» u «8.5» como centavos; `null` si no es válido.
int? parseAmountToCents(String input) {
  final match = _amount.firstMatch(input.trim());
  if (match == null) return null;
  final whole = int.parse(match.group(1)!);
  final fraction = (match.group(2) ?? '').padRight(2, '0');
  return whole * 100 + int.parse(fraction);
}
