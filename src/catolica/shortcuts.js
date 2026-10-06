// Catálogo dos atalhos do editor, exibido na janela "Atalhos do teclado".
// Nesta versão é só leitura: os atalhos do upstream continuam definidos em
// ControlPanel.jsx (useHotkeys) e os de uma tecla em useSafeKeyShortcuts.js.
// Para permitir personalização no futuro, cada ação já tem um id estável.
//
// label: chave de tradução; keys: combinações exibidas (cada uma é uma lista
// de teclas); note: chave de tradução da observação.
export const SHORTCUT_GROUPS = [
  {
    group: "shortcut_group_create",
    items: [
      {
        id: "add_table",
        label: "add_table",
        keys: [["T"]],
        note: "shortcut_note_single_key",
      },
      {
        id: "add_area",
        label: "add_area",
        keys: [["A"]],
        note: "shortcut_note_single_key",
      },
      {
        id: "add_note",
        label: "add_note",
        keys: [["N"]],
        note: "shortcut_note_single_key",
      },
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
        note: "shortcut_note_system",
      },
      {
        id: "cut",
        label: "cut",
        keys: [["Ctrl", "X"]],
        note: "shortcut_note_system",
      },
      {
        id: "paste",
        label: "paste",
        keys: [["Ctrl", "V"]],
        note: "shortcut_note_system",
      },
      { id: "duplicate", label: "duplicate", keys: [["Ctrl", "D"]] },
      {
        id: "delete",
        label: "delete",
        keys: [["Delete"]],
        note: "shortcut_note_delete",
      },
      { id: "edit", label: "shortcut_edit_selected", keys: [["Ctrl", "E"]] },
      { id: "deselect", label: "shortcut_deselect", keys: [["Esc"]] },
      {
        id: "search",
        label: "shortcut_search_table",
        keys: [["Ctrl", "F"]],
        note: "shortcut_note_search",
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
      {
        id: "fit",
        label: "shortcut_fit_diagram",
        keys: [["F"], ["Ctrl", "Alt", "W"]],
        note: "shortcut_note_single_key",
      },
      { id: "reset_view", label: "shortcut_center_view", keys: [["Enter"]] },
      {
        id: "zoom_in",
        label: "zoom_in",
        keys: [["Ctrl", "↑"]],
        note: "shortcut_note_wheel",
      },
      {
        id: "zoom_out",
        label: "zoom_out",
        keys: [["Ctrl", "↓"]],
        note: "shortcut_note_wheel",
      },
      { id: "pan", label: "shortcut_pan", keys: [["←"], ["↑"], ["→"], ["↓"]] },
      { id: "grid", label: "show_grid", keys: [["Ctrl", "Shift", "G"]] },
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
  {
    group: "shortcut_group_help",
    items: [
      {
        id: "shortcuts",
        label: "shortcut_list",
        keys: [["?"]],
        note: "shortcut_note_single_key",
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
