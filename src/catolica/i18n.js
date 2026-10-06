import i18n from "../i18n/i18n";

// Textos próprios do fork. Ficam aqui, e não em src/i18n/locales, para não
// gerar conflitos ao sincronizar as traduções com o upstream.
const resources = {
  "pt-BR": {
    diagram_not_found_title: "Diagrama não encontrado neste navegador",
    diagram_not_found_body:
      "Links do editor só abrem diagramas salvos localmente. Para carregar o arquivo de outra pessoa, solicite o Arquivo de Importação. O conteúdo atual será salvo como um novo diagrama.",
    ready_to_import_as_new:
      "Tudo certo. O arquivo será aberto como um novo diagrama, e o diagrama atual não será alterado.",
    diagram_imported: 'Diagrama "{{title}}" aberto e salvo neste navegador.',
    unknown_database_in_file:
      "O arquivo usa um banco de dados que este editor não reconhece.",
    autosave_off_notice:
      "Salvamento automático desligado: suas alterações só são salvas com Ctrl+S.",
    turn_on_autosave: "Ligar",
    diagram_open_in_other_tab:
      "Este diagrama já está aberto em outra aba. Edite em apenas uma aba para evitar conflitos de salvamento.",
    save_conflict_title: "Este diagrama foi alterado em outra aba",
    save_conflict_body:
      "Depois que você abriu este diagrama aqui, ele foi salvo em outra aba ou janela ({{date}}). Para não perder nada, escolha o que fazer com as alterações desta aba.",
    save_conflict_copy: "Salvar como cópia (recomendado)",
    save_conflict_copy_hint:
      "Mantém as duas versões: a outra aba continua com a dela, e esta vira um novo diagrama.",
    save_conflict_reload: "Descartar e recarregar",
    save_conflict_reload_hint:
      "Abre a versão salva pela outra aba. As alterações desta aba serão perdidas.",
    save_conflict_overwrite: "Substituir pela versão desta aba",
    save_conflict_overwrite_hint:
      "Grava esta versão por cima. As alterações feitas na outra aba serão perdidas.",
    conflict_copy_name: "{{title}} (cópia de conflito {{date}})",
    nothing_to_paste:
      "Nada para colar: copie uma tabela, nota, área ou view do diagrama.",
    shortcuts_title: "Atalhos do teclado",
    shortcuts_button: "Atalhos do teclado (?)",
    shortcuts_fixed_notice:
      "Nesta versão os atalhos são fixos. A personalização ficará disponível em uma próxima versão.",
    shortcuts_single_key_toggle: "Atalhos de uma tecla (T, A, N, F e ?)",
    shortcuts_single_key_help:
      "São ignorados enquanto você digita em um campo, logo depois de digitar em um campo, quando várias letras são digitadas em sequência e com janelas ou menus abertos.",
    shortcut_col_action: "Ação",
    shortcut_col_keys: "Atalho",
    shortcut_col_notes: "Observação",
    shortcut_group_create: "Criar",
    shortcut_group_edit: "Edição",
    shortcut_group_file: "Arquivo",
    shortcut_group_view: "Visualização",
    shortcut_group_help: "Ajuda",
    shortcut_note_system: "Padrão do sistema",
    shortcut_note_single_key: "Uma tecla, protegido contra digitação",
    shortcut_note_search: "Na aba Tabelas",
    shortcut_note_delete: "Ignorado logo após digitar em um campo",
    shortcut_note_wheel: "Ou Ctrl + roda do mouse",
    shortcut_fit_diagram: "Ajustar diagrama à tela",
    shortcut_center_view: "Redefinir visualização",
    shortcut_pan: "Mover a visualização",
    shortcut_deselect: "Desmarcar seleção",
    shortcut_search_table: "Buscar tabela",
    shortcut_list: "Lista de atalhos",
    shortcut_edit_selected: "Editar elemento selecionado",
    shortcut_field_summary: "Mostrar resumo dos campos",
    shortcut_dbml_editor: "Abrir editor DBML",
    shortcut_used:
      "{{action}} pelo atalho {{key}}. Ctrl+Z desfaz. Os atalhos de uma tecla podem ser desligados em Atalhos do teclado.",
    shortcut_typing_detected:
      "Parece que você está digitando fora de um campo de texto: os atalhos de uma tecla foram ignorados. Clique no campo onde quer escrever.",
    shortcut_delete_blocked:
      "Exclusão ignorada: você estava digitando em um campo. Pressione Delete de novo para excluir o elemento selecionado.",
  },
  en: {
    diagram_not_found_title: "Diagram not found in this browser",
    diagram_not_found_body:
      "Editor links only open diagrams saved locally. To load someone else's diagram, ask for the import file. The current content will be saved as a new diagram.",
    ready_to_import_as_new:
      "All set. The file will open as a new diagram and the current one will not change.",
    diagram_imported: 'Diagram "{{title}}" opened and saved in this browser.',
    unknown_database_in_file:
      "The file uses a database this editor does not recognize.",
    autosave_off_notice:
      "Autosave is off: your changes are only saved with Ctrl+S.",
    turn_on_autosave: "Turn on",
    diagram_open_in_other_tab:
      "This diagram is already open in another tab. Edit it in only one tab to avoid saving conflicts.",
    save_conflict_title: "This diagram was changed in another tab",
    save_conflict_body:
      "After you opened this diagram here, it was saved in another tab or window ({{date}}). To avoid losing anything, choose what to do with the changes in this tab.",
    save_conflict_copy: "Save as a copy (recommended)",
    save_conflict_copy_hint:
      "Keeps both versions: the other tab keeps its own, and this one becomes a new diagram.",
    save_conflict_reload: "Discard and reload",
    save_conflict_reload_hint:
      "Opens the version saved by the other tab. Changes in this tab will be lost.",
    save_conflict_overwrite: "Replace with this tab's version",
    save_conflict_overwrite_hint:
      "Writes this version over the saved one. Changes made in the other tab will be lost.",
    conflict_copy_name: "{{title}} (conflict copy {{date}})",
    nothing_to_paste:
      "Nothing to paste: copy a table, note, area or view from the diagram.",
    shortcuts_title: "Keyboard shortcuts",
    shortcuts_button: "Keyboard shortcuts (?)",
    shortcuts_fixed_notice:
      "Shortcuts are fixed in this version. Customization will be available in a future version.",
    shortcuts_single_key_toggle: "Single-key shortcuts (T, A, N, F and ?)",
    shortcuts_single_key_help:
      "They are ignored while you type in a field, right after typing in a field, when several letters are typed in a row and while dialogs or menus are open.",
    shortcut_col_action: "Action",
    shortcut_col_keys: "Shortcut",
    shortcut_col_notes: "Notes",
    shortcut_group_create: "Create",
    shortcut_group_edit: "Editing",
    shortcut_group_file: "File",
    shortcut_group_view: "View",
    shortcut_group_help: "Help",
    shortcut_note_system: "System default",
    shortcut_note_single_key: "Single key, protected against typing",
    shortcut_note_search: "In the Tables tab",
    shortcut_note_delete: "Ignored right after typing in a field",
    shortcut_note_wheel: "Or Ctrl + mouse wheel",
    shortcut_fit_diagram: "Fit diagram to screen",
    shortcut_center_view: "Reset view",
    shortcut_pan: "Move the view",
    shortcut_deselect: "Clear selection",
    shortcut_search_table: "Search table",
    shortcut_list: "Shortcut list",
    shortcut_edit_selected: "Edit selected element",
    shortcut_field_summary: "Show field summary",
    shortcut_dbml_editor: "Open DBML editor",
    shortcut_used:
      "{{action}} with the {{key}} shortcut. Ctrl+Z undoes it. Single-key shortcuts can be turned off in Keyboard shortcuts.",
    shortcut_typing_detected:
      "It looks like you are typing outside a text field: single-key shortcuts were ignored. Click the field where you want to write.",
    shortcut_delete_blocked:
      "Delete ignored: you were typing in a field. Press Delete again to delete the selected element.",
  },
};

for (const [lng, translation] of Object.entries(resources)) {
  i18n.addResourceBundle(lng, "translation", translation, true, false);
}
