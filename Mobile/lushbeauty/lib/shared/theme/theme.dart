import 'package:material_ui/material_ui.dart';

import 'tokens.dart';

/// Tema cuadrado: radio 0, sin elevación ni sombras, fondo blanco.
ThemeData buildLushTheme() {
  final base = ThemeData(
    useMaterial3: true,
    fontFamily: 'Jost',
    colorScheme: const ColorScheme.light(
      primary: LushColors.ink,
      onPrimary: LushColors.inkInverse,
      surface: LushColors.surface,
      onSurface: LushColors.ink,
      error: LushColors.rouge,
    ),
    scaffoldBackgroundColor: LushColors.surface,
    splashFactory: NoSplash.splashFactory,
    highlightColor: Colors.transparent,
  );
  return base.copyWith(
    textTheme: base.textTheme.apply(bodyColor: LushColors.ink, displayColor: LushColors.ink),
  );
}
