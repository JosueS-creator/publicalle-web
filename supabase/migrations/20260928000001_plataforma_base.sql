-- ============================================================================
-- PUBLICALLE — Plataforma base (v0.1)
-- Modelo: docs/plataforma/modelo-operativo.md
-- Principios:
--   * La hora oficial es la del servidor (triggers sellan registrado_en).
--   * Eventos, GPS y evidencias no se editan ni se borran (salvo validación por admin).
--   * Clientes ven solo su empresa y solo ejecuciones VALIDADAS.
--   * Precios: fuera de alcance en esta versión.
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;
create extension if not exists btree_gist with schema extensions;

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
create type public.rol_usuario as enum ('super_admin', 'admin', 'operador', 'cliente');
create type public.linea_servicio as enum ('move', 'events', 'place');
create type public.estado_solicitud as enum ('nueva', 'en_revision', 'convertida', 'descartada');
create type public.estado_campania as enum (
  'borrador', 'cotizacion_enviada', 'aprobada', 'programada', 'en_ejecucion', 'finalizada', 'reportada', 'cancelada'
);
create type public.estado_ejecucion as enum (
  'programada', 'en_curso', 'pausada', 'finalizada', 'validada', 'rechazada', 'incompleta'
);
create type public.tipo_evento as enum (
  'inicio', 'pausa', 'reanudacion', 'fin',          -- MOVE
  'llegada', 'salida',                              -- EVENTS
  'instalacion', 'verificacion'                     -- PLACE
);
create type public.tipo_evidencia as enum ('foto', 'video');
create type public.estado_evidencia as enum ('pendiente', 'validada', 'rechazada');

-- ---------------------------------------------------------------------------
-- Empresas y perfiles
-- ---------------------------------------------------------------------------
create table public.empresas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(nombre) between 2 and 160),
  rtn text,
  telefono text,
  correo text,
  creado_en timestamptz not null default now()
);

create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  rol public.rol_usuario not null default 'cliente',
  empresa_id uuid references public.empresas (id) on delete set null,
  nombre text not null default '',
  telefono text,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  -- un cliente siempre pertenece a una empresa; el staff no
  constraint cliente_con_empresa check (rol <> 'cliente' or empresa_id is not null)
);

-- ---------------------------------------------------------------------------
-- Funciones de acceso (security definer: evitan recursión en RLS)
-- ---------------------------------------------------------------------------
create or replace function public.mi_rol() returns public.rol_usuario
language sql stable security definer set search_path = public as $$
  select rol from public.perfiles where id = auth.uid() and activo
$$;

create or replace function public.mi_empresa() returns uuid
language sql stable security definer set search_path = public as $$
  select empresa_id from public.perfiles where id = auth.uid() and activo
$$;

create or replace function public.es_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.mi_rol() in ('super_admin', 'admin'), false)
$$;

