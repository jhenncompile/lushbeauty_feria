# F14 · seguridad-demo-feria

**Plataformas:** TRANS · todas  **Semanas:** 7-8  **Estado:** T1/T2 parciales; el resto pendiente

## Resultado esperado
Un sistema que se puede demostrar con seguridad y sin sorpresas ante el jurado.
**Métrica:** los 10 CP y los 7 DSS-CP pasan; el guion de 5 minutos corre completo en el entorno local; checklist del Anexo N al 100 %.

## Alcance
- Dentro: pruebas de aislamiento (RLS), permisos y secretos, datos sintéticos, ambientes separados (dev/demo/piloto), respaldo y restauración verificada, guion y contingencia.
- Fuera: nuevas funciones.

## Requisitos cubiertos
RF-19, RF-20 · RN-06, RN-08 · CP-06 · Anexo N · cap. 14 (guion, riesgos, definición de terminado)

## Tareas
- [~] **F14-T1 [TRANS]** Suite de seguridad: cruce de salones, especialista vs nómina ajena, enlaces vencidos, logs sin datos sensibles. *Acept.:* pasa en CI. Incluir: la RLS con un rol sin privilegios, los triggers (RN-02, RN-04, RN-05, DSS-CP07) probados directo contra la BD, y que una especialista no lee la nómina de otra (la RLS no lo cubre). **Auditoría 2026-11-26:** Existe: Pruebas de RLS con rol sin privilegios, aislamiento entre salones, triggers de inmutabilidad (líneas, cierres, reglas, bitácora) y 403 con bitácora. Falta: Enlaces vencidos, logs sin datos sensibles y que corra en CI. Bloquea: F13-T3.
- [~] **F14-T2 [TRANS]** Datos ficticios y cuenta demo sin acceso a datos reales de nómina. *Acept.:* la base real nunca se usa en la demo. **Auditoría 2026-11-26:** Existe: `seed_demo` crea solo datos ficticios y se niega fuera de `DJANGO_DEBUG`. Falta: Garantizar que la demo nunca apunta a la base real. Bloquea: Nada.
- [ ] **F14-T3 [TRANS]** Respaldo y restauración en un entorno de prueba. *Acept.:* se prueba la restauración, no solo el respaldo; tras restaurar siguen activos triggers, RLS y vistas. **Auditoría 2026-11-26:** Existe: Nada. Falta: Respaldo y restauración probados. Bloquea: Nada.
- [ ] **F14-T4 [TRANS]** Ejecución completa de CP-01..10 y DSS-CP01..07 con evidencia. *Acept.:* informe con aprobado/fallido y causas. **Auditoría 2026-11-26:** Existe: Hay pruebas automáticas de varios CP; ninguna ejecución formal con informe. Falta: Ejecución completa de CP-01..10 y DSS-CP01..07 con evidencia. Bloquea: F03, F05 y F08–F10.
- [ ] **F14-T5 [TRANS]** Guion de 5 minutos (Excel → importar → venta offline → dashboard → What-If → matriz → Insight → aprobación), video de contingencia, teléfono con PWA y cola verificada. *Acept.:* ensayo completo cronometrado. **Auditoría 2026-11-26:** Existe: Nada. Falta: Guion de 5 minutos y ensayo cronometrado. Bloquea: El recorrido completo.
- [ ] **F14-T6 [TRANS]** Definición de terminado por función: UI usable, validaciones, pruebas, permisos y documentación. *Acept.:* checklist firmado por feature. **Auditoría 2026-11-26:** Existe: Nada. Falta: Checklist firmado por feature. Bloquea: Todas.

## Dependencias
Todas las anteriores. Plan sin IA: la caja funciona aunque Insight esté caído.

## Evidencia
_(se completa al cerrar)_

Auditoría 2026-11-26: estado contrastado con el código; suite de backend 202 pruebas OK. La UI web solo consume `POST /api/auth/login`; Flutter no llama a la red.

## Siguiente paso
Completar T1 (enlaces vencidos, logs sin datos sensibles) cuando exista F13-T3.
