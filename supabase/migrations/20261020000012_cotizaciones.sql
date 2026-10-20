-- Módulo de cotizaciones: borrador editable → emitida (copia inmutable) → enlace público de solo lectura.
-- Solo staff (admin/super_admin) accede a las tablas; el público entra únicamente por cotizacion_publica(token).

create type public.estado_cotizacion as enum ('borrador','emitida','compartida','vencida','cancelada');

-- Datos comerciales de Publicalle (una sola fila; nulos = pendiente por configurar)
create table public.config_comercial (
  id boolean primary key default true check (id),
  razon_social text,
  rtn text,
  telefono text,
  correo text,
  direccion text,
  sitio_web text,
  logo_ref text,
  condiciones_defecto text,
  vigencia_dias_defecto int check (vigencia_dias_defecto is null or vigencia_dias_defecto > 0),
  isv_porcentaje numeric(5,2) check (isv_porcentaje is null or isv_porcentaje between 0 and 100),
  moneda text not null default 'HNL',
  actualizado_en timestamptz not null default now()
);
insert into public.config_comercial (id) values (true);

-- Contador anual para numeración atómica
create table public.contadores_cotizacion (
  anio int primary key,
  ultimo int not null default 0
);

create table public.cotizaciones (
  id uuid primary key default gen_random_uuid(),
  campania_id uuid not null references public.campanias(id) on delete cascade,
  numero text unique,
  version int not null default 1 check (version >= 1),
  cotizacion_origen_id uuid references public.cotizaciones(id) on delete restrict,
  estado public.estado_cotizacion not null default 'borrador',
  proyecto text,
  cliente_contacto text,
  moneda text not null default 'HNL',
  fecha_emision date,
  vigencia_dias int check (vigencia_dias is null or vigencia_dias > 0),
  fecha_vencimiento date,
  impuesto_porcentaje numeric(5,2) not null default 0 check (impuesto_porcentaje between 0 and 100),
  condiciones text,
  notas_internas text,
  subtotal numeric(14,2) not null default 0,
  descuento_total numeric(14,2) not null default 0,
  impuesto_total numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  snapshot jsonb,
  token_hash text unique,
  enlace_revocado_en timestamptz,
  emitida_en timestamptz,
  emitida_por uuid references public.perfiles(id) on delete set null,
  creado_por uuid references public.perfiles(id) on delete set null,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint cotizaciones_emitida_completa check (estado = 'borrador' or (numero is not null and snapshot is not null))
);
create index cotizaciones_campania_idx on public.cotizaciones(campania_id);

create table public.cotizacion_conceptos (
  id uuid primary key default gen_random_uuid(),
  cotizacion_id uuid not null references public.cotizaciones(id) on delete cascade,
  campania_servicio_id uuid references public.campania_servicios(id) on delete set null,
  orden int not null default 0,
  concepto text not null check (btrim(concepto) <> ''),
  descripcion text,
  cantidad numeric(14,2) not null check (cantidad > 0),
  unidad text not null default 'UN',
  precio_unitario numeric(14,2) not null check (precio_unitario >= 0),
  descuento_porcentaje numeric(5,2) not null default 0 check (descuento_porcentaje between 0 and 100),
  subtotal numeric(14,2) generated always as (round(cantidad * precio_unitario * (1 - descuento_porcentaje / 100), 2)) stored
);
create index cotizacion_conceptos_idx on public.cotizacion_conceptos(cotizacion_id, orden);

create table public.cotizacion_eventos (
  id uuid primary key default gen_random_uuid(),
  cotizacion_id uuid not null references public.cotizaciones(id) on delete cascade,
  evento text not null,
  detalle jsonb not null default '{}'::jsonb,
  usuario uuid,
  creado_en timestamptz not null default now()
);
create index cotizacion_eventos_idx on public.cotizacion_eventos(cotizacion_id, creado_en);

