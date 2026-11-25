/// Contrato público de `catalog`: servicios con precio de lista y política ilustrativa.
library;

class CatalogService {
  const CatalogService(this.id, this.name, this.listPriceCents);
  final String id;
  final String name;
  final int listPriceCents;
}

/// Valores ILUSTRATIVOS del diseño (35 % sobre lista, 10 % de descuento máximo).
/// No son reglas del negocio: dependen de las decisiones abiertas 2 y 6 del README.
class IllustrativePolicy {
  const IllustrativePolicy({required this.commissionBps, required this.maxDiscountBps});
  final int commissionBps;
  final int maxDiscountBps;
}

const _services = [
  CatalogService('manicura-gel', 'Manicura gel', 12000),
  CatalogService('pedicura', 'Pedicura', 10000),
  CatalogService('cejas', 'Cejas', 6000),
  CatalogService('pestanas', 'Pestañas', 18000),
  CatalogService('depilacion', 'Depilación', 4000),
  CatalogService('little-princess', 'Lush Little Princess', 8000),
];

List<CatalogService> listServices() => _services;

IllustrativePolicy getPolicy() => const IllustrativePolicy(commissionBps: 3500, maxDiscountBps: 1000);
