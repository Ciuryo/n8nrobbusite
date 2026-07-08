// Catálogo de nós do Sandbox (réplicas dos nós Advanced AI do n8n),
// tipos do grafo e o "compilador" que gera o JSON estilo n8n.

export type PortKind = "main" | "model" | "memory" | "tool" | "embedding";

export interface CatalogEntry {
  type: string;
  label: string;
  icon: string;
  category: string;
  desc: string;
  n8nType: string;
  /** portas de entrada no fluxo principal (esquerda) */
  mainIn: boolean;
  /** porta de saída no fluxo principal (direita) */
  mainOut: boolean;
  /** portas de recurso que este nó ACEITA (parte de baixo) */
  accepts: PortKind[];
  /** recurso que este nó FORNECE a outro nó (parte de cima) */
  provides: PortKind | null;
}

export const NODE_CATALOG: CatalogEntry[] = [
  {
    type: "whatsapp-trigger",
    label: "WhatsApp Trigger",
    icon: "💬",
    category: "Triggers",
    desc: "Recebe webhooks da WhatsApp Cloud API (mensagens do cliente).",
    n8nType: "n8n-nodes-base.whatsAppTrigger",
    mainIn: false,
    mainOut: true,
    accepts: [],
    provides: null,
  },
  {
    type: "ai-agent",
    label: "AI Agent",
    icon: "🤖",
    category: "IA Avançada",
    desc: "Agente orientado a objetivos (Tools Agent / ReAct). Requer um Chat Model.",
    n8nType: "@n8n/n8n-nodes-langchain.agent",
    mainIn: true,
    mainOut: true,
    accepts: ["model", "memory", "tool"],
    provides: null,
  },
  {
    type: "basic-chain",
    label: "Basic LLM Chain",
    icon: "⛓️",
    category: "IA Avançada",
    desc: "Cadeia linear de LLM: um prompt, uma resposta, sem autonomia.",
    n8nType: "@n8n/n8n-nodes-langchain.chainLlm",
    mainIn: true,
    mainOut: true,
    accepts: ["model"],
    provides: null,
  },
  {
    type: "openai-model",
    label: "OpenAI Chat Model",
    icon: "🧠",
    category: "Modelos",
    desc: "gpt-4o via API da OpenAI. Conecte à porta Model de um agente ou chain.",
    n8nType: "@n8n/n8n-nodes-langchain.lmChatOpenAi",
    mainIn: false,
    mainOut: false,
    accepts: [],
    provides: "model",
  },
  {
    type: "ollama-model",
    label: "Ollama Chat Model",
    icon: "🦙",
    category: "Modelos",
    desc: "Modelo local via Ollama (llama3). Sem custo por token.",
    n8nType: "@n8n/n8n-nodes-langchain.lmChatOllama",
    mainIn: false,
    mainOut: false,
    accepts: [],
    provides: "model",
  },
  {
    type: "window-memory",
    label: "Window Buffer Memory",
    icon: "🪟",
    category: "Memória",
    desc: "Retém as últimas N interações da sessão.",
    n8nType: "@n8n/n8n-nodes-langchain.memoryBufferWindow",
    mainIn: false,
    mainOut: false,
    accepts: [],
    provides: "memory",
  },
  {
    type: "redis-memory",
    label: "Redis Chat Memory",
    icon: "🗃️",
    category: "Memória",
    desc: "Histórico persistente em Redis, chaveado pelo Session ID (telefone).",
    n8nType: "@n8n/n8n-nodes-langchain.memoryRedisChat",
    mainIn: false,
    mainOut: false,
    accepts: [],
    provides: "memory",
  },
  {
    type: "qdrant-store",
    label: "Qdrant Vector Store",
    icon: "🧮",
    category: "RAG",
    desc: "Banco vetorial como ferramenta de recuperação. Requer Embeddings.",
    n8nType: "@n8n/n8n-nodes-langchain.vectorStoreQdrant",
    mainIn: false,
    mainOut: false,
    accepts: ["embedding"],
    provides: "tool",
  },
  {
    type: "pinecone-store",
    label: "Pinecone Vector Store",
    icon: "🌲",
    category: "RAG",
    desc: "Vector store gerenciado. Requer Embeddings.",
    n8nType: "@n8n/n8n-nodes-langchain.vectorStorePinecone",
    mainIn: false,
    mainOut: false,
    accepts: ["embedding"],
    provides: "tool",
  },
  {
    type: "openai-embeddings",
    label: "OpenAI Embeddings",
    icon: "📐",
    category: "RAG",
    desc: "text-embedding-3-small. Conecte à porta Embedding do vector store.",
    n8nType: "@n8n/n8n-nodes-langchain.embeddingsOpenAi",
    mainIn: false,
    mainOut: false,
    accepts: [],
    provides: "embedding",
  },
  {
    type: "custom-tool",
    label: "Custom Tool (Code)",
    icon: "🛠️",
    category: "Ferramentas",
    desc: "Ferramenta em JavaScript — ex.: calc_frete(cep) consultando SQL.",
    n8nType: "@n8n/n8n-nodes-langchain.toolCode",
    mainIn: false,
    mainOut: false,
    accepts: [],
    provides: "tool",
  },
  {
    type: "http-tool",
    label: "HTTP Request Tool",
    icon: "🌐",
    category: "Ferramentas",
    desc: "Transforma uma API REST em ferramenta invocável pelo agente.",
    n8nType: "@n8n/n8n-nodes-langchain.toolHttpRequest",
    mainIn: false,
    mainOut: false,
    accepts: [],
    provides: "tool",
  },
  {
    type: "code",
    label: "Code",
    icon: "{ }",
    category: "Utilidades",
    desc: "JavaScript para transformar itens { json: {...} } no fluxo principal.",
    n8nType: "n8n-nodes-base.code",
    mainIn: true,
    mainOut: true,
    accepts: [],
    provides: null,
  },
  {
    type: "whatsapp-send",
    label: "WhatsApp Send",
    icon: "📤",
    category: "Saída",
    desc: "Envia a resposta final ao cliente via Cloud API.",
    n8nType: "n8n-nodes-base.whatsApp",
    mainIn: true,
    mainOut: false,
    accepts: [],
    provides: null,
  },
];

