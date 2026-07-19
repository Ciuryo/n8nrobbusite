"use client";

import { createContext, useContext } from "react";

/** Porta aguardando o segundo toque para virar conexão */
export interface PendingHandle {
  nodeId: string;
  handleId: string; // ex.: "out-main", "in-model"
}

export interface TapConnectValue {
  pending: PendingHandle | null;
  onHandleTap: (nodeId: string, handleId: string) => void;
}

export const TapConnectContext = createContext<TapConnectValue>({
  pending: null,
  onHandleTap: () => {},
});

/** Toque numa porta, depois na outra: conecta sem precisar arrastar — essencial no celular */
export function useTapConnect() {
  return useContext(TapConnectContext);
}
