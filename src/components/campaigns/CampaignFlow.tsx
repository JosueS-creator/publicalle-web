import { useEffect, useRef, useState } from "react";
import { m, useReducedMotion, useScroll, useSpring } from "motion/react";
import { ChartNoAxesColumn, MapPinned, Route, Tent } from "lucide-react";
import type { FlowNode, LineId } from "@/types";
import { CountUp } from "@/components/ui/CountUp";
import { DemoTag } from "@/components/ui/StatusBadge";
import { lineById } from "@/data/services";
import { reveal, stagger, viewportOnce } from "@/lib/motion";
import { cn } from "@/lib/cn";

const icons: Record<LineId, typeof Route> = { move: Route, events: Tent, place: MapPinned, data: ChartNoAxesColumn };

type Props = {
  kicker: string;
  name: string;
  nodes: FlowNode[];
  result: FlowNode;
};

type Link = { id: string; d: string };

function NodeCard({ node, refCb, className }: { node: FlowNode; refCb?: (el: HTMLElement | null) => void; className?: string }) {
  const line = lineById[node.line];
  const Icon = icons[node.line];
  return (
    <m.div
      ref={refCb}
      variants={reveal}
      className={cn(
        "metal-sheen relative flex items-center gap-4 overflow-hidden rounded-2xl bg-[linear-gradient(150deg,rgb(21_96_200/0.2),rgb(10_19_38/0.95)_55%)] p-4 ring-1 ring-inset ring-white/12 md:p-5",
        className,
      )}
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-blue-dark text-brand-green-light ring-1 ring-inset ring-white/10">
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="type-eyebrow block text-[0.6rem] text-brand-white/75">{line.kicker}</span>
        <span className="mt-0.5 block text-xl font-extrabold tracking-tight [font-stretch:125%]">{line.name}</span>
      </span>
      <span className="text-right">
        {node.value > 0 ? (
          <>
            <CountUp value={node.value} className="type-data block text-3xl font-semibold text-brand-green-light" />
            <span className="block text-xs text-brand-white/80">{node.label}</span>
          </>
        ) : (
          <span className="block text-sm font-semibold text-brand-green-light">{node.label}</span>
        )}
      </span>
    </m.div>
  );
}

/**
 * <CampaignFlow /> — una campaña que se reparte en líneas (MOVE/EVENTS/PLACE) y converge en DATA.
 * Desktop: conectores SVG medidos del layout real, dibujados con el scroll. Móvil: flujo vertical.
 */
export function CampaignFlow({ kicker, name, nodes, result }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const originRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLElement | null>(null);
  const nodeRefs = useRef<(HTMLElement | null)[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({ target: wrapRef, offset: ["start 85%", "center 50%"] });
  const draw = useSpring(scrollYProgress, { stiffness: 90, damping: 26 });

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const measure = () => {
      // En pantallas < 1024 px no hay conectores: salir ANTES de medir (evita un reflow forzado de toda la página)
      if (window.innerWidth < 1024) return setLinks([]);
      const W = wrap.getBoundingClientRect();
      const rel = (el: HTMLElement | null) => {
        const r = el!.getBoundingClientRect();
        return { l: r.left - W.left, r: r.right - W.left, cy: r.top - W.top + r.height / 2 };
      };
      const o = rel(originRef.current);
      const res = rel(resultRef.current);
      const curve = (x1: number, y1: number, x2: number, y2: number) => {
        const mx = (x1 + x2) / 2;
        return `M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`;
      };
      const out: Link[] = [];
      nodeRefs.current.forEach((el, i) => {
        if (!el) return;
        const n = rel(el);
        out.push({ id: `in-${i}`, d: curve(o.r, o.cy, n.l, n.cy) });
        out.push({ id: `out-${i}`, d: curve(n.r, n.cy, res.l, res.cy) });
      });
      setSize({ w: W.width, h: W.height });
      setLinks(out);
    };
    // ResizeObserver entrega la primera medición tras el layout (sin forzarlo)
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      {links.length > 0 && (
        <svg className="pointer-events-none absolute inset-0 hidden lg:block" width={size.w} height={size.h} aria-hidden>
          <defs>
            <linearGradient id="flow-grad" x1="0" x2="1">
              <stop offset="0" stopColor="var(--publicalle-blue-electric)" />
              <stop offset="1" stopColor="var(--publicalle-green-light)" />
            </linearGradient>
          </defs>
          {links.map((l) => (
            <g key={l.id}>
              <path d={l.d} fill="none" stroke="rgb(148 170 220 / 0.18)" strokeWidth="1.5" strokeDasharray="2 6" />
              <m.path d={l.d} fill="none" stroke="url(#flow-grad)" strokeWidth="2" strokeLinecap="round" style={{ pathLength: reduce ? 1 : draw }} />
              {!reduce && (
                <circle r="3.5" fill="var(--publicalle-green-light)">
                  <animateMotion dur="3.2s" repeatCount="indefinite" path={l.d} begin={`${l.id.endsWith("0") ? 0 : l.id.endsWith("1") ? 0.6 : 1.2}s`} />
                </circle>
              )}
            </g>
          ))}
        </svg>
      )}

      <m.div
        variants={stagger(0.12)}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        className="relative grid gap-4 lg:grid-cols-[1fr_1.25fr_1fr] lg:items-center lg:gap-20"
      >
        {/* Campaña origen */}
        <m.div
          ref={originRef}
          variants={reveal}
          className="relative overflow-hidden rounded-3xl bg-[linear-gradient(160deg,var(--publicalle-blue),var(--publicalle-blue-dark)_70%)] p-6 shadow-[0_30px_60px_-30px_rgb(21_96_200/0.8)] ring-1 ring-inset ring-white/15 md:p-7"
        >
          <div className="bg-grid absolute inset-0 opacity-30" aria-hidden />
          <div className="relative flex items-center justify-between gap-3">
            <span className="type-eyebrow text-[0.65rem] text-brand-white">{kicker}</span>
            <DemoTag />
          </div>
          <p className="relative mt-4 text-2xl font-extrabold leading-tight tracking-tight [font-stretch:115%] md:text-3xl">{name}</p>
          <p className="relative mt-3 text-sm text-brand-white/70">Un objetivo, un plan, una sola coordinación.</p>
        </m.div>

        <Connector />

        {/* Líneas */}
        <div className="grid gap-3">
          {nodes.map((n, i) => (
            <NodeCard key={n.line} node={n} refCb={(el) => (nodeRefs.current[i] = el)} />
          ))}
        </div>

        <Connector />

        {/* Resultado */}
        <NodeCard
          node={result}
          refCb={(el) => (resultRef.current = el)}
          className="ring-brand-green/40 shadow-[0_0_40px_-10px_rgb(34_201_180/0.5)]"
        />
      </m.div>
    </div>
  );
}

/** Conector vertical para móvil/tablet (en desktop lo reemplaza el SVG). */
function Connector() {
  return (
    <div className="flex justify-center lg:hidden" aria-hidden>
      <span className="h-10 w-px bg-[repeating-linear-gradient(180deg,var(--publicalle-green)_0_4px,transparent_4px_9px)]" />
    </div>
  );
}
