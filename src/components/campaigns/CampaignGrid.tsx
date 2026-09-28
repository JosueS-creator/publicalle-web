import { m } from "motion/react";
import type { Campaign } from "@/types";
import { CampaignCard } from "./CampaignCard";
import { stagger, viewportOnce } from "@/lib/motion";

export function CampaignGrid({ campaigns }: { campaigns: Campaign[] }) {
  return (
    <m.div variants={stagger(0.1)} initial="hidden" whileInView="show" viewport={viewportOnce} className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {campaigns.map((c) => (
        <CampaignCard key={c.id} campaign={c} />
      ))}
    </m.div>
  );
}
