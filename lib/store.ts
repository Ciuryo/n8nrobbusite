"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getNode, type SpecClass } from "./curriculum";

interface AcademyState {
  hydrated: boolean;
  name: string;
  specClass: SpecClass | null;
  onboarded: boolean;
  xp: number;
  completedNodes: string[];
  completedChallenges: string[];
  /** tentativas de quiz por nó (para métricas de primeira tentativa) */
  quizAttempts: Record<string, number>;
  firstTryPasses: number;
  passedQuizzes: string[];
  /** sequência de dias seguidos estudando */
  streakDays: number;
  lastActiveDate: string; // YYYY-MM-DD
  /** conquistas já celebradas (para não repetir o toast) */
  seenAchievements: string[];

  setProfile: (name: string, specClass: SpecClass) => void;
  registerQuizAttempt: (nodeId: string) => void;
  passQuiz: (nodeId: string, firstTry: boolean) => void;
  completeNode: (nodeId: string) => void;
  completeChallenge: (challengeId: string, xp: number) => void;
  /** primeiro acesso do dia: atualiza a sequência e credita o bônus.
   *  Retorna { streak, bonus } quando há bônus a celebrar, ou null. */
  checkInDaily: () => { streak: number; bonus: number } | null;
  markAchievementsSeen: (ids: string[]) => void;
  reset: () => void;
  setHydrated: () => void;
}

/** XP com bônus de classe (+20% quando o nó favorece a classe do aluno) */
export function xpWithBonus(
  nodeId: string,
  specClass: SpecClass | null
): number {
  const node = getNode(nodeId);
  if (!node) return 0;
  const bonus = node.bonusClass && node.bonusClass === specClass ? 1.2 : 1;
  return Math.round(node.xp * bonus);
}

export const useAcademy = create<AcademyState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      name: "",
      specClass: null,
      onboarded: false,
      xp: 0,
      completedNodes: [],
      completedChallenges: [],
      quizAttempts: {},
      firstTryPasses: 0,
      passedQuizzes: [],
      streakDays: 0,
      lastActiveDate: "",
      seenAchievements: [],

      setProfile: (name, specClass) =>
        set({ name, specClass, onboarded: true }),

      checkInDaily: () => {
        const s = get();
        if (!s.onboarded) return null;
        const today = new Date().toISOString().slice(0, 10);
        if (s.lastActiveDate === today) return null;
        const yesterday = new Date(Date.now() - 86_400_000)
          .toISOString()
          .slice(0, 10);
        const streak =
          s.lastActiveDate === yesterday ? s.streakDays + 1 : 1;
        const bonus = 10 * Math.min(streak, 7);
        set({
          streakDays: streak,
          lastActiveDate: today,
          xp: s.xp + bonus,
        });
        return { streak, bonus };
      },

      markAchievementsSeen: (ids) =>
        set((s) => ({
          seenAchievements: [...new Set([...s.seenAchievements, ...ids])],
        })),

      passQuiz: (nodeId, firstTry) => {
        const s = get();
        if (s.passedQuizzes.includes(nodeId)) return;
        set({
          passedQuizzes: [...s.passedQuizzes, nodeId],
          firstTryPasses: s.firstTryPasses + (firstTry ? 1 : 0),
        });
      },

      registerQuizAttempt: (nodeId) =>
        set((s) => ({
          quizAttempts: {
            ...s.quizAttempts,
            [nodeId]: (s.quizAttempts[nodeId] ?? 0) + 1,
          },
        })),

      completeNode: (nodeId) => {
        const s = get();
        if (s.completedNodes.includes(nodeId)) return;
        set({
          completedNodes: [...s.completedNodes, nodeId],
          xp: s.xp + xpWithBonus(nodeId, s.specClass),
        });
      },

      completeChallenge: (challengeId, xp) => {
        const s = get();
        if (s.completedChallenges.includes(challengeId)) return;
        set({
          completedChallenges: [...s.completedChallenges, challengeId],
          xp: s.xp + xp,
        });
      },

      reset: () =>
        set({
          name: "",
          specClass: null,
          onboarded: false,
          xp: 0,
          completedNodes: [],
          completedChallenges: [],
          quizAttempts: {},
          firstTryPasses: 0,
          passedQuizzes: [],
          streakDays: 0,
          lastActiveDate: "",
          seenAchievements: [],
        }),

      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "n8n-agentic-academy",
      partialize: (s) => ({
        name: s.name,
        specClass: s.specClass,
        onboarded: s.onboarded,
        xp: s.xp,
        completedNodes: s.completedNodes,
        completedChallenges: s.completedChallenges,
        quizAttempts: s.quizAttempts,
        firstTryPasses: s.firstTryPasses,
        passedQuizzes: s.passedQuizzes,
        streakDays: s.streakDays,
        lastActiveDate: s.lastActiveDate,
        seenAchievements: s.seenAchievements,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
