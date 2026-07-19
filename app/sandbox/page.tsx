"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  useReactFlow,
  type Connection,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import FlowNode, { type AcademyNode } from "@/components/sandbox/FlowNode";
import { TapConnectContext, type PendingHandle } from "@/components/sandbox/TapConnect";
import WhatsAppWidget, {
  type ChatMessage,
} from "@/components/sandbox/WhatsAppWidget";
import ExecutionTerminal from "@/components/sandbox/ExecutionTerminal";
import { NODE_CATALOG, compileGraph, type Graph } from "@/lib/sandbox";
import {
  CHALLENGES,
  getChallenge,
  type Challenge,
  type ValidationResult,
} from "@/lib/challenges";
import { simulate, type LogStep } from "@/lib/simulator";
import { useAcademy } from "@/lib/store";
import { fireConfetti } from "@/lib/confetti";
import { getNode } from "@/lib/curriculum";
import { loadProjectChallenge } from "@/lib/architect";

const nodeTypes = { academy: FlowNode };

const CATEGORIES = [...new Set(NODE_CATALOG.map((c) => c.category))];

const CANVAS_KEY = "robbu-sandbox-canvas";

/** nível do módulo recomendado (desafios sem referência vão para o fim) */
function challengeLevel(c: Challenge): number {
  return c.recommendedAfter ? (getNode(c.recommendedAfter)?.level ?? 99) : 99;
}

/** desafios em ordem didática: do Nível 0 ao boss */
const ORDERED_CHALLENGES = [...CHALLENGES].sort(
  (a, b) => challengeLevel(a) - challengeLevel(b)
);

function kindOf(handle: string | null | undefined): string | null {
  if (!handle) return null;
  return handle.replace(/^(in|out)-/, "");
}

/** converte o setup de um desafio de conserto em nós/arestas do React Flow */
function setupToFlow(ch: Challenge) {
  const nodes: AcademyNode[] = (ch.setup?.nodes ?? []).map((n) => ({
    id: n.id,
    type: "academy" as const,
    position: { x: n.x, y: n.y },
    data: { ctype: n.type },
  }));
  const edges: Edge[] = (ch.setup?.edges ?? []).map((e, i) => ({
    id: `setup-${i}`,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
    animated: kindOf(e.sourceHandle) !== "main",
  }));
  return { nodes, edges };
}

