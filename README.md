# PUBLICALLE 2.0 — Sitio web

Publicidad territorial medible. React + TypeScript + Vite + Tailwind CSS v4 + Motion.

**Ecosistema:** PUBLICALLE (marca madre) → **MOVE** (publicidad en movimiento) · **EVENTS** (activaciones) · **PLACE** (ubicaciones físicas) · **DATA** (cobertura y evidencia).

**Orden de la home:** Hero → Cobertura en toda Honduras → Servicios → Move → Events → Place → Campañas combinadas → Data → Cómo funciona → Cobertura → CTA final (con formulario).

```bash
npm install
npm run dev        # desarrollo  → http://localhost:5173
npm run build      # producción  → /dist  (TypeScript sin errores)
npm run preview    # probar el build
npm run build:single  # un solo HTML autocontenido (vista previa/demo) → /dist-single
```

---

## Identidad

- **Logo aprobado** (P + UBLICALLE + HN.) reconstruido en **vector** en `src/components/brand/`.
  Por decisión del documento maestro (sección 7) el camión del logo original se **reemplazó por la silueta real
  del vehículo** (Nissan Versa con pantalla LED y parlante), trazada del video `VID-20250618-WA0029.mp4`.
  El archivo original aprobado está en `brand-source/publicalle-logo-aprobado.png`.
- Componentes: `<PublicalleLogo />` (logo completo) y `<PublicalleMark />` (solo la P).
  - `theme="dark" | "light"`, `mono`, `withVehicle={false}` (P sola), `compact` (tamaños pequeños), `animate` (animación de entrada, respeta *reduced motion*).
- Archivos listos para usar fuera de la web: `public/brand/` (logo dark/light/mono, mark dark/light/mono), `public/favicon.svg`, `apple-touch-icon.png`, `icon-512.png`, `og-image.jpg`.
- Colores (tokens únicos): `src/styles/index.css` → `--publicalle-blue`, `--publicalle-blue-dark`, `--publicalle-blue-electric`, `--publicalle-green`, `--publicalle-white`, `--publicalle-graphite`, `--publicalle-background`. Extraídos del logo aprobado.
- Tipografía: Archivo (variable, ancho expandido para titulares) + JetBrains Mono (datos). Auto-hospedadas, sin Google Fonts.

## ⚠️ Antes de publicar

| Qué | Dónde |
|---|---|
| Número de WhatsApp, teléfono, email, redes | `src/config/contact.ts` (o variable `VITE_WHATSAPP_NUMBER`) |
| Dominio real (canonical / Open Graph) | `index.html` y `src/config/site.ts` |
| Panel "Publicalle Data" (cifras **demostrativas**, marcadas como tal) | `src/data/site.ts` → `demoCampaign` |
| Ejemplo de campaña combinada (2 vehículos, 4 activaciones, 8 ubicaciones) | `src/data/site.ts` → `combined` |
| Zonas del mapa de cobertura (Centro, Comayagüela, Kennedy, Miraflores, El Carrizal) | `src/data/coverage.ts` |
| Ciudades del mapa de Honduras (con la P de Publicalle) | `src/data/honduras.ts` → `HN_CITIES` (contorno real: Natural Earth, dominio público) |
| Casos reales de campañas (componentes listos, aún no en la home) | `src/data/campaigns.ts` + `CampaignGrid` |

## Agregar fotos reales

Inventario completo y criterios en `docs/photo-inventory.md`. Originales en `brand-source/fotos-originales/`, versiones web en `src/assets/media/`.

**Events (carpas, audio, animación, promotores).** Hoy cada bloque muestra una escena ilustrada. Para usar fotos:

1. Copia la foto a `src/assets/images/events/` (ideal `.webp`, ~1400 px, horizontal 16:10).
2. En `src/data/site.ts` → `eventBlocks`, impórtala y asígnala:

```ts
import carpaImg from "@/assets/images/events/carpa.webp";
// ...
{ id: "carpas", ..., image: carpaImg, imageAlt: "Carpa Publicalle con branding en activación" }
```

La tarjeta cambia a la foto con overlay azul/teal automáticamente.

**Líneas y textos.** Las 4 líneas (nombre, descripción, lo que incluyen) están en `src/data/services.ts`.
Todos los textos de secciones están en `src/data/site.ts`.

## Estructura

```
src/
├── assets/        brand · vehicles (fotos + silueta trazada) · media (video) · evidence (fotos de ejemplo) · images (tus fotos)
├── components/    brand · navigation · layout · coverage (CoverageMap, RouteAnimation, CoveragePoint)
│                  vehicle (VehicleShowcase, VehiclePhoto, LedScreen) · services (LineCard) · events (EventCard, EventScene)
│                  campaigns (CampaignFlow, CampaignCard) · data (CampaignDashboard) · process · contact · ui (LineHeading, CountUp…)
├── sections/      Hero · Services · Move · Events · Place · CombinedCampaigns · Data · HowItWorks · Coverage · FinalCta
├── config/        brand · contact · navigation · site      ← valores centralizados
├── data/          site · services · campaigns · coverage   ← textos y datos (sin tocar componentes)
├── lib/           contact (submitContactForm) · whatsapp · geometry · motion · cn
├── hooks/         useScrolled · useActiveSection · useSpotlight
└── types/
```

## Formulario de contacto

`submitContactForm(data)` en `src/lib/contact.ts` está desacoplado del proveedor.
Hoy usa `whatsappSubmitter`: arma la solicitud y abre WhatsApp con el mensaje listo (ningún prospecto se pierde sin backend).
Para Supabase / Formspree / CRM: crea otro `ContactSubmitter` y asígnalo a `activeSubmitter`. Hay un ejemplo comentado.

