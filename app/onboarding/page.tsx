"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CLASSES,
  getNode,
  shuffledIndices,
  type SpecClass,
} from "@/lib/curriculum";
import { useAcademy } from "@/lib/store";

// Nivelamento: acertando as 3, os módulos do Nível 1 são creditados automaticamente.
const PLACEMENT = [
  {
    question:
      "Você recebe um webhook e precisa devolver { json: {...} } por item. Qual nó resolve transformações arbitrárias?",
    options: ["Nó Code", "Nó Wait", "Nó NoOp", "Nó Merge"],
    answer: 0,
  },
  {
    question:
      "No handshake de verificação de webhook da Meta, o que deve ser ecoado?",
    options: [
      "hub.challenge",
      "hub.verify_token",
      "app_secret",
      "access_token",
    ],
    answer: 0,
  },
  {
    question:
      "Qual expressão n8n acessa o primeiro número de telefone em value.contacts?",
    options: [
      "{{ $json.value.contacts[0].wa_id }}",
      "{{ contacts.wa_id }}",
      "{{ $node.contacts.first }}",
      "{{ value->contacts->0 }}",
    ],
    answer: 0,
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { setProfile, completeNode } = useAcademy();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [specClass, setSpecClass] = useState<SpecClass | null>(null);
  const [answers, setAnswers] = useState<number[]>([-1, -1, -1]);
  const [placementResult, setPlacementResult] = useState<string | null>(null);
  // Ordem embaralhada das opções, gerada no cliente (hidratação segura)
  const [perms, setPerms] = useState<number[][]>([]);

  useEffect(() => {
    setPerms(PLACEMENT.map((q) => shuffledIndices(q.options.length)));
  }, []);

  function finish(skipBasics: boolean, destination = "/skills") {
    if (!specClass) return;
    setProfile(name.trim() || "Recruta", specClass);
    if (skipBasics) {
      // Nivelamento aprovado: credita a introdução (Nível 0) e os módulos do Nível 1
      ["n8n-basics", "first-workflow", "json-mastery", "webhooks-whatsapp"].forEach(
        completeNode
      );
    }
    router.push(destination);
  }

  function gradePlacement() {
    const correct = PLACEMENT.filter((q, i) => answers[i] === q.answer).length;
    if (correct === PLACEMENT.length) {
      const l1 = ["json-mastery", "webhooks-whatsapp"]
        .map((id) => getNode(id)?.title)
        .join(" e ");
      setPlacementResult(
        `✔ ${correct}/3 — Nivelamento aprovado! A introdução (Nível 0) e os módulos "${l1}" serão creditados com XP integral.`
      );
    } else {
      setPlacementResult(
        `${correct}/3 — Sem problemas: você começará pela introdução, do jeito certo.`
      );
    }
  }

  const placementPassed =
    placementResult !== null && placementResult.startsWith("✔");

  return (
    <div className="grid-bg flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <p className="mb-2 text-center font-mono text-xs uppercase tracking-[0.3em] text-neon">
          Inicialização de operador
        </p>
        <h1 className="font-display mb-8 text-center text-3xl font-bold">
          Criação de Personagem
        </h1>

        {step === 0 && (
          <div className="panel p-6">
            <h2 className="mb-1 text-lg font-semibold">Identificação</h2>
            <p className="mb-4 text-sm text-muted">
              Como você quer aparecer no leaderboard da equipe?
            </p>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && name.trim() && setStep(1)}
              placeholder="Seu codinome (ex.: ByteRunner)"
              className="w-full rounded-md border border-edge bg-surface-2 px-4 py-3 font-mono text-sm outline-none placeholder:text-muted focus:border-neon"
            />
            <button
              onClick={() => setStep(1)}
              disabled={!name.trim()}
              className="mt-4 w-full rounded-md bg-neon px-4 py-3 font-semibold text-background transition hover:brightness-110 disabled:opacity-40"
            >
              Continuar →
            </button>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="mb-1 text-lg font-semibold">
              Escolha sua Classe de Especialização
            </h2>
            <p className="mb-4 text-sm text-muted">
              A classe concede +20% de XP nos módulos da sua trilha favorita.
              Todos os módulos ficam disponíveis para todas as classes.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {CLASSES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSpecClass(c.id)}
                  className={`panel flex flex-col gap-2 p-4 text-left transition hover:border-neon/60 ${
                    specClass === c.id
                      ? "border-neon shadow-[0_0_20px_rgba(34,211,238,0.25)]"
                      : ""
                  }`}
                >
                  <span className="text-3xl">{c.icon}</span>
                  <span className="text-sm font-semibold leading-tight">
                    {c.name}
                  </span>
                  <span className="text-xs text-muted">{c.focus}</span>
                  <span className="mt-auto font-mono text-[11px] text-gold">
                    {c.bonus}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setStep(0)}
                className="rounded-md border border-edge px-4 py-3 text-sm text-muted hover:text-foreground"
              >
                ← Voltar
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!specClass}
                className="flex-1 rounded-md bg-neon px-4 py-3 font-semibold text-background transition hover:brightness-110 disabled:opacity-40"
              >
                Continuar →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="panel p-6">
            <div className="mb-5 rounded-lg border border-success/40 bg-success/5 p-4">
              <h2 className="text-base font-semibold text-success">
                🌱 Nunca usou o n8n?
              </h2>
              <p className="mt-1 text-sm text-muted">
                Perfeito — a trilha começa do absoluto zero. O Nível 0 explica o
                que é o n8n, o que são nós e gatilhos, e você monta seu primeiro
                fluxo no Sandbox em poucos minutos.
              </p>
              <button
                onClick={() => finish(false, "/module/n8n-basics")}
                className="mt-3 w-full rounded-md bg-success px-4 py-3 font-semibold text-background transition hover:brightness-110"
              >
                Começar pela introdução (Nível 0) →
              </button>
            </div>

            <h2 className="mb-1 text-lg font-semibold">
              Nivelamento Inicial{" "}
              <span className="font-mono text-xs text-muted">
                (opcional, para quem já usa n8n)
              </span>
            </h2>
            <p className="mb-4 text-sm text-muted">
              Já domina webhooks e o nó Code? Acerte as 3 questões práticas para
              pular a introdução e os módulos básicos do Nível 1 — com XP
              creditado.
            </p>

            {PLACEMENT.map((q, qi) => (
              <fieldset key={qi} className="mb-4">
                <legend className="mb-2 text-sm font-medium">
                  {qi + 1}. {q.question}
                </legend>
                <div className="grid gap-1.5">
                  {(perms[qi] ?? q.options.map((_, i) => i)).map((oi) => {
                    const opt = q.options[oi];
                    return (
                    <label
                      key={oi}
                      className={`cursor-pointer rounded-md border px-3 py-2 font-mono text-xs transition ${
                        answers[qi] === oi
                          ? "border-neon bg-neon/10 text-neon"
                          : "border-edge bg-surface-2 text-muted hover:text-foreground"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q${qi}`}
                        className="sr-only"
                        checked={answers[qi] === oi}
                        onChange={() =>
                          setAnswers((a) =>
                            a.map((v, i) => (i === qi ? oi : v))
                          )
                        }
                      />
                      {opt}
                    </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}

            {placementResult && (
              <p
                className={`mb-4 rounded-md border px-3 py-2 text-sm ${
                  placementPassed
                    ? "border-success/50 bg-success/10 text-success"
                    : "border-edge bg-surface-2 text-muted"
                }`}
              >
                {placementResult}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => finish(false)}
                className="rounded-md border border-edge px-4 py-3 text-sm text-muted hover:text-foreground"
              >
                Pular e ir para a árvore
              </button>
              {!placementResult ? (
                <button
                  onClick={gradePlacement}
                  disabled={answers.some((a) => a === -1)}
                  className="flex-1 rounded-md bg-neon px-4 py-3 font-semibold text-background transition hover:brightness-110 disabled:opacity-40"
                >
                  Corrigir nivelamento
                </button>
              ) : (
                <button
                  onClick={() => finish(placementPassed)}
                  className="flex-1 rounded-md bg-neon px-4 py-3 font-semibold text-background transition hover:brightness-110"
                >
                  Entrar na Academy →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
