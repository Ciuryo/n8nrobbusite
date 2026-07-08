"use client";

import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { CATALOG_BY_TYPE, type PortKind } from "@/lib/sandbox";

export type AcademyNode = Node<{ ctype: string }, "academy">;

const PORT_LABEL: Record<PortKind, string> = {
  main: "Main",
  model: "Model",
  memory: "Memory",
  tool: "Tool",
  embedding: "Embedding",
};

const PORT_COLOR: Record<PortKind, string> = {
  main: "var(--neon)",
  model: "#a78bfa",
  memory: "#fbbf24",
  tool: "#e879f9",
  embedding: "#34d399",
};

export default function FlowNode({ data, selected }: NodeProps<AcademyNode>) {
  const entry = CATALOG_BY_TYPE[data.ctype];
  if (!entry) return null;

  return (
    <div
      className={`min-w-40 rounded-lg border-2 bg-surface-2 px-3 py-2 shadow-lg transition ${
        selected ? "border-neon" : "border-edge"
      }`}
    >
      {entry.mainIn && (
        <Handle
          type="target"
          position={Position.Left}
          id="in-main"
          style={{ background: PORT_COLOR.main }}
        />
      )}
      {entry.mainOut && (
        <Handle
          type="source"
          position={Position.Right}
          id="out-main"
          style={{ background: PORT_COLOR.main }}
        />
      )}
      {entry.provides && (
        <Handle
          type="source"
          position={Position.Top}
          id={`out-${entry.provides}`}
          style={{ background: PORT_COLOR[entry.provides] }}
        />
      )}
      {entry.accepts.map((kind, i) => (
        <Handle
          key={kind}
          type="target"
          position={Position.Bottom}
          id={`in-${kind}`}
          style={{
            background: PORT_COLOR[kind],
            left: `${((i + 1) / (entry.accepts.length + 1)) * 100}%`,
          }}
        />
      ))}

      <div className="flex items-center gap-2">
        <span className="text-lg">{entry.icon}</span>
        <div>
          <div className="text-xs font-semibold leading-tight">
            {entry.label}
          </div>
          <div className="font-mono text-[9px] text-muted">
            {entry.category}
          </div>
        </div>
      </div>

      {(entry.accepts.length > 0 || entry.provides) && (
        <div className="mt-1.5 flex justify-between font-mono text-[8px] uppercase tracking-wide text-muted">
          <span>
            {entry.accepts.map((k) => (
              <span key={k} className="mr-1.5" style={{ color: PORT_COLOR[k] }}>
                ▾{PORT_LABEL[k]}
              </span>
            ))}
          </span>
          {entry.provides && (
            <span style={{ color: PORT_COLOR[entry.provides] }}>
              ▴{PORT_LABEL[entry.provides]}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
