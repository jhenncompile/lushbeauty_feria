import 'package:material_ui/material_ui.dart';

import '../../../shared/connection.dart';
import '../../../shared/money.dart';
import '../../../shared/routes.dart';
import '../../../shared/state/controller_scope.dart';
import '../../../shared/theme/tokens.dart';
import '../../../shared/ui/lush_button.dart';
import '../../../shared/ui/lush_parts.dart';
import '../../../shared/ui/lush_screen.dart';
import '../domain/sale.dart';
import '../sales.dart';

class GuardadoPage extends StatelessWidget {
  const GuardadoPage({super.key});

  @override
  Widget build(BuildContext context) {
    final sales = ControllerScope.of<SalesController>(context);
    final saved = sales.saved;
    if (saved == null) {
      // Sin registro guardado no hay nada que mostrar: se vuelve a Registrar.
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (context.mounted) Navigator.of(context).pushReplacementNamed(Routes.register);
      });
      return const Scaffold(body: SizedBox.shrink());
    }
    final online = ConnectionScope.of(context).online;
    final whole = saved.chargedCents % 100 == 0;
    final amount = formatBs(saved.chargedCents, decimals: whole ? 0 : 2);
    return LushScreen(
      syncRoute: Routes.sync,
      header: Container(
        width: double.infinity,
        color: LushColors.inverse,
        padding: const EdgeInsets.fromLTRB(LushSpace.s5, LushSpace.s7, LushSpace.s5, LushSpace.s6),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: LushColors.inkInverse)),
              child: const Icon(Icons.check, color: LushColors.inkInverse, size: 22, semanticLabel: 'Guardado'),
            ),
            const SizedBox(height: LushSpace.s4),
            Semantics(
              header: true,
              child: Text('SERVICIO GUARDADO', style: LushText.eyebrow.copyWith(color: LushColors.hairline)),
            ),
            const SizedBox(height: LushSpace.s4),
            Text(amount, style: jost(80, 300, height: 80, letterSpacing: -2.4, color: LushColors.inkInverse, tabular: true)),
            const SizedBox(height: LushSpace.s4),
            Text(
              '${saved.serviceName} · ${saved.specialistName} · ${saved.method}',
              style: LushText.body.copyWith(color: LushColors.inkInverse),
            ),
            Text(
              online
                  ? 'Enviado (simulado, sin servidor)'
                  : 'Guardado en este teléfono: se enviará al volver la conexión',
              style: LushText.caption.copyWith(color: LushColors.hairline),
            ),
          ],
        ),
      ),
      footer: [
        LushButton(label: 'Registrar otro servicio', onPressed: () => Navigator.of(context).pushReplacementNamed(Routes.register)),
        LushButton(
          label: 'Volver a Hoy',
          variant: LushButtonVariant.secondary,
          onPressed: () => Navigator.of(context).pushReplacementNamed(Routes.home),
        ),
      ],
      children: [
        Column(
          children: [
            LushLine(label: 'Precio de lista', value: formatBs(saved.listCents)),
            if (saved.discountCents > 0)
              LushLine(
                label: 'Descuento · ${saved.discountReason}',
                value: formatBs(-saved.discountCents),
                valueColor: LushColors.rouge,
              ),
            LushLine(
              label: 'Comisión ${formatPercent(saved.commissionBps)} sobre lista',
              value: formatBs(saved.commissionCents),
            ),
          ],
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            LushButton(
              label: 'Deshacer este registro',
              variant: LushButtonVariant.link,
              block: false,
              onPressed: () {
                sales.undoSaved();
                Navigator.of(context).pushReplacementNamed(Routes.home);
              },
            ),
            Text('Deshacer anula 1 servicio de $amount y deja un ajuste.', style: LushText.caption),
          ],
        ),
      ],
    );
  }
}
