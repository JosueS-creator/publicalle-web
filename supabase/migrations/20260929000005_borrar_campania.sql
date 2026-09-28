-- El staff puede borrar archivos de evidencia (necesario al eliminar una campaña; Storage no borra en cascada)
create policy evidencias_staff_borra on storage.objects for delete to authenticated
  using (bucket_id = 'evidencias' and public.es_staff());
