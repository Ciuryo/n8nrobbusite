"use client";

import { useEffect } from "react";

const base = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register(`${base}/sw.js`).catch(() => {});
    }
  }, []);
  return null;
}
