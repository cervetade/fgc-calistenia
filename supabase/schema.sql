-- ============================================================================
-- FGC Calistenia — Esquema de base de datos (Supabase / PostgreSQL)
-- ----------------------------------------------------------------------------
-- Cómo usarlo: en tu proyecto de Supabase → SQL Editor → pegá y ejecutá:
--   1) schema.sql   (este archivo)
--   2) policies.sql (seguridad por roles)
--   3) seed.sql     (datos iniciales)
-- ============================================================================

-- Perfil de cada usuario (se crea al primer login con Google).
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  full_name  text,
  role       text not null default 'user'  check (role in ('user', 'admin')),
  level      text not null default 'principiante',
  created_at timestamptz not null default now()
);

-- Biblioteca de ejercicios (se reutilizan en las rutinas).
create table if not exists public.exercises (
  id          text primary key,
  name        text not null,
  muscle      text,            -- músculo principal (detalle)
  category    text,            -- patrón: Empuje, Tracción, Core, Piernas, Estáticos / Skills, Cardio / Movilidad
  level       text,            -- Principiante | Intermedio | Avanzado
  video       text,            -- link o id de YouTube (null = "próximamente")
  description text
);

-- Si la tabla ya existía sin estas columnas, se agregan sin romper nada.
alter table public.exercises add column if not exists category text;
alter table public.exercises add column if not exists level    text;

-- Rutinas: pizarrón ("board") o planificación avanzada ("plan").
-- El contenido (bloques, ejercicios, series, etc.) va en JSON.
create table if not exists public.routines (
  id         text primary key,
  kind       text not null check (kind in ('board', 'plan')),
  title      text not null,
  content    jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Qué pizarrón se muestra en cada fecha (el "pizarrón de hoy").
create table if not exists public.board_schedule (
  day        date primary key,
  routine_id text references public.routines(id) on delete set null
);

-- Plan avanzado asignado a un usuario puntual.
create table if not exists public.assignments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  routine_id  text not null references public.routines(id) on delete cascade,
  active      boolean not null default true,
  assigned_at timestamptz not null default now()
);

create index if not exists assignments_user_active_idx
  on public.assignments (user_id) where active;

-- Feedback de esfuerzo percibido (RPE 1-5) que deja el alumno al terminar.
--   day_index: -1 = pizarrón del día; 0,1,2.. = día del plan.
--   details:   opcional, { "<ejercicio_id>": 1..5 } para el detalle por ejercicio.
create table if not exists public.feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  routine_id  text references public.routines(id) on delete set null,
  day_index   int  not null default -1,
  day         date not null default current_date,
  rating      int  not null check (rating between 1 and 5),
  note        text,
  details     jsonb,
  created_at  timestamptz not null default now()
);

-- Una respuesta por alumno / rutina / día del plan / fecha (se puede editar).
create unique index if not exists feedback_uniq
  on public.feedback (user_id, routine_id, day_index, day);
create index if not exists feedback_day_idx on public.feedback (day desc);

-- Cuotas / pagos que lleva el profe por alumno y mes.
--   period: 'YYYY-MM' (mes al que pertenece la cuota).
--   status: 'pendiente' | 'pagado'; paid_at: fecha en que pagó (null si debe).
create table if not exists public.payments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  period     text not null,
  amount     numeric,
  due_date   date,
  status     text not null default 'pendiente' check (status in ('pendiente', 'pagado')),
  paid_at    date,
  note       text,
  created_at timestamptz not null default now()
);
create unique index if not exists payments_uniq on public.payments (user_id, period);
create index if not exists payments_status_idx on public.payments (status);

-- Teléfono opcional en el perfil, para el recordatorio por WhatsApp (Fase 2).
alter table public.profiles add column if not exists phone text;
