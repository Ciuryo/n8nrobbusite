"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  analyzeIdea,
  featuresOf,
  saveProject,
  loadProject,
  clearProject,
  blueprintToGraph,
  type ProjectBlueprint,
} from "@/lib/architect";
import { compileGraph, CATALOG_BY_TYPE } from "@/lib/sandbox";
import { getNode } from "@/lib/curriculum";
import { useAcademy } from "@/lib/store";

const EXAMPLES = [
  "Pizzaria: cardápio, pedidos e entrega com cálculo de frete",
  "Clínica: agendar consultas e responder dúvidas dos pacientes",
  "Loja online: status de pedido, catálogo de produtos e pagamento via PIX",
  "Escola de cursos: dúvidas sobre aulas, matrícula e cobrança",
];

export default function ProjetoPage() {
  const { completedNodes } = useAcademy();
  const [idea, setIdea] = useState("");
  const [bp, setBp] = useState<ProjectBlueprint | null>(null);
  const [editing, setEditing] = useState(false);

  // restaura o projeto salvo
  useEffect(() => {
    const saved = loadProject();
    if (saved) {
      setBp(saved);
      setIdea(saved.idea);
    }
  }, []);

  function generate() {
    if (idea.trim().length < 10) return;
    const result = analyzeIdea(idea);
    saveProject(result);
    setBp(result);
    setEditing(false);
  }

  function exportJson() {
    if (!bp) return;
    const blob = new Blob(
      [JSON.stringify(compileGraph(blueprintToGraph(bp)), null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "meu-projeto-n8n.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function reset() {
    clearProject();
    setBp(null);
    setIdea("");
    setEditing(false);
  }

  const showForm = !bp || editing;
  const feats = bp ? featuresOf(bp) : [];
  const studyModules = bp
    ? [...new Set(feats.flatMap((f) => f.modules))]
        .map((id) => getNode(id))
        .filter((n): n is NonNullable<typeof n> => !!n)
        .sort((a, b) => a.level - b.level || a.module.localeCompare(b.module))
    : [];
  const doneCount = studyModules.filter((m) =>
    completedNodes.includes(m.id)
  ).length;

  return (
    <div className="grid-bg flex-1">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon">
          Arquiteto de Projetos
        </p>
        <h1 className="font-display mt-1 text-3xl font-bold">🚀 Meu Projeto</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Descreva a sua ideia e o Arquiteto desenha a arquitetura n8n ideal:
          os blocos certos, o porquê de cada um, a trilha de estudo e a prática
          no Sandbox.
        </p>

        {showForm ? (
          <div className="panel mt-8 p-6">
            <label
              htmlFor="idea"
              className="mb-2 block text-sm font-semibold"
            >
              O que você quer construir?
            </label>
            <textarea
              id="idea"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              rows={4}
              placeholder="Ex.: um bot para minha barbearia que agenda horários, responde os preços dos serviços e cobra sinal via PIX…"
              className="w-full rounded-md border border-edge bg-surface-2 px-4 py-3 text-sm leading-relaxed outline-none placeholder:text-muted focus:border-neon"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setIdea(ex)}
                  className="rounded-full border border-edge bg-surface-2/60 px-3 py-1 text-xs text-muted transition hover:border-neon/50 hover:text-foreground"
                >
                  {ex}
                </button>
              ))}
            </div>
            <div className="mt-4 flex gap-3">
              {editing && (
                <button
                  onClick={() => setEditing(false)}
                  className="rounded-md border border-edge px-4 py-3 text-sm text-muted hover:text-foreground"
                >
                  ← Voltar
                </button>
              )}
              <button
                onClick={generate}
                disabled={idea.trim().length < 10}
                className="btn-primary flex-1 rounded-md px-4 py-3 font-semibold disabled:opacity-40"
              >
                ⚙ Gerar arquitetura →
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Ideia + ações */}
            <div className="panel mt-8 border-neon/40 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted">
                    Sua ideia
                  </div>
                  <p className="mt-1 text-sm leading-relaxed">{bp!.idea}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => setEditing(true)}
                    className="rounded-md border border-edge px-3 py-1.5 text-xs text-muted hover:text-foreground"
                  >
                    ✏ Editar
                  </button>
                  <button
                    onClick={reset}
                    className="rounded-md border border-edge px-3 py-1.5 text-xs text-muted hover:text-danger"
                  >
                    🗑
                  </button>
                </div>
              </div>
            </div>

            {/* Blueprint */}
            <h2 className="font-display mt-10 text-xl font-bold">
              Blueprint do Fluxo
            </h2>
            <p className="mt-1 text-sm text-muted">
              {feats.length} blocos, na ordem do pipeline. Os marcados com ⚡
              foram detectados na sua ideia.
            </p>
            <div className="mt-4 space-y-3">
              {feats.map((f, i) => (
                <div key={f.id} className="panel p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-arcade text-[10px] text-neon">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-xl">{f.icon}</span>
                    <span className="text-sm font-semibold">{f.title}</span>
                    {bp!.matches[f.id] && (
                      <span className="rounded-full bg-neon/10 px-2 py-0.5 font-mono text-[10px] text-neon">
                        ⚡ {bp!.matches[f.id].join(", ")}
                      </span>
                    )}
                    {f.toolName && (
                      <span className="rounded bg-surface-2 px-2 py-0.5 font-mono text-[10px] text-neon-2">
                        {f.toolName}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {f.why}
                  </p>
                  {f.nodes.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {f.nodes.map((t) => (
                        <span
                          key={t}
                          className="rounded border border-edge bg-surface-2 px-2 py-0.5 font-mono text-[10px] text-foreground/80"
                        >
                          {CATALOG_BY_TYPE[t]?.icon} {CATALOG_BY_TYPE[t]?.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Trilha de estudo */}
            <h2 className="font-display mt-10 text-xl font-bold">
              Trilha de Estudo
            </h2>
            <p className="mt-1 text-sm text-muted">
              Módulos que ensinam cada bloco — você já domina {doneCount}/
              {studyModules.length}.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {studyModules.map((m) => {
                const done = completedNodes.includes(m.id);
                return (
                  <Link
                    key={m.id}
                    href={`/module/${m.id}`}
                    className={`panel flex items-center gap-3 p-3 transition hover:border-neon/50 ${
                      done ? "border-success/40" : ""
                    }`}
                  >
                    <span className="text-lg">{done ? "✅" : m.icon}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {m.title}
                      </span>
                      <span className="font-mono text-[10px] text-muted">
                        Nv{m.level} · Módulo {m.module}
                        {done && " · dominado"}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Ações */}
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/sandbox?challenge=meu-projeto"
                className="btn-primary flex-1 rounded-md px-6 py-4 text-center font-bold"
              >
                🧪 Montar meu projeto no Sandbox (+400 XP)
              </Link>
              <button
                onClick={exportJson}
                className="rounded-md border border-edge px-6 py-4 text-sm font-semibold text-muted transition hover:border-neon/50 hover:text-neon"
              >
                ⬇ Exportar JSON pronto (n8n)
              </button>
            </div>
            <p className="mt-3 text-center font-mono text-[11px] text-muted">
              O JSON exportado importa direto no n8n real: menu ⋯ → Import from
              File.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
