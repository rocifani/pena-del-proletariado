# Peña del Proletariado

App de torneos de truco. Sitio público con el ranking + panel de administración protegido.

Stack: **Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Supabase**.

---

## Puesta en marcha

```bash
npm install
cp .env.local.example .env.local   # y completar con tus datos de Supabase
npm run dev
```

Abrir http://localhost:3000

> `node_modules` no viene incluido: hay que correr `npm install` en tu propia máquina
> para que se bajen los binarios correctos de tu sistema operativo.

### Variables de entorno

En `.env.local` (y después en Vercel → Settings → Environment Variables):

| Variable | Dónde sale |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon public |

No hace falta la service role key: todas las escrituras van con la sesión del
administrador y las políticas RLS de la base.

### Base de datos

1. Supabase → SQL Editor → pegar y ejecutar `supabase/schema.sql`.
2. Supabase → Authentication → Users → **Add user** → crear el usuario administrador
   (mail + contraseña). No hay registro público en la app.

El diseño y las reglas de negocio están documentados en `supabase/diseno.md`.

---

## Estructura

```
src/
├── app/
│   ├── layout.tsx              raíz: fuentes, tema y script anti-flash
│   ├── globals.css             Tailwind v4, paleta de marca, helpers
│   ├── login/                  ingreso del administrador
│   ├── logout/                 route handler de salida
│   ├── (public)/               sitio público, sin login
│   │   ├── layout.tsx          PublicShell
│   │   ├── page.tsx            inicio: torneo en curso + top 5
│   │   ├── ranking/
│   │   ├── fechas/
│   │   ├── jugadores/
│   │   └── torneos/
│   └── admin/                  panel, protegido por middleware
│       ├── layout.tsx          AdminShell
│       ├── page.tsx            panel
│       ├── jugadores/          ABM completo (referencia del patrón)
│       ├── torneos/            alta, parámetros, cierre y reapertura
│       └── fechas/             alta y carga de resultados
├── components/
│   ├── PublicShell.tsx         header + nav pública
│   ├── AdminShell.tsx          sidebar hamburguesa (mobile) / fijo (desktop)
│   ├── ThemeToggle.tsx         claro / oscuro, persistido en localStorage
│   ├── StandingsTable.tsx      tabla general: tarjetas en mobile, tabla en desktop
│   ├── MatchdayGrid.tsx        carga de resultados de una fecha
│   ├── TournamentForm.tsx
│   ├── PlayerForm.tsx
│   ├── SubmitButton.tsx        envío + modal de confirmación propio
│   ├── ui.tsx                  PageHeader, EmptyState, Toast, Badge, ErrorBox
│   └── icons.tsx
├── lib/
│   ├── supabase/               clientes browser / server / server-readonly
│   ├── queries.ts              consultas compartidas
│   ├── types.ts                tipos del esquema
│   └── format.ts               formato de números y fechas
└── middleware.ts               refresco de sesión + guard de /admin
```

---

## Convenciones

**Lectura de datos.** Server Components con `createSupabaseServerReadOnly()`.
Nunca escribe cookies (Next no lo permite durante el render); del refresco de
sesión se encarga el middleware.

**Escritura de datos.** Server Actions en un `actions.ts` al lado de la página, con
`createSupabaseServer()`. Usan la sesión del administrador, así que las políticas RLS
son las que autorizan de verdad.

**Feedback al usuario.** Las actions terminan con un `redirect` que agrega
`?toast=...` (éxito) o `?error=...` (falla), y la página los muestra con `<Toast />`
y `<ErrorBox />`. Ver `src/app/admin/jugadores/` como referencia.

**Vocabulario.** En la interfaz, cada juntada se llama **fecha**. En el código y en
la base sigue siendo `matchday` / `matchdays`, que es el nombre de la tabla. No
mezclar: si aparece un texto visible, va "fecha"; si es un identificador, va en
inglés.

**Estilos.** Clases utilitarias de Tailwind. Para lo repetido hay helpers en
`globals.css`: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.card`,
`.form-input`, `.form-label`.

⚠️ Esos helpers **tienen que quedar dentro de `@layer components`**. Si se
escriben fuera de una capa, le ganan a las utilidades de Tailwind (que viven en
la capa `utilities`) y cosas como `w-20` sobre un `.form-input` dejan de tener
efecto.

**Color de marca.** `#7092bf` es `brand-400`. Escala completa de `brand-50` a
`brand-900` definida en `globals.css`.

**Modo oscuro.** Por clase `.dark` en `<html>`, no por preferencia del sistema.
El script del `layout.tsx` la aplica antes del primer pintado para evitar el
flash blanco; `ThemeToggle` la cambia y guarda la elección en `localStorage`.

**Mobile first.** Empezar por el layout chico y agregar `sm:` / `md:` para arriba.
Los botones y links tocables usan `min-h-11` (44 px).

---

## Deploy en Vercel

1. Subir el repo a GitHub.
2. Vercel → Add New → Project → importar el repo.
3. Cargar las dos variables de entorno.
4. Deploy.

En Supabase → Authentication → URL Configuration, agregar la URL de producción
a **Site URL** y **Redirect URLs**.

---

## Ciclo de uso

1. **Jugadores** → cargar a los integrantes de la peña.
2. **Torneos** → crear uno (nace en borrador), revisar el puntaje, **Activar**.
3. **Fechas** → crear la fecha (el número se autocompleta), agregar con el
   desplegable a los que jugaron, cargar ganados y perdidos, **Guardar la fecha**
   y después **Marcar como completada**. Solo las completadas suman a la tabla.
4. Al terminar el torneo: **Torneos → Cerrar torneo**, revisar la tabla final y
   confirmar el campeón.
5. Si hace falta corregir algo de un torneo cerrado, **Reabrir**, corregir y
   volver a cerrar.

Cambiar el puntaje de un torneo activo recalcula todas sus fechas
automáticamente: los puntos no se guardan, se calculan en las vistas de la base.

## Pendiente

- [ ] Perfil e historial por jugador
- [ ] Vista pública de detalle de un torneo histórico (hoy solo se ve el activo)
- [ ] Exportar la tabla a Excel
