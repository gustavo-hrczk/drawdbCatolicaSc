// Catálogo dos atalhos do editor, exibido na janela "Atalhos do teclado".
// É só leitura: os atalhos do upstream continuam definidos em ControlPanel.jsx
// (useHotkeys) e os de uma tecla em useSafeKeyShortcuts.js. Cada ação já tem
// um id estável, para permitir personalização no futuro.
//
// label: chave de tradução; keys: combinações (cada uma é uma lista de
// teclas). O grupo com singleKey é o dos atalhos de uma tecla, que a janela
// mostra ou oculta conforme a chave.
export const SHORTCUT_GROUPS = [
  {
    group: "shortcuts_single_key_group",
    singleKey: true,
    items: [
      {
        id: "add_table",
        label: "add_table",
        keys: [["T"]],
      },
      {
        id: "add_area",
        label: "add_area",
        keys: [["A"]],
      },
      {
        id: "add_note",
        label: "add_note",
        keys: [["N"]],
      },
      { id: "auto_arrange", label: "auto_arrange", keys: [["O"]] },
      { id: "fit", label: "shortcut_fit_diagram", keys: [["F"]] },
      { id: "shortcuts", label: "shortcut_list", keys: [["?"]] },
    ],
  },
  {
    group: "shortcut_group_edit",
    items: [
      { id: "undo", label: "undo", keys: [["Ctrl", "Z"]] },
      {
        id: "redo",
        label: "redo",
        keys: [
          ["Ctrl", "Y"],
          ["Ctrl", "Shift", "Z"],
        ],
      },
      {
        id: "copy",
        label: "copy",
        keys: [["Ctrl", "C"]],
      },
      {
        id: "cut",
        label: "cut",
        keys: [["Ctrl", "X"]],
      },
      {
        id: "paste",
        label: "paste",
        keys: [["Ctrl", "V"]],
      },
      { id: "duplicate", label: "duplicate", keys: [["Ctrl", "D"]] },
      {
        id: "delete",
        label: "delete",
        keys: [["Delete"]],
      },
      { id: "edit", label: "shortcut_edit_selected", keys: [["Ctrl", "E"]] },
      { id: "rename", label: "rename_selected", keys: [["F2"]] },
      { id: "deselect", label: "shortcut_deselect", keys: [["Esc"]] },
      {
        id: "search",
        label: "shortcut_search_table",
        keys: [["Ctrl", "F"]],
      },
    ],
  },
  {
    group: "shortcut_group_file",
    items: [
      { id: "open", label: "open", keys: [["Ctrl", "O"]] },
      { id: "save", label: "save", keys: [["Ctrl", "S"]] },
      { id: "save_as", label: "save_as", keys: [["Ctrl", "Shift", "S"]] },
      { id: "import", label: "import", keys: [["Ctrl", "I"]] },
    ],
  },
  {
    group: "shortcut_group_view",
    items: [
      { id: "reset_view", label: "shortcut_center_view", keys: [["Enter"]] },
      {
        id: "zoom",
        label: "shortcut_zoom",
        keys: [
          ["Ctrl", "↑"],
          ["Ctrl", "↓"],
        ],
      },
      { id: "pan", label: "shortcut_pan", keys: [["←"], ["↑"], ["→"], ["↓"]] },
      { id: "grid", label: "show_grid", keys: [["Ctrl", "Shift", "G"]] },
      { id: "snap", label: "grid_snap", keys: [["Ctrl", "Alt", "G"]] },
      { id: "theme", label: "shortcut_theme", keys: [["Ctrl", "Alt", "D"]] },
      { id: "strict", label: "strict_mode", keys: [["Ctrl", "Shift", "M"]] },
      {
        id: "field_summary",
        label: "shortcut_field_summary",
        keys: [["Ctrl", "Shift", "F"]],
      },
      { id: "dbml", label: "shortcut_dbml_editor", keys: [["Alt", "E"]] },
      {
        id: "copy_image",
        label: "copy_as_image",
        keys: [["Ctrl", "Alt", "C"]],
      },
    ],
  },
];

// Preferência por navegador: atalhos de uma tecla ligados ou desligados.
const PREFS_KEY = `${import.meta.env.VITE_DB_NAME || "drawDB"}-catolica:shortcuts`;

export function readShortcutPrefs() {
  try {
    return { singleKey: true, ...JSON.parse(localStorage.getItem(PREFS_KEY)) };
  } catch {
    return { singleKey: true };
  }
}

export function writeShortcutPrefs(prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Sem localStorage a preferência vale só até recarregar a página.
  }
}