-- Totales (aritmética numeric exacta)
create function public.cotizacion_totales(p_id uuid, p_pct numeric)
returns table(r_subtotal numeric, r_descuento numeric, r_impuesto numeric, r_total numeric)
language sql stable set search_path = public as $$
  select s.bruto, s.bruto - s.neto, round(s.neto * p_pct / 100, 2), s.neto + round(s.neto * p_pct / 100, 2)
  from (
    select coalesce(sum(round(cantidad * precio_unitario, 2)), 0) bruto, coalesce(sum(subtotal), 0) neto
    from public.cotizacion_conceptos where cotizacion_id = p_id
  ) s
$$;

-- Protección e inmutabilidad
create function public.cotizaciones_proteger()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    if old.estado <> 'borrador' then
      raise exception 'cotizacion_emitida: hay cotizaciones emitidas asociadas; no se puede eliminar. Cancela la cotización o la campaña en su lugar.' using errcode = '23000';
    end if;
    return old;
  end if;

  if old.estado = 'borrador' then
    if new.estado <> 'borrador' and coalesce(current_setting('app.emitiendo', true), '') <> '1' then
      raise exception 'Usa emitir_cotizacion() para emitir.' using errcode = '23000';
    end if;
    select r_subtotal, r_descuento, r_impuesto, r_total
      into new.subtotal, new.descuento_total, new.impuesto_total, new.total
      from public.cotizacion_totales(new.id, new.impuesto_porcentaje);
    return new;
  end if;

  if new.estado = 'borrador' then
    raise exception 'Una cotización emitida no vuelve a borrador; crea una revisión.' using errcode = '23000';
  end if;
  if (new.campania_id, new.numero, new.version, new.cotizacion_origen_id, new.proyecto, new.cliente_contacto,
      new.moneda, new.fecha_emision, new.vigencia_dias, new.fecha_vencimiento, new.impuesto_porcentaje,
      new.condiciones, new.subtotal, new.descuento_total, new.impuesto_total, new.total, new.snapshot)
     is distinct from
     (old.campania_id, old.numero, old.version, old.cotizacion_origen_id, old.proyecto, old.cliente_contacto,
      old.moneda, old.fecha_emision, old.vigencia_dias, old.fecha_vencimiento, old.impuesto_porcentaje,
      old.condiciones, old.subtotal, old.descuento_total, old.impuesto_total, old.total, old.snapshot) then
    raise exception 'La cotización emitida es inmutable; crea una revisión.' using errcode = '23000';
  end if;
  if new.estado <> old.estado and (old.estado::text, new.estado::text) not in (
      ('emitida','compartida'),('emitida','vencida'),('emitida','cancelada'),
      ('compartida','emitida'),('compartida','vencida'),('compartida','cancelada'),
      ('vencida','cancelada')) then
    raise exception 'Transición de estado no permitida: % -> %', old.estado, new.estado using errcode = '23000';
  end if;
  return new;
end $$;

create trigger cotizaciones_proteger_upd before update on public.cotizaciones
  for each row execute function public.cotizaciones_proteger();
create trigger cotizaciones_proteger_del before delete on public.cotizaciones
  for each row execute function public.cotizaciones_proteger();
create trigger tocar_cotizaciones before update on public.cotizaciones
  for each row execute function public.tocar_actualizado();

create function public.conceptos_proteger()
returns trigger language plpgsql set search_path = public as $$
declare v_estado public.estado_cotizacion;
begin
  select estado into v_estado from public.cotizaciones where id = coalesce(new.cotizacion_id, old.cotizacion_id);
  if v_estado is not null and v_estado <> 'borrador' then
    raise exception 'Los conceptos de una cotización emitida son inmutables.' using errcode = '23000';
  end if;
  return coalesce(new, old);
end $$;
create trigger conceptos_proteger before insert or update or delete on public.cotizacion_conceptos
  for each row execute function public.conceptos_proteger();

create function public.conceptos_recalcular()
returns trigger language plpgsql set search_path = public as $$
begin
  update public.cotizaciones set actualizado_en = now()
   where id = coalesce(new.cotizacion_id, old.cotizacion_id);
  return null;
