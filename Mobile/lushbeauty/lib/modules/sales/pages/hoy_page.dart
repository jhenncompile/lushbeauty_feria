import 'package:material_ui/material_ui.dart';

import '../../../shared/connection.dart';
import '../../../shared/money.dart';
import '../../../shared/routes.dart';
import '../../../shared/theme/tokens.dart';
import '../../../shared/ui/lush_button.dart';
import '../../../shared/ui/lush_parts.dart';
import '../../../shared/ui/lush_screen.dart';

/// Pestañas del administrador en el teléfono (nómina y decisiones se usan desde la PWA).
const adminTabs = [TabSpec('Hoy', Routes.home), TabSpec('Caja', Routes.cashClose)];

const _todayByMethod = [('Efectivo', 41200), ('QR', 20000), ('Transferencia', 8000)];

class HoyPage extends StatelessWidget {
  const HoyPage({super.key});

  @override
  Widget build(BuildContext context) {
    final total = _todayByMethod.fold<int>(0, (sum, item) => sum + item.$2);
    final pending = ConnectionScope.of(context).pending;
    return LushScreen(
      title: 'Lush Beauty',
      tabs: adminTabs,
      currentRoute: Routes.home,
      syncRoute: Routes.sync,
      footer: [
        LushButton(label: 'Registrar servicio', onPressed: () => Navigator.of(context).pushNamed(Routes.register)),
      ],
      children: [
        Container(
          color: LushColors.inverse,
          padding: const EdgeInsets.all(LushSpace.s5),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('LUNES 23 NOV 2026 · HOY', style: LushText.eyebrow.copyWith(color: LushColors.hairline)),
              const SizedBox(height: LushSpace.s4),
              Text(
                formatBs(total, decimals: 0),
                style: jost(72, 300, height: 72, letterSpacing: -2, color: LushColors.inkInverse, tabular: true),
              ),
              const SizedBox(height: LushSpace.s4),
              Text('Cobrado hoy · 6 servicios registrados', style: LushText.body.copyWith(color: LushColors.inkInverse)),
              Text('Ilustrativo', style: LushText.caption.copyWith(color: LushColors.hairline)),
            ],
          ),
        ),
        Column(
          children: [
            for (final item in _todayByMethod)
              LushLine(label: item.$1, value: formatBs(item.$2, decimals: 0), big: true),
          ],
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Eyebrow('Atajos'),
            const SizedBox(height: LushSpace.s2),
            LushLine(
              label: 'Cola de envío',
              onTap: () => Navigator.of(context).pushNamed(Routes.sync),
              trailing: pending > 0 ? LushTag('$pending por enviar', tone: LushTone.rouge) : const LushTag('Al día', tone: LushTone.ok),
            ),
          ],
        ),
      ],
    );
  }
}
