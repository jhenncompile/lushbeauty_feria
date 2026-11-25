# insight

**Responsabilidad:** Lush Insight en la PWA (F11, solo UI con respuestas de ejemplo): asistente de consultas financieras de **solo lectura**.

**Contrato público (`index.ts`):** `InsightPage`, `WebInsightPage`.

**Dependencias:** `shared/layout` y `shared/ui`. No importa otros módulos.

**Reglas puras (`domain/answer.ts`):** responde solo con cifras de reportes predefinidos (descuentos por servicio, QR de la semana); ante cualquier otra cosa responde «Información insuficiente» y no inventa. Se prueba sin React.

**Invariantes de UI:** no escribe datos, no autoriza pagos, no muestra la nómina de otras especialistas; cada respuesta enlaza al reporte de origen.

**Eventos:** no emite ni consume. Con backend usará funciones de lectura del backend, nunca SQL generado por el modelo (F11).