end $$;
create trigger conceptos_recalcular after insert or update or delete on public.cotizacion_conceptos
  for each row execute function public.conceptos_recalcular();

-- Historial
create function public.cotizaciones_historial()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.cotizacion_eventos (cotizacion_id, evento, detalle, usuario)
    values (new.id, 'creada', jsonb_build_object('version', new.version), auth.uid());
  else
    if old.estado <> new.estado then
      insert into public.cotizacion_eventos (cotizacion_id, evento, detalle, usuario)
      values (new.id, 'estado', jsonb_build_object('de', old.estado, 'a', new.estado), auth.uid());
    end if;
    if old.token_hash is distinct from new.token_hash and new.token_hash is not null then
      insert into public.cotizacion_eventos (cotizacion_id, evento, usuario) values (new.id, 'enlace_generado', auth.uid());
    end if;
    if old.enlace_revocado_en is distinct from new.enlace_revocado_en and new.enlace_revocado_en is not null then
      insert into public.cotizacion_eventos (cotizacion_id, evento, usuario) values (new.id, 'enlace_revocado', auth.uid());
    end if;
  end if;
  return null;
end $$;
create trigger cotizaciones_historial_ins after insert on public.cotizaciones
  for each row execute function public.cotizaciones_historial();
create trigger cotizaciones_historial_upd after update on public.cotizaciones
  for each row execute function public.cotizaciones_historial();

-- Emitir: asigna número, congela la copia y marca la campaña como «cotización enviada»
create function public.emitir_cotizacion(p_id uuid)
returns public.cotizaciones language plpgsql security definer set search_path = public as $$
declare
  c public.cotizaciones; cam public.campanias; emp public.empresas; cfg public.config_comercial;
  t record; v_anio int; v_n int; v_numero text; v_emision date; v_venc date; v_dias int; v_snap jsonb;
begin
  if not public.es_staff() then raise exception 'No autorizado' using errcode = '42501'; end if;
  select * into c from public.cotizaciones where id = p_id for update;
  if not found then raise exception 'Cotización no encontrada'; end if;
  if c.estado <> 'borrador' then raise exception 'La cotización ya fue emitida'; end if;
  if not exists (select 1 from public.cotizacion_conceptos where cotizacion_id = p_id) then
    raise exception 'La cotización no tiene conceptos';
  end if;

  select * into cam from public.campanias where id = c.campania_id;
  select * into emp from public.empresas where id = cam.empresa_id;
  select * into cfg from public.config_comercial limit 1;
  select * into t from public.cotizacion_totales(p_id, c.impuesto_porcentaje);

  v_emision := public.hoy_hn();
  v_dias := coalesce(c.vigencia_dias, cfg.vigencia_dias_defecto);
  v_venc := case when v_dias is not null then v_emision + v_dias end;
  v_anio := extract(year from v_emision)::int;

  insert into public.contadores_cotizacion (anio, ultimo) values (v_anio, 1)
  on conflict (anio) do update set ultimo = public.contadores_cotizacion.ultimo + 1
  returning ultimo into v_n;
  v_numero := 'PUB-' || v_anio || '-' || lpad(v_n::text, 4, '0');

  v_snap := jsonb_build_object(
    'numero', v_numero,
    'version', c.version,
    'fecha_emision', v_emision,
    'fecha_vencimiento', v_venc,
    'moneda', c.moneda,
    'emisor', jsonb_build_object('razon_social', cfg.razon_social, 'rtn', cfg.rtn, 'telefono', cfg.telefono,
      'correo', cfg.correo, 'direccion', cfg.direccion, 'sitio_web', cfg.sitio_web, 'logo_ref', cfg.logo_ref),
    'cliente', jsonb_build_object('nombre', emp.nombre, 'rtn', emp.rtn, 'telefono', emp.telefono,
      'correo', emp.correo, 'contacto', c.cliente_contacto),
    'campania', jsonb_build_object('nombre', cam.nombre, 'objetivo', cam.objetivo, 'ciudades', to_jsonb(cam.ciudades),
      'zonas', to_jsonb(cam.zonas), 'fecha_inicio', cam.fecha_inicio, 'fecha_fin', cam.fecha_fin),
    'proyecto', coalesce(nullif(btrim(c.proyecto), ''), cam.nombre),
    'conceptos', (select coalesce(jsonb_agg(jsonb_build_object('orden', k.orden, 'concepto', k.concepto,
        'descripcion', k.descripcion, 'cantidad', k.cantidad, 'unidad', k.unidad, 'precio_unitario', k.precio_unitario,
        'descuento_porcentaje', k.descuento_porcentaje, 'subtotal', k.subtotal) order by k.orden, k.id), '[]'::jsonb)
      from public.cotizacion_conceptos k where k.cotizacion_id = p_id),
    'totales', jsonb_build_object('subtotal', t.r_subtotal, 'descuento_total', t.r_descuento,
      'impuesto_porcentaje', c.impuesto_porcentaje, 'impuesto_total', t.r_impuesto, 'total', t.r_total),
    'condiciones', coalesce(nullif(btrim(c.condiciones), ''), cfg.condiciones_defecto)
  );

  perform set_config('app.emitiendo', '1', true);
  update public.cotizaciones
     set estado = 'emitida', numero = v_numero, fecha_emision = v_emision, vigencia_dias = v_dias,
         fecha_vencimiento = v_venc, snapshot = v_snap, emitida_en = now(), emitida_por = auth.uid()
   where id = p_id returning * into c;

  update public.campanias set estado = 'cotizacion_enviada' where id = c.campania_id and estado = 'borrador';

  if c.cotizacion_origen_id is not null then
    update public.cotizaciones set estado = 'cancelada', enlace_revocado_en = now()
     where id = c.cotizacion_origen_id and estado in ('emitida','compartida','vencida');
  end if;
  return c;
