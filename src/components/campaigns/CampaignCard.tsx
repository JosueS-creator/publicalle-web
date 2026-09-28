import { m } from "motion/react";
import type { Campaign } from "@/types";
import { DemoTag } from "@/components/ui/StatusBadge";
import { VehicleIcon } from "@/components/vehicle/VehicleSilhouette";
import { reveal } from "@/lib/motion";

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const rows = [
    { k: "Cliente", v: campaign.client },
    { k: "Zona", v: campaign.location },
    { k: "Duración", v: campaign.duration },
    { k: "Formato", v: campaign.format },
  ].filter((r) => r.v);
  return (
    <m.article variants={reveal} className="group flex flex-col overflow-hidden rounded-3xl bg-surface ring-1 ring-inset ring-line">
      <div className="relative aspect-[4/3] overflow-hidden">
        {campaign.image ? (
          <img src={campaign.image} alt={campaign.imageAlt ?? campaign.title} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="grid h-full place-items-center bg-[repeating-linear-gradient(135deg,rgb(148_170_220/0.06)_0_12px,transparent_12px_24px)]">
            <div className="flex flex-col items-center gap-3 text-muted">
              <VehicleIcon className="w-24 opacity-40" bodyColor="currentColor" screenColor="var(--publicalle-green)" />
              <span className="type-eyebrow text-[0.6rem]">Foto de campaña</span>
            </div>
          </div>
        )}
        <div className="absolute left-4 top-4 flex gap-2">
          <span className="type-eyebrow rounded-full bg-brand-bg/80 px-3 py-1.5 text-[0.6rem] text-brand-white backdrop-blur">{campaign.type}</span>
          {campaign.isPlaceholder && <DemoTag />}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-xl font-extrabold tracking-tight [font-stretch:112%]">{campaign.title}</h3>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          {rows.map((r) => (
            <div key={r.k}>
              <dt className="type-eyebrow text-[0.58rem] text-muted">{r.k}</dt>
              <dd className="mt-0.5 text-brand-white/85">{r.v}</dd>
            </div>
          ))}
        </dl>
        {campaign.result && (
          <p className="mt-5 border-t border-line pt-4 text-sm text-muted">
            <span className="type-eyebrow mr-2 text-[0.58rem] text-brand-green">Resultado</span>
            {campaign.result}
          </p>
        )}
      </div>
    </m.article>
  );
}
