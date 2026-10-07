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

// Itens do upstream que saíram de um menu continuam acessíveis pelo código,
// só que fora da lista exibida (propriedade não enumerável): partes do
// upstream chamam funções pelo menu, como o botão de tema da barra inferior
// (menu.view.theme).
function keepHidden(menu, upstream) {
  for (const [key, item] of Object.entries(upstream)) {
    if (!(key in menu)) {
      Object.defineProperty(menu, key, { value: item, enumerable: false });
    }
  }
  return menu;
}

const without = (menu, keys) =>
  Object.fromEntries(
    Object.entries(menu).filter(([key]) => !keys.includes(key)),
  );

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
  const menu = {
    new: { function: actions.newHere },
    new_window: { function: actions.newWindow },
    open: upstream.open,
    open_recent: { children: recentChildren(actions), function: () => {} },
    save: upstream.save,
    save_as: upstream.save_as,
    import: { function: actions.importFile, shortcut: "Ctrl+I" },
    export: { function: actions.exportFile, shortcut: "Ctrl+E" },
    exit: upstream.exit,
  };
  return keepHidden(menu, upstream);
}

// Item de submenu com o atalho e o estado (liga/desliga) à direita, como nos
// itens do primeiro nível (os submenus do upstream só têm nome e etiqueta).
function submenuItem(t, key, item) {
  return {
    name: (
      <span className="flex w-full items-center justify-between gap-4">
        <span>{t(key)}</span>
        <span className="flex items-center gap-1">
          {item.shortcut && (
            <span className="text-gray-400">{item.shortcut}</span>
          )}
          {item.state}
        </span>
      </span>
    ),
    function: item.function,
    disabled: item.disabled,
  };
}

// Editar: sai "Limpar" (apagava o diagrama inteiro de uma vez) e "Editar"
// (menu Editar > Editar; a edição do elemento fica na tecla E, no F2 e nos
// botões do próprio elemento); entra "Histórico de alterações" (a linha do
// tempo, que ficava em Configurações); "Organizar automaticamente" mostra o
// atalho O quando os atalhos rápidos estão ligados.
export function catolicaEditMenu(upstream, { singleKeyShortcuts, history }) {
  const { undo, redo, ...rest } = without(upstream, ["clear", "edit"]);
  const menu = { undo, redo, change_history: history, ...rest };
  if (singleKeyShortcuts) {
    menu.auto_arrange = { ...menu.auto_arrange, shortcut: "O" };
  }
  return keepHidden(menu, upstream);
}

// Ver: só o que muda a exibição do diagrama e não está na barra de
// ferramentas inferior (Tema, zoom, grade, ímã, barras, problemas e tela
// cheia estão lá). Saem as coordenadas de depuração (ferramenta de
// desenvolvimento) e o Modo estrito vai para Configurações.
const ON_DIAGRAM = [
  "field_details",
  "show_comments",
  "show_datatype",
  "show_cardinality",
  "show_relationship_labels",
];

export function catolicaViewMenu(upstream, { t }) {
  const menu = {
    view_on_diagram: {
      children: ON_DIAGRAM.map((key) => submenuItem(t, key, upstream[key])),
      function: () => {},
    },
    dbml_view: upstream.dbml_view,
    presentation_mode: upstream.presentation_mode,
    reset_view: { ...upstream.reset_view, shortcut: "Enter" },
  };
  return keepHidden(menu, upstream);
}

// Configurações: o que é preferência do editor. Sai "Limpar cache" (cache de
// diagramas compartilhados pelo servidor, que este editor não usa); a cópia de
// todos os diagramas e o "apagar tudo" ficam juntos em "Dados do navegador",
// com confirmação explícita para apagar.
export function catolicaSettingsMenu(
  upstream,
  { strictMode, t, confirmErase },
) {
  const menu = {
    autosave: upstream.autosave,
    strict_mode: strictMode,
    default_database: upstream.default_database,
    configure_custom_types: upstream.configure_custom_types,
    language: upstream.language,
    browser_data: {
      children: [
        {
          name: t("browser_data_export"),
          function: upstream.export_saved_data.function,
        },
        { divider: true },
        {
          name: t("browser_data_erase"),
          function: () => confirmErase(upstream.flush_storage.function),
        },
      ],
      function: () => {},
    },
  };
  return keepHidden(menu, upstream);
}

// Ajuda: sai o Discord (comunidade do drawDB original) e o atalho Ctrl+H da
// documentação (é o atalho do histórico do navegador); "Relatar um problema"
// abre uma issue no repositório deste editor; entram Novidades e Sobre.
export function catolicaHelpMenu(upstream, actions) {
  const menu = {
    help_shortcuts: {
      function: actions.showShortcuts,
      ...(actions.singleKeyShortcuts && { shortcut: "?" }),
    },
    help_docs: { function: actions.openDocs },
    help_changelog: { function: actions.showChangelog },
    help_report: { function: actions.reportProblem },
    help_about: { function: actions.showAbout },
  };
  return keepHidden(menu, upstream);
}
