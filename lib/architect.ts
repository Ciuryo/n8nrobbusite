// Arquiteto de Projetos: a "memória" de padrões n8n do jogo.
// Analisa a ideia do jogador (offline, sem backend) e monta o blueprint
// com os melhores fluxos: nós do canvas, justificativas e trilha de estudo.

import {
  type Graph,
  nodesOfType,
  providersOf,
  mainPathReaches,
} from "./sandbox";
import type { Challenge, ValidationResult } from "./challenges";

export interface ArchFeature {
  id: string;
  icon: string;
  title: string;
  /** por que este bloco é a melhor prática (didático) */
  why: string;
  /** tipos de nó do catálogo que entram no canvas */
  nodes: string[];
  /** módulos da árvore recomendados para estudar */
  modules: string[];
  /** gatilhos na ideia; ausente = bloco essencial (sempre entra) */
  keywords?: string[];
  /** nome sugerido da ferramenta, quando o bloco é uma tool */
  toolName?: string;
}

/** Base de conhecimento: padrões de arquitetura n8n, na ordem do pipeline */
export const ARCH_FEATURES: ArchFeature[] = [
  {
    id: "recepcao",
    icon: "💬",
    title: "Recepção e Resposta (WhatsApp)",
    why: "Todo atendimento começa recebendo o webhook (com deduplicação por message.id e resposta 200 imediata à Meta) e termina enviando a resposta pela Cloud API.",
    nodes: ["whatsapp-trigger", "whatsapp-send"],
    modules: ["n8n-basics", "first-workflow", "json-mastery", "webhooks-whatsapp"],
  },
  {
    id: "guardrail",
    icon: "🛡️",
    title: "Guardrail de Entrada",
    why: "Valide o input ANTES do agente: um classificador barato filtra abuso e prompt injection antes de gastar tokens — defesa em profundidade.",
    nodes: ["text-classifier"],
    modules: ["guardrails"],
  },
  {
    id: "cerebro",
    icon: "🤖",
    title: "Cérebro Agêntico",
    why: "O AI Agent decide quando responder direto e quando invocar ferramentas. Temperatura baixa (0–0.3) para atendimento e Max Iterations configurado.",
    nodes: ["ai-agent", "openai-model"],
    modules: ["llm-nodes", "prompt-engineering", "ai-agent"],
  },
  {
    id: "memoria",
    icon: "🗃️",
    title: "Memória Persistente por Cliente",
    why: "Session ID = telefone do remetente; Redis com TTL de 24h (alinhado à janela do WhatsApp) sobrevive a reinícios e escala para múltiplos workers.",
    nodes: ["redis-memory"],
    modules: ["memory-types", "session-persistence"],
  },
  {
    id: "rag",
    icon: "📚",
    title: "Base de Conhecimento (RAG)",
    why: "O conteúdo do seu negócio vira chunks embeddados em um vector store; o agente busca por similaridade e responde citando a fonte — sem alucinar.",
    nodes: ["qdrant-store", "openai-embeddings"],
    modules: ["document-loaders", "vector-stores", "retrieval"],
    keywords: [
      "catalogo", "produto", "produtos", "cardapio", "menu", "faq",
      "duvida", "duvidas", "manual", "documento", "documentos", "pdf",
      "preco", "precos", "conhecimento", "curso", "aula", "aulas",
      "regras", "politica", "politicas", "servicos", "portfolio",
    ],
  },
  {
    id: "agendamento",
    icon: "📅",
    title: "Ferramenta: Agendamento",
    why: "Uma Custom Tool com descrição semântica clara — o agente a invoca quando o cliente pede horário e devolve a confirmação em retorno compacto.",
    nodes: ["custom-tool"],
    modules: ["custom-tools"],
    toolName: "agendar_horario(data, servico)",
    keywords: [
      "agendar", "agenda", "agendamento", "horario", "horarios",
      "consulta", "consultas", "reserva", "reservar", "marcar",
    ],
  },
  {
    id: "pedidos",
    icon: "📦",
    title: "Ferramenta: Consulta de Pedidos",
    why: "O telefone da SESSÃO (nunca o ditado na mensagem) identifica o cliente — menor privilégio: ninguém consulta pedido alheio.",
    nodes: ["custom-tool"],
    modules: ["custom-tools", "guardrails"],
    toolName: "consultar_pedido(telefone_da_sessao)",
    keywords: ["pedido", "pedidos", "rastrear", "rastreio", "status", "encomenda"],
  },
  {
    id: "frete",
    icon: "🚚",
    title: "Ferramenta: Cálculo de Frete",
    why: "calc_frete(cep, sku) consulta sua tabela e devolve { valor, prazo } — erros viram mensagens curtas e acionáveis ('CEP inválido').",
    nodes: ["custom-tool"],
    modules: ["custom-tools"],
    toolName: "calc_frete(cep, sku)",
    keywords: ["frete", "cep", "envio", "correios", "entrega", "entregas", "delivery"],
  },
  {
    id: "pagamento",
    icon: "💳",
    title: "Ferramenta: Cobrança",
    why: "O agente gera o link/PIX pela ferramenta, mas o VALOR vem do sistema — nunca do texto do modelo. Valide o output antes de enviar.",
    nodes: ["custom-tool"],
    modules: ["custom-tools", "guardrails"],
    toolName: "gerar_cobranca(pedido_id)",
    keywords: ["pagamento", "pagar", "pix", "cobranca", "cobrar", "boleto", "cartao"],
  },
  {
    id: "estoque",
    icon: "📊",
    title: "Ferramenta: Estoque",
    why: "consulta_estoque(sku) responde disponibilidade em tempo real — retorno compacto para não estourar o contexto do agente.",
    nodes: ["custom-tool"],
    modules: ["custom-tools"],
    toolName: "consultar_estoque(sku)",
    keywords: ["estoque", "disponibilidade", "disponivel", "disponiveis"],
  },
  {
    id: "integracao",
    icon: "🌐",
    title: "Ferramenta: Integração com Sistemas",
    why: "O HTTP Request Tool transforma sua API/CRM/planilha em ferramenta invocável — o agente lê a descrição e decide quando chamar.",
    nodes: ["http-tool"],
    modules: ["custom-tools"],
    toolName: "api_interna(recurso)",
    keywords: [
      "api", "sistema", "sistemas", "crm", "erp", "planilha", "planilhas",
      "sheets", "integracao", "integrar", "banco de dados", "notion",
    ],
  },
  {
    id: "resiliencia",
    icon: "🛟",
    title: "Resiliência de Produção",
    why: "Fallback de provedor, workflow com Error Trigger, retries com idempotência e ack rápido ao webhook — o fluxo degrada com elegância, nunca em silêncio.",
    nodes: [],
    modules: ["error-handling"],
  },
];

