import 'package:material_ui/material_ui.dart';

/// Tokens del sistema LUSH BEAUTY (tema Blanc), iguales a los de la PWA.
class LushColors {
  static const surface = Color(0xFFFFFFFF);
  static const raised = Color(0xFFF5F5F5);
  static const inverse = Color(0xFF0A0A0A);
  static const ink = Color(0xFF0A0A0A);
  static const muted = Color(0xFF5A5A5A);
  static const inkInverse = Color(0xFFFFFFFF);
  static const hairline = Color(0xFFD9D9D9);
  static const borderStrong = Color(0xFF6E6E6E);
  static const rouge = Color(0xFF7D1530);
  static const ok = Color(0xFF0F5C6E);
}

class LushSpace {
  static const s1 = 4.0;
  static const s2 = 8.0;
  static const s3 = 12.0;
  static const s4 = 16.0;
  static const s5 = 24.0;
  static const s6 = 32.0;
  static const s7 = 48.0;
  static const touchMin = 48.0;
}

/// Jost con el peso como variación del eje `wght` (fuente variable).
TextStyle jost(
  double size,
  int weight, {
  double? height,
  double letterSpacing = 0,
  Color color = LushColors.ink,
  bool tabular = false,
}) {
  return TextStyle(
    fontFamily: 'Jost',
    fontSize: size,
    height: height == null ? null : height / size,
    letterSpacing: letterSpacing,
    color: color,
    fontWeight: FontWeight.values[(weight ~/ 100) - 1],
    fontVariations: [FontVariation.weight(weight.toDouble())],
    fontFeatures: tabular
        ? const [FontFeature.tabularFigures(), FontFeature.liningFigures()]
        : null,
  );
}

class LushText {
  static final eyebrow = jost(11, 500, height: 16, letterSpacing: 11 * 0.24, color: LushColors.muted);
  static final headline = jost(32, 300, height: 38);
  static final body = jost(15, 400, height: 24);
  static final bodyMuted = jost(15, 400, height: 24, color: LushColors.muted);
  static final caption = jost(12, 400, height: 18, letterSpacing: 0.24, color: LushColors.muted);
  static final captionRouge = caption.copyWith(color: LushColors.rouge);
  static final button = jost(11, 500, height: 16, letterSpacing: 11 * 0.22);
  static final figureSm = jost(28, 300, tabular: true);
  static final valueMd = jost(15, 400, height: 24, tabular: true);
  static final tab = jost(11, 400, height: 16, letterSpacing: 1.1, color: LushColors.muted);
}
