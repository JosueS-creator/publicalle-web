# Plataforma Publicalle — Modelo operativo (v0.1)

Fecha: 28/09/2026 · Estado: base aprobada para construir. **Precios: fuera de alcance por ahora.**

## 1. Alcance de esta fase

| Pieza | En esta fase | Después |
|---|---|---|
| Web pública | **Brief de campaña**: recopila la necesidad del cliente (objetivo, territorio, servicios, fechas, contacto). Sin precios. | Estimación automática (Pricing Engine) |
| Base de datos | Esquema completo con reglas de acceso (RLS) | — |
| Admin | Solicitudes, clientes, campañas, jornadas, unidades, usuarios, validación y evidencias (`/admin`) | Reportes, precios |
| App del operador | Web en el celular (`/operador`): registros con ubicación, GPS con pantalla encendida, fotos, incidencias | App nativa (Expo) con GPS en segundo plano |
| Portal del cliente | Campañas, jornadas validadas, zonas y km en zonas, evidencias validadas (`/portal`) | Reportes descargables, mapa del recorrido |

Orden de construcción: **modelo → base de datos → brief → admin + portal → app del operador → estimación de precios.**

El admin también puede marcar el estado de una jornada y subir evidencias (p. ej. fotos recibidas por WhatsApp) si el operador no pudo registrarlas.

## 2. Roles

| Rol | Qué hace | Qué ve |
|---|---|---|
| `super_admin` | Todo, incluida la gestión de administradores | Todo |
| `admin` | Solicitudes, clientes, campañas, unidades, operadores, asignación, validación | Todo, incluida la telemetría interna |
| `operador` | Ejecuta las tareas asignadas y registra evidencia | Solo sus ejecuciones |
| `cliente` | Envía solicitudes, consulta sus campañas | Solo su empresa, y solo ejecuciones **validadas** |

El cliente es una **empresa** con uno o varios usuarios. Todas las reglas de acceso se aplican por empresa.

## 3. Modelo de evidencia por línea

El GPS continuo solo tiene sentido en MOVE. Cada línea tiene su propio registro mínimo para considerar una ejecución completa.

| Línea | Registro obligatorio | Evidencia mínima | Métrica para el cliente |
|---|---|---|---|
| **MOVE** (perifoneo, LED, audio móvil, volanteo) | `inicio` → (`pausa`/`reanudacion`)* → `fin` + recorrido GPS | 2 fotos del vehículo en zona | Zonas cubiertas (x de y), km **dentro de las zonas** (sin contar pausas) |
| **EVENTS** (carpa, audio, animación, promotores) | `llegada` → `salida` en el punto asignado | Foto del montaje + foto de la actividad | Jornadas realizadas, evidencias |
| **PLACE** (espacios, comercios aliados, pantallas fijas) | `instalacion` y `verificacion` periódica | Foto de la instalación + foto por verificación | Ubicaciones activas, verificaciones |

`*` = puede repetirse. Una ejecución sin el registro obligatorio queda **incompleta** y no pasa a validación.

## 4. Confiabilidad de la evidencia

- **La hora oficial es la del servidor.** La base de datos sella cada evento, punto GPS y evidencia con su propia hora (`registrado_en`) aunque el teléfono envíe otra. La hora del teléfono se guarda aparte (`capturado_en`) solo para auditoría y para registros que llegan tarde por falta de conexión.
- **Sin edición.** Operadores y clientes no pueden modificar ni borrar eventos, puntos GPS ni evidencias. Solo un admin puede marcar una evidencia como válida o rechazada, y queda registrado quién lo hizo.
- **Integridad de fotos.** Cada archivo guarda su huella (`sha256`) para detectar si se reemplaza.
- **Sin conexión.** La app del operador guardará en el teléfono y sincronizará al volver la señal.

## 5. Horas: internas, no para el cliente

| Dato | Admin (interno) | Cliente |
|---|---|---|
| Hora de inicio, pausas, fin | ✅ | ❌ |
| Tiempo efectivo / detenido | ✅ | ❌ |
| Recorrido GPS completo | ✅ | ❌ — solo el recorrido **dentro de sus zonas** (filtrado en el servidor) |
| Avance durante la jornada | ✅ en vivo | ✅ con **15 min de retraso** (hora del servidor), solo dentro de zonas |
| Km totales | ✅ | ❌ |
| Km dentro de zonas contratadas | ✅ (calculado con GPS; el admin lo confirma al validar) | ✅ |
| Zonas cubiertas | ✅ | ✅ |
| Ejecuciones completadas | ✅ | ✅ |
| Evidencias | ✅ todas | ✅ solo validadas |

Las horas **se almacenan siempre**, aunque hoy no se muestren al cliente. Cuando una campaña se venda por horas, se podrá mostrar "horas contratadas vs. ejecutadas" sin cambiar la base de datos.

**No se almacena la velocidad** del vehículo: no se usa para ninguna decisión y crea un riesgo legal en caso de accidente.

## 6. Estados

**Solicitud** (lo que entra por la web):
`nueva → en_revision → convertida` (pasó a campaña) · o `descartada`

**Campaña:**
`borrador → cotizacion_enviada → aprobada → programada → en_ejecucion → finalizada → reportada` · o `cancelada`

**Ejecución** (una jornada de una unidad u operador):
`programada → en_curso ⇄ pausada → finalizada → validada` · o `rechazada` / `incompleta`

## 7. Entidades

```
empresas ─┬─ perfiles (usuarios: cliente)
          └─ campanias ─┬─ campania_servicios
solicitudes ────────────┘   └─ ejecuciones ─┬─ ejecucion_eventos
                                             ├─ gps_puntos (solo MOVE)
unidades ── (asignadas a ejecuciones)        ├─ evidencias
perfiles (operador) ── (asignados)           └─ incidencias
```

## 8. Decisiones técnicas

- **Supabase** como única fuente de verdad (Postgres + Auth + Storage).
- **App web** (React + Vite): web pública con el brief, portal del cliente y admin, separados por rol.
- **App del operador** nativa con Expo: el GPS en segundo plano no funciona de forma confiable en el navegador.
- **Videos:** máximo 30 s, comprimidos en el teléfono antes de subir, para controlar el costo de almacenamiento y descarga.

## 9. Pendiente de decidir

- **Tarifas y reglas de precio**, validadas con 5–10 cotizaciones reales, antes de construir el Pricing Engine.
- **Frecuencia de verificación en PLACE:** semanal, quincenal o por contrato.
- **Evidencias mínimas por jornada:** hoy son 2 fotos; confirmar con operación.
- **Cuenta de Supabase** donde vivirá el proyecto: el plan gratuito permite 2 proyectos activos por cuenta.


## Reglas operativas de cobertura

- Los km en zona no cuentan los tramos recorridos durante una pausa.
- Las zonas contratadas no deben encimarse: un punto solo se asigna a una zona.
- Contacto público vigente: +504 8740-1299 · ventaspublicalle@gmail.com · Facebook «Publicalle Honduras».
