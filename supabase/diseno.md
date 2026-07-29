# Torneo de Truco — Diseño de base de datos (resumen ordenado)

Versión ordenada de la conversación previa. Sin temporadas, sin tabla `admin_users`, sin `tournament_settings` separada. Listo para SQL Editor de Supabase (plan Free).

## 1. Decisiones ya cerradas

- Estructura: `tournaments` → `matchdays` → `matchday_results`. Sin temporadas.
- `players` es independiente y persiste entre torneos (no se borra, se marca `active = false`).
- Un solo torneo `active` a la vez.
- Los parámetros de puntaje viven directo en `tournaments` (no hay tabla de settings aparte).
- Los puntos por jornada **no se guardan**; se calculan siempre con la fórmula vigente. Esto permite recalcular todo si cambian los parámetros.
- Login solo para el administrador (Supabase Auth, usuario único creado a mano desde el panel). Sin registro público, sin tabla propia de usuarios.
- `authenticated` = administrador. Cualquier usuario autenticado puede escribir; el público solo puede leer (RLS).
- Auditoría: `created_by` / `updated_by` (y `closed_by` en torneos) referenciando `auth.users.id`.
- Nada se borra físicamente si tiene historial (torneos, jugadores, jornadas); se cancela o desactiva.

## 2. Flujo de negocio (resumen)

1. Admin crea jugadores.
2. Admin crea un torneo (`draft`) y define parámetros.
3. Admin activa el torneo (`active`) — pasa a ser el torneo público actual.
4. Admin crea una jornada (`draft` → `completed`).
5. Carga ganados/perdidos por jugador que participó.
6. La app calcula puntos por jornada con la fórmula (no se edita a mano).
7. Admin puede modificar parámetros del torneo mientras esté activo → recalcula todo automáticamente (con aviso previo).
8. Admin puede corregir jornadas (editar, agregar, borrar participación, cancelar jornada) mientras el torneo esté activo.
9. Admin cierra el torneo → se calcula y confirma ganador, se guarda `closed_at`, estado pasa a `finished`.
10. Se puede reabrir un torneo `finished` (con confirmación, y solo si no hay otro torneo activo) → vuelve a `active`, el ganador guardado deja de ser definitivo hasta cerrar de nuevo.
11. Se crea el torneo siguiente: jugadores se conservan, ranking arranca de cero, numeración de jornadas arranca de 1, parámetros se pueden copiar del anterior.
12. Público (sin login) consulta torneo actual, ranking, jornadas, jugadores e historial.

## 3. Tablas

### 3.1 `players`

| Campo | Tipo | Oblig. | Descripción |
|---|---|---|---|
| id | uuid | sí | PK |
| display_name | text | sí | Nombre/apodo, único (case-insensitive) |
| active | boolean | sí | Si aparece por defecto al cargar jornada |
| notes | text | no | Observaciones |
| created_at / updated_at | timestamptz | sí | Auto |
| created_by / updated_by | uuid → auth.users.id | no | Auditoría |

### 3.2 `tournaments`

| Campo | Tipo | Oblig. | Descripción |
|---|---|---|---|
| id | uuid | sí | PK |
| name | text | sí | |
| description | text | no | |
| status | text | sí | draft / active / finished / cancelled |
| start_date / end_date | date | no | |
| points_per_win | numeric(10,2) | sí | |
| points_per_loss | numeric(10,2) | sí | |
| minimum_points_per_matchday | numeric(10,2) | sí | Piso por jornada |
| winner_player_id | uuid → players.id | no | Se limpia al reabrir |
| closed_at | timestamptz | no | |
| created_at / updated_at | timestamptz | sí | Auto |
| created_by / updated_by / closed_by | uuid → auth.users.id | no | Auditoría |

Reglas: solo un torneo `active` a la vez · `finished` no admite cambios salvo reapertura · ganador debe haber participado en ese torneo.

### 3.3 `matchdays`

