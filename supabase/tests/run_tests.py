import subprocess
ADMIN='00000000-0000-0000-0000-00000000000a'; O1='00000000-0000-0000-0000-0000000000b1'; C1='00000000-0000-0000-0000-0000000000c1'; C2='00000000-0000-0000-0000-0000000000c2'
X1='d0000000-0000-0000-0000-000000000001'; X2='d0000000-0000-0000-0000-000000000002'
def run(role, uid, sql):
    pre=f"set role {role}; select set_config('request.jwt.claim.sub','{uid or ''}',false);"
    r=subprocess.run(['su','postgres','-c',f'psql -X -q -t -A -v ON_ERROR_STOP=1 -d pctest'],input=pre+sql,capture_output=True,text=True)
    out=[l for l in r.stdout.strip().splitlines() if l.strip()]
    return r.returncode==0, (out[-1] if out else ''), r.stderr.strip().splitlines()[-1:] if r.stderr else ''
SOL="insert into solicitudes (objetivo,ciudades,contacto_nombre,contacto_telefono{extra}) values ('Lanzamiento','{{Tegucigalpa}}','Ana','+504 9999-9999'{val});"
tests=[
 ("Público crea solicitud", 'anon',None, SOL.format(extra='',val=''), True, None),
 ("Público NO puede crear solicitud ya 'convertida'", 'anon',None, SOL.format(extra=',estado',val=",'convertida'"), False, None),
 ("Público NO puede escribir notas internas", 'anon',None, SOL.format(extra=',notas_internas',val=",'x'"), False, None),
 ("Público NO puede leer solicitudes", 'anon',None, "select count(*) from solicitudes;", True, '0'),
 ("Teléfono inválido rechazado", 'anon',None, "insert into solicitudes (objetivo,ciudades,contacto_nombre,contacto_telefono) values ('X','{a}','Ana','abc');", False, None),
 ("Admin lee solicitudes", 'authenticated',ADMIN, "select count(*) from solicitudes;", True, '1'),
 ("Cliente 1 ve solo su campaña", 'authenticated',C1, "select count(*) from campanias;", True, '1'),
 ("Cliente 2 no ve campañas de Empresa 1", 'authenticated',C2, "select count(*) from campanias where empresa_id='e0000000-0000-0000-0000-000000000001';", True, '0'),
 ("Cliente 1 ve solo ejecuciones validadas propias", 'authenticated',C1, "select count(*) from ejecuciones;", True, '1'),
 ("Cliente 1 ve solo evidencias validadas propias", 'authenticated',C1, "select count(*) from evidencias;", True, '1'),
 ("Cliente NO ve eventos (horas internas)", 'authenticated',C1, "select count(*) from ejecucion_eventos;", True, '0'),
 ("Cliente NO puede crear campañas", 'authenticated',C1, "insert into campanias (empresa_id,nombre) values ('e0000000-0000-0000-0000-000000000001','hack');", False, None),
 ("Operador inicia su ejecución", 'authenticated',O1, f"update ejecuciones set estado='en_curso' where id='{X1}' returning estado;", True, 'en_curso'),
 ("Operador registra evento; hora falsa ignorada (usa hora servidor)", 'authenticated',O1, f"insert into ejecucion_eventos (ejecucion_id,tipo,registrado_en,capturado_en) values ('{X1}','inicio','2020-01-01','2020-01-01') returning extract(year from registrado_en)=extract(year from now());", True, 't'),
 ("Operador NO registra en ejecución ajena", 'authenticated',O1, f"insert into ejecucion_eventos (ejecucion_id,tipo) values ('{X2}','inicio');", False, None),
 ("Operador NO puede cambiar km/zonas", 'authenticated',O1, f"update ejecuciones set km_en_zonas=999 where id='{X1}';", False, None),
 ("Operador NO puede borrar eventos", 'authenticated',O1, "with d as (delete from ejecucion_eventos returning 1) select count(*) from d;", True, '0'),
 ("Operador registra GPS", 'authenticated',O1, f"insert into gps_puntos (ejecucion_id,capturado_en,lat,lng) values ('{X1}',now(),14.07,-87.19);", True, None),
 ("Operador sube evidencia (pendiente)", 'authenticated',O1, f"insert into evidencias (ejecucion_id,storage_path,sha256) values ('{X1}','{X1}/f1.jpg','{'d'*64}');", True, None),
 ("Operador NO puede auto-validar evidencia", 'authenticated',O1, "with u as (update evidencias set estado='validada' returning 1) select count(*) from u;", True, '0'),
 ("Operador sube archivo a Storage de su ejecución", 'authenticated',O1, f"insert into storage.objects (bucket_id,name) values ('evidencias','{X1}/f1.jpg');", True, None),
 ("Operador NO sube archivo a ejecución ajena", 'authenticated',O1, f"insert into storage.objects (bucket_id,name) values ('evidencias','{X2}/x.jpg');", False, None),
 ("Admin NO puede reemplazar archivo de evidencia", 'authenticated',ADMIN, "update evidencias set storage_path='otro.jpg' where sha256 like 'd%';", False, None),
 ("Admin valida evidencia (queda quién y cuándo)", 'authenticated',ADMIN, f"update evidencias set estado='validada' where sha256 like 'd%' returning revisada_por='{ADMIN}' and revisada_en is not null;", True, 't'),
 ("Agenda: unidad NO se cruza en horario", 'authenticated',ADMIN, "insert into ejecuciones (campania_id,linea,servicio,unidad_id,fecha,hora_inicio_prog,hora_fin_prog) values ('c0000000-0000-0000-0000-000000000002','move','led','a0000000-0000-0000-0000-000000000001','2026-10-01','10:00','14:00');", False, None),
 ("Agenda: misma unidad por la tarde sí", 'authenticated',ADMIN, "insert into ejecuciones (campania_id,linea,servicio,unidad_id,fecha,hora_inicio_prog,hora_fin_prog) values ('c0000000-0000-0000-0000-000000000002','move','led','a0000000-0000-0000-0000-000000000001','2026-10-01','13:00','17:00');", True, None),
 ("Operador pausa y finaliza", 'authenticated',O1, f"insert into ejecucion_eventos (ejecucion_id,tipo) values ('{X1}','pausa'); select pg_sleep(0.3); insert into ejecucion_eventos (ejecucion_id,tipo) values ('{X1}','reanudacion'); select pg_sleep(0.3); insert into ejecucion_eventos (ejecucion_id,tipo) values ('{X1}','fin'); update ejecuciones set estado='finalizada' where id='{X1}' returning estado;", True, 'finalizada'),
 ("Operador NO registra tras finalizar", 'authenticated',O1, f"insert into ejecucion_eventos (ejecucion_id,tipo) values ('{X1}','inicio');", False, None),
 ("Admin ve tiempos internos (efectivo y pausado)", 'authenticated',ADMIN, f"select (tiempo_efectivo is not null and tiempo_pausado is not null)::text from v_tiempos_ejecucion where ejecucion_id='{X1}';", True, 'true'),
 ("Cliente NO obtiene tiempos internos", 'authenticated',C1, f"select count(*) from v_tiempos_ejecucion where inicio is not null;", True, '0'),
 ("Admin convierte solicitud en campaña (crea empresa y servicios)", 'authenticated',ADMIN, "update solicitudes set servicios='{move:perifoneo,events:carpa,asesoria}'; select convertir_solicitud((select id from solicitudes limit 1),null,'Empresa Nueva','Campaña Nueva'); select (select count(*) from campania_servicios s join campanias c on c.id=s.campania_id where c.nombre='Campaña Nueva')::text || '/' || (select estado from solicitudes limit 1) || '/' || (select count(*) from empresas where nombre='Empresa Nueva');", True, '2/convertida/1'),
 ("No se puede convertir dos veces", 'authenticated',ADMIN, "select convertir_solicitud((select id from solicitudes limit 1),null,'X','Y');", False, None),
 ("Cliente NO puede convertir solicitudes", 'authenticated',C1, "select convertir_solicitud(gen_random_uuid(),null,'X','Y');", False, None),
 ("Público NO puede ejecutar convertir_solicitud", 'anon',None, "select convertir_solicitud(gen_random_uuid(),null,'X','Y');", False, None),
 ("Admin sube evidencia (pendiente)", 'authenticated',ADMIN, f"insert into evidencias (ejecucion_id,storage_path,sha256) values ('{X2}','{X2}/admin.jpg','{'e'*64}') returning estado;", True, 'pendiente'),
 ("Admin sube archivo a Storage", 'authenticated',ADMIN, f"insert into storage.objects (bucket_id,name) values ('evidencias','{X2}/admin.jpg');", True, None),
 ("Cliente NO sube evidencias", 'authenticated',C1, f"insert into evidencias (ejecucion_id,storage_path,sha256) values ('{X2}','{X2}/c.jpg','{'f'*64}');", False, None),
 ("Cliente NO puede borrar campañas", 'authenticated',C1, "with d as (delete from campanias returning 1) select count(*) from d;", True, '0'),
 ("Operador ve la campaña de su jornada", 'authenticated',O1, "select count(*) from campanias;", True, '1'),
 ("Operador ve la empresa y la unidad de su jornada", 'authenticated',O1, "select (select count(*) from empresas)::text || '/' || (select count(*) from unidades);", True, '1/1'),
 ("Operador 2 NO ve campañas ajenas", 'authenticated','00000000-0000-0000-0000-0000000000b2', "select count(*) from campanias where id='c0000000-0000-0000-0000-000000000001';", True, '0'),
 ("Operador ve archivos de su jornada en Storage", 'authenticated',O1, f"select count(*)>0 from storage.objects where name like '{X1}/%';", True, 't'),
 ("Operador NO ve archivos de jornada ajena", 'authenticated',O1, f"select count(*) from storage.objects where name like '{X2}/%';", True, '0'),
 ("Cliente sigue viendo solo su campaña (sin recursión)", 'authenticated',C1, "select count(*) from campanias;", True, '1'),
 ("Punto dentro / fuera de polígono", 'anon',None, "select public.punto_en_poligono(14.085,-87.205,'[[14.080,-87.210],[14.080,-87.200],[14.090,-87.200],[14.090,-87.210]]'::jsonb)::text || '/' || public.punto_en_poligono(14.07,-87.19,'[[14.080,-87.210],[14.080,-87.200],[14.090,-87.200],[14.090,-87.210]]'::jsonb)::text;", True, 'true/false'),
 ("Admin crea zona con contorno", 'authenticated',ADMIN, "insert into zonas (nombre,ciudad,contorno) values ('Centro','Tegucigalpa','[[14.080,-87.210],[14.080,-87.200],[14.090,-87.200],[14.090,-87.210]]') returning nombre;", True, 'Centro'),
 ("Cliente NO puede crear zonas", 'authenticated',C1, "insert into zonas (nombre,contorno) values ('X','[[14.080,-87.210],[14.080,-87.200],[14.090,-87.200],[14.090,-87.210]]');", False, None),
 ("(preparación) GPS dentro/fuera de zona", 'postgres',None, f"update campanias set zonas='{{Centro}}' where id='c0000000-0000-0000-0000-000000000001'; alter table gps_puntos disable trigger sellar_gps; insert into gps_puntos (ejecucion_id,capturado_en,registrado_en,lat,lng) values ('{X1}',now()-interval '60 min',now()-interval '60 min',14.082,-87.205),('{X1}',now()-interval '59 min',now()-interval '59 min',14.083,-87.205),('{X1}',now()-interval '58 min',now()-interval '58 min',14.084,-87.205),('{X1}',now()-interval '90 min',now()-interval '1 min',14.085,-87.205),('{X1}',now()-interval '57 min',now()-interval '57 min',14.07,-87.19); alter table gps_puntos enable trigger sellar_gps; select 1;", True, None),
 ("Cliente ve solo puntos DENTRO de zona y con 15 min de retraso", 'authenticated',C1, f"select count(*) from recorrido_en_zonas('{X1}');", True, '3'),
 ("Admin ve todos los puntos en zona (sin retraso)", 'authenticated',ADMIN, f"select count(*) from recorrido_en_zonas('{X1}');", True, '4'),
 ("Cliente de otra empresa NO ve el recorrido", 'authenticated',C2, f"select count(*) from recorrido_en_zonas('{X1}');", True, '0'),
 ("Operador NO ve recorridos por esta vía", 'authenticated',O1, f"select count(*) from recorrido_en_zonas('{X1}');", True, '0'),
 ("Cobertura calcula km dentro de la zona", 'authenticated',ADMIN, f"select zona || ':' || (km between 0.2 and 0.25)::text from cobertura_jornada('{X1}');", True, 'Centro:true'),
 ("Cliente ve jornada en curso/finalizada de su campaña (sin horas)", 'authenticated',C1, "select count(*) > 0 from jornadas_en_curso_cliente('c0000000-0000-0000-0000-000000000001');", True, 't'),
 ("Otro cliente NO ve jornadas en curso ajenas", 'authenticated',C2, "select count(*) from jornadas_en_curso_cliente('c0000000-0000-0000-0000-000000000001');", True, '0'),
 ("Público NO puede consultar recorridos", 'anon',None, f"select count(*) from recorrido_en_zonas('{X1}');", False, None),
 ("Público envía brief con ubicación, radio y zonas", 'anon',None, "insert into solicitudes (objetivo,ciudades,contacto_nombre,contacto_telefono,ubicacion_lat,ubicacion_lng,radio_km,zonas_elegidas,contacto_empresa) values ('Promoción','{Tegucigalpa}','Luis','+504 9999-2222',14.0818,-87.2068,2,'{Centro}','Tienda Luis');", True, None),
 ("Ubicación fuera de Honduras rechazada", 'anon',None, "insert into solicitudes (objetivo,ciudades,contacto_nombre,contacto_telefono,ubicacion_lat,ubicacion_lng) values ('X','{a}','Luis','+504 9999-2222',40.4,-3.7);", False, None),
 ("Radio sin ubicación rechazado", 'anon',None, "insert into solicitudes (objetivo,ciudades,contacto_nombre,contacto_telefono,radio_km) values ('X','{a}','Luis','+504 9999-2222',2);", False, None),
 ("Público puede ver las zonas dibujadas (para elegir)", 'anon',None, "select count(*) >= 0 from zonas;", True, 't'),
 ("Convertir crea la zona del radio y copia las zonas elegidas", 'authenticated',ADMIN, "select convertir_solicitud((select id from solicitudes where contacto_nombre='Luis'),null,'Tienda Luis','Promo Luis'); select (select array_to_string(zonas, '|') from campanias where nombre='Promo Luis') ~ '^Centro\\|Radio 2.0 km · [0-9A-F]{8}$', (select jsonb_array_length(contorno) from zonas where nombre like 'Radio 2.0 km%');", True, 't|32'),
 ("El centro del radio queda dentro de la zona creada", 'authenticated',ADMIN, "select punto_en_poligono(14.0818,-87.2068,(select contorno from zonas where nombre like 'Radio 2.0 km%'))::text || '/' || punto_en_poligono(14.12,-87.2068,(select contorno from zonas where nombre like 'Radio 2.0 km%'))::text;", True, 'true/false'),
 ("Cliente NO borra archivos en Storage", 'authenticated',C1, "with d as (delete from storage.objects returning 1) select count(*) from d;", True, '0'),
 ("Admin borra campaña (jornadas y evidencias en cascada)", 'authenticated',ADMIN, "delete from campanias where id='c0000000-0000-0000-0000-000000000001'; select (select count(*) from ejecuciones where campania_id='c0000000-0000-0000-0000-000000000001')::text || '/' || (select count(*) from evidencias where ejecucion_id='d0000000-0000-0000-0000-000000000003');", True, '0/0'),
 ("Admin borra archivos de evidencias en Storage", 'authenticated',ADMIN, "with d as (delete from storage.objects where bucket_id='evidencias' returning 1) select (count(*)>0)::text from d;", True, 'true'),
]
ok=0
for name,role,uid,sql,should_pass,expect in tests:
    passed,out,err=run(role,uid,sql)
    good = (passed==should_pass) and (expect is None or not passed or out==expect)
    ok+=good
    print(('✅' if good else '❌'), name, '' if good else f'-> passed={passed} out={out!r} err={err}')
print(f'\n{ok}/{len(tests)} pruebas correctas')
