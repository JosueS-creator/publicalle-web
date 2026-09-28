# Pruebas de seguridad (RLS) — sin tocar producción

Prueban la migración en un PostgreSQL local con una simulación mínima de Supabase
(`auth.uid()`, roles `anon`/`authenticated`, `storage.objects`).

```bash
sh reset_local.sh      # recrea la base local "pctest" con todas las migraciones + seed.sql
python3 run_tests.py   # 37 pruebas: público, cliente, operador, admin, storage, agenda, conversión de solicitudes
```
