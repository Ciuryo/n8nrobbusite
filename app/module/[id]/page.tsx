import { SKILL_TREE } from "@/lib/curriculum";
import ModuleClient from "./ModuleClient";

// Export estático: pré-renderiza uma página por competência da árvore.
export function generateStaticParams() {
  return SKILL_TREE.map((n) => ({ id: n.id }));
}

export const dynamicParams = false;

export default function ModulePage() {
  return <ModuleClient />;
}
