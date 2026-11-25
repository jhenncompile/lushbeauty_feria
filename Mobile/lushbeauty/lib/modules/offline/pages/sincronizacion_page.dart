import 'package:material_ui/material_ui.dart';

import '../../../shared/money.dart';
import '../../../shared/routes.dart';
import '../../../shared/state/controller_scope.dart';
import '../../../shared/theme/tokens.dart';
import '../../../shared/ui/lush_button.dart';
import '../../../shared/ui/lush_parts.dart';
import '../../../shared/ui/lush_screen.dart';
import '../../identity/identity.dart';
import '../offline.dart';

class SincronizacionPage extends StatefulWidget {
  const SincronizacionPage({super.key});

  @override
  State<SincronizacionPage> createState() => _SincronizacionPageState();
}

class _SincronizacionPageState extends State<SincronizacionPage> {
  String? _message;

  @override
  Widget build(BuildContext context) {
    final offline = ControllerScope.of<OfflineController>(context);
    final session = ControllerScope.of<SessionController>(context).session;
    final back = session == null ? Routes.login : homeRouteFor(session.role);
    return LushScreen(
      title: 'Sincronización',
      backRoute: back,
      footer: [
        LushButton(
          label: 'Reintentar envío',
          onPressed: offline.pending == 0
              ? null
              : () => setState(() {
                    _message = offline.retry() == RetryResult.offline
                        ? 'Sigue sin conexión. Sus registros están a salvo en este teléfono.'
                        : 'Registros enviados.';
                  }),
        ),
        if (_message != null) Text(_message!, style: LushText.caption, textAlign: TextAlign.center),
      ],
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Semantics(header: true, child: Text('Cola de envío', style: LushText.headline)),
            const SizedBox(height: LushSpace.s2),
            Text(
              offline.online
                  ? 'Hay conexión. Lo pendiente se envía solo.'
                  : 'Sus registros están guardados en este teléfono y se enviarán al volver la conexión.',
              style: LushText.bodyMuted,
            ),
          ],
        ),
        if (offline.queue.isEmpty)
          Text('No hay registros en la cola. Todo está sincronizado.', style: LushText.body)
        else
          Column(
            children: [
              for (final item in offline.queue)
                Container(
                  padding: const EdgeInsets.symmetric(vertical: LushSpace.s4),
                  decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: LushColors.hairline))),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(item.label, style: LushText.body),
                            Text(item.timeLabel, style: LushText.caption),
                            if (item.error != null) Text('Error: ${item.error}', style: LushText.captionRouge),
                            if (item.status == QueueStatus.revision)
                              LushButton(
                                label: 'Confirmar importe de ${formatBs(item.amountCents)}',
                                variant: LushButtonVariant.link,
                                block: false,
                                onPressed: () => offline.confirmReview(item.id),
                              ),
                          ],
                        ),
                      ),
                      const SizedBox(width: LushSpace.s4),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(formatBs(item.amountCents), style: LushText.valueMd),
                          const SizedBox(height: LushSpace.s1),
                          switch (item.status) {
                            QueueStatus.pendiente => const LushTag('Pendiente'),
                            QueueStatus.confirmada => const LushTag('Confirmada', tone: LushTone.ok),
                            QueueStatus.revision => const LushTag('Requiere revisión', tone: LushTone.rouge),
                          },
                        ],
                      ),
                    ],
                  ),
                ),
            ],
          ),
        Text(
          'Cada registro lleva una clave única: al reintentar no se duplica. Aprobar liquidaciones y cerrar caja requiere conexión.',
          style: LushText.caption,
        ),
      ],
    );
  }
}
