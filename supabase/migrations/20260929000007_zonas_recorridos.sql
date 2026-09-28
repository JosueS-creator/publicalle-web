-- ============================================================================
-- Zonas con contorno + recorridos visibles para el cliente SOLO dentro de sus zonas.
-- - El filtro se hace en el servidor: el cliente nunca recibe puntos fuera de zona.
-- - Jornadas en curso: el cliente ve el avance con 15 minutos de retraso (no la ubicación actual).
-- - Contorno: arreglo JSON de [lat, lng] (mín. 3 vértices).
-- ============================================================================

create table public.zonas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique check (char_length(nombre) between 2 and 80),
  ciudad text,
  contorno jsonb not null check (jsonb_typeof(contorno) = 'array' and jsonb_array_length(contorno) >= 3),
  creado_en timestamptz not null default now()
);
alter table public.zonas enable row level security;
create policy staff_todo on public.zonas for all to authenticated using (public.es_staff()) with check (public.es_staff());
create policy zonas_lectura on public.zonas for select to authenticated using (true);  -- contornos de colonias: no son datos sensibles

-- Punto dentro de polígono (ray casting)
create or replace function public.punto_en_poligono(p_lat double precision, p_lng double precision, p_contorno jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
declare
  n int := jsonb_array_length(p_contorno);
  i int; j int; yi float8; xi float8; yj float8; xj float8;
  dentro boolean := false;
begin
  if n < 3 then return false; end if;
  j := n - 1;
  for i in 0 .. n - 1 loop
    yi := (p_contorno -> i ->> 0)::float8; xi := (p_contorno -> i ->> 1)::float8;
    yj := (p_contorno -> j ->> 0)::float8; xj := (p_contorno -> j ->> 1)::float8;
    if ((yi > p_lat) <> (yj > p_lat)) and (p_lng < (xj - xi) * (p_lat - yi) / (yj - yi) + xi) then
      dentro := not dentro;
    end if;
    j := i;
  end loop;
  return dentro;
end $$;

-- Distancia en metros (haversine)
create or replace function public.metros(lat1 float8, lng1 float8, lat2 float8, lng2 float8)
returns float8 language sql immutable set search_path = '' as $$
  select 2 * 6371000 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)))
$$;

-- ¿Quién pide? 'staff' | 'cliente' (de la empresa, jornada ya iniciada) | null
create or replace function public.acceso_recorrido(p_ejecucion uuid) returns text
language sql stable security definer set search_path = public as $$
  select case
    when public.es_staff() then 'staff'
    when exists (select 1 from ejecuciones e join campanias c on c.id = e.campania_id
                 where e.id = p_ejecucion and public.mi_rol() = 'cliente' and c.empresa_id = public.mi_empresa()
                   and e.estado in ('en_curso', 'pausada', 'finalizada', 'validada')) then 'cliente'
  end
$$;

-- Hasta cuándo puede ver: staff todo; cliente con 15 min de retraso salvo jornada ya validada
create or replace function public.recorrido_hasta(p_ejecucion uuid) returns timestamptz
language sql stable security definer set search_path = public as $$
  select case public.acceso_recorrido(p_ejecucion)
    when 'staff' then 'infinity'::timestamptz
    when 'cliente' then case when (select estado from ejecuciones where id = p_ejecucion) = 'validada'
                             then 'infinity'::timestamptz else now() - interval '15 minutes' end
  end
$$;

-- Puntos GPS dentro de las zonas de la campaña/jornada (solo para quien tiene acceso)
create or replace function public.recorrido_en_zonas(p_ejecucion uuid)
returns table (lat double precision, lng double precision, capturado_en timestamptz, zona text)
language sql stable security definer set search_path = public as $$
  select g.lat, g.lng, g.capturado_en, z.nombre
  from gps_puntos g
  join ejecuciones e on e.id = g.ejecucion_id
  join campanias c on c.id = e.campania_id
  cross join lateral (
    select z.nombre from zonas z
    where z.nombre = any (c.zonas || e.zonas) and public.punto_en_poligono(g.lat, g.lng, z.contorno)
    order by z.nombre limit 1
  ) z
  where g.ejecucion_id = p_ejecucion
    and g.registrado_en <= public.recorrido_hasta(p_ejecucion)  -- hora del SERVIDOR; null (sin acceso) => ninguna fila
  order by g.capturado_en
$$;

-- Cobertura calculada: km dentro de cada zona (tramos consecutivos en la misma zona, ≤ 5 min y < 2 km)
create or replace function public.cobertura_jornada(p_ejecucion uuid)
returns table (zona text, km numeric, puntos int, ultima timestamptz)
language sql stable security definer set search_path = public as $$
  with p as (select * from public.recorrido_en_zonas(p_ejecucion)),
  s as (
    select zona, capturado_en, lat, lng,
           lag(lat) over w as plat, lag(lng) over w as plng, lag(capturado_en) over w as pt, lag(zona) over w as pz
    from p window w as (order by capturado_en)
  )
  select zona,
         round((sum(case when pz = zona and capturado_en - pt <= interval '5 minutes'
                          and public.metros(plat, plng, lat, lng) < 2000
                         then public.metros(plat, plng, lat, lng) else 0 end) / 1000)::numeric, 2),
         count(*)::int, max(capturado_en)
  from s group by zona order by zona
$$;

-- Jornadas iniciadas (aún no validadas) de una campaña, para el portal: sin horas internas
create or replace function public.jornadas_en_curso_cliente(p_campania uuid)
returns table (id uuid, fecha date, linea public.linea_servicio, servicio text, estado public.estado_ejecucion,
               zonas text[], punto_nombre text, fotos_recibidas int)
language sql stable security definer set search_path = public as $$
  select e.id, e.fecha, e.linea, e.servicio, e.estado, e.zonas, e.punto_nombre,
         (select count(*)::int from evidencias ev where ev.ejecucion_id = e.id and ev.estado <> 'rechazada')
  from ejecuciones e join campanias c on c.id = e.campania_id
  where e.campania_id = p_campania and e.estado in ('en_curso', 'pausada', 'finalizada')
    and (public.es_staff() or (public.mi_rol() = 'cliente' and c.empresa_id = public.mi_empresa()))
  order by e.fecha desc
$$;

-- Punto registrado (llegada / instalación / verificación) de EVENTS y PLACE, con las mismas reglas de retraso
create or replace function public.punto_jornada(p_ejecucion uuid)
returns table (lat double precision, lng double precision, registrado_en timestamptz)
language sql stable security definer set search_path = public as $$
  select ev.lat, ev.lng, ev.registrado_en from ejecucion_eventos ev
  where ev.ejecucion_id = p_ejecucion and ev.tipo in ('llegada', 'instalacion', 'verificacion') and ev.lat is not null
    and ev.registrado_en <= public.recorrido_hasta(p_ejecucion)
  order by ev.registrado_en limit 1
$$;

revoke execute on function public.acceso_recorrido(uuid), public.recorrido_hasta(uuid), public.recorrido_en_zonas(uuid),
  public.cobertura_jornada(uuid), public.jornadas_en_curso_cliente(uuid), public.punto_jornada(uuid) from public, anon;
grant execute on function public.recorrido_en_zonas(uuid), public.cobertura_jornada(uuid),
  public.jornadas_en_curso_cliente(uuid), public.punto_jornada(uuid) to authenticated;
-- acceso_recorrido / recorrido_hasta: solo uso interno (las llaman las funciones de arriba como propietario)
