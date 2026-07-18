"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getNode,
  nodeState,
  shuffledIndices,
  LEVEL_NAMES,
  SKILL_TREE,
} from "@/lib/curriculum";
import { CHALLENGES } from "@/lib/challenges";
import { useAcademy, xpWithBonus } from "@/lib/store";

function NextStep({
  completedNodes,
  onMap,
}: {
  completedNodes: string[];
  onMap: () => void;
}) {
  const next = SKILL_TREE.filter(
    (n) => nodeState(n, completedNodes) === "available"
  ).sort((a, b) => a.level - b.level || a.module.localeCompare(b.module))[0];

  return (
    <div className="mt-8 flex flex-col items-center gap-3 text-center">
      {next && (
        <Link
          href={`/module/${next.id}`}
          className="rounded-md bg-neon px-6 py-3 font-semibold text-background transition hover:brightness-110"
        >
          Próximo módulo: {next.icon} {next.title} →
        </Link>
      )}
      <button
        onClick={onMap}
        className="rounded-md border border-gold px-6 py-3 font-semibold text-gold hover:bg-gold/10"
      >
        🏅 {next ? "Ver o mapa de habilidades" : "Voltar ao mapa — trilha completa!"}
      </button>
    </div>
  );
}

export default function ModuleClient() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const node = getNode(id);
  const {
    hydrated,
    completedNodes,
    completedChallenges,
    passedQuizzes,
    specClass,
    quizAttempts,
    registerQuizAttempt,
    passQuiz,
    completeNode,
  } = useAcademy();

  const [answers, setAnswers] = useState<number[]>([]);
  const [graded, setGraded] = useState<boolean[] | null>(null);
  // Ordem de exibição embaralhada por questão (índices originais).
  // Gerada no cliente para não quebrar a hidratação da página estática.
  const [perms, setPerms] = useState<number[][]>([]);

  useEffect(() => {
    if (node) {
      setAnswers(new Array(node.quiz.length).fill(-1));
      setPerms(node.quiz.map((q) => shuffledIndices(q.options.length)));
    }
  }, [node]);

  const quizPassed = node ? passedQuizzes.includes(node.id) : false;
  const challengeDone = node?.challengeId
    ? completedChallenges.includes(node.challengeId)
    : true;
  const isCompleted = node ? completedNodes.includes(node.id) : false;

  // Conclui o nó automaticamente quando quiz + desafio (se houver) estiverem OK
  useEffect(() => {
    if (node && hydrated && quizPassed && challengeDone && !isCompleted) {
      completeNode(node.id);
    }
  }, [node, hydrated, quizPassed, challengeDone, isCompleted, completeNode]);

  if (!node) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted">
        Módulo não encontrado.{" "}
        <Link href="/skills" className="ml-2 text-neon underline">
          Voltar à árvore
        </Link>
      </div>
    );
  }

  if (hydrated && nodeState(node, completedNodes) === "locked") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
        <span className="text-4xl">🔒</span>
        <h1 className="text-xl font-bold">Competência bloqueada</h1>
        <p className="max-w-md text-sm text-muted">
          Conclua os pré-requisitos primeiro:{" "}
          {node.deps.map((d) => getNode(d)?.title).join(", ")}.
        </p>
        <Link
          href="/skills"
          className="rounded-md bg-neon px-4 py-2 font-semibold text-background"
        >
          ← Voltar à Árvore de Habilidades
        </Link>
      </div>
    );
  }

  const challenge = node.challengeId
    ? CHALLENGES.find((c) => c.id === node.challengeId)
    : null;

  function grade() {
    if (!node) return;
    registerQuizAttempt(node.id);
    const results = node.quiz.map((q, i) => answers[i] === q.answer);
    setGraded(results);
    if (results.every(Boolean)) {
      const firstTry = (quizAttempts[node.id] ?? 0) === 0;
      passQuiz(node.id, firstTry);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <Link href="/skills" className="font-mono text-xs text-muted hover:text-neon">
        ← Árvore de Habilidades
      </Link>

      <div className="mb-6 mt-2 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-neon">
            Nível {node.level} — {LEVEL_NAMES[node.level]} · Módulo{" "}
            {node.module}
          </p>
          <h1 className="font-display mt-1 text-2xl font-bold">
            {node.icon} {node.title}
          </h1>
          <p className="mt-2 text-sm text-muted">{node.summary}</p>
        </div>
        <div className="panel shrink-0 px-4 py-2 text-center">
          <div className="font-arcade text-sm text-gold">
            {xpWithBonus(node.id, specClass)}
          </div>
          <div className="mt-1 text-[10px] uppercase text-muted">XP</div>
        </div>
      </div>

      {isCompleted && (
        <div className="mb-6 rounded-md border border-gold/50 bg-gold/10 px-4 py-3 text-sm text-gold">
          🏅 Competência dominada! XP creditado no seu perfil.
        </div>
      )}

      <section className="space-y-4">
        {node.topics.map((t, i) => (
          <article key={i} className="panel p-5">
            <h2 className="mb-2 font-semibold text-neon">
              <span className="mr-2 font-mono text-xs text-muted">
                {String(i + 1).padStart(2, "0")}
              </span>
              {t.heading}
            </h2>
            <p className="text-sm leading-relaxed text-foreground/90">
              {t.body}
            </p>
          </article>
        ))}
      </section>

      {challenge && (
        <section className="mt-8">
          <h2 className="mb-2 text-lg font-semibold">
            <span className="text-neon-2">◆</span> Desafio Prático no Sandbox
          </h2>
          <div
            className={`panel p-5 ${challengeDone ? "border-success/50" : "border-neon-2/40"}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold">{challenge.title}</h3>
                <p className="mt-1 text-sm text-muted">{challenge.brief}</p>
              </div>
              <span className="shrink-0 font-mono text-sm text-gold">
                +{challenge.xp} XP
              </span>
            </div>
            {challengeDone ? (
              <p className="mt-3 text-sm text-success">
                ✔ Desafio validado no Sandbox.
              </p>
            ) : (
              <Link
                href={`/sandbox?challenge=${challenge.id}`}
                className="mt-4 inline-block rounded-md bg-neon-2 px-4 py-2 text-sm font-semibold text-background hover:brightness-110"
              >
                Abrir no Sandbox →
              </Link>
            )}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-2 text-lg font-semibold">Checagem de Conhecimento</h2>
        {quizPassed ? (
          <div className="panel border-success/50 p-5 text-sm text-success">
            ✔ Quiz aprovado
            {!challengeDone && (
              <span className="ml-1 text-muted">
                — conclua o desafio prático acima para dominar a competência.
              </span>
            )}
          </div>
        ) : (
          <div className="panel space-y-5 p-5">
            {node.quiz.map((q, qi) => (
              <fieldset key={qi}>
                <legend className="mb-2 text-sm font-medium">
                  {qi + 1}. {q.question}
                </legend>
                <div className="grid gap-1.5">
                  {(perms[qi] ?? q.options.map((_, i) => i)).map((oi) => {
                    const opt = q.options[oi];
                    const chosen = answers[qi] === oi;
                    const wrong =
                      graded && chosen && !graded[qi] ? "border-danger text-danger" : "";
                    return (
                      <label
                        key={oi}
                        className={`cursor-pointer rounded-md border px-3 py-2 text-xs transition ${
                          chosen
                            ? wrong || "border-neon bg-neon/10 text-neon"
                            : "border-edge bg-surface-2 text-muted hover:text-foreground"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q-${node.id}-${qi}`}
                          className="sr-only"
                          checked={chosen}
                          onChange={() => {
                            setAnswers((a) =>
                              a.map((v, i) => (i === qi ? oi : v))
                            );
                            setGraded(null);
                          }}
                        />
                        {opt}
                      </label>
                    );
                  })}
                </div>
                {graded && !graded[qi] && (
                  <p className="mt-1.5 text-xs text-danger">
                    ✖ Resposta incorreta. Dica: {q.explanation}
                  </p>
                )}
              </fieldset>
            ))}
            <button
              onClick={grade}
              disabled={answers.some((a) => a === -1)}
              className="w-full rounded-md bg-neon px-4 py-3 font-semibold text-background transition hover:brightness-110 disabled:opacity-40"
            >
              Validar respostas
            </button>
          </div>
        )}
      </section>

      {isCompleted && (
        <NextStep completedNodes={completedNodes} onMap={() => router.push("/skills")} />
      )}
    </div>
  );
}
