-- ============================================================================
-- PubliEscuela: agenda de horarios con cupos
--  - agenda_franjas: horarios de 2 h que el cliente puede elegir (los define el admin).
--  - agenda_bloqueos: días sin servicio (feriados, vacaciones), para todas o una franja.
--  - Una solicitud de PubliEscuela APARTA su cupo en cada día del recorrido mientras está
--    nueva / en revisión / convertida. Descartarla libera el cupo.
--  - El cupo se valida EN EL SERVIDOR al guardar (no se puede saltar desde el navegador).
-- Fechas en hora de Honduras.
-- ============================================================================

create table public.agenda_franjas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(nombre) between 2 and 60),
  hora_inicio time not null,
  hora_fin time not null,
  dias_semana int[] not null default '{1,2,3,4,5}', -- 1 = lunes … 7 = domingo
  cupos int not null default 1 check (cupos between 0 and 50), -- campañas (vehículos) a la vez en esta franja
  activa boolean not null default true,
  orden int not null default 0,
  creado_en timestamptz not null default now(),
  constraint franja_horas check (hora_fin > hora_inicio),
  constraint franja_dias check (cardinality(dias_semana) between 1 and 7 and dias_semana <@ '{1,2,3,4,5,6,7}')
);

create table public.agenda_bloqueos (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  franja_id uuid references public.agenda_franjas (id) on delete cascade, -- null = todo el día
  motivo text check (char_length(motivo) <= 120),
  creado_en timestamptz not null default now()
);
create index agenda_bloqueos_fecha_idx on public.agenda_bloqueos (fecha);

alter table public.solicitudes
  add column franja_id uuid references public.agenda_franjas (id) on delete set null,
  add column dias_recorrido int check (dias_recorrido is null or dias_recorrido between 1 and 60),
  add column escuelas jsonb check (escuelas is null or (jsonb_typeof(escuelas) = 'array' and jsonb_array_length(escuelas) <= 10)),
  add column fechas_reserva date[] not null default '{}';
create index solicitudes_franja_idx on public.solicitudes (franja_id) where franja_id is not null;

alter table public.agenda_franjas enable row level security;
alter table public.agenda_bloqueos enable row level security;
create policy staff_todo on public.agenda_franjas for all to authenticated using (public.es_staff()) with check (public.es_staff());
create policy staff_todo on public.agenda_bloqueos for all to authenticated using (public.es_staff()) with check (public.es_staff());
-- Las franjas activas son públicas (el configurador las muestra); los bloqueos y las reservas no.
create policy publico_ve_franjas on public.agenda_franjas for select to anon, authenticated using (activa);
grant select on public.agenda_franjas to anon;

-- Hoy en Honduras
create or replace function public.hoy_hn() returns date language sql stable set search_path = '' as $$
  select (now() at time zone 'America/Tegucigalpa')::date
$$;

-- Días de recorrido: desde p_inicio, los días de la franja que no estén bloqueados, hasta juntar p_dias
create or replace function public.agenda_fechas(p_franja uuid, p_inicio date, p_dias int)
returns date[] language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(d order by d), '{}') from (
    select d::date as d
    from public.agenda_franjas f, generate_series(p_inicio, p_inicio + 180, interval '1 day') d
    where f.id = p_franja
      and extract(isodow from d)::int = any (f.dias_semana)
      and not exists (select 1 from public.agenda_bloqueos b where b.fecha = d::date and (b.franja_id is null or b.franja_id = f.id))
    order by d
    limit greatest(p_dias, 0)
  ) x
$$;

-- Cupos libres de una franja en un día (sin contar la solicitud p_excluir)
create or replace function public.agenda_libres(p_franja uuid, p_fecha date, p_excluir uuid default null)
returns int language sql stable security definer set search_path = public as $$
  with f as (select * from public.agenda_franjas where id = p_franja),
  apartados as (
    select s.id from public.solicitudes s
    where s.franja_id = p_franja and p_fecha = any (s.fechas_reserva)
      and s.estado in ('nueva', 'en_revision', 'convertida')
      and not exists (select 1 from public.campanias c where c.solicitud_id = s.id and c.estado = 'cancelada')
      and s.id is distinct from p_excluir
  ),
  -- Vehículos ya programados en ese horario por otras campañas (no las de una solicitud ya apartada)
  ocupados as (
    select count(distinct e.unidad_id) as n
    from public.ejecuciones e join public.campanias c on c.id = e.campania_id, f
    where e.fecha = p_fecha and e.unidad_id is not null
      and e.estado not in ('rechazada', 'incompleta')
      and coalesce(e.hora_inicio_prog, time '00:00') < f.hora_fin
      and coalesce(e.hora_fin_prog, time '23:59:59') > f.hora_inicio
      and (c.solicitud_id is null or c.solicitud_id not in (
        select s.id from public.solicitudes s where s.franja_id is not null and s.estado in ('nueva', 'en_revision', 'convertida')))
  )
  select case when exists (select 1 from public.agenda_bloqueos b where b.fecha = p_fecha and (b.franja_id is null or b.franja_id = p_franja)) then 0
              else greatest(0, (select cupos from f) - (select count(*) from apartados)::int - (select n from ocupados)::int) end
