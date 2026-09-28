-- El límite de cambios aplica SOLO a operadores. Antes bloqueaba también al SQL Editor / service_role.
create or replace function public.limitar_cambios_operador() returns trigger
language plpgsql set search_path = '' as $$
begin
  if coalesce(public.mi_rol()::text, '') <> 'operador' then return new; end if;
  if (new.campania_id, new.operador_id, new.unidad_id, new.fecha, new.zonas, new.zonas_cubiertas,
      new.km_en_zonas, new.validada_por, new.validada_en)
     is distinct from
     (old.campania_id, old.operador_id, old.unidad_id, old.fecha, old.zonas, old.zonas_cubiertas,
      old.km_en_zonas, old.validada_por, old.validada_en) then
    raise exception 'El operador solo puede cambiar el estado de la ejecución.';
  end if;
  return new;
end $$;
