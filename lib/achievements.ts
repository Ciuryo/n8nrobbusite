// Conquistas do RobbuGameN8N — derivadas do estado do jogador (função pura).

import { SKILL_TREE, TOTAL_XP } from "./curriculum";
import { CHALLENGES } from "./challenges";

export interface PlayerSnapshot {
  xp: number;
  completedNodes: string[];
  completedChallenges: string[];
  firstTryPasses: number;
  streakDays: number;
}

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  desc: string;
  earned: (s: PlayerSnapshot) => boolean;
}

const has = (list: string[], ...ids: string[]) =>
  ids.every((id) => list.includes(id));

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "primeiro-no",
    icon: "🌱",
    title: "Primeiro Passo",
    desc: "Domine sua primeira competência da árvore.",
    earned: (s) => s.completedNodes.length >= 1,
  },
  {
    id: "intro-completa",
    icon: "🧭",
    title: "Bem-vindo ao n8n",
    desc: "Complete a introdução (Nível 0) inteira.",
    earned: (s) => has(s.completedNodes, "n8n-basics", "first-workflow"),
  },
  {
    id: "primeiro-desafio",
    icon: "🔌",
    title: "Mão na Massa",
    desc: "Valide seu primeiro desafio no Sandbox.",
    earned: (s) => s.completedChallenges.length >= 1,
  },
  {
    id: "quiz-perfeito",
    icon: "🎯",
    title: "Na Mosca",
    desc: "Passe em um quiz na primeira tentativa.",
    earned: (s) => s.firstTryPasses >= 1,
  },
  {
    id: "cinco-na-mosca",
    icon: "🏹",
    title: "Atirador de Elite",
    desc: "Passe em 5 quizzes na primeira tentativa.",
    earned: (s) => s.firstTryPasses >= 5,
  },
  {
    id: "mecanico",
    icon: "🔧",
    title: "Mecânico de Fluxos",
    desc: "Conserte um fluxo quebrado no Sandbox.",
    earned: (s) =>
      s.completedChallenges.some((c) => c.startsWith("conserto-")),
  },
  {
    id: "trilha-rag",
    icon: "📚",
    title: "Bibliotecário Vetorial",
    desc: "Complete toda a trilha de RAG (Nível 3).",
    earned: (s) =>
      has(s.completedNodes, "document-loaders", "vector-stores", "retrieval"),
  },
  {
    id: "meio-caminho",
    icon: "⚡",
    title: "Meio Caminho Andado",
    desc: `Acumule ${Math.round(TOTAL_XP / 2)} XP (metade da trilha).`,
    earned: (s) => s.xp >= TOTAL_XP / 2,
  },
  {
    id: "streak-3",
    icon: "🔥",
    title: "Pegando Fogo",
    desc: "Estude 3 dias seguidos.",
    earned: (s) => s.streakDays >= 3,
  },
  {
    id: "streak-7",
    icon: "🌋",
    title: "Imparável",
    desc: "Estude 7 dias seguidos.",
    earned: (s) => s.streakDays >= 7,
  },
  {
    id: "visionario",
    icon: "🚀",
    title: "Visionário",
    desc: "Monte o blueprint do SEU projeto no Sandbox.",
    earned: (s) => s.completedChallenges.includes("meu-projeto"),
  },
  {
    id: "boss-vencido",
    icon: "👑",
    title: "Caçador de Boss",
    desc: "Vença o desafio final: o Atendente Completo.",
    earned: (s) => s.completedChallenges.includes("boss-final"),
  },
  {
    id: "todos-desafios",
    icon: "🏆",
    title: "Sandbox Platinado",
    desc: "Valide todos os desafios do Sandbox.",
    earned: (s) =>
      CHALLENGES.every((c) => s.completedChallenges.includes(c.id)),
  },
  {
    id: "arvore-completa",
    icon: "🌳",
    title: "Arquiteto Agêntico",
    desc: "Domine todas as competências da árvore.",
    earned: (s) =>
      SKILL_TREE.every((n) => s.completedNodes.includes(n.id)),
  },
];

export function earnedAchievements(s: PlayerSnapshot): string[] {
  return ACHIEVEMENTS.filter((a) => a.earned(s)).map((a) => a.id);
}
