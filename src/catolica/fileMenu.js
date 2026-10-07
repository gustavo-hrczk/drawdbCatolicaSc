// Menu Arquivo do fork: 8 itens no lugar dos 15 do upstream.
//
// Os itens do upstream continuam definidos em ControlPanel.jsx (menos
// conflito ao sincronizar); esta função só escolhe e reorganiza:
// - Novo e Nova aba abrem a escolha de modelo (nesta aba / em nova aba);
// - Abrir já mostra os recentes primeiro (sai o "Abrir recente");
// - "Salvar como modelo" virou opção de Salvar como;
// - Renomear fica no lápis ao lado do nome e no F2;
// - Excluir diagrama sai do menu (voltará em outra tela);
// - Importar e Exportar reúnem os antigos "Importar", "Importar de SQL",
//   "Exportar SQL", "Exportar como" e "Exportar para entrega".
//
// O rótulo de cada item é a chave de tradução (como no upstream).
export function catolicaFileMenu(upstream, actions) {
  return {
    file_new: { function: actions.newHere },
    file_new_tab: { function: actions.newTab },
    file_open: upstream.open,
    save: upstream.save,
    file_save_as: upstream.save_as,
    file_import: { function: actions.importFile, shortcut: "Ctrl+I" },
    file_export: { function: actions.exportFile },
    exit: upstream.exit,
  };
}
