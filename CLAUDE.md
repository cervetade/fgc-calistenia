# FGC Calistenia — Contexto del proyecto

App **web** para el gimnasio de calistenia **FGC** (Joaquín, San Francisco, Córdoba).
El alumno inicia sesión y ve **su rutina**; el profe (admin) gestiona todo desde la app.

> Idioma: **español rioplatense (voseo)**. Trato cercano y claro; el dueño del
> proyecto (Tadeo) no es programador senior, así que las explicaciones van simples.

## Qué hace la app
- **Pizarrón del día** (principiantes): rutina única para todos, cambia por día.
  Bloques: Zona media ×3 · Rutina de 5 ejercicios ×3 (superseries con `+`) · Complemento.
- **Plan avanzado** (avanzados): planificación que el profe **asigna a un alumno**.
  Se organiza en días (Día 1, 2, 3…) que se repiten cada semana ~4-5 semanas.
- Cada ejercicio abre "cómo se hace" → **video del profe embebido de YouTube**
  (se cargan en `exercises.video`; si está vacío muestra "próximamente").
- **Feedback / RPE**: al terminar, el alumno califica del 1 al 5 qué tan difícil
  estuvo (+ nota, y opcional detalle por ejercicio). El profe ve tendencias.
- **Pagos**: el profe lleva el control de cuotas por mes (monto, vencimiento,
  pagó/pendiente). *Control + recordatorio, NO cobra plata real.*
- **Dos roles**: `user` (alumno) y `admin` (profe). El admin gestiona usuarios,
  publica el pizarrón, asigna planes, **crea/edita rutinas y ejercicios desde la
  app** (Editor v2), ve el feedback y los pagos.

## Stack
- **Frontend**: web estática, HTML + CSS + JavaScript **sin build** (scripts en orden
  bajo `window.FGC`, sin módulos ES → anda hasta con doble clic en `index.html`).
  Supabase se carga por CDN. Tipografía **Lato**. Tema oscuro (carbón + acento naranja).
- **Backend**: **Supabase** (Postgres + Auth + RLS). Login por **email + contraseña**.
- **Hosting**: GitHub Pages → https://cervetade.github.io/fgc-calistenia/
- **Repo**: cervetade/fgc-calistenia (rama `main`).

## Estructura
```
index.html            Carga los scripts en orden (con ?v=N para evitar caché vieja)
css/styles.css        Estilos (tema oscuro FGC, Lato)
js/config.js          URL + anon key de Supabase (vacías = modo demo)
js/seed.js            Datos: ejercicios (con category/level), pizarrones y plan de ejemplo
js/store.js           Capa de datos: demo (localStorage) o Supabase, misma interfaz
js/auth.js            Sesión y login (demo, o email+contraseña con Supabase)
js/ui.js              Render de rutinas + modal de video (usa FGC.exIndex, índice vivo)
js/app.js             Navegación y pantallas (login, hoy, plan, admin, editor, feedback, pagos)
config.local.js       (opcional, NO se versiona) override de config; sirve para forzar demo
supabase/schema.sql          Tablas
supabase/policies.sql        Seguridad RLS
supabase/seed.sql            Datos iniciales (generado desde seed.js)
supabase/auth-email-setup.sql  Trigger de perfil + roles seguros (correr en Supabase)
tests/run.js          Suite de tests sin dependencias (node tests/run.js / npm test)
package.json          Solo para `npm test` (la app NO usa build ni node_modules)
assets/logo.png       Logo FGC (si falta, se dibuja un escudo "FG" de respaldo)
```

## Modelo de datos (Supabase)
- `profiles(id, email, full_name, role, level, phone)` — perfil por usuario. El rol lo
  pone el **trigger** `handle_new_user` (en `auth-email-setup.sql`), **no el cliente**.
  Los emails admin están en una lista dentro de ese trigger. `phone` = para WhatsApp.
- `exercises(id, name, muscle, category, level, video, description)` — biblioteca.
  `category`: Empuje | Tracción | Core | Piernas | Estáticos / Skills | Cardio / Movilidad.
  `level`: Principiante | Intermedio | Avanzado. (Listas en `FGC.exerciseCategories/Levels`.)
