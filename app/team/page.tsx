"use client";

import { useMemo, useState } from "react";
import { SKILL_TREE, rankFor } from "@/lib/curriculum";
import { useAcademy } from "@/lib/store";

// Séries validadas para o surface escuro (validate_palette.js: ΔE 21, ≥3:1)
const SERIES_TEAM = "#06a6c4";
const SERIES_YOU = "#c936da";

const AXES = [
  { key: "whatsapp", label: "Fundamentos & Mensageria", nodes: ["n8n-basics", "first-workflow", "json-mastery", "webhooks-whatsapp", "session-persistence"] },
  { key: "prompts", label: "Prompts & LLMs", nodes: ["llm-nodes", "prompt-engineering"] },
  { key: "rag", label: "RAG", nodes: ["document-loaders", "vector-stores", "retrieval"] },
  { key: "agents", label: "Agentes & Tools", nodes: ["memory-types", "custom-tools", "ai-agent"] },
  { key: "infra", label: "Produção & Guardrails", nodes: ["error-handling", "guardrails"] },
] as const;

interface Teammate {
  name: string;
  icon: string;
  xp: number;
  firstTryRate: number; // %
  avgBugMinutes: number;
  tokens: number;
  scores: number[]; // por eixo, 0–100
}

const TEAMMATES: Teammate[] = [
  { name: "Nakamura", icon: "🥷", xp: 1460, firstTryRate: 82, avgBugMinutes: 11, tokens: 48200, scores: [95, 80, 70, 85, 55] },
  { name: "Vasquez", icon: "🔥", xp: 1180, firstTryRate: 74, avgBugMinutes: 16, tokens: 61400, scores: [70, 90, 85, 55, 40] },
  { name: "Petrov", icon: "🧊", xp: 860, firstTryRate: 66, avgBugMinutes: 22, tokens: 35800, scores: [80, 55, 45, 60, 35] },
  { name: "Osei", icon: "⚡", xp: 640, firstTryRate: 71, avgBugMinutes: 19, tokens: 27300, scores: [60, 65, 30, 40, 20] },
];

const SIZE = 420;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = 150;

function polar(axisIndex: number, value: number): [number, number] {
  const angle = (Math.PI * 2 * axisIndex) / AXES.length - Math.PI / 2;
  const r = (value / 100) * R;
  return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)];
}

function polygonPath(scores: number[]): string {
  return (
    scores.map((v, i) => polar(i, v).join(",")).join(" ")
  );
}

