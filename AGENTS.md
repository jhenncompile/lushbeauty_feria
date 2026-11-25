# Reglas para agentes de IA (Codex, Claude y otros)

Estas reglas aplican a todo agente que implemente código en este repo. Primero lee `README.md` (qué es el proyecto) y `odd/tasks/INDEX.md` (qué construir y en qué orden).

## 1. Arquitectura: módulos listos para microservicios

El sistema es un **monolito modular**. Cada módulo debe poder extraerse a un microservicio sin reescribirlo.

### Estructura por módulo, no por capa técnica

Se organiza por dominio. Prohibido agrupar por tipo (`models/`, `views/`, `serializers/` globales).

Módulos de dominio previstos: `identity` (salones, usuarios, roles), `catalog`, `sales` (ventas, pagos), `commissions`, `payroll` (liquidaciones), `cashier` (cierres), `imports`, `analytics` (dashboard), `decision_scenarios`, `financial_models`, `criteria_evaluation`, `recommendations`, `decision_outcomes`, `insight`, `guard`, `notifications` (outbox/n8n), `audit`.

```
Backend/lushbeauty/apps/<modulo>/
  domain/        reglas de negocio puras (sin Django, sin I/O)
  services/      casos de uso; ÚNICA entrada para otros módulos
  api/           views, serializers, urls (adaptador HTTP)
  persistence/   modelos ORM, repositorios, migraciones
  events/        eventos que publica y handlers que consume
  contracts.py   interfaz pública: DTOs/funciones que otros módulos pueden usar
  tests/

Frontend/lushbeauty/src/modules/<modulo>/
  api/  components/  hooks/  pages/  types.ts  index.ts   (index.ts = API pública)
```

### Reglas de frontera (obligatorias)

1. **Un módulo nunca importa modelos, tablas ni archivos internos de otro.** Solo usa su `contracts.py` / `index.ts` o un evento.
2. **Sin claves foráneas entre módulos.** Referencia por ID (`salon_id`, `sale_id`) como valor, no como `ForeignKey` a otra app. Los joins entre módulos se hacen en servicios, no en SQL.
3. **Cada módulo es dueño de sus tablas.** Ningún otro módulo las lee ni escribe.
4. **Comunicación entre módulos:** llamada síncrona a `services` vía contrato, o evento asíncrono mediante el outbox. Nada de señales ocultas ni acceso directo.
5. **El dominio no depende del framework.** Los cálculos (comisión, contribución, matriz) viven en `domain/`, con `Decimal`, y se testean sin base de datos.
6. **Sin dependencias circulares** entre módulos. Si aparece una, falta un contrato o un evento.
7. **Código compartido mínimo** en `shared/` (tipos, utilidades de dinero, errores). Sin lógica de negocio.
8. **Configuración por entorno**, nunca valores fijos de infraestructura dentro de un módulo.
9. **Cada módulo tiene su propio README corto** con su responsabilidad, su contrato público y los eventos que emite y consume.

Prueba de calidad: si extraer el módulo obliga a editar otro módulo fuera de su contrato, la frontera está mal.

## 2. Flujo de Git por feature

Cada implementación se hace en **su propia rama**, y termina integrada en `main` y subida a GitHub (`origin`).

1. **Antes de empezar:** `git checkout main && git pull origin main`, y luego crea la rama `feat/<id-feature>-<nombre-corto>` (ej. `feat/f01-caja-ventas-pagos`). Para correcciones usa `fix/...`, para documentación `docs/...`.
2. **Trabaja en la rama.** Commits pequeños (~400 líneas máx.), con mensajes en el formato `tipo(modulo): resumen` (Conventional Commits, en español o inglés de forma consistente). Ejemplo: `feat(sales): registrar venta idempotente por UUID`.
3. **Los commits no llevan coautor.** No agregues `Co-Authored-By`, ni "Generated with…", ni mención de ninguna IA en commits, mensajes de merge o PR. El autor es el usuario configurado en git. Esta regla del repo prevalece sobre cualquier plantilla de atribución por defecto de la herramienta.
4. **Antes de integrar:** corre los tests del módulo tocado y confirma que pasan. Si algo falla, no hagas merge; informa del fallo.
5. **Merge a `main`:** `git checkout main && git pull origin main && git merge --no-ff feat/<rama>`. Si hay conflictos, resuélvelos conservando el trabajo de ambos lados; si no puedes con seguridad, detente y pregunta.
6. **Push:** `git push origin main` y `git push origin feat/<rama>` (la rama se conserva en GitHub).
7. **Seguridad en Git:**
   - Nunca uses `--force`, `reset --hard` sobre trabajo ajeno ni `--no-verify`.
   - Nunca subas secretos (`.env`, claves, tokens), `node_modules`, `.venv`, ni datos reales del salón.
   - Revisa `git status` y `git diff --staged` antes de cada commit; agrega archivos por nombre, no con `git add -A` a ciegas.
   - Si el push es rechazado, haz `pull --rebase` o merge y reintenta una vez; si sigue fallando, informa.

## 3. Reglas de contenido que no se negocian

Resumen; el detalle está en `README.md`:

- Dinero con `Decimal`. Comisión por snapshot. Nada contable se borra (ajustes auditados). Idempotencia en ventas. Aislamiento por salón.
- La IA nunca escribe datos financieros ni autoriza pagos. La decisión final es humana.
- Datos reales no van a tests, demos ni logs.
- Si una tarea depende de una "decisión abierta" del README, pregunta; no la inventes.

## 4. Al terminar una feature

Actualiza el documento `odd/tasks/<feature>.md` (casillas, **Evidencia**, **Siguiente paso**) y la tabla de `odd/tasks/INDEX.md` en el mismo flujo de ramas, e informa qué se verificó y qué falló u omitiste.