$$;

-- Configurador público: para cada franja activa, los días del recorrido y cuáles no tienen cupo
create or replace function public.agenda_disponibilidad(p_inicio date, p_dias int)
returns table (franja_id uuid, nombre text, hora_inicio time, hora_fin time, fechas date[], sin_cupo date[])
language plpgsql stable security definer set search_path = public as $$
begin
  if p_dias is null or p_dias < 1 or p_dias > 60 then raise exception 'Duración no válida'; end if;
  if p_inicio is null or p_inicio <= public.hoy_hn() then raise exception 'La fecha de inicio debe ser a partir de mañana'; end if;
  return query
    select f.id, f.nombre, f.hora_inicio, f.hora_fin, x.fechas,
           coalesce((select array_agg(d order by d) from unnest(x.fechas) d where public.agenda_libres(f.id, d) < 1), '{}')
    from public.agenda_franjas f
    cross join lateral (select public.agenda_fechas(f.id, p_inicio, p_dias) as fechas) x
    where f.activa
    order by f.orden, f.hora_inicio;
end $$;

-- Primera fecha de inicio (desde p_desde) en la que la franja tiene cupo todos los días
create or replace function public.agenda_proximo_inicio(p_franja uuid, p_dias int, p_desde date)
returns date language plpgsql stable security definer set search_path = public as $$
declare d date := greatest(p_desde, public.hoy_hn() + 1); fs date[];
begin
  if p_dias is null or p_dias < 1 or p_dias > 60 then return null; end if;
  for i in 0..90 loop
    fs := public.agenda_fechas(p_franja, d, p_dias);
    if cardinality(fs) = p_dias and not exists (select 1 from unnest(fs) x where public.agenda_libres(p_franja, x) < 1) then
      return fs[1];
    end if;
    d := d + 1;
  end loop;
  return null;
end $$;

-- Al guardar una solicitud con horario: calcula las fechas y comprueba el cupo (con candado, sin carreras)
create or replace function public.solicitud_aparta_cupo()
returns trigger language plpgsql security definer set search_path = public as $$
declare fs date[]; sin date[];
begin
  if new.franja_id is null then
    new.fechas_reserva := '{}';
    return new;
  end if;
  if tg_op = 'UPDATE' and new.franja_id is not distinct from old.franja_id
     and new.fecha_inicio is not distinct from old.fecha_inicio and new.dias_recorrido is not distinct from old.dias_recorrido then
    new.fechas_reserva := old.fechas_reserva; -- solo cambió el estado u otros datos
    return new;
  end if;
  if new.fecha_inicio is null or new.dias_recorrido is null then
    raise exception 'AGENDA: falta la fecha de inicio o la duración';
  end if;
  if tg_op = 'INSERT' and new.fecha_inicio <= public.hoy_hn() then
    raise exception 'AGENDA: la fecha de inicio debe ser a partir de mañana';
  end if;
  if not exists (select 1 from public.agenda_franjas where id = new.franja_id and activa) then
    raise exception 'AGENDA: ese horario no está disponible';
  end if;
  perform pg_advisory_xact_lock(hashtext('agenda_publiescuela'));
  fs := public.agenda_fechas(new.franja_id, new.fecha_inicio, new.dias_recorrido);
  if cardinality(fs) < new.dias_recorrido then raise exception 'AGENDA: no hay suficientes días disponibles'; end if;
  select array_agg(d) into sin from unnest(fs) d where public.agenda_libres(new.franja_id, d, new.id) < 1;
  if sin is not null then
    raise exception 'AGENDA_SIN_CUPO: %', array_to_string(sin, ', ');
  end if;
  new.fechas_reserva := fs;
  new.fecha_inicio := fs[1];
  new.fecha_fin := fs[cardinality(fs)];
  return new;
end $$;

create trigger solicitud_aparta_cupo before insert or update on public.solicitudes
  for each row execute function public.solicitud_aparta_cupo();

-- Panel: ocupación por día y franja (solo staff)
create or replace function public.agenda_ocupacion(p_desde date, p_hasta date)
returns table (fecha date, franja_id uuid, cupos int, libres int, bloqueado boolean, reservas jsonb)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.es_staff() then raise exception 'No autorizado'; end if;
  if p_hasta < p_desde or p_hasta - p_desde > 62 then raise exception 'Rango no válido'; end if;
  return query
    select d::date, f.id, f.cupos, public.agenda_libres(f.id, d::date),
           exists (select 1 from public.agenda_bloqueos b where b.fecha = d::date and (b.franja_id is null or b.franja_id = f.id)),
           coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'folio', s.folio, 'estado', s.estado,
                       'contacto', coalesce(s.contacto_empresa, s.contacto_nombre)) order by s.creado_en)
                     from public.solicitudes s
                     where s.franja_id = f.id and d::date = any (s.fechas_reserva) and s.estado in ('nueva', 'en_revision', 'convertida')), '[]')
    from public.agenda_franjas f, generate_series(p_desde, p_hasta, interval '1 day') d
    where extract(isodow from d)::int = any (f.dias_semana)
    order by d, f.orden, f.hora_inicio;
