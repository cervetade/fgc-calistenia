-- ============================================================================
-- FGC Calistenia — Login por email: perfil automático + seguridad de roles
-- ----------------------------------------------------------------------------
-- Ejecutar UNA vez en Supabase (SQL Editor), DESPUÉS de schema.sql y policies.sql.
-- Hace 2 cosas:
--   1) Crea el perfil del usuario automáticamente al registrarse.
--   2) Impide que un alumno se convierta en admin por su cuenta.
-- ============================================================================

-- 1) Perfil automático al registrarse. El ROL lo decide la base, no el cliente.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := 'user';
begin
  -- 👇 Emails que entran como ADMIN (el profe). Agregá los que quieras,
  --    en minúscula y separados por coma. Ej: ('joaquin@gmail.com','otro@mail.com')
  if lower(new.email) in ('tcervellati123@gmail.com') then
    v_role := 'admin';
  end if;

  insert into public.profiles (id, email, full_name, role, level)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    v_role,
    'principiante'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) Seguridad: sacamos que el usuario pueda crear/editar su propio perfil
--    (antes podía cambiarse el rol a admin). Ahora el perfil lo crea el trigger
--    y solo un admin puede editar perfiles.
drop policy if exists "profiles: crear el propio" on public.profiles;
drop policy if exists "profiles: editar propio o admin" on public.profiles;
drop policy if exists "profiles: editar solo admin" on public.profiles;

create policy "profiles: editar solo admin"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- (La lectura del propio perfil / de todos por el admin ya está en policies.sql)
