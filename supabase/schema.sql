-- KonectAll · esquema del modelo unificado
-- Ejecutar completo en Supabase → SQL Editor.
-- Es idempotente: se puede volver a ejecutar sin duplicar datos.

-- ─────────────────────────────────────────────────────────────
-- 1. Perfiles (cada usuario es un vecino)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.perfiles (
  id uuid primary key,
  nombre text not null,
  telefono text,
  barrio text,
  creado_en timestamptz not null default now()
);

-- Compatibilidad con la tabla del modelo anterior (id, nombre, telefono, creado_en, rol).
alter table public.perfiles add column if not exists barrio text;

-- Sin FK a auth.users para poder sembrar vecinos demo; los usuarios reales
-- obtienen su perfil mediante el trigger de la sección 4.
do $$
declare r record;
begin
  for r in
    select c.conname
    from pg_constraint c
    where c.conrelid = 'public.perfiles'::regclass
      and c.contype = 'f'
      and c.confrelid = 'auth.users'::regclass
  loop
    execute format('alter table public.perfiles drop constraint %I', r.conname);
  end loop;
end $$;

-- Si la tabla antigua tiene la columna rol, le damos default para no romper inserts.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'perfiles' and column_name = 'rol'
  ) then
    execute 'alter table public.perfiles alter column rol set default ''vecino''';
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- 2. Publicaciones (ofrezco / necesito / intercambio)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.publicaciones (
  id uuid primary key default gen_random_uuid(),
  autor_id uuid not null references public.perfiles(id) on delete cascade,
  tipo text not null check (tipo in ('ofrezco', 'necesito', 'intercambio')),
  modo text not null default 'normal' check (modo in ('normal', 'emergencia')),
  categoria text not null default 'otros',
  titulo text not null,
  descripcion text,
  direccion text,
  foto_url text,
  precio numeric(10, 2),
  urgente boolean not null default false,
  lat double precision not null,
  lng double precision not null,
  estado text not null default 'disponible' check (estado in ('disponible', 'atendida')),
  creado_en timestamptz not null default now()
);

alter table public.publicaciones add column if not exists direccion text;

create index if not exists publicaciones_creado_en_idx on public.publicaciones (creado_en desc);
create index if not exists publicaciones_autor_idx on public.publicaciones (autor_id);
create index if not exists publicaciones_autor_creado_idx on public.publicaciones (autor_id, creado_en);
create index if not exists publicaciones_filtros_idx on public.publicaciones (modo, tipo, estado);

-- ─────────────────────────────────────────────────────────────
-- 3. Recomendaciones ("Visto Bueno Vecinal")
-- ─────────────────────────────────────────────────────────────
create table if not exists public.recomendaciones (
  id uuid primary key default gen_random_uuid(),
  publicacion_id uuid not null references public.publicaciones(id) on delete cascade,
  vecino_id uuid not null references public.perfiles(id) on delete cascade,
  creado_en timestamptz not null default now(),
  unique (publicacion_id, vecino_id)
);

create index if not exists recomendaciones_publicacion_idx on public.recomendaciones (publicacion_id);

-- ─────────────────────────────────────────────────────────────
-- 3b. Mensajes (chat por publicación)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.mensajes (
  id uuid primary key default gen_random_uuid(),
  publicacion_id uuid not null references public.publicaciones(id) on delete cascade,
  emisor_id uuid not null references public.perfiles(id) on delete cascade,
  receptor_id uuid not null references public.perfiles(id) on delete cascade,
  texto text not null check (length(btrim(texto)) between 1 and 1000),
  leido boolean not null default false,
  creado_en timestamptz not null default now()
);

alter table public.mensajes add column if not exists leido boolean not null default false;

create index if not exists mensajes_publicacion_idx on public.mensajes (publicacion_id, creado_en);
create index if not exists mensajes_emisor_idx on public.mensajes (emisor_id);
create index if not exists mensajes_receptor_idx on public.mensajes (receptor_id);
create index if not exists mensajes_no_leidos_idx on public.mensajes (receptor_id, leido);
create index if not exists mensajes_emisor_creado_idx on public.mensajes (emisor_id, creado_en);

-- ─────────────────────────────────────────────────────────────
-- 3c. Moderación: denuncias y bloqueos
-- ─────────────────────────────────────────────────────────────
create table if not exists public.denuncias (
  id uuid primary key default gen_random_uuid(),
  publicacion_id uuid references public.publicaciones(id) on delete cascade,
  mensaje_id uuid references public.mensajes(id) on delete cascade,
  denunciante_id uuid not null references public.perfiles(id) on delete cascade,
  motivo text not null check (length(btrim(motivo)) between 1 and 200),
  creado_en timestamptz not null default now(),
  check (publicacion_id is not null or mensaje_id is not null)
);

