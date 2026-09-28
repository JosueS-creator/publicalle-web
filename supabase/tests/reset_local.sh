#!/bin/sh
# Recrea la base local pctest con todas las migraciones y la semilla (uso: sh reset_local.sh)
set -e
pg_ctlcluster 16 main start 2>/dev/null || true
rm -rf /tmp/sbt; cp -r "$(dirname "$0")/.." /tmp/sbt; chmod -R a+r /tmp/sbt; cd /tmp/sbt/tests
su postgres -c "dropdb --if-exists -f pctest && createdb pctest && psql -X -q -d pctest -c 'alter database pctest set search_path = public, extensions'"
files="-f stubs.sql"
for m in ../migrations/*.sql; do files="$files -f $m"; [ "$(basename $m)" = "20260928000001_plataforma_base.sql" ] && files="$files -f grants.sql"; done
su postgres -c "psql -X -q -v ON_ERROR_STOP=1 -d pctest $files -f seed.sql"
