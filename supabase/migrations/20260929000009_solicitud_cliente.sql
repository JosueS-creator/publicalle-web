-- ============================================================================
-- Clientes existentes piden nuevas campañas desde su portal.
-- La solicitud queda ligada a su empresa (origen 'portal'). El cliente ve el estado
-- de sus solicitudes con una función (sin exponer notas internas).
-- ============================================================================

alter table public.solicitudes drop constraint if exists solicitudes_origen_check;
alter table public.solicitudes add constraint solicitudes_origen_check
  check (origen in ('web', 'whatsapp', 'admin', 'portal'));

create policy cliente_crea_solicitud on public.solicitudes for insert to authenticated
  with check (public.mi_rol() = 'cliente' and empresa_id = public.mi_empresa() and origen = 'portal'
              and estado = 'nueva' and notas_internas is null and atendida_por is null);

create or replace function public.mis_solicitudes()
returns table (id uuid, folio text, estado public.estado_solicitud, objetivo text, ciudades text[], creado_en timestamptz)
language sql stable security definer set search_path = public as $$
  select s.id, s.folio, s.estado, s.objetivo, s.ciudades, s.creado_en
  from solicitudes s
  where public.mi_rol() = 'cliente' and s.empresa_id = public.mi_empresa()
  order by s.creado_en desc
  limit 50
$$;
revoke execute on function public.mis_solicitudes() from public, anon;
grant execute on function public.mis_solicitudes() to authenticated;
