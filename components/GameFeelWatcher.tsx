"use client";

// Observa o estado do jogador e celebra: +XP, patente nova, conquistas e streak.
import { useEffect, useRef } from "react";
import { useAcademy } from "@/lib/store";
import { useToasts } from "@/lib/toasts";
import { rankFor } from "@/lib/curriculum";
import { ACHIEVEMENTS, earnedAchievements } from "@/lib/achievements";
import { fireConfetti } from "@/lib/confetti";

export default function GameFeelWatcher() {
  const { hydrated, onboarded, xp } = useAcademy();
  const push = useToasts((s) => s.push);
  const prevXp = useRef<number | null>(null);
  const prevRank = useRef<string | null>(null);

  // Check-in diário (streak) — roda uma vez após hidratar
  useEffect(() => {
    if (!hydrated || !onboarded) return;
    const result = useAcademy.getState().checkInDaily();
    if (result) {
      push({
        icon: "🔥",
        tone: "streak",
        title: `Sequência de ${result.streak} dia${result.streak > 1 ? "s" : ""}!`,
        desc: `Bônus diário: +${result.bonus} XP. Volte amanhã para manter o fogo.`,
      });
    }
    // baseia XP/rank DEPOIS do bônus, para não duplicar o toast
    const s = useAcademy.getState();
    prevXp.current = s.xp;
    prevRank.current = rankFor(s.xp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, onboarded]);

  // +XP e patente
  useEffect(() => {
    if (prevXp.current === null) return;
    if (xp > prevXp.current) {
      push({
        icon: "✨",
        tone: "xp",
        title: `+${xp - prevXp.current} XP`,
      });
      const rank = rankFor(xp);
      if (rank !== prevRank.current) {
        push({
          icon: "🎖️",
          tone: "rank",
          title: "Nova patente!",
          desc: rank,
        });
        fireConfetti(120);
        prevRank.current = rank;
      }
      prevXp.current = xp;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xp]);

  // Conquistas novas
  const { completedNodes, completedChallenges, firstTryPasses, streakDays, seenAchievements } =
    useAcademy();
  useEffect(() => {
    if (!hydrated || !onboarded) return;
    const earned = earnedAchievements({
      xp,
      completedNodes,
      completedChallenges,
      firstTryPasses,
      streakDays,
    });
    const fresh = earned.filter((id) => !seenAchievements.includes(id));
    if (fresh.length === 0) return;
    useAcademy.getState().markAchievementsSeen(fresh);
    if (fresh.length > 2) {
      push({
        icon: "🏆",
        tone: "achievement",
        title: `${fresh.length} conquistas desbloqueadas!`,
        desc: "Veja sua Sala de Troféus na Base.",
      });
    } else {
      for (const id of fresh) {
        const a = ACHIEVEMENTS.find((x) => x.id === id);
        if (a) {
          push({
            icon: a.icon,
            tone: "achievement",
            title: `Conquista: ${a.title}`,
            desc: a.desc,
          });
        }
      }
    }
    fireConfetti(70);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, onboarded, xp, completedNodes, completedChallenges, firstTryPasses, streakDays]);

  return null;
}