create unique index if not exists denuncias_publicacion_unica
  on public.denuncias (denunciante_id, publicacion_id) where publicacion_id is not null;
create unique index if not exists denuncias_mensaje_unica
  on public.denuncias (denunciante_id, mensaje_id) where mensaje_id is not null;
create index if not exists denuncias_creado_idx on public.denuncias (creado_en desc);

create table if not exists public.bloqueos (
  id uuid primary key default gen_random_uuid(),
  bloqueante_id uuid not null references public.perfiles(id) on delete cascade,
  bloqueado_id uuid not null references public.perfiles(id) on delete cascade,
  creado_en timestamptz not null default now(),
  unique (bloqueante_id, bloqueado_id),
  check (bloqueante_id <> bloqueado_id)
);

create index if not exists bloqueos_bloqueante_idx on public.bloqueos (bloqueante_id);

-- ─────────────────────────────────────────────────────────────
-- 3d. Tokens de notificaciones push (Android/iOS)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.perfiles(id) on delete cascade,
  token text not null unique,
  plataforma text not null default 'android',
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists push_tokens_user_idx on public.push_tokens (user_id);

-- ─────────────────────────────────────────────────────────────
-- 4. Trigger: crear perfil al registrarse
-- ─────────────────────────────────────────────────────────────
create or replace function public.crear_perfil_nuevo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, nombre, telefono, barrio)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'nombre', ''), split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'telefono',
    new.raw_user_meta_data ->> 'barrio'
  )
  on conflict (id) do update set
    nombre = excluded.nombre,
    telefono = coalesce(excluded.telefono, perfiles.telefono),
    barrio = coalesce(excluded.barrio, perfiles.barrio);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.crear_perfil_nuevo();

-- ─────────────────────────────────────────────────────────────
-- 5. RLS: lectura pública, escritura solo del dueño
-- ─────────────────────────────────────────────────────────────
alter table public.perfiles enable row level security;
alter table public.publicaciones enable row level security;
alter table public.recomendaciones enable row level security;
alter table public.mensajes enable row level security;
alter table public.denuncias enable row level security;
alter table public.bloqueos enable row level security;
alter table public.push_tokens enable row level security;

drop policy if exists "perfiles lectura" on public.perfiles;
create policy "perfiles lectura" on public.perfiles
  for select using (true);

drop policy if exists "perfiles insert propio" on public.perfiles;
create policy "perfiles insert propio" on public.perfiles
  for insert to authenticated with check (auth.uid() = id);

drop policy if exists "perfiles update propio" on public.perfiles;
create policy "perfiles update propio" on public.perfiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "publicaciones lectura" on public.publicaciones;
create policy "publicaciones lectura" on public.publicaciones
  for select using (true);

drop policy if exists "publicaciones insert autor" on public.publicaciones;
create policy "publicaciones insert autor" on public.publicaciones
  for insert to authenticated with check (
    auth.uid() = autor_id
    and (
      select count(*) from public.publicaciones p
      where p.autor_id = auth.uid() and p.creado_en > now() - interval '1 day'
    ) < 20
  );

drop policy if exists "publicaciones update autor" on public.publicaciones;
create policy "publicaciones update autor" on public.publicaciones
  for update to authenticated using (auth.uid() = autor_id) with check (auth.uid() = autor_id);

drop policy if exists "publicaciones delete autor" on public.publicaciones;
create policy "publicaciones delete autor" on public.publicaciones
  for delete to authenticated using (auth.uid() = autor_id);

drop policy if exists "recomendaciones lectura" on public.recomendaciones;
create policy "recomendaciones lectura" on public.recomendaciones
  for select using (true);

drop policy if exists "recomendaciones insert" on public.recomendaciones;
create policy "recomendaciones insert" on public.recomendaciones
  for insert to authenticated with check (
    auth.uid() = vecino_id
    and exists (
      select 1 from public.publicaciones p
      where p.id = publicacion_id and p.autor_id <> auth.uid()
    )
  );

drop policy if exists "recomendaciones delete propia" on public.recomendaciones;
create policy "recomendaciones delete propia" on public.recomendaciones
  for delete to authenticated using (auth.uid() = vecino_id);

drop policy if exists "mensajes lectura" on public.mensajes;
create policy "mensajes lectura" on public.mensajes
  for select to authenticated using (auth.uid() = emisor_id or auth.uid() = receptor_id);

drop policy if exists "mensajes insert" on public.mensajes;
create policy "mensajes insert" on public.mensajes
  for insert to authenticated with check (
    auth.uid() = emisor_id
    and receptor_id <> auth.uid()
    and (
      select count(*) from public.mensajes m
      where m.emisor_id = auth.uid() and m.creado_en > now() - interval '1 hour'
    ) < 50
  );