export default function TeamPage() {
  const { hydrated, name, xp, completedNodes, quizAttempts, firstTryPasses, passedQuizzes } =
    useAcademy();
  const [hover, setHover] = useState<{
    x: number;
    y: number;
    text: string;
  } | null>(null);

  const youScores = useMemo(
    () =>
      AXES.map(
        (a) =>
          Math.round(
            (a.nodes.filter((n) => completedNodes.includes(n)).length /
              a.nodes.length) *
              100
          )
      ),
    [completedNodes]
  );

  const teamScores = useMemo(
    () =>
      AXES.map((_, i) =>
        Math.round(
          (TEAMMATES.reduce((acc, t) => acc + t.scores[i], 0) + youScores[i]) /
            (TEAMMATES.length + 1)
        )
      ),
    [youScores]
  );

  const totalAttempts = Object.values(quizAttempts).reduce((a, b) => a + b, 0);
  const youFirstTryRate =
    passedQuizzes.length > 0
      ? Math.round((firstTryPasses / passedQuizzes.length) * 100)
      : 0;
  const youTokens = 1200 + completedNodes.length * 2140;
  const youName = name || "Você";

  const board = [
    ...TEAMMATES,
    {
      name: `${youName} (você)`,
      icon: "🫵",
      xp,
      firstTryRate: youFirstTryRate,
      avgBugMinutes: totalAttempts > 0 ? 14 : 0,
      tokens: youTokens,
      scores: youScores,
    },
  ].sort((a, b) => b.xp - a.xp);

  if (!hydrated) {
    return (
      <div className="flex flex-1 items-center justify-center font-mono text-sm text-muted">
        Carregando painel…
      </div>
    );
  }

  const teamXp = board.reduce((a, b) => a + b.xp, 0);
  const teamFirstTry = Math.round(
    board.reduce((a, b) => a + b.firstTryRate, 0) / board.length
  );
  const teamTokens = board.reduce((a, b) => a + b.tokens, 0);
  const teamBugTime = Math.round(
    board.filter((b) => b.avgBugMinutes > 0).reduce((a, b) => a + b.avgBugMinutes, 0) /
      Math.max(1, board.filter((b) => b.avgBugMinutes > 0).length)
  );

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon">
        Visão macro da equipe
      </p>
      <h1 className="font-display mb-6 text-2xl font-bold">Painel do Gestor</h1>

      {/* Métricas de desempenho */}
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "XP total da equipe", value: teamXp.toLocaleString("pt-BR"), unit: "XP" },
          { label: "Acerto de 1ª tentativa", value: String(teamFirstTry), unit: "%" },
          { label: "Resolução média de bug", value: String(teamBugTime), unit: "min" },
          { label: "Tokens simulados", value: (teamTokens / 1000).toFixed(1), unit: "k" },
        ].map((m) => (
          <div key={m.label} className="panel p-4">
            <div className="text-2xl font-bold">
              {m.value}
              <span className="ml-1 text-sm font-normal text-muted">{m.unit}</span>
            </div>
            <div className="mt-1 text-xs text-muted">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Matriz de competências (radar) */}
        <section className="panel p-5">
          <h2 className="font-semibold">Matriz de Competências</h2>
          <p className="mb-2 text-xs text-muted">
            Força por área — média da equipe vs. seu perfil (0–100).
          </p>

          <div className="relative">
            <svg
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              className="mx-auto w-full max-w-md"
              role="img"
              aria-label="Radar de competências da equipe"
            >
              {/* grade recessiva */}
              {[25, 50, 75, 100].map((ring) => (
                <polygon
                  key={ring}
                  points={polygonPath(AXES.map(() => ring))}
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth={1}
                />
              ))}
              {AXES.map((_, i) => {
                const [x, y] = polar(i, 100);
                return (
                  <line
                    key={i}
                    x1={CX}
                    y1={CY}
                    x2={x}
                    y2={y}
                    stroke="var(--border)"
                    strokeWidth={1}
                  />
                );
              })}

              {/* série: média da equipe */}
              <polygon
                points={polygonPath(teamScores)}
                fill={SERIES_TEAM}
                fillOpacity={0.14}
                stroke={SERIES_TEAM}
                strokeWidth={2}
              />
              {/* série: você */}
              <polygon
                points={polygonPath(youScores)}
                fill={SERIES_YOU}
                fillOpacity={0.14}
                stroke={SERIES_YOU}
                strokeWidth={2}
              />

              {/* vértices com hover */}
              {[
                { scores: teamScores, color: SERIES_TEAM, label: "Equipe" },
                { scores: youScores, color: SERIES_YOU, label: youName },
              ].map((serie) =>
                serie.scores.map((v, i) => {
                  const [x, y] = polar(i, v);
                  return (
                    <circle
                      key={`${serie.label}-${i}`}
                      cx={x}
                      cy={y}
                      r={5}
                      fill={serie.color}
                      stroke="var(--surface)"
                      strokeWidth={2}
                      onMouseEnter={() =>
                        setHover({
                          x: (x / SIZE) * 100,
                          y: (y / SIZE) * 100,
                          text: `${serie.label} · ${AXES[i].label}: ${v}`,
                        })
                      }
                      onMouseLeave={() => setHover(null)}
                    />
                  );
                })
              )}

              {/* rótulos dos eixos */}
              {AXES.map((a, i) => {
                const [x, y] = polar(i, 122);
                return (
                  <text
                    key={a.key}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-[var(--muted)]"
                    fontSize={11}
                  >
                    {a.label}
                  </text>
                );
              })}
            </svg>

            {hover && (
              <div
                className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded border border-edge bg-surface-2 px-2 py-1 font-mono text-[10px] shadow-lg"
                style={{ left: `${hover.x}%`, top: `${hover.y}%` }}
              >
                {hover.text}
              </div>
            )}
          </div>

          {/* legenda */}
          <div className="mt-2 flex justify-center gap-6 text-xs">
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ background: SERIES_TEAM }}
              />
              Média da equipe
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ background: SERIES_YOU }}
              />
              {youName}
            </span>
          </div>

          {/* visão em tabela (acessibilidade) */}
          <details className="mt-3">
            <summary className="cursor-pointer font-mono text-[11px] text-muted hover:text-foreground">
              Ver dados em tabela
            </summary>
            <table className="mt-2 w-full text-left text-xs">
              <thead>
                <tr className="border-b border-edge text-muted">
                  <th className="py-1 font-normal">Área</th>
                  <th className="py-1 font-normal">Equipe</th>
                  <th className="py-1 font-normal">{youName}</th>
                </tr>
              </thead>
              <tbody>
                {AXES.map((a, i) => (
                  <tr key={a.key} className="border-b border-edge/50">
                    <td className="py-1">{a.label}</td>
                    <td className="py-1 font-mono">{teamScores[i]}</td>
                    <td className="py-1 font-mono">{youScores[i]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </section>

        {/* Leaderboard */}
        <section className="panel p-5">
          <h2 className="font-semibold">Leaderboard da Equipe</h2>
          <p className="mb-3 text-xs text-muted">
            Ranking por XP · taxa de acerto de 1ª tentativa · consumo de tokens
            simulados.
          </p>
          <ol className="space-y-2">
            {board.map((t, i) => {
              const isYou = t.name.endsWith("(você)");
              return (
                <li
                  key={t.name}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
                    isYou ? "border-neon/60 bg-neon/5" : "border-edge bg-surface-2"
                  }`}
                >
                  <span
                    className={`w-7 text-center font-mono text-sm ${
                      i === 0 ? "text-gold" : "text-muted"
                    }`}
                  >
                    {i === 0 ? "👑" : `#${i + 1}`}
                  </span>
                  <span className="text-xl">{t.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{t.name}</div>
                    <div className="font-mono text-[10px] text-muted">
                      {rankFor(t.xp)}
                    </div>
                  </div>
                  <div className="hidden text-right font-mono text-[10px] text-muted sm:block">
                    <div>1ª tentativa: {t.firstTryRate}%</div>
                    <div>{(t.tokens / 1000).toFixed(1)}k tokens</div>
                  </div>
                  <span className="w-20 text-right font-mono text-sm font-bold text-gold">
                    {t.xp.toLocaleString("pt-BR")}
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="mt-3 font-mono text-[10px] text-muted">
            * Colegas simulados para demonstração. Seus dados são reais e vêm do
            seu progresso na árvore ({completedNodes.length}/{SKILL_TREE.length}{" "}
            competências).
          </p>
        </section>
      </div>
    </div>
  );
}
