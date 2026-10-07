import { DateTime } from "luxon";

// Menus do fork. Os itens do upstream continuam definidos em ControlPanel.jsx
// (menos conflito ao sincronizar); estas funções só escolhem e reorganizam.
//
// Arquivo: Novo, Nova janela, Abrir, Abrir recente, Salvar, Salvar como,
// Importar, Exportar e Sair, com os rótulos do upstream:
// - Novo e Nova janela abrem a escolha de modelo (nesta janela / em outra);
// - Abrir recente mostra os 5 diagramas editados por último (sem o aberto);
// - "Salvar como modelo" virou opção de Salvar como;
// - Renomear fica no lápis ao lado do nome e no F2;
// - Excluir diagrama sai do menu (voltará em outra tela);
// - Importar e Exportar reúnem os antigos "Importar", "Importar de SQL",
//   "Exportar SQL" e "Exportar como".
//
// O rótulo de cada item é a chave de tradução (como no upstream).

const RECENT_COUNT = 5;

// recent: diagramas em ordem de última edição ({ diagramId, name,
// lastModified }); currentId: o diagrama aberto, que não entra na lista.
function recentChildren({
  recent,
  currentId,
  openDiagram,
  openAll,
  t,
  language,
}) {
  const items = recent
    .filter((diagram) => diagram.diagramId !== currentId)
    .slice(0, RECENT_COUNT)
    .map((diagram) => ({
      name: diagram.name,
      label: DateTime.fromJSDate(new Date(diagram.lastModified))
        .setLocale(language)
        .toRelative(),
      function: () => openDiagram(diagram.diagramId),
    }));
  if (!items.length) return [{ name: t("no_saved_diagrams"), disabled: true }];
  return [
    ...items,
    { divider: true },
    { name: t("open_recent_all"), function: openAll },
  ];
}

export function catolicaFileMenu(upstream, actions) {
  return {
    new: { function: actions.newHere },
    new_window: { function: actions.newWindow },
    open: upstream.open,
    open_recent: { children: recentChildren(actions), function: () => {} },
    save: upstream.save,
    save_as: upstream.save_as,
    import: { function: actions.importFile, shortcut: "Ctrl+I" },
    export: { function: actions.exportFile, shortcut: "Ctrl+Alt+E" },
    exit: upstream.exit,
  };
}

const without = (menu, keys) =>
  Object.fromEntries(
    Object.entries(menu).filter(([key]) => !keys.includes(key)),
  );

// Editar: sai "Limpar" (apagava o diagrama inteiro de uma vez) e
// "Organizar automaticamente" mostra o atalho O quando os atalhos de uma
// tecla estão ligados.
export function catolicaEditMenu(upstream, { singleKeyShortcuts }) {
  const menu = without(upstream, ["clear"]);
  if (singleKeyShortcuts) {
    menu.auto_arrange = { ...menu.auto_arrange, shortcut: "O" };
  }
  return menu;
}

// Ver: saem Tema, Aumentar zoom e Diminuir zoom, que estão na barra de
// ferramentas inferior.
export function catolicaViewMenu(upstream) {
  return without(upstream, ["theme", "zoom_in", "zoom_out"]);
}
