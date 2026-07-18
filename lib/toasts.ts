"use client";

// Fila global de toasts do jogo (+XP, patente, conquistas, streak).
import { create } from "zustand";

export interface Toast {
  id: number;
  icon: string;
  title: string;
  desc?: string;
  /** cor de destaque da borda */
  tone: "xp" | "rank" | "achievement" | "streak";
}

interface ToastState {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => void;
  remove: (id: number) => void;
}

let nextId = 1;

export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  push: (t) => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    setTimeout(
      () => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
      4200
    );
  },
  remove: (id) =>
    set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));