| Campo | Tipo | Oblig. | Descripción |
|---|---|---|---|
| id | uuid | sí | PK |
| tournament_id | uuid → tournaments.id | sí | |
| number | integer | sí | Único por torneo (`unique(tournament_id, number)`) |
| played_at | date | no | |
| status | text | sí | draft / completed / cancelled |
| notes | text | no | |
| created_at / updated_at, created_by / updated_by | | sí/no | Auto / auditoría |

Solo las jornadas `completed` cuentan para ranking y asistencia.

### 3.4 `matchday_results`

| Campo | Tipo | Oblig. | Descripción |
|---|---|---|---|
| id | uuid | sí | PK |
| matchday_id | uuid → matchdays.id | sí | Cascade delete |
| player_id | uuid → players.id | sí | |
| matches_won | integer | sí | ≥ 0 |
| matches_lost | integer | sí | ≥ 0 |
| created_at / updated_at, created_by / updated_by | | sí/no | Auto / auditoría |

Restricciones: `unique(matchday_id, player_id)` · `matches_won + matches_lost > 0` (un jugador con 0 y 0 no cuenta como presente, en la v1).

## 4. Fórmula de puntos (no se almacena)

```
puntos = MAX(
  minimum_points_per_matchday,
  matches_won * points_per_win + matches_lost * points_per_loss
)
```

## 5. Vistas a crear

- **matchday_results_with_points**: jornada + jugador + ganados/perdidos + puntos calculados (equivalente a la hoja del Excel).
- **tournament_standings**: tabla general — posición, jornadas jugadas, ganados, perdidos, partidos, puntos totales, promedio, % victorias, % asistencia. Posición calculada con función de ventana según el orden de desempate.
- **tournament_summary**: tarjetas de resumen — estado, ganador o líder actual, cantidad de jornadas completadas, participantes.

Todas con `security_invoker = true` para respetar RLS.

## 6. Desempate (orden fijo v1)

1. Más puntos.
2. Más partidos ganados.
3. Mejor % de victorias.
4. Más jornadas jugadas.
5. Nombre (orden estable, no deportivo).

## 7. Automatización

- Trigger `updated_at = now()` en las 4 tablas.
- Trigger que completa `created_by` / `updated_by` con `auth.uid()` en insert/update.

## 8. RLS

- `SELECT` público (`anon` + `authenticated`) en las 4 tablas.
- `INSERT` / `UPDATE` / `DELETE` solo `authenticated`.

## 9. Índices

`tournaments.status` · `matchdays.tournament_id` · `matchdays.status` · `matchday_results.matchday_id` · `matchday_results.player_id`.

## 10. Puntos a confirmar antes de escribir el SQL

1. **Un solo torneo activo**: ¿lo forzamos con un índice único parcial (`unique index where status = 'active'`) o lo controlamos desde la app? Recomendado: índice parcial, así queda blindado a nivel de base también.
2. **Cierre sin jornadas**: ¿bloqueamos el cierre si el torneo no tiene ninguna jornada `completed`, o lo dejamos pasar (torneo cerrado sin ganador)?
3. **Reapertura con otro torneo activo**: ¿bloqueamos directamente en base (trigger/constraint) o solo lo validamos desde la app?
4. **matches_won = 0 y matches_lost = 0**: quedó en "no cuenta como presente" para v1 — ¿confirmás esto o preferís permitir asistencia sin partidas jugadas (recibiendo el mínimo)?
5. **Nombre de jugador único**: ¿case-insensitive solamente, o también ignoramos espacios/acentos?
6. **Copiar parámetros al crear el torneo siguiente**: es una acción de la app (insert con los mismos valores), no requiere nada especial en el schema — solo para confirmar que no hace falta una tabla de "plantillas".

Con esto confirmado, el siguiente paso es el script SQL completo (tablas, constraints, índices, funciones, triggers, vistas, RLS) para pegar en el SQL Editor de Supabase.
