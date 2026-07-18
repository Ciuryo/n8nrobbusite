// Motor de simulação: analisa a topologia do grafo e gera o traço de
// execução passo a passo (estilo ReAct) + a resposta que chega ao WhatsApp.

import {
  type Graph,
  CATALOG_BY_TYPE,
  nodesOfType,
  providersOf,
  mainPathReaches,
} from "./sandbox";
import type { Challenge } from "./challenges";

export type LogTone = "info" | "thought" | "action" | "observation" | "error" | "success";

export interface LogStep {
  tag: string;
  text: string;
  tone: LogTone;
}

export interface SimulationResult {
  steps: LogStep[];
  userMessage: string;
  botReply: string | null;
  ok: boolean;
}

const DEFAULT_USER_MESSAGE = "Olá! Preciso de ajuda com um pedido.";
const DEFAULT_REPLY =
  "Olá! 👋 Sou o assistente virtual. Como posso ajudar com o seu pedido?";

export function simulate(g: Graph, challenge?: Challenge | null): SimulationResult {
  const steps: LogStep[] = [];
  const userMessage = challenge?.userMessage ?? DEFAULT_USER_MESSAGE;
  const fail = (tag: string, text: string): SimulationResult => {
    steps.push({ tag, text, tone: "error" });
    return { steps, userMessage, botReply: null, ok: false };
  };

  const trigger = nodesOfType(g, "whatsapp-trigger")[0];
  if (!trigger) {
    return fail(
      "Runtime",
      "Nenhum nó de gatilho encontrado. Adicione um WhatsApp Trigger para receber o webhook."
    );
  }

  steps.push({
    tag: "Webhook",
    text: `POST /webhook — payload recebido: { from: "+55 11 98765-4321", text: "${userMessage}" }`,
    tone: "info",
  });
  steps.push({
    tag: "Webhook",
    text: "Handshake OK · message.id deduplicado · 200 devolvido à Meta em 41ms",
    tone: "observation",
  });

  const agent = nodesOfType(g, "ai-agent")[0];
  const chain = nodesOfType(g, "basic-chain")[0];
  const brain = agent ?? chain;

  if (!brain) {
    // Fluxo de eco (Nível 0): Trigger → Send direto, sem IA
    if (mainPathReaches(g, trigger.id, "whatsapp-send")) {
      steps.push({
        tag: "Flow",
        text: "Nenhum nó de IA no fluxo — modo eco: o item { json: { from, text } } segue direto pelo fluxo principal.",
        tone: "info",
      });
      steps.push({
        tag: "Flow",
        text: "Texto recebido repassado ao nó de saída sem transformação",
        tone: "action",
      });
      steps.push({
        tag: "WhatsApp",
        text: 'POST /v19.0/{phone-number-id}/messages → 200 { "messages": [{ "id": "wamid.HBg..." }] }',
        tone: "success",
      });
      return {
        steps,
        userMessage,
        botReply: `Eco 🤖: "${userMessage}"`,
        ok: true,
      };
    }
    return fail(
      "Runtime",
      "O payload chegou, mas não há caminho até uma saída. Conecte o Trigger a um nó de IA (AI Agent / Basic LLM Chain) — ou, para um eco simples, direto ao WhatsApp Send."
    );
  }

  if (!mainPathReaches(g, trigger.id, brain.type)) {
    return fail(
      "Runtime",
      `O ${CATALOG_BY_TYPE[brain.type].label} existe no canvas, mas não está conectado ao fluxo principal do Trigger. Arraste a conexão main (→).`
    );
  }

  const models = providersOf(g, brain.id, "model");
  if (models.length === 0) {
    return fail(
      "NodeOperationError",
      `${CATALOG_BY_TYPE[brain.type].label}: nenhum Chat Model conectado na porta Model. Um agente sem modelo é um corpo sem cérebro.`
    );
  }
  const modelLabel = CATALOG_BY_TYPE[models[0].type].label;
  steps.push({
    tag: "Model",
    text: `${modelLabel} inicializado (temperature=0.2, maxTokens=512)`,
    tone: "info",
  });

  // memória
  const memories = agent ? providersOf(g, agent.id, "memory") : [];
  if (memories.length > 0) {
    const mem = CATALOG_BY_TYPE[memories[0].type];
    const persistent = memories[0].type === "redis-memory";
    steps.push({
      tag: "Memory",
      text: `${mem.label}: sessão "+5511987654321" carregada — ${
        persistent
          ? "3 mensagens anteriores restauradas do Redis (TTL 24h)"
          : "janela das últimas 5 interações em RAM"
      }`,
      tone: "observation",
    });
  }

  if (!agent) {
    // chain linear
    steps.push({
      tag: "Chain",
      text: "Basic LLM Chain: prompt montado e enviado ao modelo (execução única, sem tools)",
      tone: "action",
    });
  } else {
    const tools = providersOf(g, agent.id, "tool");
    steps.push({
      tag: "Agent",
      text: `AI Agent iniciado (Tools Agent) com ${tools.length} ferramenta(s) registrada(s): ${
        tools.length
          ? tools.map((t) => CATALOG_BY_TYPE[t.type].label).join(", ")
          : "nenhuma"
      }`,
      tone: "info",
    });
    steps.push({
      tag: "Agent",
      text: `Pensamento: o cliente disse "${userMessage}". Preciso decidir se respondo direto ou uso uma ferramenta.`,
      tone: "thought",
    });

    // RAG
    const stores = tools.filter(
      (t) => t.type === "qdrant-store" || t.type === "pinecone-store"
    );
    for (const store of stores) {
      const storeLabel = CATALOG_BY_TYPE[store.type].label;
      const embeddings = providersOf(g, store.id, "embedding");
      if (embeddings.length === 0) {
        return fail(
          "NodeOperationError",
          `${storeLabel}: nenhum nó de Embeddings conectado. Sem embeddings não há como vetorizar a consulta.`
        );
      }
      steps.push({
        tag: "Agent",
        text: `Pensamento: a resposta pode estar na base de conhecimento. Chamando Tool: ${storeLabel.toLowerCase().replace(/ /g, "_")}...`,
        tone: "thought",
      });
      steps.push({
        tag: "Tool",
        text: `${storeLabel}: consulta embeddada via ${CATALOG_BY_TYPE[embeddings[0].type].label} → busca por similaridade (cosine, top_k=4)`,
        tone: "action",
      });
      steps.push({
        tag: "Tool",
        text: 'Observação: 3 chunks recuperados (scores 0.89 / 0.84 / 0.81) — metadados: { fonte: "catalogo-2026.pdf" }',
        tone: "observation",
      });
    }

    // custom tools
    const customTools = tools.filter(
      (t) => t.type === "custom-tool" || t.type === "http-tool"
    );
    for (const tool of customTools) {
      const label = CATALOG_BY_TYPE[tool.type].label;
      const isHttp = tool.type === "http-tool";
      steps.push({
        tag: "Agent",
        text: `Pensamento: preciso de dados externos. Chamando Tool: ${
          isHttp ? "consulta_api" : "calc_frete"
        }...`,
        tone: "thought",
      });
      steps.push({
        tag: "Tool",
        text: isHttp
          ? `${label}: GET https://api.interna.empresa/v1/pedidos → 200 OK (134ms)`
          : `${label}: calc_frete("01310-100", "TEC-021") → { valor: 22.5, prazo_dias: 2 }`,
        tone: "action",
      });
      steps.push({
        tag: "Tool",
        text: "Observação: retorno compacto devolvido ao contexto do agente",
        tone: "observation",
      });
    }

    steps.push({
      tag: "Agent",
      text: "Pensamento: tenho tudo o que preciso. Gerando resposta final para o cliente.",
      tone: "thought",
    });
  }

  const botReply = challenge?.botReply ?? DEFAULT_REPLY;
  steps.push({
    tag: brain.type === "ai-agent" ? "Agent" : "Chain",
    text: `Resposta final gerada (${Math.floor(botReply.length / 3.5)} tokens de saída)`,
    tone: "success",
  });

  if (memories.length > 0) {
    steps.push({
      tag: "Memory",
      text: "Turno usuário+assistente gravado na sessão",
      tone: "observation",
    });
  }

  const sender = nodesOfType(g, "whatsapp-send")[0];
  if (!sender || !mainPathReaches(g, brain.id, "whatsapp-send")) {
    return fail(
      "Runtime",
      "A resposta foi gerada, mas não há um nó WhatsApp Send conectado à saída — o cliente ficou no vácuo."
    );
  }

  steps.push({
    tag: "WhatsApp",
    text: 'POST /v19.0/{phone-number-id}/messages → 200 { "messages": [{ "id": "wamid.HBg..." }] }',
    tone: "success",
  });

  return { steps, userMessage, botReply, ok: true };
}
