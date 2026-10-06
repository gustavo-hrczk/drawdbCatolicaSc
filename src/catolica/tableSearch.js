// Ctrl+F no editor: abre a busca de tabelas do painel lateral (aba Tabelas).
// Devolve false se a busca não estiver visível (painel oculto ou outra aba),
// e aí o Ctrl+F continua sendo a busca do navegador.
export function focusTableSearch() {
  const search = document.querySelector(".semi-tree-select-filterable");
  if (!search || search.getClientRects().length === 0) return false;
  search.click();
  requestAnimationFrame(() => search.querySelector("input")?.focus());
  return true;
}
