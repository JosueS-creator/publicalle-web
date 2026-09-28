-- ============================================================================
-- PUBLICALLE — Soporte para el panel de administración y el portal del cliente
-- ============================================================================

-- Correo visible en el admin (la fuente de verdad sigue siendo auth.users)
alter table public.perfiles add column if not exists correo text;

-- Convertir una solicitud del brief en campaña (atómico). Crea la empresa si no se indica una.
create or replace function public.convertir_solicitud(
  p_solicitud uuid, p_empresa uuid, p_empresa_nombre text, p_nombre text
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  s public.solicitudes;
  v_emp uuid;
  v_camp uuid;
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

  insert into public.campanias (empresa_id, solicitud_id, nombre, objetivo, ciudades, fecha_inicio, fecha_fin, creado_por)
  values (v_emp, s.id, trim(p_nombre), s.objetivo, s.ciudades, s.fecha_inicio, s.fecha_fin, auth.uid())
  returning id into v_camp;

  -- servicios del brief ("linea:servicio"); se omite "asesoria"
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

-- Mientras no exista la app del operador, el staff puede subir evidencias (p. ej. fotos recibidas por WhatsApp).
-- Siguen siendo inmutables: solo se validan o rechazan.
create policy staff_sube_evidencia on public.evidencias for insert to authenticated
  with check (public.es_staff() and subida_por = auth.uid() and estado = 'pendiente');
create policy evidencias_staff_sube on storage.objects for insert to authenticated
  with check (bucket_id = 'evidencias' and public.es_staff());
