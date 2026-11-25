/// Contrato público de `sales`: registro de servicio y resumen del día.
library;

import 'dart:math';

import 'package:material_ui/material_ui.dart';

import '../catalog/catalog.dart';
import '../identity/identity.dart';
import '../offline/offline.dart';
import 'domain/sale.dart';

export 'pages/descuento_page.dart';
export 'pages/guardado_page.dart';
export 'pages/hoy_page.dart';
export 'pages/registrar_page.dart';

const paymentMethods = ['Efectivo', 'QR', 'Transferencia'];
const discountReasons = ['Clienta frecuente', 'Promoción', 'Corrección', 'Otro'];

class Discount {
  const Discount(this.cents, this.reason, this.detail);
  final int cents;
  final String reason;
  final String detail;
}

class SavedSale {
  const SavedSale({
    required this.clientUuid,
    required this.serviceName,
    required this.specialistName,
    required this.method,
    required this.listCents,
    required this.discountCents,
    required this.discountReason,
    required this.chargedCents,
    required this.commissionCents,
    required this.commissionBps,
  });
  final String clientUuid;
  final String serviceName;
  final String specialistName;
  final String method;
  final int listCents;
  final int discountCents;
  final String? discountReason;
  final int chargedCents;
  final int commissionCents;
  final int commissionBps;
}

String _newUuid() {
  final random = Random.secure();
  return List.generate(16, (_) => random.nextInt(256).toRadixString(16).padLeft(2, '0')).join();
}

/// Registro de servicio en curso. Vive en memoria; con backend se envía con su UUID (RN-01).
class SalesController extends ChangeNotifier {
  SalesController({required this.offline}) : _clientUuid = _newUuid();

  final OfflineController offline;
  final services = listServices();
  final specialists = listSpecialists();
  final policy = getPolicy();

  String serviceId = listServices().first.id;
  String specialistId = 'marisol';
  String? method;
  Discount? discount;
  SavedSale? saved;
  String _clientUuid;

  CatalogService get service => services.firstWhere((s) => s.id == serviceId);
  Specialist get specialist => specialists.firstWhere((s) => s.id == specialistId);

  SaleResult get result => calculateSale(
        listCents: service.listPriceCents,
        discountCents: discount?.cents ?? 0,
        policy: SalePolicy(commissionBps: policy.commissionBps, maxDiscountBps: policy.maxDiscountBps),
      );

  bool get needsApproval => result.exceedsLimit;
  bool get canSave => method != null && !needsApproval;

  void pickService(String id) {
    serviceId = id;
    discount = null;
    notifyListeners();
  }

  void pickSpecialist(String id) {
    specialistId = id;
    notifyListeners();
  }

  void pickMethod(String value) {
    method = value;
    notifyListeners();
  }

  void setDiscount(Discount? value) {
    discount = value;
    notifyListeners();
  }

  bool save() {
    if (!canSave) return false;
    final r = result;
    final record = SavedSale(
      clientUuid: _clientUuid,
      serviceName: service.name,
      specialistName: specialist.name,
      method: method!,
      listCents: r.listCents,
      discountCents: r.discountCents,
      discountReason: discount?.reason,
      chargedCents: r.chargedCents,
      commissionCents: r.commissionCents,
      commissionBps: policy.commissionBps,
    );
    offline.enqueue(
      id: record.clientUuid,
      label: '${record.serviceName} · ${record.specialistName}',
      amountCents: record.chargedCents,
    );
    saved = record;
    // Nuevo registro: nueva clave de idempotencia.
    _clientUuid = _newUuid();
    serviceId = services.first.id;
    specialistId = 'marisol';
    method = null;
    discount = null;
    notifyListeners();
    return true;
  }

  void undoSaved() {
    saved = null;
    notifyListeners();
  }
}