function SandboxInner() {
  const searchParams = useSearchParams();
  const { completedChallenges, completeChallenge } = useAcademy();

  const [nodes, setNodes, onNodesChange] = useNodesState<AcademyNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const idRef = useRef(0);
  const { fitView } = useReactFlow();

  // reenquadra o canvas para nenhum nó ficar fora da área visível
  const requestFit = useCallback(() => {
    window.setTimeout(
      // minZoom evita que os nós encolham demais (e as portas fiquem
      // pequenas demais para tocar) quando o canvas tem vários nós
      () => fitView({ padding: 0.25, duration: 200, maxZoom: 1.2, minZoom: 0.7 }),
      60
    );
  }, [fitView]);

  const [challengeId, setChallengeId] = useState<string>(
    () => searchParams.get("challenge") ?? ""
  );
  // desafio dinâmico do Arquiteto de Projetos (carrega no cliente)
  const [projectChallenge, setProjectChallenge] = useState<Challenge | null>(
    null
  );
  useEffect(() => {
    setProjectChallenge(loadProjectChallenge());
  }, []);

  const challenge =
    challengeId === "meu-projeto"
      ? projectChallenge
      : challengeId
        ? getChallenge(challengeId)
        : null;

  // Restaura o canvas salvo (ou o fluxo quebrado do desafio de conserto)
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const initial = challengeId ? getChallenge(challengeId) : null;
    if (initial?.setup) {
      const { nodes: n, edges: e } = setupToFlow(initial);
      setNodes(n);
      setEdges(e);
      requestFit();
      return;
    }
    try {
      const raw = localStorage.getItem(CANVAS_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (Array.isArray(data.nodes)) setNodes(data.nodes);
        if (Array.isArray(data.edges)) setEdges(data.edges);
        idRef.current = data.idc ?? data.nodes?.length ?? 0;
        requestFit();
      }
    } catch {
      /* canvas salvo corrompido: começa vazio */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-salva o canvas a cada mudança
  useEffect(() => {
    if (!restored.current) return;
    try {
      localStorage.setItem(
        CANVAS_KEY,
        JSON.stringify({ nodes, edges, idc: idRef.current })
      );
    } catch {
      /* armazenamento cheio: segue sem salvar */
    }
  }, [nodes, edges]);

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

  // Checklist ao vivo: critérios do desafio conferidos a cada mudança no grafo
  const liveChecks = useMemo(
    () => (challenge ? challenge.validate(graph) : null),
    [challenge, graph]
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
      requestFit();
    },
    [setNodes, requestFit]
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

  // Modo "toque e toque": toca numa porta, depois na outra, sem precisar
  // arrastar — no celular, acertar um arrasto entre duas portas pequenas é difícil.
  const [pending, setPending] = useState<PendingHandle | null>(null);
  const isSourceHandle = (handleId: string) => handleId.startsWith("out-");

  const onHandleTap = useCallback(
    (nodeId: string, handleId: string) => {
      setPending((prev) => {
        if (!prev) return { nodeId, handleId };
        // toca de novo na mesma porta: cancela a seleção
        if (prev.nodeId === nodeId && prev.handleId === handleId) return null;
        // mesmo papel (as duas de saída, ou as duas de entrada): troca a seleção
        if (isSourceHandle(prev.handleId) === isSourceHandle(handleId)) {
          return { nodeId, handleId };
        }
        // mesmo nó, papéis diferentes: não conecta nó nele mesmo — troca a seleção
        if (prev.nodeId === nodeId) return { nodeId, handleId };

        // papéis complementares em nós diferentes: tenta conectar
        const source = isSourceHandle(prev.handleId) ? prev : { nodeId, handleId };
        const target = isSourceHandle(prev.handleId) ? { nodeId, handleId } : prev;
        const conn: Connection = {
          source: source.nodeId,
          sourceHandle: source.handleId,
          target: target.nodeId,
          targetHandle: target.handleId,
        };
        if (isValidConnection(conn)) onConnect(conn);
        return null;
      });
    },
    [isValidConnection, onConnect]
  );

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  function runFlow(messageOverride?: string) {
    clearTimers();
    setValidation(null);
    setAwarded(null);
    // O widget limpa o histórico e simula a perspectiva do cliente
    setChat([]);
    setLogSteps([]);
    setRunning(true);

    const result = simulate(graph, challenge, messageOverride);
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
        fireConfetti(challenge.id === "boss-final" ? 180 : 90);
      }
    } else {
      setValidation(result);
    }
  }

  // Remoção por toque: no celular não há Backspace/Delete
  const selNodeIds = nodes.filter((n) => n.selected).map((n) => n.id);
  const hasSelEdge = edges.some((e) => e.selected);

  function deleteSelected() {
    const ids = new Set(selNodeIds);
    setNodes((ns) => ns.filter((n) => !ids.has(n.id)));
    setEdges((es) =>
      es.filter((e) => !e.selected && !ids.has(e.source) && !ids.has(e.target))
    );
    setPending(null);
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
    setPending(null);
  }

  function selectChallenge(id: string) {
    setChallengeId(id);
    setValidation(null);
    setAwarded(null);
    // desafio de conserto: carrega o fluxo quebrado no canvas
    const ch = id ? getChallenge(id) : null;
    if (ch?.setup) {
      clearTimers();
      const { nodes: n, edges: e } = setupToFlow(ch);
      setNodes(n);
      setEdges(e);
      setChat([]);
      setLogSteps([]);
      setRunning(false);
      setTyping(false);
      setPending(null);
      requestFit();
    }
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(compileGraph(graph), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fluxo-robbugamen8n.json";
    a.click();
    URL.revokeObjectURL(url);
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
          onChange={(e) => selectChallenge(e.target.value)}
          className="rounded-md border border-edge bg-surface-2 px-2 py-1.5 text-xs outline-none focus:border-neon"
        >
          <option value="">Modo livre (sem desafio)</option>
          {projectChallenge && (
            <option value="meu-projeto">
              {completedChallenges.includes("meu-projeto") ? "✔ " : "🚀 "}
              Meu Projeto (+{projectChallenge.xp} XP)
            </option>
          )}
          {ORDERED_CHALLENGES.map((c) => {
            const rec = c.recommendedAfter ? getNode(c.recommendedAfter) : null;
            return (
              <option key={c.id} value={c.id}>
                {completedChallenges.includes(c.id) ? "✔ " : "◆ "}
                {c.title} (+{c.xp} XP{rec ? ` · Nv${rec.level}` : ""})
              </option>
            );
          })}
        </select>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowJson((v) => !v)}
            className="rounded-md border border-edge px-3 py-1.5 font-mono text-xs text-muted hover:text-foreground"
          >
            {"{ } JSON"}
          </button>
          <button
            onClick={exportJson}
            disabled={nodes.length === 0}
            title="Baixa o fluxo em JSON para importar no n8n de verdade (menu ⋯ → Import from File)"
            className="rounded-md border border-edge px-3 py-1.5 text-xs text-muted hover:text-neon disabled:opacity-40"
          >
            ⬇ Exportar p/ n8n
          </button>
          <button
            onClick={resetCanvas}
            className="rounded-md border border-edge px-3 py-1.5 text-xs text-muted hover:text-danger"
          >
            🗑 Limpar
          </button>
          <button
            onClick={() => runFlow()}
            disabled={running || nodes.length === 0}
            className="rounded-md bg-neon px-4 py-1.5 text-xs font-bold text-background hover:brightness-110 disabled:opacity-40"
          >
            ▶ Executar Fluxo
          </button>
          {challenge && (
            <button
              onClick={validateChallenge}
              disabled={running || nodes.length === 0}
              className={`rounded-md bg-neon-2 px-4 py-1.5 text-xs font-bold text-background hover:brightness-110 disabled:opacity-40 ${
                liveChecks?.ok && !challengeDone ? "animate-pulse" : ""
              }`}
            >
              ✔ Validar Desafio
            </button>
          )}
        </div>
      </div>

      {/* Briefing do desafio + checklist ao vivo */}
      {challenge && (
        <div className="border-b border-edge bg-surface-2/50 px-4 py-2 text-xs">
          <span className="font-semibold text-neon-2">◆ {challenge.title}</span>
          {challengeDone && <span className="ml-2 text-success">✔ concluído</span>}
          {!challengeDone && challenge.recommendedAfter && (() => {
            const rec = getNode(challenge.recommendedAfter);
            return rec ? (
              <span className="ml-2 font-mono text-gold/80">
                🎓 recomendado após o módulo {rec.module}
              </span>
            ) : null;
          })()}
          <span className="ml-2 text-muted">{challenge.brief}</span>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px]">
            {(liveChecks?.checks ?? []).map((c, i) => (
              <span key={i} className={c.pass ? "text-success" : "text-muted"}>
                {c.pass ? "✔" : "○"} {c.label}
              </span>
            ))}
            {liveChecks?.ok && !challengeDone && (
              <span className="font-bold text-neon-2">
                ← tudo verde! Clique em ✔ Validar Desafio
              </span>
            )}
          </div>
          {challenge.hint && !challengeDone && !liveChecks?.ok && (
            <div className="mt-1 text-neon">💡 {challenge.hint}</div>
          )}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Paleta de nós — faixa única de rolagem horizontal no celular, coluna no desktop */}
        <aside className="w-full shrink-0 border-b border-edge bg-surface lg:w-52 lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <p className="px-3 pb-1 pt-3 font-mono text-[10px] uppercase tracking-widest text-muted">
            Paleta de Nós (+)
          </p>

          {/* Mobile: TODOS os nós visíveis, em linhas que quebram —
              rolagem horizontal escondia os nós e parecia que haviam sumido */}
          <div className="flex flex-wrap gap-1.5 px-3 pb-3 lg:hidden">
            {NODE_CATALOG.map((c) => (
              <button
                key={c.type}
                onClick={() => addNode(c.type)}
                title={c.desc}
                className="flex items-center gap-1 whitespace-nowrap rounded-md border border-edge bg-surface-2 px-2 py-1.5 text-[11px] active:border-neon/60"
              >
                <span>{c.icon}</span>
                {c.label}
              </button>
            ))}
          </div>

          {/* Desktop: colunas agrupadas por categoria */}
          <div className="hidden lg:block">
            {CATEGORIES.map((cat) => (
              <div key={cat} className="px-2 pb-2">
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
        <div className="relative h-[55vh] min-w-0 flex-none lg:h-auto lg:min-h-0 lg:flex-1">
          <TapConnectContext.Provider value={{ pending, onHandleTap }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onPaneClick={() => setPending(null)}
              isValidConnection={isValidConnection}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.25, maxZoom: 1.2, minZoom: 0.7 }}
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
          </TapConnectContext.Provider>

          {pending && (
            <div className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full border border-neon/50 bg-surface/95 px-4 py-1.5 text-xs font-semibold text-neon shadow-lg backdrop-blur">
              ● Toque na porta de destino para conectar (toque de novo para cancelar)
            </div>
          )}

          {(selNodeIds.length > 0 || hasSelEdge) && (
            <button
              onClick={deleteSelected}
              className="absolute right-3 top-3 z-10 rounded-md border border-danger/60 bg-surface/95 px-3 py-2 text-xs font-bold text-danger shadow-lg backdrop-blur active:bg-danger/10"
            >
              🗑 Remover {selNodeIds.length > 0 ? "nó" : "conexão"}
            </button>
          )}

          {nodes.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p className="max-w-sm text-center text-sm text-muted">
                Clique em um nó na paleta à esquerda para adicioná-lo ao canvas.
                <br />
                <span className="font-mono text-xs">
                  Fluxo principal: portas laterais (→). Sub-nós de IA: portas de
                  baixo (Model/Memory/Tool).
                </span>
                <br />
                <span className="text-xs">
                  Para conectar: arraste de uma porta à outra, ou toque em uma
                  e depois na outra.
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
            <WhatsAppWidget
              messages={chat}
              typing={typing}
              onSend={(text) => runFlow(text)}
              disabled={running || nodes.length === 0}
            />
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
