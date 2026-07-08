# N8N Agentic Academy

Plataforma web gamificada de treinamento avançado em **Inteligência Artificial, RAG e orquestração de agentes no n8n** — ideias para iniciantes e times inteiros dominarem os Nós Advanced AI (LangChain) aplicados a chatbots de **WhatsApp**.

Implementação do blueprint técnico do projeto: LMS gamificado (árvore de habilidades estilo RPG) + Sandbox interativo baseado em nós (React Flow) com simulador de WhatsApp em tempo real.

## Funcionalidades

- **Onboarding / Criação de Personagem** — escolha de classe de especialização (Prompt Engineer, RAG & Data Engineer, Agent Architect, com +20% XP na trilha favorita) e questionário de nivelamento opcional que credita os módulos básicos do Nível 1.
- **Árvore de Habilidades** — 13 competências em 6 níveis com dependências de aprendizado; estados Bloqueado / Disponível (borda neon pulsante) / Concluído (dourado com insígnia). Conteúdo completo por módulo + quiz de validação.
- **Sandbox Interativo (Mock-n8n)** — canvas React Flow com paleta de nós replicando o ecossistema Advanced AI (AI Agent, Chains, OpenAI/Ollama Chat Model, Qdrant/Pinecone Vector Store, Window Buffer/Redis Memory, Custom Tool, HTTP Tool…), com portas tipadas (Model/Memory/Tool/Embedding) e compilador de grafo → JSON no formato n8n.
- **Simulador de WhatsApp acoplado** — widget estilo WhatsApp Web que limpa o histórico e simula a perspectiva do cliente ao executar o fluxo, com terminal exibindo o traço ReAct do agente (Thought → Action → Observation) passo a passo.
- **Desafios práticos validados** — 4 desafios ("Primeiro Agente", "Sessão Persistente Redis", "RAG de Catálogo", "Custom Tool de Frete") com critérios de aceitação checados contra a topologia do grafo e XP ao validar.
- **Painel do Gestor** — matriz de competências em radar (equipe vs. você), leaderboard, taxa de acerto de 1ª tentativa e consumo de tokens simulados.

## Stack

- Next.js 16 (App Router) + TypeScript
- TailwindCSS 4 (tema dark industrial/cyberpunk)
- React Flow (`@xyflow/react`) para o canvas de fluxos
- Zustand (persistência de progresso/XP em `localStorage`)

## Rodando

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # build de produção
```

## Estrutura

```
app/
  page.tsx            # landing + visão geral do currículo
  onboarding/         # criação de personagem + nivelamento
  skills/             # árvore de habilidades (mapa com dependências)
  module/[id]/        # lição + quiz + link para o desafio prático
  sandbox/            # canvas React Flow + WhatsApp + terminal ReAct
  team/               # painel do gestor (radar + leaderboard)
lib/
  curriculum.ts       # matriz curricular (6 níveis, quizzes, XP, deps)
  sandbox.ts          # catálogo de nós, topologia e compilador de grafo
  challenges.ts       # desafios e validação por critérios de aceitação
  simulator.ts        # motor de simulação (traço ReAct + resposta)
  store.ts            # estado global persistido (Zustand)
```

Todo o ambiente é 100% simulado — nenhuma credencial de produção é necessária ou exposta.
