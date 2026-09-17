-- ============================================================================
-- FGC Calistenia — Seguridad (Row Level Security)
-- ----------------------------------------------------------------------------
-- Reglas: cada alumno ve solo lo suyo (su perfil, su plan, el pizarrón).
-- El admin (profe) puede ver y editar todo.
-- Ejecutar DESPUÉS de schema.sql.
-- ============================================================================

-- Función auxiliar: ¿el usuario actual es admin?
-- SECURITY DEFINER evita recursión al leer la tabla profiles desde sus policies.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- Activar RLS en todas las tablas.
alter table public.profiles       enable row level security;
alter table public.exercises      enable row level security;
alter table public.routines       enable row level security;
alter table public.board_schedule enable row level security;
alter table public.assignments    enable row level security;
alter table public.feedback       enable row level security;
alter table public.payments       enable row level security;

-- -------------------- PROFILES --------------------
-- El perfil lo crea automáticamente el trigger handle_new_user (ver
-- auth-email-setup.sql), no el cliente. Por eso NO hay policy de insert:
-- así un alumno no puede crearse un perfil con rol admin.
create policy "profiles: leer propio o admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "profiles: editar solo admin"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- -------------------- EXERCISES --------------------
create policy "exercises: todos leen"
  on public.exercises for select
  using (auth.role() = 'authenticated');

create policy "exercises: solo admin escribe"
  on public.exercises for all
  using (public.is_admin())
  with check (public.is_admin());

-- -------------------- ROUTINES --------------------
create policy "routines: todos leen"
  on public.routines for select
  using (auth.role() = 'authenticated');

create policy "routines: solo admin escribe"
  on public.routines for all
  using (public.is_admin())
  with check (public.is_admin());

-- -------------------- BOARD SCHEDULE --------------------
create policy "board: todos leen"
  on public.board_schedule for select
  using (auth.role() = 'authenticated');

create policy "board: solo admin escribe"
  on public.board_schedule for all
  using (public.is_admin())
  with check (public.is_admin());

-- -------------------- ASSIGNMENTS --------------------
create policy "assignments: propio o admin"
  on public.assignments for select
  using (user_id = auth.uid() or public.is_admin());

create policy "assignments: solo admin escribe"
  on public.assignments for all
  using (public.is_admin())
  with check (public.is_admin());

-- -------------------- FEEDBACK --------------------
-- Cada alumno ve y maneja SOLO su propio feedback; el admin ve todo.
create policy "feedback: leer propio o admin"
  on public.feedback for select
  using (user_id = auth.uid() or public.is_admin());

create policy "feedback: crear propio"
  on public.feedback for insert
  with check (user_id = auth.uid());

create policy "feedback: editar propio"
  on public.feedback for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "feedback: borrar propio"
  on public.feedback for delete
  using (user_id = auth.uid());

-- -------------------- PAYMENTS --------------------
-- El alumno ve SOLO sus cuotas; solo el admin (profe) las crea o modifica.
create policy "payments: leer propio o admin"
  on public.payments for select
  using (user_id = auth.uid() or public.is_admin());

create policy "payments: solo admin escribe"
  on public.payments for all
  using (public.is_admin())
  with check (public.is_admin());
