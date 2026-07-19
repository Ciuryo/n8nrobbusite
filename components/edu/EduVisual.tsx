import { Fragment, type ReactNode } from "react";
import { CATALOG_BY_TYPE } from "@/lib/sandbox";
import type { EduChip, EduPort, EduVisual } from "@/lib/eduVisuals";

const PORT_COLOR: Record<EduPort, string> = {
  model: "#a78bfa",
  memory: "#fbbf24",
  tool: "#e879f9",
  embedding: "#34d399",
};

const PORT_LABEL: Record<EduPort, string> = {
  model: "Model",
  memory: "Memory",
  tool: "Tool",
  embedding: "Embedding",
};

const TONE_BORDER: Record<"good" | "bad" | "neutral", string> = {
  good: "border-success/40 bg-success/5",
  bad: "border-danger/40 bg-danger/5",
  neutral: "border-edge bg-surface-2/40",
};

const ZONE_COLOR: Record<"good" | "warn" | "bad", string> = {
  good: "var(--success)",
  warn: "var(--gold)",
  bad: "var(--danger)",
};

function Chip({ chip }: { chip: EduChip }) {
  if ("type" in chip) {
    const entry = CATALOG_BY_TYPE[chip.type];
    if (!entry) return null;
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-edge bg-surface-2 px-2.5 py-1.5 text-xs font-medium">
        <span className="text-sm">{entry.icon}</span>
        {entry.label}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border px-2.5 py-1.5 text-xs font-medium ${
        chip.danger
          ? "border-danger/50 bg-danger/10 text-danger"
          : "border-edge bg-surface-2"
      }`}
    >
      <span className="text-sm">{chip.icon}</span>
      {chip.label}
    </span>
  );
}

function FlowDiagram({ v }: { v: Extract<EduVisual, { kind: "flow" }> }) {
  return (
    <div className="my-3 overflow-x-auto rounded-lg border border-edge bg-surface-2/40 p-4">
      <div className="flex min-w-max items-center gap-2">
        {v.main.map((chip, i) => (
          <Fragment key={i}>
            {i > 0 && <span className="shrink-0 text-neon">→</span>}
            <Chip chip={chip} />
          </Fragment>
        ))}
      </div>
      {v.subs && v.subs.length > 0 && (
        <div className="mt-3 flex min-w-max flex-wrap gap-4 border-t border-edge/60 pt-3">
          {v.subs.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span
                className="font-mono text-[10px] font-bold uppercase tracking-wide"
                style={{ color: PORT_COLOR[s.port] }}
              >
                ↳ {PORT_LABEL[s.port]}
              </span>
              <Chip chip={s.chip} />
            </div>
          ))}
        </div>
      )}
      {v.caption && <p className="mt-3 text-xs text-muted">{v.caption}</p>}
    </div>
  );
}

/** Colorização leve de JSON/expressões — sem dependências externas */
function highlightCode(code: string): ReactNode[] {
  const lines = code.split("\n");
  const out: ReactNode[] = [];
  const re =
    /("(?:[^"\\]|\\.)*")(\s*:)?|([{}[\],:])|(-?\b\d+\.?\d*\b)|(\btrue\b|\bfalse\b|\bnull\b)/g;
  lines.forEach((line, li) => {
    let last = 0;
    let m: RegExpExecArray | null;
    let key = 0;
    re.lastIndex = 0;
    while ((m = re.exec(line))) {
      if (m.index > last) out.push(line.slice(last, m.index));
      if (m[1]) {
        const isKey = !!m[2];
        out.push(
          <span
            key={`${li}-${key++}`}
            style={{ color: isKey ? "var(--gold)" : "var(--neon)" }}
          >
            {m[1]}
          </span>
        );
        if (m[2]) out.push(m[2]);
      } else if (m[3]) {
        out.push(
          <span key={`${li}-${key++}`} className="text-muted">
            {m[3]}
          </span>
        );
      } else if (m[4]) {
        out.push(
          <span key={`${li}-${key++}`} style={{ color: "var(--neon-2)" }}>
            {m[4]}
          </span>
        );
      } else if (m[5]) {
        out.push(
          <span key={`${li}-${key++}`} style={{ color: "var(--success)" }}>
            {m[5]}
          </span>
        );
      }
      last = re.lastIndex;
    }
    if (last < line.length) out.push(line.slice(last));
    if (li < lines.length - 1) out.push(<br key={`${li}-br`} />);
  });
  return out;
}

function CodeBlock({ label, code }: { label?: string; code: string }) {
  return (
    <div className="my-3 overflow-hidden rounded-lg border border-edge bg-black/30">
      {label && (
        <div className="border-b border-edge/60 bg-surface-2/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-neon">
          {label}
        </div>
      )}
      <pre className="overflow-x-auto px-4 py-3 font-mono text-[12px] leading-relaxed text-foreground/90">
        <code>{highlightCode(code)}</code>
      </pre>
    </div>
  );
}

function CodeCompare({
  v,
}: {
  v: Extract<EduVisual, { kind: "codeCompare" }>;
}) {
  return (
    <div className="my-3 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
      <CodeBlock label={v.leftLabel} code={v.left} />
      <span className="hidden text-2xl text-neon sm:block">→</span>
      <CodeBlock label={v.rightLabel} code={v.right} />
    </div>
  );
}

function Compare({ v }: { v: Extract<EduVisual, { kind: "compare" }> }) {
  const gridCols =
    v.columns.length >= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";
  return (
    <div className={`my-3 grid gap-3 ${gridCols}`}>
      {v.columns.map((c, i) => (
        <div
          key={i}
          className={`rounded-lg border p-4 ${TONE_BORDER[c.tone ?? "neutral"]}`}
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            {c.icon && <span>{c.icon}</span>}
            {c.title}
          </div>
          <ul className="mt-2 space-y-1 text-xs leading-relaxed text-muted">
            {c.points.map((p, j) => (
              <li key={j}>• {p}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Gauge({ v }: { v: Extract<EduVisual, { kind: "gauge" }> }) {
  const range = v.max - v.min;
  const pct = (val: number) => ((val - v.min) / range) * 100;
  return (
    <div className="my-3 rounded-lg border border-edge bg-surface-2/40 p-4">
      <div className="relative h-2.5 overflow-hidden rounded-full bg-surface">
        {v.zones.map((z, i) => (
          <div
            key={i}
            className="absolute inset-y-0"
            style={{
              left: `${pct(z.from)}%`,
              width: `${pct(z.to) - pct(z.from)}%`,
              background: ZONE_COLOR[z.tone],
              opacity: 0.6,
            }}
          />
        ))}
        {v.marker !== undefined && (
          <div
            className="absolute -top-1 h-4.5 w-0.5 rounded bg-foreground"
            style={{ left: `${pct(v.marker)}%` }}
          />
        )}
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[10px] text-muted">
        <span>
          {v.min}
          {v.unit}
        </span>
        <span>
          {v.max}
          {v.unit}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-foreground/80">
        {v.zones.map((z, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: ZONE_COLOR[z.tone] }}
            />
            {z.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function Overlap() {
  return (
    <div className="my-3 rounded-lg border border-edge bg-surface-2/40 p-4">
      <div className="flex items-center overflow-x-auto font-mono text-[11px]">
        <div className="whitespace-nowrap rounded-l-md bg-neon/20 px-3 py-2 text-foreground">
          Chunk 1
        </div>
        <div className="whitespace-nowrap bg-gold/30 px-3 py-2 font-semibold text-gold">
          overlap
        </div>
        <div className="whitespace-nowrap rounded-r-md bg-neon-2/20 px-3 py-2 text-foreground">
          Chunk 2
        </div>
      </div>
      <p className="mt-2 text-xs text-muted">
        O trecho dourado se repete nos dois chunks — nenhuma frase fica
        cortada ao meio na fronteira.
      </p>
    </div>
  );
}

export default function EduVisualRenderer({
  visual,
}: {
  visual?: EduVisual;
}) {
  if (!visual) return null;
  switch (visual.kind) {
    case "flow":
      return <FlowDiagram v={visual} />;
    case "code":
      return <CodeBlock label={visual.label} code={visual.code} />;
    case "codeCompare":
      return <CodeCompare v={visual} />;
    case "compare":
      return <Compare v={visual} />;
    case "gauge":
      return <Gauge v={visual} />;
    case "overlap":
      return <Overlap />;
    default:
      return null;
  }
}
