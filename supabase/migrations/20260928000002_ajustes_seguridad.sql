-- Ajustes del linter de seguridad de Supabase
-- 1) search_path fijo en funciones de trigger
alter function public.sellar_hora_servidor() set search_path = '';
alter function public.tocar_actualizado() set search_path = '';
alter function public.proteger_evidencia() set search_path = '';
alter function public.limitar_cambios_operador() set search_path = '';

-- 2) Funciones auxiliares de RLS: no ejecutables por visitantes sin sesión (anon)
--    (authenticated sí las necesita: las usan las políticas y solo devuelven datos del propio usuario)
revoke execute on function public.mi_rol() from public, anon;
revoke execute on function public.mi_empresa() from public, anon;
revoke execute on function public.es_staff() from public, anon;
revoke execute on function public.ejecucion_activa_mia(uuid) from public, anon;
grant execute on function public.mi_rol(), public.mi_empresa(), public.es_staff(), public.ejecucion_activa_mia(uuid) to authenticated;
