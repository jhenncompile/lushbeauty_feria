import 'package:material_ui/material_ui.dart';

import '../../../shared/money.dart';
import '../../../shared/routes.dart';
import '../../../shared/state/controller_scope.dart';
import '../../../shared/theme/tokens.dart';
import '../../../shared/ui/lush_button.dart';
import '../../../shared/ui/lush_parts.dart';
import '../../../shared/ui/lush_screen.dart';
import '../../identity/identity.dart';
import '../../sales/pages/registrar_page.dart' show specialistTabs;
import '../payroll.dart';

class MiLiquidacionPage extends StatelessWidget {
  const MiLiquidacionPage({super.key});

  @override
  Widget build(BuildContext context) {
    final session = ControllerScope.of<SessionController>(context).session;
    // Solo la propia: se busca por quien inició sesión, nunca se listan las demás.
    final own = statements.where((s) => s.name.toLowerCase() == session?.userName.trim().toLowerCase()).firstOrNull;
    return LushScreen(
      tabs: specialistTabs,
      currentRoute: Routes.myPayroll,
      syncRoute: Routes.sync,
      header: Container(
        height: 56,
        alignment: Alignment.center,
        decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: LushColors.hairline))),
        child: Text('LUSH BEAUTY', style: LushText.button),
      ),
      footer: own == null
          ? null
          : [
              const LushButton(label: 'Descargar comprobante', onPressed: null),
              Text(
                'El comprobante PDF se emite al aprobar la liquidación, con el servidor.',
                style: LushText.caption,
                textAlign: TextAlign.center,
              ),
            ],
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Eyebrow('${own?.name ?? session?.userName ?? ''} · $weekLabel'),
            const SizedBox(height: LushSpace.s2),
            Semantics(header: true, child: Text('Mi liquidación', style: LushText.headline)),
          ],
        ),
        if (own != null) ...[
          LushStat(
            label: 'Neto a pagar',
            value: formatBs(own.netCents),
            delta: 'Aprobada el 23 nov',
            tone: LushTone.ok,
            note: 'Ilustrativo',
          ),
          Column(
            children: [
              LushLine(label: 'Comisión 35 % sobre lista', value: formatBs(own.commissionCents)),
              LushLine(label: 'Propinas', value: '+ ${formatBs(own.tipsCents)}', valueColor: LushColors.ok),
              LushLine(label: own.deductionLabel, value: formatBs(-own.deductionsCents), valueColor: LushColors.rouge),
            ],
          ),
        ] else
          LushPanel(child: Text('No hay una liquidación para su usuario en esta semana.', style: LushText.body)),
        LushPanel(
          child: Text(
            'Solo usted puede ver este detalle. Las liquidaciones de otras especialistas no están disponibles para su cuenta.',
            style: LushText.body,
          ),
        ),
      ],
    );
  }
}