/** Blocos essenciais que entram em qualquer projeto */
const ESSENTIAL_IDS = ["recepcao", "guardrail", "cerebro", "memoria", "resiliencia"];

export interface ProjectBlueprint {
  idea: string;
  featureIds: string[];
  /** palavras da ideia que ativaram cada bloco */
  matches: Record<string, string[]>;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Analisa a ideia e monta o blueprint com os padrões detectados */
export function analyzeIdea(idea: string): ProjectBlueprint {
  const text = normalize(idea);
  const featureIds: string[] = [];
  const matches: Record<string, string[]> = {};

  for (const f of ARCH_FEATURES) {
    if (!f.keywords) {
      if (ESSENTIAL_IDS.includes(f.id)) featureIds.push(f.id);
      continue;
    }
    const hits = f.keywords.filter((kw) =>
      new RegExp(`\\b${kw}\\b`).test(text)
    );
    if (hits.length > 0) {
      featureIds.push(f.id);
      matches[f.id] = hits;
    }
  }

  // ordena na ordem canônica do pipeline
  featureIds.sort(
    (a, b) =>
      ARCH_FEATURES.findIndex((f) => f.id === a) -
      ARCH_FEATURES.findIndex((f) => f.id === b)
  );
  return { idea: idea.trim(), featureIds, matches };
}

export function featuresOf(bp: ProjectBlueprint): ArchFeature[] {
  return bp.featureIds
    .map((id) => ARCH_FEATURES.find((f) => f.id === id))
    .filter((f): f is ArchFeature => !!f);
}

// ---------- persistência local ----------

const PROJECT_KEY = "robbu-project-v1";

export function saveProject(bp: ProjectBlueprint) {
  try {
    localStorage.setItem(PROJECT_KEY, JSON.stringify(bp));
  } catch {
    /* armazenamento indisponível */
  }
}

export function loadProject(): ProjectBlueprint | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROJECT_KEY);
    if (!raw) return null;
    const bp = JSON.parse(raw);
    return typeof bp.idea === "string" && Array.isArray(bp.featureIds)
      ? bp
      : null;
  } catch {
    return null;
  }
}

export function clearProject() {
  try {
    localStorage.removeItem(PROJECT_KEY);
  } catch {
    /* ok */
  }
}

// ---------- grafo pronto (exportação) ----------

/** Monta o Graph completo do blueprint (para exportar como JSON do n8n) */
export function blueprintToGraph(bp: ProjectBlueprint): Graph {
  const feats = featuresOf(bp);
  const has = (id: string) => feats.some((f) => f.id === id);
  const nodes: Graph["nodes"] = [];
  const edges: Graph["edges"] = [];
  const main = (a: string, b: string) =>
    edges.push({ source: a, target: b, sourceHandle: "out-main", targetHandle: "in-main" });
  const sub = (a: string, b: string, kind: string) =>
    edges.push({ source: a, target: b, sourceHandle: `out-${kind}`, targetHandle: `in-${kind}` });

  nodes.push({ id: "t", type: "whatsapp-trigger" });
  nodes.push({ id: "a", type: "ai-agent" });
  nodes.push({ id: "s", type: "whatsapp-send" });
  nodes.push({ id: "m", type: "openai-model" });
  sub("m", "a", "model");
  nodes.push({ id: "r", type: "redis-memory" });
  sub("r", "a", "memory");

  if (has("guardrail")) {
    nodes.push({ id: "g", type: "text-classifier" });
    main("t", "g");
    main("g", "a");
  } else {
    main("t", "a");
  }
  main("a", "s");

  if (has("rag")) {
    nodes.push({ id: "q", type: "qdrant-store" });
    nodes.push({ id: "e", type: "openai-embeddings" });
    sub("q", "a", "tool");
    sub("e", "q", "embedding");
  }

  let ti = 0;
  for (const f of feats) {
    if (!f.toolName) continue;
    const id = `tool${ti++}`;
    nodes.push({ id, type: f.nodes[0] });
    sub(id, "a", "tool");
  }
  return { nodes, edges };
}