end $$;

-- Revisión (nueva versión vinculada a la original)
create function public.crear_revision_cotizacion(p_id uuid)
returns public.cotizaciones language plpgsql security definer set search_path = public as $$
declare o public.cotizaciones; n public.cotizaciones;
begin
  if not public.es_staff() then raise exception 'No autorizado' using errcode = '42501'; end if;
  select * into o from public.cotizaciones where id = p_id;
  if not found then raise exception 'Cotización no encontrada'; end if;
  if o.estado = 'borrador' then raise exception 'Un borrador se edita directamente'; end if;
  if exists (select 1 from public.cotizaciones where cotizacion_origen_id = p_id and estado = 'borrador') then
    raise exception 'Ya existe una revisión en borrador';
  end if;
  insert into public.cotizaciones (campania_id, version, cotizacion_origen_id, proyecto, cliente_contacto, moneda,
      vigencia_dias, impuesto_porcentaje, condiciones, creado_por)
  values (o.campania_id, o.version + 1, o.id, o.proyecto, o.cliente_contacto, o.moneda,
      o.vigencia_dias, o.impuesto_porcentaje, o.condiciones, auth.uid())
  returning * into n;
  insert into public.cotizacion_conceptos (cotizacion_id, campania_servicio_id, orden, concepto, descripcion,
      cantidad, unidad, precio_unitario, descuento_porcentaje)
  select n.id, campania_servicio_id, orden, concepto, descripcion, cantidad, unidad, precio_unitario, descuento_porcentaje
  from public.cotizacion_conceptos where cotizacion_id = o.id;
  select * into n from public.cotizaciones where id = n.id;
  return n;
end $$;