drop policy if exists "mensajes update receptor" on public.mensajes;
create policy "mensajes update receptor" on public.mensajes
  for update to authenticated
  using (auth.uid() = receptor_id)
  with check (auth.uid() = receptor_id);

drop policy if exists "denuncias insert" on public.denuncias;
create policy "denuncias insert" on public.denuncias
  for insert to authenticated with check (auth.uid() = denunciante_id);

drop policy if exists "denuncias lectura propia" on public.denuncias;
create policy "denuncias lectura propia" on public.denuncias
  for select to authenticated using (auth.uid() = denunciante_id);

drop policy if exists "bloqueos insert" on public.bloqueos;
create policy "bloqueos insert" on public.bloqueos
  for insert to authenticated with check (auth.uid() = bloqueante_id);

drop policy if exists "bloqueos lectura propia" on public.bloqueos;
create policy "bloqueos lectura propia" on public.bloqueos
  for select to authenticated using (auth.uid() = bloqueante_id);

drop policy if exists "bloqueos delete propia" on public.bloqueos;
create policy "bloqueos delete propia" on public.bloqueos
  for delete to authenticated using (auth.uid() = bloqueante_id);

drop policy if exists "push_tokens insert propio" on public.push_tokens;
create policy "push_tokens insert propio" on public.push_tokens
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "push_tokens update propio" on public.push_tokens;
create policy "push_tokens update propio" on public.push_tokens
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "push_tokens select propio" on public.push_tokens;
create policy "push_tokens select propio" on public.push_tokens
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "push_tokens delete propio" on public.push_tokens;
create policy "push_tokens delete propio" on public.push_tokens
  for delete to authenticated using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- 6. Realtime
-- ─────────────────────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'publicaciones'
  ) then
    alter publication supabase_realtime add table public.publicaciones;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'recomendaciones'
  ) then
    alter publication supabase_realtime add table public.recomendaciones;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'mensajes'
  ) then
    alter publication supabase_realtime add table public.mensajes;
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- 7. Storage para fotos (bucket público de lectura)
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', true)
on conflict (id) do update set public = true;

drop policy if exists "fotos lectura publica" on storage.objects;
create policy "fotos lectura publica" on storage.objects
  for select using (bucket_id = 'fotos');

drop policy if exists "fotos subida autenticada" on storage.objects;
create policy "fotos subida autenticada" on storage.objects
  for insert to authenticated with check (bucket_id = 'fotos');

-- ─────────────────────────────────────────────────────────────
-- 8. Contacto: el teléfono se obtiene solo al tocar "WhatsApp"
-- ─────────────────────────────────────────────────────────────
revoke select on public.perfiles from anon, authenticated;
grant select (id, nombre, barrio, creado_en) on public.perfiles to anon, authenticated;

create or replace function public.telefono_de(p_publicacion_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.telefono
  from public.publicaciones pu
  join public.perfiles p on p.id = pu.autor_id
  where pu.id = p_publicacion_id;
$$;

grant execute on function public.telefono_de(uuid) to anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 9. Notificaciones push: pg_net + triggers
-- ─────────────────────────────────────────────────────────────
create extension if not exists pg_net;

create or replace function public.avisar_push()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  url_funcion text := 'https://rtmsgsmwyhahkrkxahog.supabase.co/functions/v1/aviso-push';
  clave_publica text := 'sb_publishable_m1-vpBa4u_kUBkYyBXZcqw_SCg8UzhI';
  cuerpo jsonb;
begin
  begin
    if tg_table_name = 'mensajes' then
      cuerpo := jsonb_build_object(
        'tipo', 'mensaje',
        'user_id', new.receptor_id,
        'titulo', 'Nuevo mensaje',
        'cuerpo', 'Tienes un mensaje nuevo en KonectAll',
        'url', '/tabs/chat'
      );
    elsif tg_table_name = 'publicaciones' and new.modo = 'emergencia' then
      cuerpo := jsonb_build_object(
        'tipo', 'emergencia',
        'excluir_user_id', new.autor_id,
        'titulo', 'Emergencia cerca',
        'cuerpo', new.titulo,
        'url', '/tabs/emergencia'
      );
    else
      return new;
    end if;

    perform net.http_post(
      url := url_funcion,
      body := cuerpo,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || clave_publica
      )
    );
  exception when others then
    null;
  end;
  return new;
end;
$$;

drop trigger if exists aviso_push_mensaje on public.mensajes;
create trigger aviso_push_mensaje
  after insert on public.mensajes
  for each row execute function public.avisar_push();

drop trigger if exists aviso_push_emergencia on public.publicaciones;
create trigger aviso_push_emergencia
  after insert on public.publicaciones
  for each row execute function public.avisar_push();

notify pgrst, 'reload schema';