export const CATALOG_BY_TYPE = Object.fromEntries(
  NODE_CATALOG.map((c) => [c.type, c])
);

export interface GraphNode {
  id: string;
  type: string; // type do catálogo
}

export interface GraphEdge {
  source: string;
  target: string;
  sourceHandle: string | null;
  targetHandle: string | null;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// ---------- helpers de topologia ----------

export function nodesOfType(g: Graph, type: string): GraphNode[] {
  return g.nodes.filter((n) => n.type === type);
}

/** ids dos nós que fornecem o recurso `kind` para o nó `targetId` */
export function providersOf(
  g: Graph,
  targetId: string,
  kind: PortKind
): GraphNode[] {
  return g.edges
    .filter((e) => e.target === targetId && e.targetHandle === `in-${kind}`)
    .map((e) => g.nodes.find((n) => n.id === e.source))
    .filter((n): n is GraphNode => !!n);
}

/** sucessor(es) no fluxo principal */
export function mainSuccessors(g: Graph, sourceId: string): GraphNode[] {
  return g.edges
    .filter((e) => e.source === sourceId && e.sourceHandle === "out-main")
    .map((e) => g.nodes.find((n) => n.id === e.target))
    .filter((n): n is GraphNode => !!n);
}

/** existe caminho no fluxo principal de `fromId` até um nó do tipo `toType`? */
export function mainPathReaches(
  g: Graph,
  fromId: string,
  toType: string
): boolean {
  const seen = new Set<string>();
  const stack = [fromId];
  while (stack.length) {
    const id = stack.pop()!;
    if (seen.has(id)) continue;
    seen.add(id);
    const node = g.nodes.find((n) => n.id === id);
    if (node && node.type === toType && id !== fromId) return true;
    for (const next of mainSuccessors(g, id)) stack.push(next.id);
  }
  return false;
}

// ---------- compilador de grafo → JSON estilo n8n ----------

const KIND_TO_N8N: Record<PortKind, string> = {
  main: "main",
  model: "ai_languageModel",
  memory: "ai_memory",
  tool: "ai_tool",
  embedding: "ai_embedding",
};

export function compileGraph(g: Graph): object {
  const nameOf = new Map<string, string>();
  const counts: Record<string, number> = {};
  for (const n of g.nodes) {
    const entry = CATALOG_BY_TYPE[n.type];
    const base = entry ? entry.label : n.type;
    counts[base] = (counts[base] ?? 0) + 1;
    nameOf.set(n.id, counts[base] > 1 ? `${base} ${counts[base]}` : base);
  }

  const connections: Record<string, Record<string, unknown[][]>> = {};
  for (const e of g.edges) {
    const srcName = nameOf.get(e.source);
    const tgtName = nameOf.get(e.target);
    if (!srcName || !tgtName) continue;
    const kind = (e.targetHandle?.replace("in-", "") ?? "main") as PortKind;
    const connType = KIND_TO_N8N[kind] ?? "main";
    connections[srcName] ??= {};
    connections[srcName][connType] ??= [[]];
    connections[srcName][connType][0].push({
      node: tgtName,
      type: connType,
      index: 0,
    });
  }

  return {
    name: "Fluxo do Sandbox — N8N Agentic Academy",
    nodes: g.nodes.map((n, i) => ({
      name: nameOf.get(n.id),
      type: CATALOG_BY_TYPE[n.type]?.n8nType ?? n.type,
      typeVersion: 1,
      position: [i * 220, 0],
    })),
    connections,
  };
}
