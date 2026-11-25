import 'package:material_ui/material_ui.dart';

import '../../../shared/money.dart';
import '../../../shared/routes.dart';
import '../../../shared/state/controller_scope.dart';
import '../../../shared/theme/tokens.dart';
import '../../../shared/ui/lush_button.dart';
import '../../../shared/ui/lush_choice.dart';
import '../../../shared/ui/lush_field.dart';
import '../../../shared/ui/lush_parts.dart';
import '../../../shared/ui/lush_screen.dart';
import '../domain/sale.dart';
import '../sales.dart';

class DescuentoPage extends StatefulWidget {
  const DescuentoPage({super.key});

  @override
  State<DescuentoPage> createState() => _DescuentoPageState();
}

class _DescuentoPageState extends State<DescuentoPage> {
  late final TextEditingController _amount;
  late final TextEditingController _detail;
  String? _reason;
  bool _showErrors = false;

  @override
  void initState() {
    super.initState();
    final sales = ControllerScope.read<SalesController>(context);
    final current = sales.discount;
    _amount = TextEditingController(text: current == null ? '' : _centsToText(current.cents));
    _detail = TextEditingController(text: current?.detail ?? '');
    _reason = current?.reason;
  }

  @override
  void dispose() {
    _amount.dispose();
    _detail.dispose();
    super.dispose();
  }

  static String _centsToText(int cents) {
    final fraction = cents % 100;
    return fraction == 0 ? '${cents ~/ 100}' : '${cents ~/ 100},${fraction.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final sales = ControllerScope.of<SalesController>(context);
    final list = sales.service.listPriceCents;
    final policy = SalePolicy(commissionBps: sales.policy.commissionBps, maxDiscountBps: sales.policy.maxDiscountBps);
    final cents = parseAmountToCents(_amount.text);
    final amountError = cents == null
        ? 'Escriba un importe válido, por ejemplo 8, 8,5 u 8,50.'
        : cents > list
            ? 'El descuento no puede superar el precio de lista.'
            : cents == 0
                ? 'El descuento debe ser mayor que cero.'
                : null;
    final reasonError = _reason == null ? 'Elija un motivo.' : null;
    final preview = (cents != null && cents > 0 && cents <= list)
        ? calculateSale(listCents: list, discountCents: cents, policy: policy)
        : null;
    final maxPct = formatPercent(policy.maxDiscountBps);

    void apply() {
      setState(() => _showErrors = true);
      if (amountError != null || reasonError != null) return;
      sales.setDiscount(Discount(cents!, _reason!, _detail.text.trim()));
      Navigator.of(context).pushReplacementNamed(Routes.register);
    }

    return LushScreen(
      title: 'Descuento',
      backRoute: Routes.register,
      footer: [
        LushButton(label: preview?.exceedsLimit == true ? 'Solicitar aprobación' : 'Aplicar descuento', onPressed: apply),
        if (sales.discount != null)
          Center(
            child: LushButton(
              label: 'Quitar descuento',
              variant: LushButtonVariant.link,
              block: false,
              onPressed: () {
                sales.setDiscount(null);
                Navigator.of(context).pushReplacementNamed(Routes.register);
              },
            ),
          ),
      ],
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Eyebrow('${sales.service.name} · ${sales.specialist.name}'),
            const SizedBox(height: LushSpace.s3),
            LushLine(label: 'Precio de lista', topRule: true, big: true, value: formatBs(list)),
          ],
        ),
        LushField(
          label: 'Descuento (Bs)',
          controller: _amount,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          hint: 'Acepta 8, 8,5 u 8,50.',
          error: _showErrors ? amountError : null,
          onChanged: (_) => setState(() {}),
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Eyebrow('Motivo'),
            const SizedBox(height: LushSpace.s3),
            Wrap(
              spacing: LushSpace.s2,
              runSpacing: LushSpace.s2,
              children: [
                for (final reason in discountReasons)
                  SizedBox(
                    width: (MediaQuery.sizeOf(context).width.clamp(0, 480) - LushSpace.s5 * 2 - LushSpace.s2) / 2,
                    child: LushChoice(
                      label: reason,
                      centered: true,
                      selected: _reason == reason,
                      onTap: () => setState(() => _reason = reason),
                    ),
                  ),
              ],
            ),
            if (_showErrors && reasonError != null)
              Padding(
                padding: const EdgeInsets.only(top: LushSpace.s2),
                child: Text('Error: $reasonError', style: LushText.captionRouge),
              ),
          ],
        ),
        LushField(label: 'Detalle del motivo (opcional)', controller: _detail),
        if (preview != null)
          LushPanel(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                LushLine(label: 'Cobrado', value: formatBs(preview.chargedCents)),
                LushLine(
                  label: 'Comisión ${formatPercent(policy.commissionBps)} sobre lista',
                  value: formatBs(preview.commissionCents),
                ),
                const SizedBox(height: LushSpace.s3),
                Text(
                  preview.exceedsLimit
                      ? 'Descuento de ${formatPercent(preview.discountBps)}. Supera el límite de $maxPct: requiere la aprobación de la administradora.'
                      : 'Descuento de ${formatPercent(preview.discountBps)}. Está dentro del límite de $maxPct, así que no requiere aprobación.',
                  style: LushText.body,
                ),
              ],
            ),
          ),
        Text(
          'Los descuentos superiores a $maxPct requieren la aprobación de la administradora. Límite ilustrativo.',
          style: LushText.caption,
        ),
      ],
    );
  }
}
