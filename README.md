# RobbuGameN8N

Plataforma web gamificada de treinamento avançado em **Inteligência Artificial, RAG e orquestração de agentes no n8n** — ideias para iniciantes e times inteiros dominarem os Nós Advanced AI (LangChain) aplicados a chatbots de **WhatsApp**.

Implementação do blueprint técnico do projeto: LMS gamificado (árvore de habilidades estilo RPG) + Sandbox interativo baseado em nós (React Flow) com simulador de WhatsApp em tempo real.

## Funcionalidades

- **Nível 0 — Introdução para iniciantes** — quem nunca abriu o n8n começa pelo zero absoluto: o que é o n8n, o que são nós/gatilhos/fluxos, e um primeiro desafio de eco no Sandbox (WhatsApp Trigger → WhatsApp Send, sem IA) para dominar o fluxo principal antes de qualquer conceito avançado.
- **Onboarding / Criação de Personagem** — trilha explícita de iniciante ("Começar pela introdução"), escolha de classe de especialização (Prompt Engineer, RAG & Data Engineer, Agent Architect, com +20% XP na trilha favorita) e questionário de nivelamento opcional que credita a introdução e os módulos básicos do Nível 1.
- **Árvore de Habilidades** — 15 competências em 7 níveis (0–6) com dependências de aprendizado; estados Bloqueado / Disponível (borda neon pulsante) / Concluído (dourado com insígnia); indicador "▶ comece/continue aqui" apontando o próximo nó sugerido. Conteúdo completo por módulo + quiz de validação + sugestão de próximo módulo ao concluir.
- **Sandbox Interativo (Mock-n8n)** — canvas React Flow com paleta de nós replicando o ecossistema Advanced AI (AI Agent, Chains, OpenAI/Ollama Chat Model, Qdrant/Pinecone Vector Store, Window Buffer/Redis Memory, Custom Tool, HTTP Tool…), com portas tipadas (Model/Memory/Tool/Embedding), dicas por desafio e compilador de grafo → JSON no formato n8n.
- **Simulador de WhatsApp acoplado** — widget estilo WhatsApp Web que limpa o histórico e simula a perspectiva do cliente ao executar o fluxo, com terminal exibindo o traço ReAct do agente (Thought → Action → Observation) passo a passo. Fluxos sem IA rodam em "modo eco".
- **Prática em TODA fase** — cada nível (0–6) termina montando um workflow real no Sandbox: eco sem IA (Nv0), extração de payload com Code (Nv1), Basic LLM Chain (Nv2), RAG (Nv3), Redis Memory (Nv4), Custom Tool e Agente (Nv5) e Guardrail com Text Classifier (Nv6).
- **Desafios práticos validados** — 11 desafios com checklist de critérios **em tempo real** no canvas: construção, **conserto de fluxos quebrados** ("Agente Sem Cérebro", "RAG Sem Embeddings" — fluxo defeituoso pré-carregado para depurar) e o **desafio BOSS final** combinando agente + Redis + RAG + Custom Tool (+500 XP).
- **Arquiteto de Projetos (Meu Projeto)** — o jogador descreve a própria ideia e uma base de conhecimento embutida de padrões n8n (recepção, guardrail, agente, memória, RAG, ferramentas, resiliência) gera o blueprint com justificativas, a trilha de estudo ligada à árvore e um desafio personalizado no Sandbox (+400 XP) — tudo offline, sem backend.
- **Exportação para o n8n real** — botão "⬇ Exportar p/ n8n" baixa o fluxo montado como JSON pronto para importar no n8n de verdade; o blueprint do Meu Projeto também exporta o fluxo completo já conectado.
- **Sensação de jogo** — 13 conquistas com Sala de Troféus na Base, toasts de +XP/patente, confete nas vitórias, sequência diária (🔥 streak) com bônus de XP e canvas do Sandbox persistido automaticamente.
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
npm run build   # export estático em out/ (sirva com: npx serve out)
```

## App de celular (PWA) — grátis

O site é um **Progressive Web App** com deploy automático no GitHub Pages
(workflow em `.github/workflows/deploy-pages.yml`):

**https://ciuryo.github.io/RobbuGameN8N/**

Para instalar no celular (sem loja, sem custo):

- **Android (Chrome)**: abra o link → menu ⋮ → **"Adicionar à tela inicial"** / **"Instalar app"**.
- **iPhone (Safari)**: abra o link → botão Compartilhar → **"Adicionar à Tela de Início"**.

O app abre em tela cheia com ícone próprio, funciona offline após a primeira
visita (service worker) e o progresso fica salvo no aparelho (`localStorage`).

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
  curriculum.ts       # matriz curricular (níveis 0–6, quizzes, XP, deps)
  sandbox.ts          # catálogo de nós, topologia e compilador de grafo
  challenges.ts       # desafios e validação por critérios de aceitação
  simulator.ts        # motor de simulação (traço ReAct + resposta)
  store.ts            # estado global persistido (Zustand)
```

Todo o ambiente é 100% simulado — nenhuma credencial de produção é necessária ou exposta.
