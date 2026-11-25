import 'package:material_ui/material_ui.dart';

import '../theme/tokens.dart';

enum LushTone { neutral, ok, rouge }

Color _toneColor(LushTone tone) => switch (tone) {
      LushTone.ok => LushColors.ok,
      LushTone.rouge => LushColors.rouge,
      LushTone.neutral => LushColors.ink,
    };

/// Estado en texto dentro de un contorno. Siempre con palabra, nunca solo color.
class LushTag extends StatelessWidget {
  const LushTag(this.text, {super.key, this.tone = LushTone.neutral});
  final String text;
  final LushTone tone;

  @override
  Widget build(BuildContext context) {
    final color = tone == LushTone.neutral ? LushColors.borderStrong : _toneColor(tone);
    return Container(
      constraints: const BoxConstraints(minHeight: 24),
      padding: const EdgeInsets.symmetric(horizontal: LushSpace.s2),
      decoration: BoxDecoration(border: Border.all(color: color)),
      alignment: Alignment.center,
      child: Text(
        text.toUpperCase(),
        style: jost(11, 500, height: 16, letterSpacing: 1.3, color: _toneColor(tone)),
      ),
    );
  }
}

/// Fila etiqueta + valor con filete inferior.
class LushLine extends StatelessWidget {
  const LushLine({
    super.key,
    required this.label,
    this.value,
    this.valueStyle,
    this.valueColor,
    this.topRule = false,
    this.big = false,
    this.caption,
    this.trailing,
    this.onTap,
  });

  final String label;
  final String? value;
  final TextStyle? valueStyle;
  final Color? valueColor;
  final bool topRule;
  final bool big;
  final String? caption;
  final Widget? trailing;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final style = (valueStyle ?? (big ? LushText.figureSm : LushText.valueMd))
        .copyWith(color: valueColor ?? LushColors.ink);
    final row = Container(
      constraints: BoxConstraints(minHeight: onTap != null ? LushSpace.touchMin : 0),
      padding: const EdgeInsets.symmetric(vertical: LushSpace.s4),
      decoration: BoxDecoration(
        border: Border(
          top: topRule ? const BorderSide(color: LushColors.ink) : BorderSide.none,
          bottom: const BorderSide(color: LushColors.hairline),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: LushText.body),
                if (caption != null) Text(caption!, style: LushText.caption),
              ],
            ),
          ),
          if (value != null) Padding(padding: const EdgeInsets.only(left: LushSpace.s4), child: Text(value!, style: style)),
          if (trailing != null) Padding(padding: const EdgeInsets.only(left: LushSpace.s4), child: trailing!),
        ],
      ),
    );
    if (onTap == null) return row;
    return Semantics(button: true, child: InkWell(onTap: onTap, child: row));
  }
}

/// Cifra grande con etiqueta, variación y nota.
class LushStat extends StatelessWidget {
  const LushStat({super.key, required this.label, required this.value, this.delta, this.note, this.tone = LushTone.neutral});
  final String label;
  final String value;
  final String? delta;
  final String? note;
  final LushTone tone;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.only(top: LushSpace.s4),
      decoration: const BoxDecoration(border: Border(top: BorderSide(color: LushColors.ink))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label.toUpperCase(), style: LushText.eyebrow),
          const SizedBox(height: LushSpace.s3),
          Text(value, style: jost(48, 300, height: 48, tabular: true)),
          if (delta != null)
            Padding(
              padding: const EdgeInsets.only(top: LushSpace.s3),
              child: Text(
                delta!,
                style: jost(13, 500, height: 20, color: tone == LushTone.neutral ? LushColors.muted : _toneColor(tone)),
              ),
            ),
          if (note != null)
            Padding(padding: const EdgeInsets.only(top: LushSpace.s2), child: Text(note!, style: LushText.caption)),
        ],
      ),
    );
  }
}

/// Bloque sobre fondo elevado.
class LushPanel extends StatelessWidget {
  const LushPanel({super.key, required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) => Container(
        width: double.infinity,
        color: LushColors.raised,
        padding: const EdgeInsets.all(LushSpace.s5),
        child: child,
      );
}

/// Sobretítulo en mayúsculas.
class Eyebrow extends StatelessWidget {
  const Eyebrow(this.text, {super.key});
  final String text;
  @override
  Widget build(BuildContext context) => Text(text.toUpperCase(), style: LushText.eyebrow);
}
