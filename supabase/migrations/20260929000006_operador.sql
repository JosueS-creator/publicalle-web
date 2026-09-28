-- ============================================================================
-- Portal del operador: ve SOLO lo necesario de SUS jornadas (campaña, cliente, unidad, sus fotos).
-- Funciones security definer para no crear recursión entre políticas (campanias <-> ejecuciones).
-- ============================================================================

create or replace function public.ejecucion_mia(eid text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.ejecuciones where id::text = eid and operador_id = auth.uid())
$$;

create or replace function public.operador_en_campania(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.ejecuciones where campania_id = cid and operador_id = auth.uid())
$$;

create or replace function public.operador_en_empresa(eid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.ejecuciones e join public.campanias c on c.id = e.campania_id
                 where c.empresa_id = eid and e.operador_id = auth.uid())
$$;

create or replace function public.operador_usa_unidad(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.ejecuciones where unidad_id = uid and operador_id = auth.uid())
$$;

revoke execute on function public.ejecucion_mia(text), public.operador_en_campania(uuid),
  public.operador_en_empresa(uuid), public.operador_usa_unidad(uuid) from public, anon;
grant execute on function public.ejecucion_mia(text), public.operador_en_campania(uuid),
  public.operador_en_empresa(uuid), public.operador_usa_unidad(uuid) to authenticated;

create policy operador_ve_campanias on public.campanias for select to authenticated
  using (public.operador_en_campania(id));
create policy operador_ve_empresa on public.empresas for select to authenticated
  using (public.operador_en_empresa(id));
create policy operador_ve_unidades on public.unidades for select to authenticated
  using (public.operador_usa_unidad(id));

-- El operador puede ver (miniaturas) los archivos de sus propias jornadas
create policy evidencias_operador_lee on storage.objects for select to authenticated
  using (bucket_id = 'evidencias' and public.ejecucion_mia((storage.foldername(name))[1]));
