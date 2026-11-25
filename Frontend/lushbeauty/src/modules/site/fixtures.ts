export const CHAPTERS = [
  { title: 'Registro de servicios', description: 'Catálogo estructurado, descuentos con motivo y registro sin conexión.', tag: 'Núcleo' },
  { title: 'Caja y cierres', description: 'Lo esperado frente a lo contado, por efectivo, QR y transferencia.', tag: 'Núcleo' },
  { title: 'Liquidación semanal', description: 'Borrador, verificación y aprobación, con propinas y deducciones.', tag: 'Núcleo' },
  { title: 'Importador de planillas', description: 'Lleva su Excel al sistema, con correcciones propuestas que usted revisa.', tag: 'Ampliación' },
  { title: 'Lush Insight', description: 'Responde preguntas sobre su caja con cifras de sus propios reportes.', tag: 'Ampliación' },
  { title: 'Lush Guard', description: 'Avisa cuando un dato se sale de las reglas que usted definió.', tag: 'Ampliación' },
  { title: 'Lush Decision Studio', description: 'Compara descuentos, precios y comisiones antes de decidir.', tag: 'Ampliación' },
]

export const SERVICES = [
  { title: 'Manicura gel', description: 'Esmaltado en gel con preparación de la uña.', duration: '60 min', price: 'Bs 120' },
  { title: 'Pedicura', description: 'Cuidado completo de pies y uñas.', duration: '60 min', price: 'Bs 100' },
  { title: 'Cejas', description: 'Diseño y perfilado.', duration: '30 min', price: 'Bs 60' },
  { title: 'Pestañas', description: 'Lifting y tratamiento de pestañas.', duration: '90 min', price: 'Bs 180' },
  { title: 'Lush Little Princess', description: 'Línea de belleza para niñas.', duration: '45 min', price: 'Bs 80' },
]

export const STEPS = [
  { title: 'Registrar', description: 'Elija el servicio y el método de pago. Tres toques, incluso sin conexión.' },
  { title: 'Cerrar', description: 'Compare lo esperado con lo contado. El sistema pide justificar cualquier diferencia.' },
  { title: 'Liquidar', description: 'Verifique el borrador y apruébelo. Cada especialista recibe su propio comprobante.' },
]

export const FAQ = [
  { question: '¿Funciona sin internet?', answer: 'Sí. El registro de servicios se guarda en el teléfono y se envía al volver la conexión. Aprobar liquidaciones y cerrar caja requieren conexión.' },
  { question: '¿Quién puede ver la nómina?', answer: 'La administradora ve todo. Cada especialista ve solo su propia liquidación.' },
  { question: '¿La inteligencia artificial puede aprobar pagos?', answer: 'No. Lush Insight consulta reportes y sugiere. La decisión es siempre de la administradora.' },
  { question: '¿Puedo traer mi planilla de Excel?', answer: 'Sí. Se importa un archivo .xlsx, se revisan las correcciones propuestas y no se guarda nada hasta que usted confirma.' },
  { question: '¿Incluye reservas, facturación o inventario?', answer: 'No. Esta versión se concentra en la caja y la nómina. La agenda, la facturación electrónica y el inventario quedan fuera.' },
]
