"use client";

import { Suspense, useCallback, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import FlowNode, { type AcademyNode } from "@/components/sandbox/FlowNode";
import WhatsAppWidget, {
  type ChatMessage,
} from "@/components/sandbox/WhatsAppWidget";
import ExecutionTerminal from "@/components/sandbox/ExecutionTerminal";
import { NODE_CATALOG, compileGraph, type Graph } from "@/lib/sandbox";
import { CHALLENGES, getChallenge, type ValidationResult } from "@/lib/challenges";
import { simulate, type LogStep } from "@/lib/simulator";
import { useAcademy } from "@/lib/store";

const nodeTypes = { academy: FlowNode };

const CATEGORIES = [...new Set(NODE_CATALOG.map((c) => c.category))];

function kindOf(handle: string | null | undefined): string | null {
  if (!handle) return null;
  return handle.replace(/^(in|out)-/, "");
}

function SandboxInner() {
  const searchParams = useSearchParams();
  const { completedChallenges, completeChallenge } = useAcademy();

  const [nodes, setNodes, onNodesChange] = useNodesState<AcademyNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const idRef = useRef(0);

  const [challengeId, setChallengeId] = useState<string>(
    () => searchParams.get("challenge") ?? ""
  );
  const challenge = challengeId ? getChallenge(challengeId) : null;

  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [logSteps, setLogSteps] = useState<LogStep[]>([]);
  const [running, setRunning] = useState(false);
  const [typing, setTyping] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [awarded, setAwarded] = useState<number | null>(null);
  const [showJson, setShowJson] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const graph: Graph = useMemo(
    () => ({
      nodes: nodes.map((n) => ({ id: n.id, type: n.data.ctype })),
      edges: edges.map((e) => ({
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle ?? null,
        targetHandle: e.targetHandle ?? null,
      })),
    }),
    [nodes, edges]
  );

  const addNode = useCallback(
    (ctype: string) => {
      const id = `n${++idRef.current}-${Date.now()}`;
      const entry = NODE_CATALOG.find((c) => c.type === ctype)!;
      const isSub = entry.provides !== null;
      setNodes((ns) => [
        ...ns,
        {
          id,
          type: "academy",
          position: {
            x: 60 + (ns.length % 4) * 210 + Math.random() * 30,
            y: (isSub ? 300 : 80) + Math.floor(ns.length / 4) * 90 + Math.random() * 40,
          },
          data: { ctype },
        },
      ]);
    },
    [setNodes]
  );

  const isValidConnection = useCallback(
    (conn: Connection | Edge) =>
      kindOf(conn.sourceHandle) !== null &&
      kindOf(conn.sourceHandle) === kindOf(conn.targetHandle),
    []
  );

  const onConnect = useCallback(
    (conn: Connection) =>
      setEdges((es) =>
        addEdge(
          {
            ...conn,
            animated: kindOf(conn.sourceHandle) !== "main",
          },
          es
        )
      ),
    [setEdges]
  );

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  function runFlow() {
    clearTimers();
    setValidation(null);
    setAwarded(null);
    // O widget limpa o histórico e simula a perspectiva do cliente
    setChat([]);
    setLogSteps([]);
    setRunning(true);

    const result = simulate(graph, challenge);
    let t = 400;
    timers.current.push(
      setTimeout(() => {
        setChat([{ from: "cliente", text: result.userMessage }]);
        setTyping(true);
      }, t)
    );
    for (const step of result.steps) {
      t += 550;
      timers.current.push(
        setTimeout(() => setLogSteps((s) => [...s, step]), t)
      );
    }
    t += 700;
    timers.current.push(
      setTimeout(() => {
        setTyping(false);
        setRunning(false);
        if (result.botReply) {
          setChat((c) => [...c, { from: "bot", text: result.botReply! }]);
        }
      }, t)
    );
  }

  function validateChallenge() {
    if (!challenge) return;
    const result = challenge.validate(graph);
    if (result.ok) {
      const isNew = !completedChallenges.includes(challenge.id);
      // runFlow limpa validation/awarded — setar depois para o painel de
      // recompensa permanecer visível durante a simulação
      runFlow();
      setValidation(result);
      if (isNew) {
        completeChallenge(challenge.id, challenge.xp);
        setAwarded(challenge.xp);
      }
    } else {
      setValidation(result);
    }
  }

  function resetCanvas() {
    clearTimers();
    setNodes([]);
    setEdges([]);
    setChat([]);
    setLogSteps([]);
    setValidation(null);
    setAwarded(null);
    setRunning(false);
    setTyping(false);
  }

  const challengeDone = challenge
    ? completedChallenges.includes(challenge.id)
    : false;

  return (
    <div className="flex flex-1 flex-col lg:overflow-hidden">
      {/* Barra de controle */}
      <div className="flex flex-wrap items-center gap-2 border-b border-edge bg-surface px-4 py-2">
        <label className="font-mono text-[10px] uppercase tracking-widest text-muted">
          Desafio
        </label>
        <select
          value={challengeId}
          onChange={(e) => {
            setChallengeId(e.target.value);
            setValidation(null);
            setAwarded(null);
          }}
          className="rounded-md border border-edge bg-surface-2 px-2 py-1.5 text-xs outline-none focus:border-neon"
        >
          <option value="">Modo livre (sem desafio)</option>
          {CHALLENGES.map((c) => (
            <option key={c.id} value={c.id}>
              {completedChallenges.includes(c.id) ? "✔ " : "◆ "}
              {c.title} (+{c.xp} XP)
            </option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowJson((v) => !v)}
            className="rounded-md border border-edge px-3 py-1.5 font-mono text-xs text-muted hover:text-foreground"
          >
            {"{ } JSON"}
          </button>
          <button
            onClick={resetCanvas}
            className="rounded-md border border-edge px-3 py-1.5 text-xs text-muted hover:text-danger"
          >
            🗑 Limpar
          </button>
          <button
            onClick={runFlow}
            disabled={running || nodes.length === 0}
            className="rounded-md bg-neon px-4 py-1.5 text-xs font-bold text-background hover:brightness-110 disabled:opacity-40"
          >
            ▶ Executar Fluxo
          </button>
          {challenge && (
            <button
              onClick={validateChallenge}
              disabled={running || nodes.length === 0}
              className="rounded-md bg-neon-2 px-4 py-1.5 text-xs font-bold text-background hover:brightness-110 disabled:opacity-40"
            >
              ✔ Validar Desafio
            </button>
          )}
        </div>
      </div>

      {/* Briefing do desafio */}
      {challenge && (
        <div className="border-b border-edge bg-surface-2/50 px-4 py-2 text-xs">
          <span className="font-semibold text-neon-2">◆ {challenge.title}</span>
          {challengeDone && <span className="ml-2 text-success">✔ concluído</span>}
          <span className="ml-2 text-muted">{challenge.brief}</span>
          <span className="ml-2 font-mono text-muted">
            Critérios: {challenge.acceptance.join(" · ")}
          </span>
          {challenge.hint && !challengeDone && (
            <div className="mt-1 text-neon">💡 {challenge.hint}</div>
          )}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Paleta de nós — faixa horizontal no celular, coluna no desktop */}
        <aside className="w-full shrink-0 overflow-x-auto border-b border-edge bg-surface lg:w-52 lg:overflow-y-auto lg:overflow-x-hidden lg:border-b-0 lg:border-r">
          <p className="px-3 pb-1 pt-3 font-mono text-[10px] uppercase tracking-widest text-muted">
            Paleta de Nós (+)
          </p>
          <div className="flex lg:block">
            {CATEGORIES.map((cat) => (
              <div key={cat} className="min-w-44 shrink-0 px-2 pb-2 lg:min-w-0">
                <p className="px-1 py-1 text-[10px] font-semibold uppercase text-neon/70">
                  {cat}
                </p>
                {NODE_CATALOG.filter((c) => c.category === cat).map((c) => (
                  <button
                    key={c.type}
                    onClick={() => addNode(c.type)}
                    title={c.desc}
                    className="mb-1 flex w-full items-center gap-2 rounded-md border border-edge bg-surface-2 px-2 py-1.5 text-left text-xs transition hover:border-neon/60"
                  >
                    <span>{c.icon}</span>
                    <span className="leading-tight">{c.label}</span>
                    <span className="ml-auto text-muted">+</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </aside>

        {/* Canvas */}
        <div className="relative min-h-[55vh] min-w-0 flex-1 lg:min-h-0">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            isValidConnection={isValidConnection}
            nodeTypes={nodeTypes}
            fitView
            deleteKeyCode={["Backspace", "Delete"]}
            colorMode="dark"
            proOptions={{ hideAttribution: false }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={24}
              color="#1d2740"
            />
            <Controls />
          </ReactFlow>

          {nodes.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p className="max-w-sm text-center text-sm text-muted">
                Clique em um nó na paleta à esquerda para adicioná-lo ao canvas
                e arraste as conexões entre as portas.
                <br />
                <span className="font-mono text-xs">
                  Fluxo principal: portas laterais (→). Sub-nós de IA: portas de
                  baixo (Model/Memory/Tool).
                </span>
                {!challenge && (
                  <>
                    <br />
                    <span className="text-xs">
                      💡 Primeira vez aqui? Selecione o desafio{" "}
                      <span className="text-neon-2">
                        ◆ Fluxo de Eco
                      </span>{" "}
                      na barra acima.
                    </span>
                  </>
                )}
              </p>
            </div>
          )}

          {/* Resultado da validação */}
          {validation && (
            <div className="absolute bottom-4 left-4 z-10 w-80 max-w-[calc(100%-2rem)] rounded-lg border border-edge bg-surface/95 p-3 shadow-xl backdrop-blur">
              <p
                className={`mb-2 text-sm font-bold ${
                  validation.ok ? "text-success" : "text-danger"
                }`}
              >
                {validation.ok
                  ? awarded
                    ? `🏆 Desafio validado! +${awarded} XP`
                    : "🏆 Desafio validado!"
                  : "✖ Critérios de aceitação pendentes"}
              </p>
              <ul className="space-y-1 text-xs">
                {validation.checks.map((c, i) => (
                  <li
                    key={i}
                    className={c.pass ? "text-success" : "text-danger"}
                  >
                    {c.pass ? "✔" : "✖"} {c.label}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setValidation(null)}
                className="mt-2 w-full rounded border border-edge py-1 text-[10px] uppercase tracking-widest text-muted hover:text-foreground"
              >
                fechar
              </button>
            </div>
          )}

          {/* Compilador de grafo → JSON */}
          {showJson && (
            <div className="absolute right-4 top-4 z-10 max-h-[70%] w-96 max-w-[calc(100%-2rem)] overflow-auto rounded-lg border border-edge bg-black/90 p-3 shadow-xl">
              <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-neon">
                Payload compilado (formato n8n)
              </p>
              <pre className="whitespace-pre-wrap font-mono text-[10px] leading-snug text-foreground/80">
                {JSON.stringify(compileGraph(graph), null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Simulador — embaixo no celular, lateral no desktop */}
        <aside className="flex w-full shrink-0 flex-col gap-2 border-t border-edge bg-surface p-2 lg:w-80 lg:border-l lg:border-t-0 xl:w-96">
          <div className="min-h-0 flex-[3] max-lg:h-80 max-lg:flex-none">
            <WhatsAppWidget messages={chat} typing={typing} />
          </div>
          <div className="min-h-0 flex-[2] max-lg:h-56 max-lg:flex-none">
            <ExecutionTerminal steps={logSteps} running={running} />
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function SandboxPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center font-mono text-sm text-muted">
          Inicializando sandbox…
        </div>
      }
    >
      <ReactFlowProvider>
        <SandboxInner />
      </ReactFlowProvider>
    </Suspense>
  );
}
