-- ============================================================================
-- Brief con mapa: el cliente ubica su negocio y elige un radio y/o zonas dibujadas.
-- Al convertir la solicitud, el radio se crea como zona real (círculo de 32 vértices).
-- ============================================================================

alter table public.solicitudes
  add column if not exists ubicacion_lat double precision,
  add column if not exists ubicacion_lng double precision,
  add column if not exists ubicacion_ref text check (char_length(ubicacion_ref) <= 200),
  add column if not exists radio_km numeric check (radio_km is null or radio_km between 0.5 and 10),
  add column if not exists zonas_elegidas text[] not null default '{}' check (cardinality(zonas_elegidas) <= 30);

-- Ubicación dentro de Honduras (aprox.) y ambas coordenadas juntas
alter table public.solicitudes add constraint ubicacion_hn check (
  (ubicacion_lat is null and ubicacion_lng is null)
  or (ubicacion_lat between 12.9 and 16.6 and ubicacion_lng between -89.5 and -83.1)
);
-- Un radio necesita ubicación
alter table public.solicitudes add constraint radio_con_ubicacion check (radio_km is null or ubicacion_lat is not null);

-- La web pública muestra las zonas dibujadas para que el cliente las elija (contornos de colonias: no sensibles)
create policy zonas_lectura_publica on public.zonas for select to anon using (true);

-- Círculo aproximado como contorno [[lat,lng],...]
create or replace function public.contorno_circulo(p_lat float8, p_lng float8, p_km float8, p_n int default 32)
returns jsonb language sql immutable set search_path = '' as $$
  select jsonb_agg(jsonb_build_array(
           round((p_lat + (p_km / 111.32) * cos(2 * pi() * i / p_n))::numeric, 6),
           round((p_lng + (p_km / (111.32 * cos(radians(p_lat)))) * sin(2 * pi() * i / p_n))::numeric, 6)
         ) order by i)
  from generate_series(0, p_n - 1) as i
$$;

-- convertir_solicitud: ahora también copia las zonas elegidas y crea la zona del radio
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
  if s.radio_km is not null and s.ubicacion_lat is not null then
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

revoke execute on function public.convertir_solicitud(uuid, uuid, text, text) from public, anon;
grant execute on function public.convertir_solicitud(uuid, uuid, text, text) to authenticated;
