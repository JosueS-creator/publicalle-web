import { CampaignBrief } from "@/components/brief/CampaignBrief";
import { useAuth } from "../auth";
import { sb } from "../supabase";
import { ErrorBox, Page, useAsync } from "../ui";

/** Cliente existente: pide una nueva campaña con el mismo brief de la web, con sus datos ya llenos. */
export default function PortalNueva() {
  const { perfil, session } = useAuth();
  const { data: empresa } = useAsync(async () => (await sb.from("empresas").select("nombre").eq("id", perfil?.empresa_id ?? "").maybeSingle()).data, [perfil?.empresa_id]);

  if (!perfil?.empresa_id || !session) return <Page title="Nueva campaña" back="/portal"><ErrorBox msg="Tu usuario no tiene una empresa asignada." /></Page>;

  return (
    <Page title="Nueva campaña" back="/portal" subtitle="Cuéntanos qué necesitas. El equipo de Publicalle te contacta para afinar los detalles.">
      <div className="max-w-3xl">
        <CampaignBrief
          key={empresa?.nombre ?? "cargando"}
          portal={{ token: session.access_token, empresaId: perfil.empresa_id }}
          inicial={{ nombre: perfil.nombre, telefono: perfil.telefono ?? "", correo: perfil.correo ?? session.user.email ?? "", empresa: empresa?.nombre ?? "" }}
        />
      </div>
    </Page>
  );
}
