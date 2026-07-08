"use client";

import Link from "next/link";
import {
  SKILL_TREE,
  TOTAL_XP,
  CLASSES,
  LEVEL_NAMES,
  rankFor,
  nodeState,
} from "@/lib/curriculum";
import { CHALLENGES } from "@/lib/challenges";
import { useAcademy } from "@/lib/store";

const FEATURES = [
  {
    icon: "🗺️",
    title: "Árvore de Habilidades",
    desc: "Progressão estilo RPG tático: desbloqueie competências de IA concluindo pré-requisitos, do JSON básico aos guardrails de produção.",
    href: "/skills",
  },
  {
    icon: "🧪",
    title: "Sandbox Interativo",
    desc: "Canvas de fluxos estilo n8n (React Flow) com simulador de WhatsApp acoplado e terminal exibindo o raciocínio ReAct do agente.",
    href: "/sandbox",
  },
  {
    icon: "📊",
    title: "Painel do Gestor",
    desc: "Matriz de competências em radar, leaderboard e métricas: acerto de primeira tentativa e consumo de tokens simulados.",
    href: "/team",
  },
];

export default function Home() {
  const { hydrated, onboarded, name, xp, specClass, completedNodes } =
    useAcademy();
  const classInfo = CLASSES.find((c) => c.id === specClass);

  const available = SKILL_TREE.filter(
    (n) => nodeState(n, completedNodes) === "available"
  );

  return (
    <div className="grid-bg flex-1">
      <div className="mx-auto max-w-6xl px-4 py-14">
        {/* Hero */}
        <div className="text-center">
          <p className="font-mono text-xs uppercase tracking-[0.4em] text-neon">
            n8n · LangChain · WhatsApp Cloud API
          </p>
          <h1 className="mx-auto mt-3 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
            <span className="neon-text text-neon">N8N Agentic</span> Academy
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
            Plataforma gamificada de treinamento avançado em{" "}
            <span className="text-foreground">Inteligência Artificial</span>,{" "}
            <span className="text-foreground">RAG</span> e{" "}
            <span className="text-foreground">orquestração de agentes</span> no
            n8n — do webhook cru ao agente autônomo respondendo no WhatsApp.
          </p>

          {hydrated && !onboarded && (
            <Link
              href="/onboarding"
              className="mt-8 inline-block rounded-lg bg-neon px-8 py-4 text-base font-bold text-background shadow-[0_0_30px_rgba(34,211,238,0.35)] transition hover:brightness-110"
            >
              ▶ Iniciar Onboarding — Criar Personagem
            </Link>
          )}

          {hydrated && onboarded && (
            <div className="mx-auto mt-8 max-w-md">
              <div className="panel p-5 text-left">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">
                      {classInfo?.icon} {name}
                    </div>
                    <div className="text-xs text-muted">{rankFor(xp)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-lg font-bold text-gold">
                      {xp} XP
                    </div>
                    <div className="text-[10px] text-muted">
                      de {TOTAL_XP} possíveis
                    </div>
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-neon to-neon-2"
                    style={{
                      width: `${Math.min(100, (xp / TOTAL_XP) * 100)}%`,
                    }}
                  />
                </div>
                <div className="mt-3 flex justify-between font-mono text-[11px] text-muted">
                  <span>
                    {completedNodes.length}/{SKILL_TREE.length} competências
                  </span>
                  <span>
                    {available.length} nó(s) disponível(is) para estudo
                  </span>
                </div>
                <Link
                  href="/skills"
                  className="mt-4 block rounded-md bg-neon py-2.5 text-center text-sm font-bold text-background hover:brightness-110"
                >
                  Continuar treinamento →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Pilares */}
        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {FEATURES.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className="panel group p-6 transition hover:border-neon/60"
            >
              <div className="text-3xl">{f.icon}</div>
              <h2 className="mt-3 font-semibold group-hover:text-neon">
                {f.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.desc}</p>
            </Link>
          ))}
        </div>

        {/* Currículo */}
        <div className="mt-16">
          <h2 className="text-center text-xl font-bold">
            Matriz Curricular — 6 Níveis
          </h2>
          <p className="mt-1 text-center text-sm text-muted">
            {SKILL_TREE.length} competências · {CHALLENGES.length} desafios
            práticos no Sandbox · {TOTAL_XP} XP na trilha
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(LEVEL_NAMES).map(([lvl, title]) => {
              const nodes = SKILL_TREE.filter((n) => n.level === Number(lvl));
              return (
                <div key={lvl} className="panel p-4">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-neon">
                    Nível {lvl}
                  </div>
                  <div className="mt-1 text-sm font-semibold">{title}</div>
                  <ul className="mt-2 space-y-1 text-xs text-muted">
                    {nodes.map((n) => (
                      <li key={n.id}>
                        <span className="mr-1">{n.icon}</span> {n.module} —{" "}
                        {n.title}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        <p className="mt-16 text-center font-mono text-[11px] text-muted">
          ⬢ Ambiente 100% simulado — nenhuma credencial de produção é exposta.
        </p>
      </div>
    </div>
  );
}