- `routines(id, kind['board'|'plan'], title, content jsonb)` — el contenido (bloques,
  ejercicios, series) va en `content` como JSON. Ver forma en `js/seed.js`.
- `board_schedule(day, routine_id)` — qué pizarrón se muestra por fecha.
- `assignments(id, user_id, routine_id, active)` — plan asignado a un alumno.
- `feedback(id, user_id, routine_id, day_index, day, rating, note, details)` — RPE.
  `day_index`: -1 = pizarrón; 0,1,2.. = día del plan. `details` jsonb = {ex_id: 1..5}.
- `payments(id, user_id, period, amount, due_date, status, paid_at, note)` — cuotas.
  `period`: 'YYYY-MM'. `status`: pendiente | pagado. Una cuota por alumno/mes.

### Seguridad (importante)
RLS activado. Cada alumno ve solo lo suyo (perfil, plan, pizarrón, su feedback, sus
pagos); el admin ve/edita todo. El perfil se crea por trigger (no por el cliente) y
**solo un admin puede editar perfiles/rutinas/ejercicios/pagos**, para que un alumno no
pueda hacerse admin ni tocar datos de otros.

## Modo demo vs producción
- Si `js/config.js` (o `config.local.js`) tiene `supabaseUrl`/`supabaseAnonKey` vacíos →
  **modo demo** (login eligiendo usuario, datos en localStorage). Útil para probar sin backend.
- Con esos valores cargados → **producción** (login real por email). Ya está conectado
  al proyecto Supabase `qbfkzuqqxpjwlfwdjahi`.
- Truco para probar en local en modo demo: crear `config.local.js` con
  `window.FGC_CONFIG = { supabaseUrl:"", supabaseAnonKey:"" };` (no se versiona).

## Estado actual (2026-09-17)
- ✅ App online en GitHub Pages, con login por email + **recuperar contraseña**.
- ✅ Arranque robusto (watchdog + timeouts; no se cuelga en "Cargando…").
- ✅ **Editor v2** completo: el profe crea/edita/borra pizarrones, planes y ejercicios
  (con video de YouTube) desde la app. Sin tocar SQL.
- ✅ **Ejercicios por categoría y nivel** (biblioteca de 66); desplegable agrupado + filtro.
- ✅ **Feedback / RPE** completo (alumno califica; profe ve evolución, ejercicios que
  más cuestan y promedio del grupo).
- ✅ **Pagos** completo: control de cuotas del profe (mes, monto, vencimiento, estado) +
  **banner** de aviso al alumno cuando debe + **recordatorio por WhatsApp** (link con
  mensaje listo, usa `profiles.phone`).
- ✅ Supabase al día: tablas `feedback` y `payments`, columnas `category`/`level`/`phone`.
- ✅ Suite de tests (`npm test`, 75 OK). Cache-busting con `?v=N` en `index.html`.

## Próximos pasos (roadmap)
1. Cargar los **videos** reales de YouTube en los ejercicios a medida que el profe grabe.
2. (Opcional) Recordatorios de pago **automáticos** (email/push) → hoy es manual por
   WhatsApp; automatizarlo requiere Edge Function + proveedor de mail (más setup).
3. (Opcional) Login con Google en producción → requiere OAuth + página de privacidad;
   se descartó por ahora, email+contraseña alcanza.

## Cómo correr local
```bash
# En la carpeta del proyecto:
python -m http.server 8000     # y abrir http://localhost:8000
```
(o cualquier server estático). Para producción se publica en GitHub Pages.

## Convenciones (importante para no romper nada)
- Comentarios y textos de UI en español (voseo).
- No romper el modo "sin build": nada de imports ES ni bundlers; todo cuelga de `window.FGC`.
- **Al cambiar cualquier archivo de `js/` o `css/`: subir el número `?v=N` en `index.html`**
  (si no, a los usuarios se les queda la versión vieja cacheada).
- **Antes de pushear cambios de JS: correr `npm test` y que dé verde.**
- `js/seed.js` es la fuente de verdad de los datos; `supabase/seed.sql` se genera a
  partir de ahí (mantener ambos coherentes). Los cambios de esquema en producción se
  aplican en el SQL Editor de Supabase (además de dejarlos en `supabase/schema.sql`).
