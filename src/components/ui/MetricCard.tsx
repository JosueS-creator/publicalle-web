import type { Metric } from "@/types";
import { CountUp } from "./CountUp";
import { cn } from "@/lib/cn";

export function MetricCard({ metric, className }: { metric: Metric; className?: string }) {
  const numeric = /^\d+$/.test(metric.value);
  return (
    <div className={cn("rounded-2xl bg-white/[0.03] p-4 ring-1 ring-inset ring-white/10", className)}>
      <p className="type-eyebrow text-[0.62rem] text-muted">{metric.label}</p>
      <p className="type-data mt-2 text-2xl font-semibold text-brand-white md:text-3xl">
        {numeric ? <CountUp value={Number(metric.value)} pad={metric.value.length} /> : metric.value}
        {metric.unit && <span className="ml-1 text-sm font-normal text-muted">{metric.unit}</span>}
      </p>
      {metric.hint && <p className="mt-1 text-xs text-muted">{metric.hint}</p>}
    </div>
  );
}
