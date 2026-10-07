import { useSyncExternalStore } from "react";

// Painel do histórico (à direita do desenho) aberto ou fechado. Fica fora do
// estado do React para ser aberto pelo menu (ControlPanel) e mostrado no
// encaixe "right-panel" do Workspace.
let open = false;
const listeners = new Set();

function setOpen(value) {
  if (open === value) return;
  open = value;
  listeners.forEach((listener) => listener());
}

export const openHistoryPanel = () => setOpen(true);
export const closeHistoryPanel = () => setOpen(false);

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useHistoryPanelOpen() {
  return useSyncExternalStore(subscribe, () => open);
}
