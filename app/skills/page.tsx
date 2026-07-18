"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  SKILL_TREE,
  LEVEL_NAMES,
  nodeState,
  type NodeState,
} from "@/lib/curriculum";
import { useAcademy, xpWithBonus } from "@/lib/store";

const CELL_W = 190;
const CELL_H = 170;
const NODE_W = 150;
const NODE_H = 110;
const PAD_X = 40;
const PAD_Y = 60;

function center(pos: { col: number; row: number }) {
  return {
    x: PAD_X + pos.col * CELL_W + NODE_W / 2,
    y: PAD_Y + (pos.row + 1) * CELL_H + NODE_H / 2,
  };
}

const STATE_STYLE: Record<NodeState, string> = {
  locked: "border-edge bg-surface opacity-50 cursor-not-allowed",
  available:
    "node-available border-neon bg-surface-2 cursor-pointer hover:brightness-125",
  completed:
    "border-gold bg-gold/10 cursor-pointer hover:brightness-125 shadow-[0_0_14px_rgba(251,191,36,0.25)]",
};

export default function SkillsPage() {
  const router = useRouter();
  const { hydrated, onboarded, completedNodes, specClass } = useAcademy();

  useEffect(() => {
    if (hydrated && !onboarded) router.replace("/onboarding");
  }, [hydrated, onboarded, router]);

  if (!hydrated) {
    return (
      <div className="flex flex-1 items-center justify-center font-mono text-sm text-muted">
        Carregando mapa de habilidades…
      </div>
    );
  }

  const cols = Math.max(...SKILL_TREE.map((n) => n.pos.col)) + 1;
  const width = PAD_X * 2 + cols * CELL_W;
  const height = PAD_Y * 2 + 3 * CELL_H;

  // Próximo nó sugerido: o disponível de menor nível/módulo
  const suggested = SKILL_TREE.filter(
    (n) => nodeState(n, completedNodes) === "available"
  ).sort(
    (a, b) => a.level - b.level || a.module.localeCompare(b.module)
  )[0];

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-7xl px-4 pt-8">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon">
          Mapa de progressão
        </p>
        <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-2xl font-bold">Árvore de Habilidades</h1>
          <div className="flex gap-4 font-mono text-[11px] text-muted">
            <span>
              <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm border border-edge bg-surface align-middle" />
              Bloqueado
            </span>
            <span>
              <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm border border-neon bg-surface-2 align-middle" />
              Disponível
            </span>
            <span>
              <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm border border-gold bg-gold/20 align-middle" />
              Concluído
            </span>
          </div>
        </div>
        <p className="mb-4 text-sm text-muted">
          Desbloqueie competências concluindo os pré-requisitos. Nós com{" "}
          <span className="text-neon-2">◆</span> exigem um desafio prático no
          Sandbox. <span className="text-gold">★</span> indica bônus de XP para
          a sua classe.
        </p>
      </div>

      <div className="grid-bg flex-1 overflow-auto border-t border-edge">
        <div
          className="relative mx-auto"
          style={{ width, height, minWidth: width }}
        >
          {/* Arestas de dependência */}
          <svg
            width={width}
            height={height}
            className="absolute inset-0"
            aria-hidden
          >
            {SKILL_TREE.flatMap((node) =>
              node.deps.map((dep) => {
                const from = SKILL_TREE.find((n) => n.id === dep)!;
                const a = center(from.pos);
                const b = center(node.pos);
                const done = completedNodes.includes(dep);
                const midX = (a.x + b.x) / 2;
                return (
                  <path
                    key={`${dep}->${node.id}`}
                    d={`M ${a.x + NODE_W / 2 - 4} ${a.y} C ${midX} ${a.y}, ${midX} ${b.y}, ${b.x - NODE_W / 2 + 4} ${b.y}`}
                    fill="none"
                    stroke={done ? "var(--neon)" : "var(--border)"}
                    strokeWidth={2}
                    strokeDasharray={done ? "none" : "6 6"}
                    opacity={done ? 0.8 : 0.6}
                  />
                );
              })
            )}
          </svg>

          {/* Nós de conhecimento */}
          {SKILL_TREE.map((node) => {
            const state = nodeState(node, completedNodes);
            const c = center(node.pos);
            const xp = xpWithBonus(node.id, specClass);
            const inner = (
              <div
                className={`relative flex h-full flex-col rounded-lg border-2 p-2.5 transition ${STATE_STYLE[state]}`}
              >
                {suggested?.id === node.id && (
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-neon px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-background shadow-[0_0_14px_rgba(34,211,238,0.5)]">
                    ▶ {completedNodes.length === 0 ? "comece aqui" : "continue aqui"}
                  </span>
                )}
                <div className="flex items-start justify-between">
                  <span className="font-mono text-lg">{node.icon}</span>
                  <span className="font-mono text-[10px] text-muted">
                    Nv{node.level} · {node.module}
                  </span>
                </div>
                <span className="mt-1 text-xs font-semibold leading-tight">
                  {node.title}
                </span>
                <div className="mt-auto flex items-center justify-between font-mono text-[10px]">
                  <span className="text-gold">
                    {node.bonusClass === specClass && "★ "}
                    {xp} XP
                  </span>
                  <span>
                    {node.challengeId && (
                      <span className="mr-1 text-neon-2">◆</span>
                    )}
                    {state === "completed" && (
                      <span className="text-gold">🏅</span>
                    )}
                    {state === "locked" && <span>🔒</span>}
                  </span>
                </div>
              </div>
            );

            const style = {
              left: c.x - NODE_W / 2,
              top: c.y - NODE_H / 2,
              width: NODE_W,
              height: NODE_H,
            };

            return state === "locked" ? (
              <div
                key={node.id}
                className="absolute"
                style={style}
                title={`Requer: ${node.deps.join(", ")}`}
              >
                {inner}
              </div>
            ) : (
              <Link
                key={node.id}
                href={`/module/${node.id}`}
                className="absolute"
                style={style}
              >
                {inner}
              </Link>
            );
          })}
        </div>
      </div>

      <footer className="border-t border-edge px-4 py-3">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-x-8 gap-y-1 font-mono text-[11px] text-muted">
          {Object.entries(LEVEL_NAMES).map(([lvl, name]) => (
            <span key={lvl}>
              <span className="text-neon">Nv{lvl}</span> {name}
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}
