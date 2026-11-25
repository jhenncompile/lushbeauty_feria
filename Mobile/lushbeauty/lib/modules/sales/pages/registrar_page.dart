import 'package:material_ui/material_ui.dart';

import '../../../shared/money.dart';
import '../../../shared/routes.dart';
import '../../../shared/state/controller_scope.dart';
import '../../../shared/theme/tokens.dart';
import '../../../shared/ui/lush_button.dart';
import '../../../shared/ui/lush_choice.dart';
import '../../../shared/ui/lush_parts.dart';
import '../../../shared/ui/lush_screen.dart';
import '../../identity/identity.dart';
import '../domain/sale.dart';
import '../sales.dart';

const specialistTabs = [TabSpec('Registrar', Routes.register), TabSpec('Mi liquidación', Routes.myPayroll)];

class RegistrarPage extends StatelessWidget {
  const RegistrarPage({super.key});

  @override
  Widget build(BuildContext context) {
    final sales = ControllerScope.of<SalesController>(context);
    final session = ControllerScope.of<SessionController>(context).session;
    final isSpecialist = session?.role == Role.especialista;
    final r = sales.result;
    final hint = sales.method == null
        ? 'Elija un método de pago para guardar.'
        : sales.needsApproval
            ? 'El descuento supera el límite: necesita la aprobación de la administradora.'
            : null;

    return LushScreen(
      title: 'Registrar servicio',
      backRoute: isSpecialist ? Routes.myPayroll : Routes.home,
      tabs: isSpecialist ? specialistTabs : null,
      currentRoute: Routes.register,
      syncRoute: Routes.sync,
      footer: [
        LushButton(
          label: 'Guardar servicio',
          onPressed: sales.canSave
              ? () {
                  if (sales.save()) Navigator.of(context).pushNamed(Routes.saved);
                }
              : null,
        ),
        if (hint != null) Text(hint, style: LushText.caption, textAlign: TextAlign.center),
      ],
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Eyebrow('Servicio'),
            const SizedBox(height: LushSpace.s3),
            for (final item in sales.services) ...[
              LushChoice(
                label: item.name,
                trailing: formatBs(item.listPriceCents, decimals: 0),
                selected: item.id == sales.serviceId,
                onTap: () => sales.pickService(item.id),
              ),
              const SizedBox(height: LushSpace.s2),
            ],
          ],
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Eyebrow('Especialista'),
            const SizedBox(height: LushSpace.s3),
            Row(
              children: [
                for (final item in sales.specialists)
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(right: LushSpace.s2),
                      child: LushChoice(
                        label: item.name,
                        centered: true,
                        selected: item.id == sales.specialistId,
                        onTap: () => sales.pickSpecialist(item.id),
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Eyebrow('Método de pago'),
            const SizedBox(height: LushSpace.s3),
            Row(
              children: [
                for (final method in paymentMethods)
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(right: LushSpace.s2),
                      child: LushChoice(
                        label: method,
                        centered: true,
                        selected: sales.method == method,
                        onTap: () => sales.pickMethod(method),
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            LushLine(
              label: 'Importe',
              topRule: true,
              big: true,
              value: formatBs(r.chargedCents, decimals: r.chargedCents % 100 == 0 ? 0 : 2),
            ),
            if (sales.discount != null)
              Text(
                'Lista ${formatBs(r.listCents)} · Descuento ${formatBs(r.discountCents)} (${formatPercent(r.discountBps)}) · ${sales.discount!.reason}',
                style: LushText.caption,
              ),
            LushButton(
              label: sales.discount != null ? 'Cambiar descuento' : 'Aplicar descuento',
              variant: LushButtonVariant.link,
              block: false,
              onPressed: () => Navigator.of(context).pushNamed(Routes.discount),
            ),
          ],
        ),
      ],
    );
  }
}
