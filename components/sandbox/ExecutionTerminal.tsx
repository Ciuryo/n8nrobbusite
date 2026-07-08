"use client";

import { useEffect, useRef } from "react";
import type { LogStep, LogTone } from "@/lib/simulator";

const TONE_COLOR: Record<LogTone, string> = {
  info: "text-foreground/80",
  thought: "text-neon",
  action: "text-neon-2",
  observation: "text-muted",
  error: "text-danger",
  success: "text-success",
};

export default function ExecutionTerminal({
  steps,
  running,
}: {
  steps: LogStep[];
  running: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [steps, running]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-edge bg-black/60">
      <div className="flex items-center gap-2 border-b border-edge px-3 py-1.5">
        <span className="h-2 w-2 rounded-full bg-danger/70" />
        <span className="h-2 w-2 rounded-full bg-gold/70" />
        <span className="h-2 w-2 rounded-full bg-success/70" />
        <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-muted">
          Execution Log — traço ReAct
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2 font-mono text-[11px] leading-relaxed">
        {steps.length === 0 && !running && (
          <p className="text-muted">
            $ aguardando execução… o passo a passo do raciocínio do agente
            (Thought → Action → Observation) aparece aqui.
          </p>
        )}
        {steps.map((s, i) => (
          <div key={i} className={TONE_COLOR[s.tone]}>
            <span className="text-muted">[{s.tag}]</span> {s.text}
          </div>
        ))}
        {running && <div className="terminal-cursor text-neon" />}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
