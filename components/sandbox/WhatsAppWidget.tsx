"use client";

import { useEffect, useRef, useState } from "react";

export interface ChatMessage {
  from: "cliente" | "bot";
  text: string;
}

export default function WhatsAppWidget({
  messages,
  typing,
  onSend,
  disabled,
}: {
  messages: ChatMessage[];
  typing: boolean;
  /** envia uma mensagem digitada pelo jogador (executa o fluxo com ela) */
  onSend?: (text: string) => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  function send() {
    const text = draft.trim();
    if (!text || !onSend || disabled) return;
    setDraft("");
    onSend(text);
  }
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-edge bg-[#0b141a]">
      {/* Header estilo WhatsApp Web */}
      <div className="flex items-center gap-3 border-b border-black/40 bg-[#202c33] px-3 py-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#00a884] text-lg">
          🤖
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-[#e9edef]">
            Robbu Store · Assistente IA
          </div>
          <div className="text-[11px] text-[#8696a0]">
            {typing ? "digitando…" : "online"}
          </div>
        </div>
        <span className="ml-auto font-mono text-[9px] uppercase tracking-widest text-[#8696a0]">
          Simulador
        </span>
      </div>

      {/* Conversa (perspectiva do cliente final) */}
      <div
        className="flex-1 space-y-2 overflow-y-auto px-3 py-3"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(0,168,132,0.04), transparent 40%), radial-gradient(circle at 80% 70%, rgba(0,168,132,0.03), transparent 40%)",
        }}
      >
        {messages.length === 0 && !typing && (
          <p className="pt-10 text-center text-xs text-[#8696a0]">
            Clique em <span className="text-[#00a884]">▶ Executar Fluxo</span>{" "}
            para simular a conversa do cliente.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.from === "cliente" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-[13px] leading-snug text-[#e9edef] shadow ${
                m.from === "cliente" ? "bg-[#005c4b]" : "bg-[#202c33]"
              }`}
            >
              {m.text}
              <span className="mt-1 block text-right text-[9px] text-[#8696a0]">
                {new Date().toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {m.from === "cliente" && " ✓✓"}
              </span>
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-[#202c33] px-4 py-3 text-[#8696a0]">
              <span className="animate-pulse">● ● ●</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Campo de digitação — o jogador vira o cliente */}
      {onSend && (
        <div className="flex items-center gap-2 border-t border-black/40 bg-[#202c33] px-2 py-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            disabled={disabled}
            placeholder="Digite como cliente…"
            className="min-w-0 flex-1 rounded-full bg-[#2a3942] px-3 py-1.5 text-[13px] text-[#e9edef] outline-none placeholder:text-[#8696a0] disabled:opacity-50"
          />
          <button
            onClick={send}
            disabled={disabled || !draft.trim()}
            aria-label="Enviar mensagem"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#00a884] text-[#0b141a] transition hover:brightness-110 disabled:opacity-40"
          >
            ➤
          </button>
        </div>
      )}
    </div>
  );
}
