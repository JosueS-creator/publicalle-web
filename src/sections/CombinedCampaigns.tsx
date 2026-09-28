import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CampaignFlow } from "@/components/campaigns/CampaignFlow";
import { ButtonLink } from "@/components/ui/Button";
import { combined } from "@/data/site";

/** 06 — Campañas combinadas: la sección comercial clave. */
export function CombinedCampaigns() {
  const ex = combined.example;
  return (
    <section id="campanas-combinadas" aria-labelledby="combinadas-title" className="relative overflow-hidden py-24 md:py-36">
      <div className="bg-grid absolute inset-0 opacity-40 [mask-image:radial-gradient(60%_55%_at_50%_60%,black,transparent)]" aria-hidden />
      <div className="container-pc relative">
        <SectionHeading id="combinadas-title" index="06" eyebrow={combined.eyebrow} title={combined.title} body={combined.body} align="center" className="mx-auto [&_h2]:max-w-[16ch]" />
        <div className="mx-auto mt-14 max-w-6xl md:mt-20">
          <CampaignFlow kicker={ex.kicker} name={ex.name} nodes={ex.nodes} result={ex.result} />
        </div>
        <div className="mt-14 flex justify-center">
          <ButtonLink href={combined.cta.href} size="lg" icon={<ArrowUpRight className="size-5" aria-hidden />}>
            {combined.cta.label}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