-- Compartir / revocar / cancelar / vencidas
create function public.compartir_cotizacion(p_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare c public.cotizaciones; v_token text;
begin
  if not public.es_staff() then raise exception 'No autorizado' using errcode = '42501'; end if;
  select * into c from public.cotizaciones where id = p_id for update;
  if not found then raise exception 'Cotización no encontrada'; end if;
  if c.estado not in ('emitida','compartida') then raise exception 'Solo se comparte una cotización emitida vigente'; end if;
  v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  update public.cotizaciones
     set token_hash = encode(sha256(convert_to(v_token, 'utf8')), 'hex'), enlace_revocado_en = null, estado = 'compartida'
   where id = p_id;
  return v_token;
end $$;

create function public.revocar_enlace_cotizacion(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.es_staff() then raise exception 'No autorizado' using errcode = '42501'; end if;
  update public.cotizaciones
     set token_hash = null, enlace_revocado_en = now(),
         estado = case when estado = 'compartida' then 'emitida'::public.estado_cotizacion else estado end
   where id = p_id and estado <> 'borrador';
end $$;

create function public.cancelar_cotizacion(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.es_staff() then raise exception 'No autorizado' using errcode = '42501'; end if;
  update public.cotizaciones set estado = 'cancelada', token_hash = null, enlace_revocado_en = now()
   where id = p_id and estado in ('emitida','compartida','vencida');
  if not found then raise exception 'Solo se cancela una cotización emitida'; end if;
end $$;

create function public.marcar_cotizaciones_vencidas()
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.es_staff() then raise exception 'No autorizado' using errcode = '42501'; end if;
  update public.cotizaciones set estado = 'vencida'
   where estado in ('emitida','compartida') and fecha_vencimiento is not null and fecha_vencimiento < public.hoy_hn();
  get diagnostics n = row_count;
  return n;
end $$;

-- Lectura pública por token (solo la copia congelada; nunca notas internas)
create function public.cotizacion_publica(p_token text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare c public.cotizaciones;
begin
  if p_token is null or length(p_token) < 32 then return null; end if;
  select * into c from public.cotizaciones
   where token_hash = encode(sha256(convert_to(p_token, 'utf8')), 'hex')
     and enlace_revocado_en is null and estado in ('emitida','compartida','vencida');
  if not found then return null; end if;
  return jsonb_build_object('numero', c.numero, 'estado', c.estado,
    'vencida', (c.fecha_vencimiento is not null and c.fecha_vencimiento < public.hoy_hn()),
    'emitida_en', c.emitida_en, 'documento', c.snapshot);
end $$;

-- Permisos de funciones
revoke execute on function public.emitir_cotizacion(uuid), public.crear_revision_cotizacion(uuid),
  public.compartir_cotizacion(uuid), public.revocar_enlace_cotizacion(uuid), public.cancelar_cotizacion(uuid),
  public.marcar_cotizaciones_vencidas(), public.cotizacion_publica(text) from public, anon;
grant execute on function public.emitir_cotizacion(uuid), public.crear_revision_cotizacion(uuid),
  public.compartir_cotizacion(uuid), public.revocar_enlace_cotizacion(uuid), public.cancelar_cotizacion(uuid),
  public.marcar_cotizaciones_vencidas() to authenticated;
grant execute on function public.cotizacion_publica(text) to anon, authenticated;

-- RLS (solo staff)
alter table public.config_comercial enable row level security;
alter table public.contadores_cotizacion enable row level security;
alter table public.cotizaciones enable row level security;
alter table public.cotizacion_conceptos enable row level security;
alter table public.cotizacion_eventos enable row level security;

create policy staff_todo on public.config_comercial for all to authenticated using (public.es_staff()) with check (public.es_staff());
create policy staff_todo on public.cotizaciones for all to authenticated using (public.es_staff()) with check (public.es_staff());
create policy staff_todo on public.cotizacion_conceptos for all to authenticated using (public.es_staff()) with check (public.es_staff());
create policy staff_ve_eventos on public.cotizacion_eventos for select to authenticated using (public.es_staff());

revoke all on public.config_comercial, public.contadores_cotizacion, public.cotizaciones,
  public.cotizacion_conceptos, public.cotizacion_eventos from anon;
revoke all on public.contadores_cotizacion from authenticated;
