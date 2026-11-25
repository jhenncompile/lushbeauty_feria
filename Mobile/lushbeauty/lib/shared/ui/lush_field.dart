import 'package:material_ui/material_ui.dart';

import '../theme/tokens.dart';

/// Campo con subrayado, etiqueta en eyebrow y mensaje de ayuda o error debajo.
class LushField extends StatelessWidget {
  const LushField({
    super.key,
    required this.label,
    required this.controller,
    this.hint,
    this.error,
    this.keyboardType,
    this.obscureText = false,
    this.readOnly = false,
    this.onChanged,
  });

  final String label;
  final TextEditingController controller;
  final String? hint;
  final String? error;
  final TextInputType? keyboardType;
  final bool obscureText;
  final bool readOnly;
  final ValueChanged<String>? onChanged;

  @override
  Widget build(BuildContext context) {
    final hasError = error != null;
    final line = BorderSide(color: hasError ? LushColors.rouge : LushColors.borderStrong);
    final message = hasError ? 'Error: $error' : hint;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label.toUpperCase(), style: LushText.eyebrow),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          obscureText: obscureText,
          readOnly: readOnly,
          onChanged: onChanged,
          style: LushText.body,
          cursorColor: LushColors.ink,
          decoration: InputDecoration(
            isDense: false,
            contentPadding: const EdgeInsets.symmetric(vertical: LushSpace.s3),
            border: UnderlineInputBorder(borderSide: line),
            enabledBorder: UnderlineInputBorder(borderSide: line),
            focusedBorder: UnderlineInputBorder(
              borderSide: BorderSide(color: hasError ? LushColors.rouge : LushColors.ink, width: 2),
            ),
            semanticCounterText: label,
          ),
        ),
        if (message != null)
          Padding(
            padding: const EdgeInsets.only(top: LushSpace.s1),
            child: Text(message, style: hasError ? LushText.captionRouge : LushText.caption),
          ),
      ],
    );
  }
}
