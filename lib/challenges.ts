// Desafios práticos validados contra a topologia do grafo do Sandbox.

import {
  type Graph,
  nodesOfType,
  providersOf,
  mainPathReaches,
} from "./sandbox";

export interface ValidationResult {
  ok: boolean;
  checks: { label: string; pass: boolean }[];
}

export interface Challenge {
  id: string;
  title: string;
  brief: string;
  /** mensagem que o "cliente" envia no simulador de WhatsApp */
  userMessage: string;
  /** resposta final esperada do bot quando o fluxo está correto */
  botReply: string;
  xp: number;
  acceptance: string[];
  /** dica exibida no Sandbox para orientar quem está travado */
  hint?: string;
  validate: (g: Graph) => ValidationResult;
}

function check(label: string, pass: boolean) {
  return { label, pass };
}

/** Regras básicas presentes em todos os desafios de chatbot */
function baseChatChecks(g: Graph) {
  const triggers = nodesOfType(g, "whatsapp-trigger");
  const agents = nodesOfType(g, "ai-agent");
  const senders = nodesOfType(g, "whatsapp-send");
  const agent = agents[0];

  const checks = [
    check("Possui exatamente 1 WhatsApp Trigger", triggers.length === 1),
    check("Possui um nó AI Agent", agents.length >= 1),
    check(
      "Trigger conectado (fluxo principal) até o AI Agent",
      !!triggers[0] && mainPathReaches(g, triggers[0].id, "ai-agent")
    ),
    check(
      "AI Agent possui um Chat Model conectado na porta Model",
      !!agent && providersOf(g, agent.id, "model").length >= 1
    ),
    check("Possui um nó WhatsApp Send", senders.length >= 1),
    check(
      "Saída do AI Agent chega ao WhatsApp Send",
      !!agent && mainPathReaches(g, agent.id, "whatsapp-send")
    ),
  ];
  return { checks, agent };
}