end $$;

revoke all on function public.agenda_fechas(uuid, date, int) from public;
revoke all on function public.agenda_libres(uuid, date, uuid) from public;
revoke all on function public.agenda_ocupacion(date, date) from public, anon;
grant execute on function public.agenda_disponibilidad(date, int) to anon, authenticated;
grant execute on function public.agenda_proximo_inicio(uuid, int, date) to anon, authenticated;
grant execute on function public.agenda_ocupacion(date, date) to authenticated;
grant execute on function public.hoy_hn() to anon, authenticated;

-- Horarios iniciales (editables en Admin → Agenda): alrededor de entrada y salida de clases
insert into public.agenda_franjas (nombre, hora_inicio, hora_fin, dias_semana, cupos, orden) values
  ('Entrada de la mañana', '06:00', '08:00', '{1,2,3,4,5}', 1, 1),
  ('Salida del mediodía', '11:00', '13:00', '{1,2,3,4,5}', 1, 2),
  ('Salida de la tarde', '16:00', '18:00', '{1,2,3,4,5}', 1, 3);

-- Convertir: si la solicitud es de PubliEscuela, crea una zona por escuela (antes solo la del primer punto)
create or replace function public.convertir_solicitud(
  p_solicitud uuid, p_empresa uuid, p_empresa_nombre text, p_nombre text
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  s public.solicitudes;
  v_emp uuid;
  v_camp uuid;
  v_zonas text[];
  v_radio text;
  e jsonb;
begin
  if not public.es_staff() then
    raise exception 'Solo el equipo de Publicalle puede convertir solicitudes.';
  end if;
  select * into s from public.solicitudes where id = p_solicitud for update;
  if not found then raise exception 'Solicitud no encontrada.'; end if;
  if s.estado = 'convertida' then raise exception 'Esta solicitud ya fue convertida en campaña.'; end if;
  if coalesce(trim(p_nombre), '') = '' then raise exception 'La campaña necesita un nombre.'; end if;

  v_emp := p_empresa;
  if v_emp is null then
    if coalesce(trim(p_empresa_nombre), '') = '' then raise exception 'Indica el nombre de la empresa.'; end if;
    insert into public.empresas (nombre, telefono, correo)
    values (trim(p_empresa_nombre), s.contacto_telefono, s.contacto_correo)
    returning id into v_emp;
  end if;

  v_zonas := coalesce(s.zonas_elegidas, '{}');
  -- PubliEscuela: una zona por escuela (su radio alrededor), para medir el recorrido en cada una
  if s.escuelas is not null and jsonb_array_length(s.escuelas) > 0 then
    for e in select * from jsonb_array_elements(s.escuelas) loop
      v_radio := format('%s · %s km · %s', left(e->>'nombre', 50), trim(to_char((e->>'radio_km')::numeric, 'FM990.0')), s.folio);
      insert into public.zonas (nombre, ciudad, contorno)
      values (v_radio, s.ciudades[1], public.contorno_circulo((e->>'lat')::float8, (e->>'lng')::float8, (e->>'radio_km')::float8))
      on conflict (nombre) do nothing;
      v_zonas := v_zonas || v_radio;
    end loop;
  elsif s.radio_km is not null and s.ubicacion_lat is not null then
    v_radio := format('Radio %s km · %s', trim(to_char(s.radio_km, 'FM990.0')), s.folio);
    insert into public.zonas (nombre, ciudad, contorno)
    values (v_radio, s.ciudades[1], public.contorno_circulo(s.ubicacion_lat, s.ubicacion_lng, s.radio_km::float8))
    on conflict (nombre) do nothing;
    v_zonas := v_zonas || v_radio;
  end if;

  insert into public.campanias (empresa_id, solicitud_id, nombre, objetivo, ciudades, zonas, fecha_inicio, fecha_fin, creado_por)
  values (v_emp, s.id, trim(p_nombre), s.objetivo, s.ciudades, v_zonas, s.fecha_inicio, s.fecha_fin, auth.uid())
  returning id into v_camp;

  insert into public.campania_servicios (campania_id, linea, servicio)
  select v_camp, split_part(x, ':', 1)::public.linea_servicio, split_part(x, ':', 2)
  from unnest(s.servicios) as x
  where x like '%:%';

  update public.solicitudes
     set estado = 'convertida', empresa_id = v_emp, atendida_por = auth.uid()
   where id = s.id;

  return v_camp;
end $$;

