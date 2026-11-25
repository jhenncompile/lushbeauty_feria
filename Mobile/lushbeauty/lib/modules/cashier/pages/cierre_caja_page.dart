import 'package:material_ui/material_ui.dart';

import '../../../shared/money.dart';
import '../../../shared/routes.dart';
import '../../../shared/state/controller_scope.dart';
import '../../../shared/theme/tokens.dart';
import '../../../shared/ui/lush_button.dart';
import '../../../shared/ui/lush_field.dart';
import '../../../shared/ui/lush_parts.dart';
import '../../../shared/ui/lush_screen.dart';
import '../../sales/pages/hoy_page.dart' show adminTabs;
import '../cashier.dart';
import '../domain/reconcile.dart';

class CierreCajaPage extends StatelessWidget {
  const CierreCajaPage({super.key});

  @override
  Widget build(BuildContext context) {
    final cash = ControllerScope.of<CashController>(context);
    final r = cash.reconciliation;
    final status = r?.cashStatus;
    return LushScreen(
      title: 'Caja',
      backRoute: Routes.home,
      tabs: adminTabs,
      currentRoute: Routes.cashClose,
      syncRoute: Routes.sync,
      footer: cash.closed
          ? [const Align(alignment: Alignment.centerLeft, child: LushTag('Caja cerrada', tone: LushTone.ok))]
          : [
              LushButton(label: 'Cerrar caja', onPressed: cash.canClose ? cash.close : null),
              Text(
                cash.canClose
                    ? 'El cierre final se registra en línea. Cualquier cambio posterior deja historial.'
                    : 'El cierre de caja requiere conexión.',
                style: LushText.caption,
                textAlign: TextAlign.center,
              ),
            ],
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Eyebrow(closeDate),
            const SizedBox(height: LushSpace.s2),
            Semantics(header: true, child: Text('Cierre de caja', style: LushText.headline)),
          ],
        ),
        if (r != null)
          Column(
            children: [
              _row('MÉTODO', 'ESPERADO', 'DECLARADO', header: true),
              for (final row in r.rows) _row(row.method, formatBs(row.expectedCents), formatBs(row.declaredCents)),
              _row('Total', formatBs(r.expectedTotalCents), formatBs(r.declaredTotalCents), total: true),
            ],
          )
        else
          Text('Cuente el efectivo para ver lo esperado y la diferencia.', style: LushText.caption),
        LushField(
          label: 'Efectivo contado (Bs)',
          controller: cash.counted,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          readOnly: cash.closed,
          hint: 'Acepta 402, 402,5 o 402,50.',
          error: cash.countedError,
          onChanged: (_) => cash.touch(),
        ),
        if (r != null && status != null)
          LushStat(
            label: 'Diferencia en efectivo',
            value: r.cashDiffCents > 0 ? '+ ${formatBs(r.cashDiffCents)}' : formatBs(r.cashDiffCents),
            delta: switch (status) {
              CashStatus.conciliado => 'Conciliado: el efectivo cuadra',
              CashStatus.falta => 'Falta ${formatBs(-r.cashDiffCents)} en efectivo',
              CashStatus.sobra => 'Sobra ${formatBs(r.cashDiffCents)} en efectivo',
            },
            tone: switch (status) {
              CashStatus.conciliado => LushTone.ok,
              CashStatus.falta => LushTone.rouge,
              CashStatus.sobra => LushTone.neutral,
            },
            note: 'Ilustrativo',
          ),
        LushField(
          label: 'Justificación de la diferencia',
          controller: cash.justification,
          readOnly: cash.closed,
          hint: 'Obligatoria cuando hay diferencia.',
          error: cash.justificationError,
          onChanged: (_) => cash.touch(),
        ),
        Text('QR y transferencia se toman iguales a lo esperado en esta maqueta.', style: LushText.caption),
      ],
    );
  }

  Widget _row(String a, String b, String c, {bool header = false, bool total = false}) {
    final style = header
        ? LushText.eyebrow
        : (total ? LushText.valueMd.copyWith(fontWeight: FontWeight.w500) : LushText.valueMd);
    return Container(
      padding: const EdgeInsets.symmetric(vertical: LushSpace.s3),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: header || total ? LushColors.ink : LushColors.hairline),
        ),
      ),
      child: Row(
        children: [
          Expanded(flex: 4, child: Text(a, style: header ? style : LushText.caption.copyWith(color: LushColors.ink, fontSize: 13))),
          Expanded(flex: 4, child: Text(b, style: style, textAlign: TextAlign.right)),
          Expanded(flex: 4, child: Text(c, style: style, textAlign: TextAlign.right)),
        ],
      ),
    );
  }
}