-- ---------------------------------------------------------------------------
-- Solicitudes (entran desde el brief público de la web)
-- ---------------------------------------------------------------------------
create table public.solicitudes (
  id uuid primary key default gen_random_uuid(),
  folio text generated always as (upper(substr(replace(id::text, '-', ''), 1, 8))) stored,
  estado public.estado_solicitud not null default 'nueva',
  -- necesidad
  objetivo text not null check (char_length(objetivo) between 2 and 80),
  ciudades text[] not null check (cardinality(ciudades) between 1 and 30),
  zonas text check (char_length(zonas) <= 1000),
  lineas public.linea_servicio[] not null default '{}',
  servicios text[] not null default '{}' check (cardinality(servicios) <= 30),
  fecha_inicio date,
  fecha_fin date,
  fechas_flexibles boolean not null default false,
  horario text check (char_length(horario) <= 120),
  presupuesto text check (char_length(presupuesto) <= 120),
  comentarios text check (char_length(comentarios) <= 2000),
  -- contacto
  contacto_nombre text not null check (char_length(contacto_nombre) between 2 and 120),
  contacto_empresa text check (char_length(contacto_empresa) <= 160),
  contacto_cargo text check (char_length(contacto_cargo) <= 120),
  contacto_telefono text not null check (contacto_telefono ~ '^[+0-9 ()-]{8,20}$'),
  contacto_correo text check (contacto_correo is null or contacto_correo ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  origen text not null default 'web' check (origen in ('web', 'whatsapp', 'admin')),
  -- gestión interna
  empresa_id uuid references public.empresas (id) on delete set null,
  notas_internas text,
  atendida_por uuid references public.perfiles (id),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint fechas_ordenadas check (fecha_fin is null or fecha_inicio is null or fecha_fin >= fecha_inicio)
);
create index solicitudes_estado_idx on public.solicitudes (estado, creado_en desc);

-- ---------------------------------------------------------------------------
-- Unidades (vehículos y equipos)
-- ---------------------------------------------------------------------------
create table public.unidades (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,                                   -- p. ej. "Versa LED 01"
  tipo text not null check (tipo in ('vehiculo', 'carpa', 'audio', 'otro')),
  capacidades text[] not null default '{}',               -- p. ej. {pantalla_led, perifoneo}
  ciudad_base text not null,
  placa text,                                             -- solo visible para staff
  activa boolean not null default true,
  notas text,
  creado_en timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Campañas
-- ---------------------------------------------------------------------------
create table public.campanias (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete restrict,
  solicitud_id uuid references public.solicitudes (id) on delete set null,
  nombre text not null,
  objetivo text,
  estado public.estado_campania not null default 'borrador',
  ciudades text[] not null default '{}',
  zonas text[] not null default '{}',                    -- zonas contratadas (para "zonas cubiertas x de y")
  fecha_inicio date,
  fecha_fin date,
  creado_por uuid references public.perfiles (id),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create index campanias_empresa_idx on public.campanias (empresa_id, estado);

create table public.campania_servicios (
  id uuid primary key default gen_random_uuid(),
  campania_id uuid not null references public.campanias (id) on delete cascade,
  linea public.linea_servicio not null,
  servicio text not null,                                 -- p. ej. perifoneo, carpa, promotores
  cantidad numeric not null default 1 check (cantidad > 0),
  unidad_medida text not null default 'jornada',          -- jornada, dia, hora, evento, ubicacion
  detalle jsonb not null default '{}'
);

-- ---------------------------------------------------------------------------
-- Ejecuciones (una jornada de trabajo de una unidad/operador)
-- ---------------------------------------------------------------------------
create table public.ejecuciones (
  id uuid primary key default gen_random_uuid(),
  campania_id uuid not null references public.campanias (id) on delete cascade,
  linea public.linea_servicio not null,
  servicio text not null,
  operador_id uuid references public.perfiles (id),
  unidad_id uuid references public.unidades (id),
  fecha date not null,
  hora_inicio_prog time,
  hora_fin_prog time,
  zonas text[] not null default '{}',                    -- MOVE: zonas a recorrer
  punto_nombre text,                                      -- EVENTS/PLACE: lugar asignado
  punto_lat double precision,
  punto_lng double precision,
  estado public.estado_ejecucion not null default 'programada',
  zonas_cubiertas text[] not null default '{}',          -- lo completa el staff al validar
  km_en_zonas numeric,                                    -- métrica para el cliente
  validada_por uuid references public.perfiles (id),
  validada_en timestamptz,
  motivo_rechazo text,
  creado_en timestamptz not null default now()
);
create index ejecuciones_operador_idx on public.ejecuciones (operador_id, fecha);
create index ejecuciones_campania_idx on public.ejecuciones (campania_id, estado);

-- Agenda: una unidad no puede tener dos ejecuciones que se crucen en horario
alter table public.ejecuciones add column rango tsrange generated always as (
  tsrange(fecha + coalesce(hora_inicio_prog, time '00:00'), fecha + coalesce(hora_fin_prog, time '23:59:59'), '[)')
) stored;
alter table public.ejecuciones add constraint unidad_sin_cruces
  exclude using gist (unidad_id with =, rango with &&)
  where (unidad_id is not null and estado not in ('rechazada', 'incompleta'));

-- ---------------------------------------------------------------------------
-- Registro operativo (inmutable; hora de servidor)
-- ---------------------------------------------------------------------------
create table public.ejecucion_eventos (
  id bigint generated always as identity primary key,
  ejecucion_id uuid not null references public.ejecuciones (id) on delete cascade,
  tipo public.tipo_evento not null,
  registrado_en timestamptz not null default now(),       -- HORA OFICIAL (servidor)
  capturado_en timestamptz,                               -- hora del teléfono (auditoría / offline)
  lat double precision,
  lng double precision,
  precision_m real,
  registrado_por uuid not null default auth.uid() references public.perfiles (id)
);
create index eventos_ejecucion_idx on public.ejecucion_eventos (ejecucion_id, registrado_en);

create table public.gps_puntos (                          -- solo MOVE
  id bigint generated always as identity primary key,
  ejecucion_id uuid not null references public.ejecuciones (id) on delete cascade,
  registrado_en timestamptz not null default now(),
  capturado_en timestamptz not null,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  precision_m real
  -- sin velocidad: decisión explícita (ver modelo operativo §5)
);
create index gps_ejecucion_idx on public.gps_puntos (ejecucion_id, capturado_en);

create table public.evidencias (
  id uuid primary key default gen_random_uuid(),
  ejecucion_id uuid not null references public.ejecuciones (id) on delete cascade,
  tipo public.tipo_evidencia not null default 'foto',
  momento text check (momento in ('montaje', 'actividad', 'recorrido', 'instalacion', 'verificacion', 'otro')),
  storage_path text not null unique,                      -- bucket "evidencias"
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  registrado_en timestamptz not null default now(),
  capturado_en timestamptz,
  lat double precision,
  lng double precision,
  estado public.estado_evidencia not null default 'pendiente',
  revisada_por uuid references public.perfiles (id),
  revisada_en timestamptz,
  subida_por uuid not null default auth.uid() references public.perfiles (id)
);
create index evidencias_ejecucion_idx on public.evidencias (ejecucion_id, estado);

create table public.incidencias (
  id uuid primary key default gen_random_uuid(),
  ejecucion_id uuid not null references public.ejecuciones (id) on delete cascade,
  tipo text not null check (tipo in ('mecanica', 'clima', 'acceso', 'seguridad', 'cliente', 'otra')),
  descripcion text not null check (char_length(descripcion) between 3 and 1000),
  registrado_en timestamptz not null default now(),
  lat double precision,
  lng double precision,
  registrado_por uuid not null default auth.uid() references public.perfiles (id)
);

-- ---------------------------------------------------------------------------
-- Triggers: hora de servidor y actualizado_en
-- ---------------------------------------------------------------------------
create or replace function public.sellar_hora_servidor() returns trigger
language plpgsql as $$
begin
  new.registrado_en := now();          -- ignora cualquier hora enviada por el cliente
  return new;
end $$;

create trigger sellar_eventos before insert on public.ejecucion_eventos
  for each row execute function public.sellar_hora_servidor();
create trigger sellar_gps before insert on public.gps_puntos
  for each row execute function public.sellar_hora_servidor();
create trigger sellar_evidencias before insert on public.evidencias
  for each row execute function public.sellar_hora_servidor();
create trigger sellar_incidencias before insert on public.incidencias
  for each row execute function public.sellar_hora_servidor();

create or replace function public.tocar_actualizado() returns trigger
language plpgsql as $$
begin
  new.actualizado_en := now();
  return new;
end $$;

create trigger tocar_solicitudes before update on public.solicitudes
  for each row execute function public.tocar_actualizado();
create trigger tocar_campanias before update on public.campanias
  for each row execute function public.tocar_actualizado();

-- Evidencias: el staff solo puede cambiar estado/revisión; nunca el archivo ni su hora.
create or replace function public.proteger_evidencia() returns trigger
language plpgsql as $$
begin
  if new.storage_path <> old.storage_path or new.sha256 <> old.sha256
     or new.registrado_en <> old.registrado_en or new.ejecucion_id <> old.ejecucion_id then
    raise exception 'Las evidencias no se pueden modificar; solo validar o rechazar.';
  end if;
  if new.estado is distinct from old.estado then
    new.revisada_por := auth.uid();
    new.revisada_en := now();
  end if;
  return new;
end $$;

create trigger proteger_evidencias before update on public.evidencias
  for each row execute function public.proteger_evidencia();

-- ---------------------------------------------------------------------------
-- Vista interna de tiempos (solo staff). Las horas se guardan siempre, aunque no se muestren al cliente.
-- ---------------------------------------------------------------------------
create or replace view public.v_tiempos_ejecucion
with (security_invoker = true) as
with ev as (
  select ejecucion_id, tipo, registrado_en,
         lead(registrado_en) over (partition by ejecucion_id order by registrado_en) as siguiente
  from public.ejecucion_eventos
)
select
  e.id as ejecucion_id,
  min(ev.registrado_en) filter (where ev.tipo in ('inicio', 'llegada')) as inicio,
  max(ev.registrado_en) filter (where ev.tipo in ('fin', 'salida')) as fin,
  sum(ev.siguiente - ev.registrado_en) filter (where ev.tipo in ('pausa')) as tiempo_pausado,
  sum(ev.siguiente - ev.registrado_en) filter (where ev.tipo in ('inicio', 'reanudacion', 'llegada')) as tiempo_efectivo
from public.ejecuciones e
left join ev on ev.ejecucion_id = e.id
group by e.id;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.empresas enable row level security;
alter table public.perfiles enable row level security;
alter table public.solicitudes enable row level security;
alter table public.unidades enable row level security;
alter table public.campanias enable row level security;
alter table public.campania_servicios enable row level security;
alter table public.ejecuciones enable row level security;
alter table public.ejecucion_eventos enable row level security;
alter table public.gps_puntos enable row level security;
alter table public.evidencias enable row level security;
alter table public.incidencias enable row level security;

-- Staff: acceso total a todo
create policy staff_todo on public.empresas for all to authenticated using (public.es_staff()) with check (public.es_staff());
create policy staff_todo on public.perfiles for all to authenticated using (public.es_staff()) with check (public.es_staff());
create policy staff_todo on public.solicitudes for all to authenticated using (public.es_staff()) with check (public.es_staff());
create policy staff_todo on public.unidades for all to authenticated using (public.es_staff()) with check (public.es_staff());
create policy staff_todo on public.campanias for all to authenticated using (public.es_staff()) with check (public.es_staff());
create policy staff_todo on public.campania_servicios for all to authenticated using (public.es_staff()) with check (public.es_staff());
create policy staff_todo on public.ejecuciones for all to authenticated using (public.es_staff()) with check (public.es_staff());
create policy staff_lee on public.ejecucion_eventos for select to authenticated using (public.es_staff());
create policy staff_lee on public.gps_puntos for select to authenticated using (public.es_staff());
create policy staff_lee on public.incidencias for select to authenticated using (public.es_staff());
create policy staff_lee on public.evidencias for select to authenticated using (public.es_staff());
create policy staff_valida on public.evidencias for update to authenticated using (public.es_staff()) with check (public.es_staff());

-- Público (web): solo puede CREAR solicitudes nuevas, nunca leerlas
create policy publico_crea_solicitud on public.solicitudes for insert to anon, authenticated
  with check (estado = 'nueva' and empresa_id is null and notas_internas is null and atendida_por is null and origen = 'web');

-- Cada usuario ve su propio perfil
create policy ver_mi_perfil on public.perfiles for select to authenticated using (id = auth.uid());

-- Cliente: su empresa, sus campañas y solo ejecuciones/evidencias validadas
create policy cliente_ve_empresa on public.empresas for select to authenticated
  using (id = public.mi_empresa());
create policy cliente_ve_campanias on public.campanias for select to authenticated
  using (public.mi_rol() = 'cliente' and empresa_id = public.mi_empresa());
create policy cliente_ve_servicios on public.campania_servicios for select to authenticated
  using (exists (select 1 from public.campanias c where c.id = campania_id
                 and public.mi_rol() = 'cliente' and c.empresa_id = public.mi_empresa()));
create policy cliente_ve_ejecuciones_validadas on public.ejecuciones for select to authenticated
  using (estado = 'validada' and public.mi_rol() = 'cliente'
         and exists (select 1 from public.campanias c where c.id = campania_id and c.empresa_id = public.mi_empresa()));
create policy cliente_ve_evidencias_validadas on public.evidencias for select to authenticated
  using (estado = 'validada' and public.mi_rol() = 'cliente'
         and exists (select 1 from public.ejecuciones e join public.campanias c on c.id = e.campania_id
                     where e.id = ejecucion_id and e.estado = 'validada' and c.empresa_id = public.mi_empresa()));
-- (sin políticas de cliente para ejecucion_eventos ni gps_puntos: horas y GPS crudo son internos)

-- Operador: solo sus ejecuciones; registra mientras están activas
create policy operador_ve_sus_ejecuciones on public.ejecuciones for select to authenticated
  using (operador_id = auth.uid());
create policy operador_actualiza_estado on public.ejecuciones for update to authenticated
  using (operador_id = auth.uid() and estado in ('programada', 'en_curso', 'pausada'))
  with check (operador_id = auth.uid() and estado in ('en_curso', 'pausada', 'finalizada'));

create or replace function public.ejecucion_activa_mia(eid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.ejecuciones
                 where id = eid and operador_id = auth.uid() and estado in ('programada', 'en_curso', 'pausada'))
$$;

create policy operador_registra_evento on public.ejecucion_eventos for insert to authenticated
  with check (public.ejecucion_activa_mia(ejecucion_id) and registrado_por = auth.uid());
create policy operador_ve_eventos on public.ejecucion_eventos for select to authenticated
  using (registrado_por = auth.uid());
create policy operador_registra_gps on public.gps_puntos for insert to authenticated
  with check (public.ejecucion_activa_mia(ejecucion_id));
create policy operador_sube_evidencia on public.evidencias for insert to authenticated
  with check (public.ejecucion_activa_mia(ejecucion_id) and subida_por = auth.uid() and estado = 'pendiente');
create policy operador_ve_evidencias on public.evidencias for select to authenticated
  using (subida_por = auth.uid());
create policy operador_registra_incidencia on public.incidencias for insert to authenticated
  with check (public.ejecucion_activa_mia(ejecucion_id) and registrado_por = auth.uid());

-- Operador: no puede cambiar campos sensibles de la ejecución (solo estado)
create or replace function public.limitar_cambios_operador() returns trigger
language plpgsql as $$
begin
  if public.es_staff() then return new; end if;
  if (new.campania_id, new.operador_id, new.unidad_id, new.fecha, new.zonas, new.zonas_cubiertas,
      new.km_en_zonas, new.validada_por, new.validada_en)
     is distinct from
     (old.campania_id, old.operador_id, old.unidad_id, old.fecha, old.zonas, old.zonas_cubiertas,
      old.km_en_zonas, old.validada_por, old.validada_en) then
    raise exception 'El operador solo puede cambiar el estado de la ejecución.';
  end if;
  return new;
end $$;

create trigger limitar_operador before update on public.ejecuciones
  for each row execute function public.limitar_cambios_operador();

-- ---------------------------------------------------------------------------
-- Storage: bucket privado de evidencias. Ruta: {ejecucion_id}/{archivo}
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('evidencias', 'evidencias', false, 26214400, array['image/jpeg', 'image/webp', 'image/heic', 'video/mp4'])
on conflict (id) do nothing;

create policy evidencias_operador_sube on storage.objects for insert to authenticated
  with check (bucket_id = 'evidencias'
              and public.ejecucion_activa_mia(((storage.foldername(name))[1])::uuid));
create policy evidencias_staff_lee on storage.objects for select to authenticated
  using (bucket_id = 'evidencias' and public.es_staff());
create policy evidencias_cliente_lee_validadas on storage.objects for select to authenticated
  using (bucket_id = 'evidencias' and exists (
    select 1 from public.evidencias ev
    join public.ejecuciones e on e.id = ev.ejecucion_id
    join public.campanias c on c.id = e.campania_id
    where ev.storage_path = name and ev.estado = 'validada' and e.estado = 'validada'
      and public.mi_rol() = 'cliente' and c.empresa_id = public.mi_empresa()));

-- ---------------------------------------------------------------------------
-- Alta automática de perfil al registrarse (rol cliente sin empresa → lo asigna el staff)
-- ---------------------------------------------------------------------------
-- Nota: los clientes se crean por invitación del staff (que asigna empresa y rol);
-- por eso no hay trigger de alta automática en auth.users en esta versión.
