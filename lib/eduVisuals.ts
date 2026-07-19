// Tipos dos visuais didáticos anexados aos tópicos dos módulos.
// Puro TS (sem JSX) para poder ser importado por lib/curriculum.ts.

/** Um "chip" visual: ou um nó real do catálogo do Sandbox, ou um passo conceitual (ícone livre) */
export type EduChip =
  | { type: string }
  | { icon: string; label: string; danger?: boolean };

export type EduPort = "model" | "memory" | "tool" | "embedding";

export type EduVisual =
  | {
      kind: "flow";
      main: EduChip[];
      subs?: { port: EduPort; chip: EduChip }[];
      caption?: string;
    }
  | { kind: "code"; label?: string; code: string }
  | {
      kind: "codeCompare";
      leftLabel: string;
      left: string;
      rightLabel: string;
      right: string;
    }
  | {
      kind: "compare";
      columns: {
        title: string;
        icon?: string;
        points: string[];
        tone?: "good" | "bad" | "neutral";
      }[];
    }
  | {
      kind: "gauge";
      min: number;
      max: number;
      unit?: string;
      zones: {
        from: number;
        to: number;
        label: string;
        tone: "good" | "warn" | "bad";
      }[];
      marker?: number;
    }
  | { kind: "overlap" };
