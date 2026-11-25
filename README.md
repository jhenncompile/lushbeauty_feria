# Lush Beauty Smart

> Contexto para personas y agentes de IA. Léelo completo antes de proponer o cambiar nada.

## Qué es

Sistema web/móvil para gestionar la **caja** y la **liquidación semanal de comisiones** del salón de belleza **Lush Beauty** (Santa Cruz de la Sierra, Bolivia). Hoy el salón trabaja con hojas de cálculo manuales, lo que produce errores de cálculo, datos inconsistentes y liquidaciones lentas.

Es un proyecto académico/de feria (UAGRM) con un **piloto real** en un salón de 3 personas. La fuente de verdad de los requisitos es el documento LaTeX en `docs/latex/latex/`.

El proyecto tiene dos capas:

1. **Núcleo transaccional.** Ventas, pagos, descuentos, comisiones versionadas, propinas, deducciones, liquidación semanal y cierre de caja.
2. **Lush Smart (DSS).** Soporte para la toma de decisiones sobre ese núcleo:
   - **Lush Decision Studio:** contribución por servicio, simulación What-If, matriz multicriterio con sensibilidad, recomendaciones explicables y bitácora de decisiones.
   - **Lush Insight:** asistente de consultas financieras de solo lectura.
   - **Lush Guard:** alertas por reglas.
   - **n8n:** avisos automáticos.
   - También: registro offline e importador de Excel.

## Usuarios y roles

| Rol | Puede |
|---|---|
| Administradora | Configura catálogo, reglas, descuentos, cierres y liquidaciones. Aprueba decisiones. |
| Especialista | Registra servicios y ve **solo su** liquidación. |
| Lector/contador | Ve reportes agregados (opcional). |

## Principios no negociables

- **Dinero con `Decimal`**, nunca `float`. El redondeo es explícito.
- **La comisión se calcula con la regla vigente al vender** y se guarda como snapshot. Cambiar una política no recalcula el pasado.
- **Nada contable se borra:** las anulaciones y correcciones generan ajustes auditados. Una liquidación aprobada es inmutable.
- **Idempotencia:** reintentar la misma venta (mismo UUID) no la duplica.
- **Aislamiento por salón** (`salon_id`/RLS) en todas las consultas, con pruebas que lo demuestren.
- **La IA nunca escribe datos financieros, no autoriza pagos y no cambia políticas.** Solo consulta mediante funciones de lectura y redacta resultados ya calculados por el backend. Si faltan datos, responde "Información insuficiente".
- **La decisión final es siempre humana** (la administradora). Las simulaciones se rotulan como supuestos y se separan de los datos observados.
- **Datos reales de nómina y clientas no van a tests, demos ni logs.** Usar datos sintéticos.

## Stack objetivo (según el documento)

- **Backend:** Django + DRF, PostgreSQL, monolito modular.
- **Cliente:** React + TypeScript como **PWA mobile-first** (Service Worker + IndexedDB para el modo offline).
- **Importador:** openpyxl + RapidFuzz.
- **Automatización:** n8n con patrón outbox.
- **Despliegue:** Docker Compose, HTTPS.

## Estructura del repo

```
Backend/lushbeauty/    Django (uv, pyproject.toml)
Frontend/lushbeauty/   React + Vite + TypeScript (pnpm)
Mobile/lushbeauty/     Proyecto Flutter  ← ver discrepancia abajo
docs/latex/latex/      Documento de investigación y requisitos (fuente de verdad)
odd/tasks/             Backlog ODD: INDEX.md + F00..F14
```

## Discrepancia a resolver

El documento define **una sola PWA** y excluye explícitamente una app nativa o React Native para la feria. En el repo existe `Mobile/lushbeauty` como proyecto **Flutter**. Antes de trabajar en `Mobile/`, pregunta al equipo si se descarta, se usa para algo concreto o se cambia la decisión del documento. No asumas ninguna de las tres opciones.

## Cómo trabajar aquí (ODD)

El flujo es **ODD** (Gentle-AI): trabajo pequeño se hace directo; trabajo sustancial va en un documento de feature en `odd/tasks/<feature>.md` **antes** del primer cambio de código.

1. Empieza por `odd/tasks/INDEX.md`: orden, estado, prioridades y cobertura de requisitos.
2. Abre el documento de la feature (`F00`…`F14`). Cada tarea lleva etiqueta `[BE]`, `[WEB]`, `[MOB]` o `[TRANS]`, un test RED y un criterio de aceptación.
3. Test-first (RED → GREEN → REFACTOR), commits de ~400 líneas.
4. Al cerrar, rellena **Evidencia** y **Siguiente paso**. Reporta lo que falló o se omitió.

**Orden de prioridad si falta tiempo:** primero la exactitud del núcleo financiero (F00–F04), luego un ciclo DSS completo (F08–F10). Se recortan primero Insight, Guard y n8n.

## Fuera del MVP (no implementar sin pedirlo)

Proyección de caja (DSS-08), optimización de capacidad (DSS-09), pronósticos con ML (DSS-10), React Native, agenda, inventario y WhatsApp.

## Decisiones abiertas (no las inventes)

Estas las define la administradora. Si una tarea depende de alguna, **pregunta**:

1. Redondeo de moneda.
2. Base de comisión: precio de lista o importe neto (el documento usa lista solo como ejemplo).
3. Costos variables de materiales por servicio.
4. Pesos de la matriz multicriterio (los del documento son de ejemplo).
5. Fecha real de la feria.
6. Día de corte semanal y política de propinas.

## Glosario

- **Liquidación:** pago semanal por especialista: comisiones + propinas − deducciones.
- **Snapshot:** copia inmutable de precio, descuento, tasa y política guardada en cada línea de venta.
- **Contribución:** `U = R − c·B − M`, donde R es el precio cobrado, c la tasa de comisión, B la base y M los materiales. No equivale a utilidad neta.
- **What-If:** escenario hipotético que nunca modifica datos reales.
- **Outbox:** evento guardado en la misma transacción que la operación, publicado después a n8n.
- **Idempotencia:** repetir una petición no cambia el resultado.

## Idioma

Documentación y textos de interfaz en **español** (Bolivia, moneda Bs). Identificadores de código en inglés o como defina cada feature.
