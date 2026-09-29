-- ============================================================================
-- Hallazgos de la validación E2E (28/09/2026)
-- H1: un mismo punto GPS no puede guardarse dos veces (reintentos con mala señal / doble envío).
-- Regla: los km recorridos DURANTE una pausa no cuentan como km en zona.
-- ============================================================================

-- H1: quitar duplicados existentes (si los hubiera) y exigir unicidad por jornada + hora de captura
delete from public.gps_puntos a
using public.gps_puntos b
where a.ejecucion_id = b.ejecucion_id and a.capturado_en = b.capturado_en and a.id > b.id;

create unique index if not exists gps_puntos_unico on public.gps_puntos (ejecucion_id, capturado_en);

-- Regla de pausa: un tramo entre dos puntos no suma si entre ellos hubo un evento de pausa
create or replace function public.cobertura_jornada(p_ejecucion uuid)
returns table (zona text, km numeric, puntos int, ultima timestamptz)
language sql stable security definer set search_path = public as $$
  with p as (select * from public.recorrido_en_zonas(p_ejecucion)),
  pausas as (
    select coalesce(capturado_en, registrado_en) as t
    from ejecucion_eventos where ejecucion_id = p_ejecucion and tipo = 'pausa'
  ),
  s as (
    select zona, capturado_en, lat, lng,
           lag(lat) over w as plat, lag(lng) over w as plng, lag(capturado_en) over w as pt, lag(zona) over w as pz
    from p window w as (order by capturado_en)
  )
  select zona,
         round((sum(case when pz = zona and capturado_en - pt <= interval '5 minutes'
                          and public.metros(plat, plng, lat, lng) < 2000
                          and not exists (select 1 from pausas where pausas.t > s.pt and pausas.t <= s.capturado_en)
                         then public.metros(plat, plng, lat, lng) else 0 end) / 1000)::numeric, 2),
         count(*)::int, max(capturado_en)
  from s group by zona order by zona
$$;

-- Para insertar "ignorando duplicados" (ON CONFLICT con índice explícito, como hace supabase-js),
-- Postgres exige que quien inserta pueda LEER la fila: el operador ve solo los puntos de sus jornadas.
create policy operador_ve_gps on public.gps_puntos for select to authenticated
  using (public.ejecucion_mia(ejecucion_id::text));
