"use client";

import { useToasts, type Toast } from "@/lib/toasts";

const TONE_STYLE: Record<Toast["tone"], string> = {
  xp: "border-gold/60",
  rank: "border-neon/60",
  achievement: "border-neon-2/60",
  streak: "border-danger/60",
};

export default function Toaster() {
  const { toasts, remove } = useToasts();
  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[90] flex w-[min(92vw,22rem)] -translate-x-1/2 flex-col gap-2">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => remove(t.id)}
          className={`toast-in pointer-events-auto flex items-center gap-3 rounded-lg border bg-surface/95 px-4 py-3 text-left shadow-xl backdrop-blur ${TONE_STYLE[t.tone]}`}
        >
          <span className="text-2xl">{t.icon}</span>
          <span className="min-w-0">
            <span className="block text-sm font-bold">{t.title}</span>
            {t.desc && (
              <span className="block text-xs text-muted">{t.desc}</span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}
