import 'package:material_ui/material_ui.dart';

import '../theme/tokens.dart';

enum LushButtonVariant { primary, secondary, danger, link }

/// Botón cuadrado de 48px. El texto se muestra en mayúsculas; el nombre accesible
/// conserva el texto original.
class LushButton extends StatelessWidget {
  const LushButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.variant = LushButtonVariant.primary,
    this.block = true,
  });

  final String label;
  final VoidCallback? onPressed;
  final LushButtonVariant variant;
  final bool block;

  @override
  Widget build(BuildContext context) {
    final enabled = onPressed != null;
    final isLink = variant == LushButtonVariant.link;
    final Color bg;
    final Color fg;
    final Color border;
    if (!enabled) {
      bg = LushColors.raised;
      fg = LushColors.muted;
      border = LushColors.hairline;
    } else {
      switch (variant) {
        case LushButtonVariant.primary:
          bg = LushColors.inverse;
          fg = LushColors.inkInverse;
          border = LushColors.inverse;
        case LushButtonVariant.secondary:
          bg = Colors.transparent;
          fg = LushColors.ink;
          border = LushColors.borderStrong;
        case LushButtonVariant.danger:
          bg = LushColors.rouge;
          fg = LushColors.inkInverse;
          border = LushColors.rouge;
        case LushButtonVariant.link:
          bg = Colors.transparent;
          fg = LushColors.ink;
          border = Colors.transparent;
      }
    }
    final text = Text(
      label.toUpperCase(),
      textAlign: TextAlign.center,
      style: LushText.button.copyWith(
        color: fg,
        decoration: isLink && enabled ? TextDecoration.underline : null,
        decorationColor: fg,
      ),
    );
    final body = Container(
      constraints: const BoxConstraints(minHeight: LushSpace.touchMin),
      padding: EdgeInsets.symmetric(horizontal: isLink ? LushSpace.s1 : LushSpace.s5),
      alignment: Alignment.center,
      decoration: BoxDecoration(color: bg, border: Border.all(color: border)),
      child: text,
    );
    return Semantics(
      button: true,
      enabled: enabled,
      label: label,
      excludeSemantics: true,
      onTap: onPressed,
      child: InkWell(
        onTap: onPressed,
        child: block && !isLink ? SizedBox(width: double.infinity, child: body) : body,
      ),
    );
  }
}
