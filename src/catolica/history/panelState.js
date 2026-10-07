import { useSyncExternalStore } from "react";

// Painel do histórico (à direita do desenho): aberto ou fechado e a aba
// ("changes" ou "versions"). Fica fora do estado do React para ser aberto pelo
// menu e pelo botão da barra e mostrado no encaixe "right-panel".
let state = { open: false, tab: "changes" };
const listeners = new Set();

function set(next) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

export const openHistoryPanel = (tab = "changes") => set({ open: true, tab });
export const closeHistoryPanel = () => set({ open: false });
export const setHistoryTab = (tab) => set({ tab });

// Botão da barra: abre na aba pedida ou, se ela já está aberta, fecha.
export function toggleHistoryPanel(tab) {
  if (state.open && state.tab === tab) closeHistoryPanel();
  else openHistoryPanel(tab);
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useHistoryPanel() {
  return useSyncExternalStore(subscribe, () => state);
}