export const CHALLENGES: Challenge[] = [
  {
    id: "eco-bot",
    title: "Fluxo de Eco (seu primeiro fluxo!)",
    brief:
      "O menor fluxo útil que existe: receba a mensagem do cliente e devolva-a como eco. Sem IA — o objetivo é dominar o fluxo principal.",
    userMessage: "Olá! Tem alguém aí? 👀",
    botReply: 'Eco 🤖: "Olá! Tem alguém aí? 👀"',
    xp: 150,
    acceptance: [
      "1 WhatsApp Trigger recebendo o webhook",
      "Conexão do fluxo principal (main) do Trigger até o WhatsApp Send",
      "Nenhum nó de IA necessário",
    ],
    hint:
      "Clique em WhatsApp Trigger e WhatsApp Send na paleta e arraste uma conexão da porta direita (→) do Trigger até a porta esquerda do Send.",
    validate: (g) => {
      const triggers = nodesOfType(g, "whatsapp-trigger");
      const senders = nodesOfType(g, "whatsapp-send");
      const checks = [
        check("Possui exatamente 1 WhatsApp Trigger", triggers.length === 1),
        check("Possui um nó WhatsApp Send", senders.length >= 1),
        check(
          "Fluxo principal conectado do Trigger até o WhatsApp Send",
          !!triggers[0] && mainPathReaches(g, triggers[0].id, "whatsapp-send")
        ),
      ];
      return { ok: checks.every((c) => c.pass), checks };
    },
  },
  {
    id: "agente-whatsapp",
    title: "Primeiro Agente no WhatsApp",
    brief:
      "Monte o esqueleto mínimo de um chatbot agêntico: WhatsApp Trigger → AI Agent (com Chat Model) → WhatsApp Send.",
    userMessage: "Oi! Vocês estão abertos hoje?",
    botReply:
      "Olá! 👋 Sim, estamos abertos hoje das 9h às 18h. Posso ajudar com mais alguma coisa?",
    xp: 250,
    acceptance: [
      "1 WhatsApp Trigger recebendo o webhook",
      "AI Agent com um Chat Model (OpenAI ou Ollama) na porta Model",
      "Resposta roteada para o nó WhatsApp Send",
    ],
    hint:
      "O AI Agent entra ENTRE o Trigger e o Send no fluxo principal. O Chat Model é um sub-nó: conecte a porta de cima dele à porta Model (embaixo) do agente.",
    validate: (g) => {
      const { checks } = baseChatChecks(g);
      return { ok: checks.every((c) => c.pass), checks };
    },
  },
  {
    id: "memoria-persistente",
    title: "Sessão Persistente por Telefone",
    brief:
      "O bot precisa lembrar o contexto entre mensagens e sobreviver a reinícios do n8n: adicione Redis Chat Memory ao agente, com o telefone como Session ID.",
    userMessage: "Meu nome é Marina. Qual o status do meu pedido #4512?",
    botReply:
      "Perfeito, Marina! 📦 O pedido #4512 saiu para entrega e chega até amanhã. Vou lembrar do seu pedido se precisar de algo mais!",
    xp: 250,
    acceptance: [
      "Estrutura básica do chatbot (trigger → agente → send)",
      "Memória PERSISTENTE (Redis Chat Memory) conectada na porta Memory",
    ],
    hint:
      "Existem duas memórias na paleta — só uma sobrevive a reinícios do n8n. Conecte-a à porta Memory (embaixo) do AI Agent.",
    validate: (g) => {
      const { checks, agent } = baseChatChecks(g);
      const memories = agent ? providersOf(g, agent.id, "memory") : [];
      checks.push(
        check(
          "AI Agent possui memória conectada na porta Memory",
          memories.length >= 1
        ),
        check(
          "A memória é persistente (Redis Chat Memory, não Window Buffer)",
          memories.some((m) => m.type === "redis-memory")
        )
      );
      return { ok: checks.every((c) => c.pass), checks };
    },
  },
  {
    id: "rag-pipeline",
    title: "RAG de Catálogo de Produtos",
    brief:
      "O cliente pergunta o preço de um produto que está na base de conhecimento. Conecte um Vector Store (com Embeddings) como ferramenta do agente.",
    userMessage: "Quanto custa o Teclado Mecânico RGB TKL?",
    botReply:
      "O Teclado Mecânico RGB TKL custa R$ 349,90 à vista 💰 (fonte: catalogo-2026.pdf, seção Periféricos). Quer que eu calcule o frete?",
    xp: 300,
    acceptance: [
      "Estrutura básica do chatbot (trigger → agente → send)",
      "Vector Store (Qdrant ou Pinecone) conectado na porta Tool do agente",
      "Nó de Embeddings conectado ao Vector Store",
    ],
    hint:
      "São duas conexões de sub-nó: o Vector Store entra na porta Tool do agente, e o OpenAI Embeddings entra na porta Embedding do Vector Store.",
    validate: (g) => {
      const { checks, agent } = baseChatChecks(g);
      const tools = agent ? providersOf(g, agent.id, "tool") : [];
      const stores = tools.filter(
        (t) => t.type === "qdrant-store" || t.type === "pinecone-store"
      );
      checks.push(
        check(
          "Vector Store conectado na porta Tool do AI Agent",
          stores.length >= 1
        ),
        check(
          "Vector Store possui Embeddings conectado",
          stores.some(
            (s) => providersOf(g, s.id, "embedding").length >= 1
          )
        )
      );
      return { ok: checks.every((c) => c.pass), checks };
    },
  },
  {
    id: "custom-tool-frete",
    title: "Custom Tool: Cálculo de Frete",
    brief:
      "Transforme a API legada de frete em uma ferramenta que o agente invoca sozinho: adicione um Custom Tool (Code) calc_frete(cep, sku).",
    userMessage: "Quanto fica o frete do SKU TEC-021 para o CEP 01310-100?",
    botReply:
      "O frete do TEC-021 para 01310-100 fica em R$ 22,50 com entrega em 2 dias úteis 🚚. Posso fechar o pedido?",
    xp: 250,
    acceptance: [
      "Estrutura básica do chatbot (trigger → agente → send)",
      "Custom Tool (Code) conectado na porta Tool do agente",
    ],
    hint:
      "Adicione o Custom Tool (Code) da categoria Ferramentas e conecte a porta de cima dele à porta Tool (embaixo) do AI Agent.",
    validate: (g) => {
      const { checks, agent } = baseChatChecks(g);
      const tools = agent ? providersOf(g, agent.id, "tool") : [];
      checks.push(
        check(
          "Custom Tool (Code) conectado na porta Tool do AI Agent",
          tools.some((t) => t.type === "custom-tool")
        )
      );
      return { ok: checks.every((c) => c.pass), checks };
    },
  },
];

export function getChallenge(id: string): Challenge | undefined {
  return CHALLENGES.find((c) => c.id === id);
}
