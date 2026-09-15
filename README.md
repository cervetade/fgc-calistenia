# FGC Calistenia 🔥

App web para el gimnasio de calistenia **FGC**. El alumno inicia sesión y ve
**su rutina**; el profe (admin) gestiona usuarios y publica las rutinas.

- **Pizarrón del día** → rutina única para todos los principiantes, cambia cada día
  (Zona media ×3 + Rutina de 5 ejercicios ×3 + Complemento).
- **Plan avanzado** → planificación personalizada que el profe asigna a un alumno
  (días que se repiten cada semana, con series, descansos y superseries).
- Cada ejercicio muestra **cómo se hace** (video del profe embebido de YouTube;
  por ahora aparece como "próximamente").
- **Dos roles**: alumno y admin (profe).

---

## 🚀 Probarlo ya (modo demo)

No hace falta instalar nada. Tenés dos opciones:

**Opción A — doble clic:** abrí `index.html` en el navegador.

**Opción B — servidor local (recomendado):**
```bash
python3 -m http.server 8000
# abrí http://localhost:8000
```

En **modo demo** podés entrar como **alumno** (Tadeo o Cerve) o como **profe**
(Joaquín) para ver las dos vistas. Los cambios se guardan en tu navegador.

> El modo demo se usa automáticamente mientras no configures Supabase.

---

## 🔐 Pasar a producción (login con Google + base de datos)

La app usa [Supabase](https://supabase.com) (plan **gratis**, suficiente para
150+ alumnos): login con Google + base de datos con seguridad por roles.

### 1. Crear el proyecto y la base
1. Creá un proyecto en Supabase.
2. En **SQL Editor**, ejecutá **en este orden** los archivos de `supabase/`:
   1. `schema.sql` — crea las tablas.
   2. `policies.sql` — seguridad (cada uno ve solo lo suyo; el profe ve todo).
   3. `seed.sql` — carga ejercicios, rutinas y el pizarrón de ejemplo.

   4. `auth-email-setup.sql` — crea el perfil de cada usuario automáticamente
      y asegura los roles (que un alumno no pueda hacerse admin).

   En `auth-email-setup.sql` está la lista de emails que entran como **admin**
   (el profe). Editá esa línea con el/los email(s) del profe.

### 2. Activar login por email
1. En Supabase: **Authentication → Providers → Email** → activá **Email**.
2. **Desactivá "Confirm email"** (así el alumno entra al instante, sin tener
   que confirmar por correo).

### 3. Configurar la app
Los datos de Supabase van en `js/config.js` (`supabaseUrl` y `supabaseAnonKey`,
que sacás de Supabase → **Settings → API**). Con esos valores cargados, la app
usa login real; vacíos, corre en modo demo.

> La `anon key` es pública por diseño (va en el navegador). La seguridad real
> la dan las políticas RLS. **Nunca** pongas la `service_role key`.

### 4. Publicar (gratis)
Al ser web estática, se publica en cualquier hosting estático: Netlify, Vercel,
Cloudflare Pages o GitHub Pages. Subí la carpeta y listo.

---

## 🎥 Cargar los videos del profe

Cuando el profe grabe los videos:
1. Subilos a **YouTube** (pueden ser "ocultos"/no listados).
2. Poné el link en la columna `video` de la tabla `exercises`
   (o en `js/seed.js` si estás en demo). Ejemplo:
   `https://youtu.be/XXXXXXXXXXX`.
3. Se ven **dentro de la app**, sin salir a YouTube.

---

## 🖼️ Cambiar el logo

Poné el escudo de FGC en `assets/logo.png` (cuadrado, ~256×256). Aparece solo
en el login y la barra superior. Sin ese archivo, se muestra un escudo "FG"
dibujado en código como respaldo. La tipografía es **Lato** (Google Fonts).

## 🗂️ Estructura

```
index.html                 App (carga los scripts en orden)
css/styles.css             Estilos (tema oscuro FGC)
js/
  config.js                Config + detección de modo demo
  seed.js                  Datos: ejercicios, pizarrón y plan de ejemplo
  store.js                 Capa de datos (demo o Supabase)
  auth.js                  Sesión y login (demo o Google)
  ui.js                    Render de rutinas y modal de video
  app.js                   Navegación y pantallas
supabase/
  schema.sql               Tablas
  policies.sql             Seguridad por roles (RLS)
  seed.sql                 Datos iniciales (generado desde seed.js)
config.local.example.js    Plantilla de configuración de producción
```

---

## 🧭 Qué queda para más adelante (v2)

- Editor visual completo de rutinas para el profe.
- Notificaciones / avisos de pago.
- Seguimiento de progreso ("marcar hecho", marcas personales).
- Los videos reales (a medida que el profe los grabe).
