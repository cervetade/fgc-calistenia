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
  muscle      text,
  video       text,            -- link o id de YouTube (null = "próximamente")
  description text
);

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
