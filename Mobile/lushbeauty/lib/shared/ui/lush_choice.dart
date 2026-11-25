import 'package:material_ui/material_ui.dart';

import '../theme/tokens.dart';

/// Opción excluyente: contorno fino; seleccionada, relleno negro.
class LushChoice extends StatelessWidget {
  const LushChoice({
    super.key,
    required this.label,
    required this.selected,
    required this.onTap,
    this.trailing,
    this.centered = false,
  });

  final String label;
  final String? trailing;
  final bool selected;
  final bool centered;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final fg = selected ? LushColors.inkInverse : LushColors.ink;
    return Semantics(
      button: true,
      selected: selected,
      label: label,
      excludeSemantics: true,
      onTap: onTap,
      child: InkWell(
        onTap: onTap,
        child: Container(
          constraints: const BoxConstraints(minHeight: LushSpace.touchMin),
          padding: EdgeInsets.symmetric(horizontal: centered ? LushSpace.s2 : LushSpace.s4),
          decoration: BoxDecoration(
            color: selected ? LushColors.inverse : Colors.transparent,
            border: Border.all(color: selected ? LushColors.inverse : LushColors.borderStrong),
          ),
          child: Row(
            mainAxisAlignment: centered ? MainAxisAlignment.center : MainAxisAlignment.spaceBetween,
            children: [
              Flexible(child: Text(label, style: LushText.body.copyWith(color: fg), textAlign: centered ? TextAlign.center : null)),
              if (trailing != null) Text(trailing!, style: LushText.valueMd.copyWith(color: fg)),
            ],
          ),
        ),
      ),
    );
  }
}
