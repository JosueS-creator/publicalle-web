import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowRight, MessageCircle, Save } from "lucide-react";
import { sb } from "../supabase";
import { estadoSolicitud, fecha, fechaHora, hora, servicioIdLabel } from "../labels";
import type { Enum } from "../database.types";
import { Mapa } from "../MapaLazy";
import { Btn, Card, Dl, ErrorBox, Estado, Field, Input, Loading, OkBox, Page, Select, Textarea, must, useAction, useAsync } from "../ui";

export default function SolicitudDetalle() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const { data, error, loading, reload } = useAsync(async () => {
    const [s, empresas] = await Promise.all([
      sb.from("solicitudes").select("*, agenda_franjas(nombre, hora_inicio, hora_fin)").eq("id", id).single(),
      sb.from("empresas").select("id, nombre").order("nombre"),
    ]);
    const sol = must(s);
    const zonasMapa = sol.zonas_elegidas.length ? must(await sb.from("zonas").select("nombre, contorno").in("nombre", sol.zonas_elegidas)) : [];
    return { s: sol, empresas: must(empresas), zonasMapa };
  }, [id]);

  const [estado, setEstado] = useState<Enum<"estado_solicitud">>("nueva");
  const [notas, setNotas] = useState("");
  const [empresaId, setEmpresaId] = useState("");
  const [empresaNombre, setEmpresaNombre] = useState("");
  const [nombreCamp, setNombreCamp] = useState("");
  const guardar = useAction();
  const convertir = useAction();

  useEffect(() => {
    if (!data) return;
    setEstado(data.s.estado);
    setNotas(data.s.notas_internas ?? "");
    setEmpresaNombre(data.s.contacto_empresa || data.s.contacto_nombre);
    if (data.s.empresa_id) setEmpresaId(data.s.empresa_id); // cliente existente (pedido desde su portal)
    setNombreCamp(`${data.s.objetivo} · ${data.s.contacto_empresa || data.s.contacto_nombre}`.slice(0, 120));
  }, [data]);

  if (loading) return <Page title="Solicitud" back="/admin"><Loading /></Page>;
  if (!data) return <Page title="Solicitud" back="/admin"><ErrorBox msg={error} /></Page>;
  const s = data.s;
  const wa = `https://wa.me/${s.contacto_telefono.replace(/\D/g, "").replace(/^(?=\d{8}$)/, "504")}`;

  return (
    <Page
      title={`Solicitud ${s.folio}`}
      back="/admin"
      subtitle={<>Recibida {fechaHora(s.creado_en)} · <Estado map={estadoSolicitud} value={s.estado} /></>}
      actions={
        <a href={wa} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-white/[0.06] px-4 text-sm font-semibold ring-1 ring-inset ring-white/20 hover:bg-white/[0.11]">
          <MessageCircle className="size-4" aria-hidden /> Escribir por WhatsApp
        </a>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid content-start gap-6">
          <Card title="Necesidad">
            <Dl
              items={[
                ["Objetivo", s.objetivo],
                ["Ciudades", s.ciudades.join(", ")],
                ["Zonas o puntos", s.zonas],
                ["Servicios", s.servicios.map(servicioIdLabel).join(", ")],
                ["Fechas", s.fechas_flexibles ? "Flexibles" : [fecha(s.fecha_inicio), s.fecha_fin ? fecha(s.fecha_fin) : ""].filter(Boolean).join(" → ")],
                ["Horario", s.horario],
                ["Presupuesto", s.presupuesto],
                ["Comentarios", s.comentarios],
              ]}
            />
          </Card>
          {s.escuelas?.length ? (
            <Card title="PubliEscuela · escuelas y horario">
              <div className="grid gap-3">
                <Mapa
                  alto={320}
                  etiqueta="Escuelas elegidas y área alrededor"
                  puntos={s.escuelas.map((e) => ({ lat: e.lat, lng: e.lng, label: e.nombre }))}
                  circulos={s.escuelas.map((e) => ({ lat: e.lat, lng: e.lng, km: Number(e.radio_km), label: `${e.nombre} · ${e.radio_km} km` }))}
                />
                <Dl
                  items={[
                    ["Escuelas", s.escuelas.map((e) => `${e.nombre} (${e.radio_km} km alrededor)`).join(" · ")],
                    ["Horario", s.agenda_franjas ? `${s.agenda_franjas.nombre} · ${hora(s.agenda_franjas.hora_inicio)}–${hora(s.agenda_franjas.hora_fin)}` : s.horario],
                    ["Días de recorrido", s.dias_recorrido ? `${s.dias_recorrido} días · 2 h/día` : ""],
                    ["Fechas apartadas", s.fechas_reserva.length ? s.fechas_reserva.map((d) => fecha(d)).join(", ") : ""],
                    ["Volanteo", s.servicios.includes("move:volanteo") ? "Sí" : "No"],
                  ]}
                />
                <p className="text-xs text-muted">El horario queda apartado en la Agenda mientras la solicitud esté nueva, en revisión o convertida. Al convertir, se crea una zona por cada escuela.</p>
              </div>
            </Card>
          ) : (s.ubicacion_lat != null || s.zonas_elegidas.length > 0) && (
            <Card title="Ubicación y área elegida en el mapa">
              <div className="grid gap-3">
                <Mapa
                  alto={320}
                  etiqueta="Ubicación del negocio y área a recorrer"
                  zonas={data.zonasMapa}
                  seleccionadas={s.zonas_elegidas}
                  puntos={s.ubicacion_lat != null && s.ubicacion_lng != null ? [{ lat: s.ubicacion_lat, lng: s.ubicacion_lng, label: "Negocio" }] : []}
                  circulo={s.ubicacion_lat != null && s.ubicacion_lng != null && s.radio_km ? { lat: s.ubicacion_lat, lng: s.ubicacion_lng, km: Number(s.radio_km) } : undefined}
                />
                <Dl
                  items={[
                    ["Referencia", s.ubicacion_ref],
                    ["Radio", s.radio_km ? `${s.radio_km} km a la redonda (se crea como zona al convertir)` : ""],
                    ["Zonas elegidas", s.zonas_elegidas.join(", ")],
                    ["Abrir en Google Maps", s.ubicacion_lat != null ? <a className="text-brand-green-light underline" href={`https://maps.google.com/?q=${s.ubicacion_lat},${s.ubicacion_lng}`} target="_blank" rel="noreferrer">Ver ubicación</a> : ""],
                  ]}
                />
              </div>
            </Card>
          )}
          <Card title="Contacto">
            <Dl
              items={[
                ["Nombre", s.contacto_nombre],
                ["Empresa", s.contacto_empresa],
                ["Cargo", s.contacto_cargo],
                ["Teléfono", s.contacto_telefono],
                ["Correo", s.contacto_correo],
              ]}
            />
          </Card>
        </div>

        <div className="grid content-start gap-6">
          <Card title="Seguimiento">
            <div className="grid gap-4">
              <Field label="Estado">
                <Select
                  value={estado}
                  disabled={s.estado === "convertida"}
                  onChange={(e) => setEstado(e.target.value as Enum<"estado_solicitud">)}
                  options={(Object.keys(estadoSolicitud) as Enum<"estado_solicitud">[])
                    .filter((k) => k !== "convertida" || s.estado === "convertida")
                    .map((k) => [k, estadoSolicitud[k][0]])}
                />
              </Field>
              <Field label="Notas internas" hint="Solo las ve el equipo de Publicalle.">
                <Textarea rows={5} value={notas} maxLength={4000} onChange={(e) => setNotas(e.target.value)} />
              </Field>
              <ErrorBox msg={guardar.error} />
              <OkBox msg={guardar.ok} />
              <Btn
                icon={<Save className="size-4" aria-hidden />}
                loading={guardar.busy}
                onClick={() =>
                  guardar.run(async () => {
                    must(await sb.from("solicitudes").update({ estado, notas_internas: notas.trim() || null }).eq("id", s.id).select("id").single());
                    await reload();
                  }, "Cambios guardados.")
                }
              >
                Guardar
              </Btn>
            </div>
          </Card>

          {s.estado === "convertida" ? (
            <Card title="Campaña">
              <ConvertidaLink solicitudId={s.id} />
            </Card>
          ) : s.estado !== "descartada" ? (
            <Card title="Convertir en campaña">
              <div className="grid gap-4">
                <Field label="Cliente">
                  <Select value={empresaId} onChange={(e) => setEmpresaId(e.target.value)} placeholder="➕ Crear empresa nueva" options={data.empresas.map((e) => [e.id, e.nombre])} />
                </Field>
                {!empresaId && (
                  <Field label="Nombre de la empresa nueva">
                    <Input value={empresaNombre} maxLength={160} onChange={(e) => setEmpresaNombre(e.target.value)} />
                  </Field>
                )}
                <Field label="Nombre de la campaña">
                  <Input value={nombreCamp} maxLength={120} onChange={(e) => setNombreCamp(e.target.value)} />
                </Field>
                <p className="text-xs text-muted">Se copian el objetivo, las ciudades, las fechas y los servicios elegidos en el brief.</p>
                <ErrorBox msg={convertir.error} />
                <Btn
                  icon={<ArrowRight className="size-4" aria-hidden />}
                  loading={convertir.busy}
                  onClick={() =>
                    convertir.run(async () => {
                      const cid = must(
                        await sb.rpc("convertir_solicitud", {
                          p_solicitud: s.id,
                          p_empresa: empresaId || null,
                          p_empresa_nombre: empresaId ? null : empresaNombre,
                          p_nombre: nombreCamp,
                        }),
                      );
                      nav(`/admin/campanias/${cid}`);
                    })
                  }
                >
                  Crear campaña
                </Btn>
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </Page>
  );
}

function ConvertidaLink({ solicitudId }: { solicitudId: string }) {
  const { data } = useAsync(async () => must(await sb.from("campanias").select("id, nombre").eq("solicitud_id", solicitudId)), [solicitudId]);
  if (!data) return <Loading />;
  return data.length ? (
    <ul className="grid gap-2">
      {data.map((c) => (
        <li key={c.id}>
          <Link to={`/admin/campanias/${c.id}`} className="font-semibold text-brand-green-light underline-offset-4 hover:underline">
            {c.nombre}
          </Link>
        </li>
      ))}
    </ul>
  ) : (
    <p className="text-sm text-muted">La campaña vinculada fue eliminada.</p>
  );
}
