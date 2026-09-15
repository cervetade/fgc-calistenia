# FGC Calistenia — Contexto del proyecto

App **web** para el gimnasio de calistenia **FGC** (Joaquín, San Francisco, Córdoba).
El alumno inicia sesión y ve **su rutina**; el profe (admin) gestiona usuarios y rutinas.

> Idioma: **español rioplatense (voseo)**. Trato cercano y claro; el dueño del
> proyecto (Tadeo) no es programador senior, así que las explicaciones van simples.

## Qué hace la app
- **Pizarrón del día** (principiantes): rutina única para todos, cambia por día.
  Bloques: Zona media ×3 · Rutina de 5 ejercicios ×3 (superseries con `+`) · Complemento.
- **Plan avanzado** (avanzados): planificación que el profe **asigna a un alumno**.
  Se organiza en días (Día 1, 2, 3…) que se repiten cada semana ~4-5 semanas.
  Bloques: entrada en calor / principal / core, con reps, series (×3), descanso y notas.
- Cada ejercicio abre "cómo se hace" → **video del profe embebido de YouTube**
  (por ahora "próximamente"; se cargan en la columna `video` de `exercises`).
- **Dos roles**: `user` (alumno) y `admin` (profe). El admin ve todos los usuarios,
  publica el pizarrón y asigna planes.

## Stack
- **Frontend**: web estática, HTML + CSS + JavaScript **sin build** (scripts en orden
  bajo `window.FGC`, sin módulos ES → anda hasta con doble clic en `index.html`).
  Supabase se carga por CDN. Tipografía **Lato**. Tema oscuro (carbón + acento naranja).
- **Backend**: **Supabase** (Postgres + Auth + RLS). Login por **email + contraseña**.
- **Hosting**: GitHub Pages → https://cervetade.github.io/fgc-calistenia/
- **Repo**: cervetade/fgc-calistenia (rama `main`).

## Estructura
```
index.html            Carga los scripts en orden
css/styles.css        Estilos (tema oscuro FGC, Lato)
js/config.js          URL + anon key de Supabase (vacías = modo demo)
js/seed.js            Datos: ejercicios, pizarrón y plan de ejemplo (fuente de verdad)
js/store.js           Capa de datos: demo (localStorage) o Supabase, misma interfaz
js/auth.js            Sesión y login (demo, o email+contraseña con Supabase)
js/ui.js              Render de rutinas + modal de video
js/app.js             Navegación y pantallas (login, hoy, plan, admin)
supabase/schema.sql          Tablas
supabase/policies.sql        Seguridad RLS
supabase/seed.sql            Datos iniciales (generado desde seed.js)
supabase/auth-email-setup.sql  Trigger de perfil + roles seguros (correr en Supabase)
assets/logo.png       Logo FGC (si falta, se dibuja un escudo "FG" de respaldo)
```

## Modelo de datos (Supabase)
- `profiles(id, email, full_name, role, level)` — perfil por usuario. El rol lo pone
  el **trigger** `handle_new_user` (en `auth-email-setup.sql`), **no el cliente**.
  Los emails admin están en una lista dentro de ese trigger.
- `exercises(id, name, muscle, video, description)` — biblioteca reutilizable.
- `routines(id, kind['board'|'plan'], title, content jsonb)` — el contenido (bloques,
  ejercicios, series) va en `content` como JSON. Ver forma en `js/seed.js`.
- `board_schedule(day, routine_id)` — qué pizarrón se muestra por fecha.
- `assignments(id, user_id, routine_id, active)` — plan asignado a un alumno.

### Seguridad (importante)
RLS activado. Cada alumno ve solo su perfil, su plan y el pizarrón; el admin ve todo.
El perfil se crea por trigger (no por el cliente) y **solo un admin puede editar
perfiles**, para que un alumno no pueda hacerse admin.

## Modo demo vs producción
- Si `js/config.js` tiene `supabaseUrl`/`supabaseAnonKey` vacíos → **modo demo**
  (login eligiendo usuario, datos en localStorage). Útil para ver la app sin backend.
- Con esos valores cargados → **producción** (login real por email). Ya está conectado
  al proyecto Supabase `qbfkzuqqxpjwlfwdjahi`.

## Estado actual (2026-09-15)
- ✅ App construida, online en GitHub Pages, con logo y tipografía FGC.
- ✅ Supabase: tablas, políticas y datos cargados. Migración `auth-email-setup.sql`
  para login por email (trigger + roles). Admin inicial: `tcervellati123@gmail.com`.
- ⏳ Pendiente de verificar end-to-end: crear cuenta por email en el sitio live.
  Requiere en Supabase: correr `auth-email-setup.sql`, activar provider **Email** y
  **desactivar "Confirm email"**.

## Próximos pasos (roadmap)
1. **Videos**: cargar links de YouTube en `exercises.video` a medida que el profe grabe.
2. **Más pizarrones** de ejemplo (por día de la semana) para que el profe solo elija.
3. **Editor v2**: pantalla para que el profe cree/edite rutinas desde la app (hoy el
   pizarrón se publica eligiendo entre rutinas existentes; falta el editor completo).
4. **Notificaciones / avisos de pago** (idea original del profe, quedó para después).
5. (Opcional) Login con Google en producción → requiere OAuth en Google Cloud +
   página de privacidad (`privacy.html`) y publicar la app. Se descartó por ahora
   por ser un trámite; email+contraseña alcanza.

## Cómo correr local
```bash
# En la carpeta del proyecto:
python3 -m http.server 8000     # y abrir http://localhost:8000
```
(o cualquier server estático). Para producción se publica en GitHub Pages.

## Convenciones
- Comentarios y textos de UI en español (voseo).
- No romper el modo "sin build": nada de imports ES ni bundlers; todo cuelga de `window.FGC`.
- `js/seed.js` es la fuente de verdad de los datos demo; `supabase/seed.sql` se genera
  a partir de ahí (hay un script en el historial; mantener ambos coherentes).
