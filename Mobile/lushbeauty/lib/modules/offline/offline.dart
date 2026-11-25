/// Contrato público de `offline`: cola de envío y estado de conexión.
library;

import 'package:material_ui/material_ui.dart';

import '../../shared/connection.dart';

export 'pages/sincronizacion_page.dart';

enum QueueStatus { pendiente, confirmada, revision }

class QueueItem {
  const QueueItem({
    required this.id,
    required this.label,
    required this.timeLabel,
    required this.amountCents,
    required this.status,
    this.error,
  });
  final String id;
  final String label;
  final String timeLabel;
  final int amountCents;
  final QueueStatus status;
  final String? error;

  QueueItem withStatus(QueueStatus next) => QueueItem(
        id: id,
        label: label,
        timeLabel: timeLabel,
        amountCents: amountCents,
        status: next,
      );
}

/// Cola de ejemplo del diseño (datos sintéticos) para demos y pruebas.
const sampleQueue = [
  QueueItem(id: 'q1', label: 'Manicura gel · Marisol', timeLabel: 'Hoy 19:46', amountCents: 11200, status: QueueStatus.pendiente),
  QueueItem(id: 'q2', label: 'Pedicura · Paty', timeLabel: 'Hoy 19:21', amountCents: 10000, status: QueueStatus.pendiente),
  QueueItem(id: 'q3', label: 'Cejas · Katherine', timeLabel: 'Hoy 18:58', amountCents: 6000, status: QueueStatus.pendiente),
  QueueItem(id: 'q4', label: 'Pestañas · Paty', timeLabel: 'Hoy 18:30', amountCents: 17000, status: QueueStatus.confirmada),
  QueueItem(
    id: 'q5',
    label: 'Depilación · Katherine',
    timeLabel: 'Hoy 18:05',
    amountCents: 4000,
    status: QueueStatus.revision,
    error: 'el catálogo cambió el precio mientras no había conexión. Confirme el importe para reenviarlo.',
  ),
];

enum RetryResult { sent, offline }

/// Cola de envío simulada en memoria: sin servidor, «enviar» solo cambia el estado.
class OfflineController extends ChangeNotifier {
  OfflineController({this._online = true, List<QueueItem> initialQueue = const []})
      : _queue = List.of(initialQueue);

  bool _online;
  List<QueueItem> _queue;

  bool get online => _online;
  List<QueueItem> get queue => List.unmodifiable(_queue);
  int get pending => _queue.where((i) => i.status == QueueStatus.pendiente).length;
  ConnectionInfo get info => ConnectionInfo(online: _online, pending: pending);

  /// Guarda el registro: «pendiente» sin conexión, «confirmada» con ella. Mismo id no se duplica.
  void enqueue({required String id, required String label, required int amountCents}) {
    if (_queue.any((i) => i.id == id)) return;
    final now = DateTime.now();
    final time = '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';
    _queue = [
      QueueItem(
        id: id,
        label: label,
        timeLabel: 'Hoy $time',
        amountCents: amountCents,
        status: _online ? QueueStatus.confirmada : QueueStatus.pendiente,
      ),
      ..._queue,
    ];
    notifyListeners();
  }

  void confirmReview(String id) {
    _queue = [
      for (final item in _queue)
        item.id == id ? item.withStatus(_online ? QueueStatus.confirmada : QueueStatus.pendiente) : item,
    ];
    notifyListeners();
  }

  RetryResult retry() {
    if (!_online) return RetryResult.offline;
    _flush();
    notifyListeners();
    return RetryResult.sent;
  }

  /// Solo demos y pruebas de campo: fuerza el estado de conexión.
  void simulateOnline(bool online) {
    _online = online;
    if (online) _flush();
    notifyListeners();
  }

  void _flush() {
    _queue = [
      for (final item in _queue)
        item.status == QueueStatus.pendiente ? item.withStatus(QueueStatus.confirmada) : item,
    ];
  }
}
