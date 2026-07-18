"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAcademy } from "@/lib/store";
import { rankFor, TOTAL_XP, CLASSES } from "@/lib/curriculum";

const LINKS = [
  { href: "/", label: "Base" },
  { href: "/skills", label: "Árvore de Habilidades" },
  { href: "/sandbox", label: "Sandbox" },
  { href: "/team", label: "Painel do Gestor" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { hydrated, name, specClass, xp, onboarded, streakDays } = useAcademy();
  const classInfo = CLASSES.find((c) => c.id === specClass);
  const pct = Math.min(100, Math.round((xp / TOTAL_XP) * 100));

  return (
    <header className="safe-top sticky top-0 z-40 border-b border-edge bg-background/85 shadow-[0_1px_0_0_rgba(34,211,238,0.15)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
        <Link href="/" className="group flex items-center gap-2">
          <span className="rounded bg-neon/10 px-2 py-1 font-mono text-sm font-bold text-neon neon-text transition group-hover:bg-neon/20">
            ⬢ Robbu
          </span>
          <span className="font-display hidden font-semibold tracking-wide sm:inline">
            GameN8N
          </span>
        </Link>

        <nav className="flex flex-1 items-center gap-1 overflow-x-auto text-sm">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 transition-colors ${
                pathname === l.href
                  ? "bg-neon/10 text-neon"
                  : "text-muted hover:bg-surface-2 hover:text-foreground"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {hydrated && onboarded && streakDays >= 1 && (
          <span
            title={`${streakDays} dia(s) seguidos estudando`}
            className="shrink-0 font-mono text-[11px] font-bold text-danger"
          >
            🔥{streakDays}
          </span>
        )}

        {hydrated && onboarded && (
          <span className="font-arcade shrink-0 text-[9px] text-gold md:hidden">
            {xp}XP
          </span>
        )}

        {hydrated && onboarded && (
          <div className="hidden items-center gap-3 md:flex">
            <div className="text-right">
              <div className="text-sm font-semibold">
                {classInfo?.icon} {name}
              </div>
              <div className="text-xs text-muted">{rankFor(xp)}</div>
            </div>
            <div className="w-32">
              <div className="mb-1 flex items-center justify-between text-[10px] text-muted">
                <span className="font-arcade text-[9px] text-gold">{xp}XP</span>
                <span className="font-mono">{pct}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-neon to-neon-2 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
