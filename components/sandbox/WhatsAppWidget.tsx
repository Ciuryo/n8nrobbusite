"use client";

import { useEffect, useRef } from "react";

export interface ChatMessage {
  from: "cliente" | "bot";
  text: string;
}

export default function WhatsAppWidget({
  messages,
  typing,
}: {
  messages: ChatMessage[];
  typing: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
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
    </div>
  );
}