## Mapa de cobertura

`<CoverageMap data=... />` recibe zonas, rutas y puntos desde `src/data/coverage.ts` (sistema 1000×620).
Es un **mapa ilustrativo** (no cartografía real). El día que exista GPS (Publicalle Move) solo cambian los datos.

## Deploy en Vercel (sin git en la computadora)

1. En GitHub: **New repository** → *Add file → Upload files* → arrastra **el contenido** de esta carpeta
   (sin `node_modules`, `dist`, `dist-single`).
2. En Vercel: **Add New → Project** → importa el repositorio. Framework: *Vite* (detectado automáticamente).
   Build: `npm run build` · Output: `dist`.
3. (Opcional) En Vercel → Settings → Environment Variables: `VITE_WHATSAPP_NUMBER`, `VITE_SITE_URL`.

## Rendimiento y accesibilidad

- Code splitting: todo lo que está debajo del hero se carga en un chunk aparte; Motion se carga con `LazyMotion`.
- JS inicial ≈ 116 KB gzip. Imágenes `.webp`; el video no se descarga hasta que el usuario pulsa *play*.
- Las animaciones del mapa se pausan fuera de pantalla y respetan `prefers-reduced-motion`.
- Auditoría axe (WCAG 2 A/AA + buenas prácticas): 0 incidencias. HTML semántico, foco visible, labels y `aria-*`.

## Plataforma (fase 1)

Modelo operativo, roles, evidencia por línea y qué ve cada rol: `docs/plataforma/modelo-operativo.md`.

- **Brief de campaña** (sección final de la web): 5 pasos (objetivo, territorio, servicios, fechas, contacto). **Sin precios.**
  Con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` guarda en la tabla `solicitudes` y muestra un número de solicitud;
  sin ellas, prepara el mensaje de WhatsApp. Incluye campo trampa anti-spam.
  En «Territorio» el cliente puede (opcional) ubicar su negocio en el mapa y elegir un radio (1–5 km) y/o zonas dibujadas; al convertir la solicitud, el radio se crea como zona real.
- **Admin y portal** (`src/platform/`, se cargan aparte de la web pública):
  - `/entrar` — acceso con correo y contraseña (los usuarios los crea el admin; no hay registro público).
  - `/admin` — solicitudes (convertir en campaña), clientes, campañas (servicios, zonas, jornadas), jornadas (validación y evidencias), unidades, usuarios.
  - `/operador` — el operador (su usuario lo crea un administrador en Admin → Usuarios y operadores → Nuevo operador) ve sus jornadas; registra inicio/pausa/fin (MOVE, con GPS mientras la pantalla está abierta), llegada/salida (EVENTS) o instalación/verificación (PLACE), sube fotos (se comprimen en el teléfono) y reporta problemas. Mínimo de fotos para finalizar: MOVE 2, EVENTS 2, PLACE 1.
  - **Zonas** (`/admin/zonas`): contornos dibujados en el mapa. El recorrido y los km que ve el cliente se filtran en el servidor SOLO dentro de estas zonas; durante la jornada, con 15 min de retraso.
    - Reglas de km: solo cuentan tramos dentro de la misma zona, con ≤ 5 min y < 2 km entre puntos; **los tramos durante una pausa no cuentan**. Un punto GPS repetido se ignora (el envío es idempotente).
    - **No dibujes zonas que se encimen**: si un punto cae en dos zonas, se asigna solo a una.
  - `/portal` — el cliente ve sus campañas, jornadas **validadas**, zonas cubiertas, km en zonas y evidencias validadas. Nunca ve horas internas.
- **Base de datos:** `supabase/migrations/` (en orden). **Edge Function** `supabase/functions/admin-usuarios` (crea usuarios y cambia contraseñas con la llave secreta, solo del lado servidor).
- **Pruebas de seguridad:** `supabase/tests/` (37 pruebas; `sh reset_local.sh && python3 run_tests.py`).

### Supabase
- Proyecto `publicalle` (región East US). Las migraciones y la Edge Function ya están aplicadas.
- Vercel → Environment Variables: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (solo la llave **anon**).
- Authentication → desactivar "Allow new users to sign up" (los usuarios se crean desde `/admin/usuarios`).

## PubliEscuela (`/publi-escuela`)

Servicio de **Publicalle MOVE** dentro del mismo sitio (mismo header, footer, tokens, mapa y tabla `solicitudes`):
recorridos de **2 h/día** por los barrios y colonias alrededor de las escuelas que elige el cliente.

- Página: `src/pages/PubliEscuela.tsx` (carga aparte, no pesa en la portada). Configurador: `src/components/publiescuela/Configurador.tsx`.
- Datos y reglas (duraciones 7/14/21/30 días, radios, volanteo L5,000): `src/lib/publiescuela.ts`.
- **Agenda** (Admin → Agenda): horarios de 2 h con **cupos**, días de la semana y **días sin servicio**.
  El cliente ve la disponibilidad real y el **servidor** vuelve a validar el cupo al guardar (no se puede saltar).
  Una solicitud aparta su cupo mientras está nueva / en revisión / convertida; descartarla lo libera.
  Los vehículos programados en Jornadas en ese horario también ocupan cupo.
- Al convertir la solicitud en campaña se crea **una zona por escuela** (para medir el recorrido en cada una).
- El recorrido no tiene precio publicado: el resumen muestra «Solicitar cotización» (más el volanteo si se elige).