// ---------- desafio dinâmico no Sandbox ----------

function check(label: string, pass: boolean) {
  return { label, pass };
}

/** Constrói o desafio "Meu Projeto" a partir do blueprint salvo */
export function buildProjectChallenge(bp: ProjectBlueprint): Challenge {
  const feats = featuresOf(bp);
  const has = (id: string) => feats.some((f) => f.id === id);
  const toolFeats = feats.filter((f) => f.toolName);
  const requiredTools = Math.min(toolFeats.length, 2);
  const resumo =
    bp.idea.length > 60 ? bp.idea.slice(0, 57) + "…" : bp.idea;

  const acceptance = [
    "Estrutura básica: Trigger → AI Agent (com Chat Model) → Send",
    "Guardrail (Text Classifier) entre o Trigger e o Agente",
    "Memória persistente (Redis) na porta Memory",
  ];
  if (has("rag")) acceptance.push("Vector Store com Embeddings na porta Tool");
  if (requiredTools > 0)
    acceptance.push(
      `${requiredTools}+ ferramenta(s): ${toolFeats.map((f) => f.toolName).join(", ")}`
    );

  return {
    id: "meu-projeto",
    title: `🚀 Meu Projeto: ${resumo}`,
    brief:
      "Monte a arquitetura que o Arquiteto desenhou para a SUA ideia — cada bloco do blueprint vira um critério do checklist.",
    userMessage: "Olá! Vi o anúncio de vocês — podem me ajudar? 🙂",
    botReply:
      "Olá! 👋 Aqui é o assistente do seu projeto em ação: guardrail ativo, memória por cliente e ferramentas prontas. Este fluxo é o blueprint que você desenhou — exporte o JSON e leve para o n8n real! 🚀",
    xp: 400,
    acceptance,
    hint:
      "Siga a ordem do blueprint na página Meu Projeto: fluxo principal primeiro (Trigger → Guardrail → Agente → Send), depois os sub-nós pelas portas de baixo.",
    validate: (g: Graph): ValidationResult => {
      const triggers = nodesOfType(g, "whatsapp-trigger");
      const agents = nodesOfType(g, "ai-agent");
      const agent = agents[0];
      const guards = nodesOfType(g, "text-classifier");
      const senders = nodesOfType(g, "whatsapp-send");
      const memories = agent ? providersOf(g, agent.id, "memory") : [];
      const tools = agent ? providersOf(g, agent.id, "tool") : [];
      const stores = tools.filter(
        (t) => t.type === "qdrant-store" || t.type === "pinecone-store"
      );
      const workTools = tools.filter(
        (t) => t.type === "custom-tool" || t.type === "http-tool"
      );

      const checks = [
        check("Possui exatamente 1 WhatsApp Trigger", triggers.length === 1),
        check("Possui um nó AI Agent", agents.length >= 1),
        check(
          "AI Agent possui um Chat Model na porta Model",
          !!agent && providersOf(g, agent.id, "model").length >= 1
        ),
        check("Possui um nó WhatsApp Send", senders.length >= 1),
        check(
          "Saída do AI Agent chega ao WhatsApp Send",
          !!agent && mainPathReaches(g, agent.id, "whatsapp-send")
        ),
        check(
          "Text Classifier entre o Trigger e o Agente",
          guards.length >= 1 &&
            !!triggers[0] &&
            mainPathReaches(g, triggers[0].id, "text-classifier") &&
            guards.some((n) => mainPathReaches(g, n.id, "ai-agent"))
        ),
        check(
          "Memória persistente (Redis) na porta Memory",
          memories.some((m) => m.type === "redis-memory")
        ),
      ];
      if (has("rag")) {
        checks.push(
          check(
            "Vector Store com Embeddings na porta Tool",
            stores.length >= 1 &&
              stores.some((s) => providersOf(g, s.id, "embedding").length >= 1)
          )
        );
      }
      if (requiredTools > 0) {
        const names = toolFeats
          .map((f) => f.toolName?.split("(")[0])
          .filter(Boolean)
          .join(", ");
        checks.push(
          check(
            `Pelo menos ${requiredTools} ferramenta(s) na porta Tool — sugeridas: ${names}`,
            workTools.length >= requiredTools
          )
        );
      }
      return { ok: checks.every((c) => c.pass), checks };
    },
  };
}

/** Desafio do projeto salvo, se existir (uso no Sandbox) */
export function loadProjectChallenge(): Challenge | null {
  const bp = loadProject();
  return bp ? buildProjectChallenge(bp) : null;
}
