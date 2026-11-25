# F14 · seguridad-demo-feria

**Plataformas:** TRANS · todas  **Semanas:** 7-8  **Estado:** pendiente

## Resultado esperado
Un sistema que se puede demostrar con seguridad y sin sorpresas ante el jurado.
**Métrica:** los 10 CP y los 7 DSS-CP pasan; el guion de 5 minutos corre completo en el entorno local; checklist del Anexo N al 100 %.

## Alcance
- Dentro: pruebas de aislamiento (RLS), permisos y secretos, datos sintéticos, ambientes separados (dev/demo/piloto), respaldo y restauración verificada, guion y contingencia.
- Fuera: nuevas funciones.

## Requisitos cubiertos
RF-19, RF-20 · RN-06, RN-08 · CP-06 · Anexo N · cap. 14 (guion, riesgos, definición de terminado)

## Tareas
- [ ] **F14-T1 [TRANS]** Suite de seguridad: cruce de salones, especialista vs nómina ajena, enlaces vencidos, logs sin datos sensibles. *Acept.:* pasa en CI.
- [ ] **F14-T2 [TRANS]** Datos ficticios y cuenta demo sin acceso a datos reales de nómina. *Acept.:* la base real nunca se usa en la demo.
- [ ] **F14-T3 [TRANS]** Respaldo y restauración en un entorno de prueba. *Acept.:* se prueba la restauración, no solo el respaldo.
- [ ] **F14-T4 [TRANS]** Ejecución completa de CP-01..10 y DSS-CP01..07 con evidencia. *Acept.:* informe con aprobado/fallido y causas.
- [ ] **F14-T5 [TRANS]** Guion de 5 minutos (Excel → importar → venta offline → dashboard → What-If → matriz → Insight → aprobación), video de contingencia, teléfono con PWA y cola verificada. *Acept.:* ensayo completo cronometrado.
- [ ] **F14-T6 [TRANS]** Definición de terminado por función: UI usable, validaciones, pruebas, permisos y documentación. *Acept.:* checklist firmado por feature.

## Dependencias
Todas las anteriores. Plan sin IA: la caja funciona aunque Insight esté caído.

## Evidencia
_(se completa al cerrar)_

## Siguiente paso
Demostración / piloto
