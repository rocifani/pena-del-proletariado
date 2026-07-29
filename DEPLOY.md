# Subir a GitHub y deployar en Vercel

Guía paso a paso. Todo esto se hace una sola vez; después, cada `git push`
redeploya solo.

---

## Antes de empezar

Verificá que tengas Git instalado. En una terminal parada en la carpeta del
proyecto (`C:\pena-del-proletariado`):

```bash
git --version
```

Si dice "no se reconoce el comando", instalalo desde https://git-scm.com/download/win
y volvé a abrir la terminal.

> Para abrir la terminal en la carpeta: entrás a `C:\pena-del-proletariado` en el
> explorador, escribís `cmd` en la barra de direcciones y Enter.

---

## Paso 1 — Confirmar que la contraseña no se sube

Esto es lo único que no se puede deshacer si sale mal, así que va primero.

El archivo `.env.local` tiene tus claves de Supabase y **no tiene que llegar a
GitHub**. Ya está listado en `.gitignore`, pero conviene verificarlo con los
ojos:

```bash
type .gitignore
```

Tenés que ver estas tres líneas:

```
.env
.env.local
.env*.local
```

Si están, seguimos.

---

## Paso 2 — Inicializar el repositorio

```bash
cd C:\pena-del-proletariado
git init
git add .
git status
```

`git status` te lista todo lo que se va a subir. **Revisá que NO aparezca
`.env.local`** (sí puede aparecer `.env.local.example`, ese es el de mentira y
está bien que se suba).

Si por algún motivo aparece `.env.local`, pará acá y avisame antes de seguir.

Si está todo bien:

```bash
git commit -m "Primera version: torneos, fechas, jugadores y sitio publico"
```

---

## Paso 3 — Crear el repositorio en GitHub

1. Entrá a https://github.com/new
2. **Repository name**: `pena-del-proletariado`
3. **Description** (opcional): "Torneos de truco de la Peña del Proletariado"
4. Elegí **Private** si no querés que se vea el código, o **Public** si te da igual.
   Las claves no están en el repo, así que cualquiera de las dos sirve.
5. **NO** marques "Add a README", ni `.gitignore`, ni licencia. El repo tiene que
   quedar vacío, porque el contenido lo subimos nosotros.
6. **Create repository**

GitHub te va a mostrar una pantalla con comandos. Ignorala, usá los del paso 4.

---

## Paso 4 — Subir el código

Reemplazá `TU-USUARIO` por tu nombre de usuario de GitHub:

```bash
git branch -M main
git remote add origin https://github.com/TU-USUARIO/pena-del-proletariado.git
git push -u origin main
```

La primera vez se te va a abrir una ventana del navegador para autorizar con tu
cuenta de GitHub. Aceptás y listo.

Recargá la página del repo: ya tenés que ver los archivos.

---

## Paso 5 — Importar el proyecto en Vercel

1. Entrá a https://vercel.com y logueate **con tu cuenta de GitHub** (así ya
   quedan conectados).
2. **Add New...** → **Project**
3. En la lista de repositorios buscá `pena-del-proletariado` y apretá **Import**.
   - Si no aparece, tocá **Adjust GitHub App Permissions** y dale acceso al repo.
4. Vercel detecta solo que es Next.js. **No toques** Framework Preset, Build
   Command ni Output Directory.
5. **Todavía no le des Deploy.** Antes van las variables (paso 6).

---

## Paso 6 — Cargar las variables de entorno

En la misma pantalla de import, abrí la sección **Environment Variables**.

Los valores salen de Supabase → tu proyecto → **Settings** → **API Keys**
(la URL está en **Settings → Data API**). También podés usar el botón **Connect**
arriba de todo, que te muestra las dos juntas.

Cargá estas dos, una por vez:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://hjbcqgsbzsknyvrvocwd.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | tu publishable key (`sb_publishable_...`) |

Puntos a cuidar:

- La URL va **sin barra final y sin `/rest/v1`**. Es el mismo error que tuvimos
  en local.
- Dejá los tres entornos tildados (Production, Preview, Development). Vercel los
  marca todos por defecto.
- No copies comillas ni espacios de más al pegar.
- **No cargues** ninguna service role key. La app no la usa.

> Si te da fiaca tipear: podés abrir tu `.env.local` con el Bloc de notas y
> copiar los valores de ahí.

Ahora sí: **Deploy**.

---

## Paso 7 — Avisarle a Supabase cuál es la URL de producción

Cuando termine el deploy, Vercel te da una URL tipo
`https://pena-del-proletariado.vercel.app`. Copiala.

En Supabase → **Authentication** → **URL Configuration**:

- **Site URL**: pegá la URL de Vercel.
- **Redirect URLs**: agregá `https://pena-del-proletariado.vercel.app/**`
  (el `/**` al final incluye todas las rutas).

Guardá.

Sin este paso el login puede fallar o redirigir mal.

---

## Paso 8 — Probar

Entrá a la URL de Vercel y verificá:

- [ ] Se ve el sitio público con el torneo en curso.
- [ ] Funciona el modo oscuro.
- [ ] `/login` te deja entrar con tu usuario admin.
- [ ] Podés crear un jugador y verlo aparecer.
- [ ] Se ve bien en el celular.

---

## De acá en adelante

Cada vez que cambies algo:

```bash
git add .
git commit -m "descripcion corta de lo que cambiaste"
git push
```

Vercel lo detecta y redeploya solo en un par de minutos. No hay que volver a
tocar nada de la configuración.

---

## Si algo falla

**El build falla en Vercel.** Abrí el deploy → pestaña **Building** y leé el
error. Probá `npm run build` en tu máquina: casi siempre falla igual y es más
cómodo arreglarlo local.

**La página carga pero no trae datos.** Faltan las variables o están mal
escritas. Vercel → Settings → Environment Variables. Ojo: después de cambiar una
variable hay que **redeployar** (Deployments → los tres puntos del último →
Redeploy), no alcanza con guardar.

**El login no anda en producción pero sí en local.** Falta el paso 7.

**Subiste `.env.local` sin querer.** Avisame: hay que sacarlo del historial de
Git y, por las dudas, rotar las claves en Supabase.
