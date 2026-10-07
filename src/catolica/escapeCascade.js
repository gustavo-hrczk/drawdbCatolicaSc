import { ObjectType, Tab } from "../data/constants";

// Esc em cascata, do mais interno para fora: sair do campo (feito em
// useSafeKeyShortcuts), fechar a edição do elemento e, por fim, desmarcar.
// Janelas, menus e mensagens flutuantes fecham antes de tudo isso.

// Itens do painel lateral que expandem para edição, por aba.
const SIDE_ITEMS = {
  [Tab.TABLES]: { prefix: "scroll_table_", element: ObjectType.TABLE },
  [Tab.RELATIONSHIPS]: {
    prefix: "scroll_ref_",
    element: ObjectType.RELATIONSHIP,
  },
  [Tab.NOTES]: { prefix: "scroll_note_", element: ObjectType.NOTE },
  [Tab.TYPES]: { prefix: "scroll_type_", element: ObjectType.TYPE },
  [Tab.VIEWS]: { prefix: "scroll_view_", element: ObjectType.VIEW },
};

// Tipo do item expandido na aba atual do painel lateral, ou null. Olha a
// tela, e não o estado: no upstream o item continua expandido depois de um
// clique no desenho (open: false), porque o Semi ignora activeKey vazio.
function expandedSideItem(currentTab) {
  const item = SIDE_ITEMS[currentTab];
  if (!item) return null;
  const header = document.querySelector(
    `[id^="${item.prefix}"] .semi-collapse-header[aria-expanded="true"]`,
  );
  return header && header.getClientRects().length > 0 ? item.element : null;
}

// Próximo passo do Esc fora dos campos:
// { collapse: tipo } recolhe o item expandido no painel lateral;
// { close: true } fecha o painel ou popover de edição do elemento;
// { deselect: true } desmarca; null, nada a fazer.
export function escapeStep(selected, sidebar) {
  if (sidebar) {
    const collapse = expandedSideItem(selected.currentTab);
    if (collapse !== null) return { collapse };
  } else if (selected.open || selected.editFromToolbar) {
    return { close: true };
  }
  return selected.element === ObjectType.NONE ? null : { deselect: true };
}
