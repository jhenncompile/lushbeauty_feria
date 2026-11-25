/// Contrato público de `payroll` en el teléfono: solo «Mi liquidación» de la especialista.
library;

export 'pages/mi_liquidacion_page.dart';

class Statement {
  const Statement({
    required this.name,
    required this.commissionCents,
    required this.tipsCents,
    required this.deductionsCents,
    required this.deductionLabel,
  });
  final String name;
  final int commissionCents;
  final int tipsCents;
  final int deductionsCents;
  final String deductionLabel;

  /// comisión + propinas − deducciones, en centavos.
  int get netCents => commissionCents + tipsCents - deductionsCents;
}

const weekLabel = 'Semana 17 – 23 nov 2026';

/// Datos sintéticos del diseño; no son nómina real.
const statements = [
  Statement(name: 'Paty', commissionCents: 16100, tipsCents: 1500, deductionsCents: 3000, deductionLabel: 'Adelanto'),
  Statement(name: 'Katherine', commissionCents: 11200, tipsCents: 0, deductionsCents: 0, deductionLabel: 'Deducciones'),
  Statement(name: 'Marisol', commissionCents: 53900, tipsCents: 2000, deductionsCents: 0, deductionLabel: 'Deducciones'),
];
