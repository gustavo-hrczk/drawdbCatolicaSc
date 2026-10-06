import i18n from "../i18n/i18n";

// Textos próprios do fork. Ficam aqui, e não em src/i18n/locales, para não
// gerar conflitos ao sincronizar as traduções com o upstream.
const resources = {
  "pt-BR": {
    diagram_not_found_title: "Diagrama não encontrado neste navegador",
    diagram_not_found_body:
      "Links do editor só abrem diagramas salvos localmente. Para carregar o arquivo de outra pessoa, solicite o Arquivo de Importação. O conteúdo atual será salvo como um novo diagrama.",
    diagram_imported: 'Diagrama "{{title}}" aberto e salvo neste navegador.',
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
    shortcuts_single_key_group: "Atalhos de uma tecla",
    shortcut_group_edit: "Edição",
    shortcut_group_file: "Arquivo",
    shortcut_group_view: "Visualização",
    shortcut_fit_diagram: "Ajustar diagrama à tela",
    shortcut_center_view: "Redefinir visualização",
    shortcut_zoom: "Aumentar / diminuir zoom",
    shortcut_pan: "Mover a visualização",
    shortcut_deselect: "Desmarcar seleção",
    shortcut_search_table: "Buscar tabela",
    shortcut_list: "Lista de atalhos",
    shortcut_edit_selected: "Editar elemento selecionado",
    shortcut_field_summary: "Mostrar resumo dos campos",
    shortcut_dbml_editor: "Abrir editor DBML",
    shortcut_theme: "Alternar tema claro/escuro",
    undo_hint: "Pressione Ctrl+Z para desfazer alterações.",
    shortcut_hint_table: "Tabela criada pelo atalho T. $t(undo_hint)",
    shortcut_hint_area: "Área criada pelo atalho A. $t(undo_hint)",
    shortcut_hint_note: "Nota criada pelo atalho N. $t(undo_hint)",
    shortcut_hint_arrange: "Diagrama organizado pelo atalho O. $t(undo_hint)",
    snap_button: "Alinhar objetos à grade (Ctrl+Alt+G)",
    shortcut_typing_detected:
      "Parece que você está digitando fora de um campo de texto, então o atalho foi ignorado ou desfeito. Clique no campo onde quer escrever.",
    shortcut_delete_blocked:
      "Exclusão ignorada: você estava digitando em um campo. Pressione Delete de novo para excluir o elemento selecionado.",
    grid_menu: "Grade",
    grid_snap: "Alinhar objetos à grade",
    grid_size: "Tamanho da grade",
    grid_size_small: "Pequena ({{size}} px)",
    grid_size_medium: "Média ({{size}} px)",
    grid_size_large: "Grande ({{size}} px)",
    image_empty_diagram: "Nada para copiar ou exportar: o diagrama está vazio.",
    show_header: "Mostrar barra de menu",
  },
  en: {
    diagram_not_found_title: "Diagram not found in this browser",
    diagram_not_found_body:
      "Editor links only open diagrams saved locally. To load someone else's diagram, ask for the import file. The current content will be saved as a new diagram.",
    diagram_imported: 'Diagram "{{title}}" opened and saved in this browser.',
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
    shortcuts_single_key_group: "Single-key shortcuts",
    shortcut_group_edit: "Editing",
    shortcut_group_file: "File",
    shortcut_group_view: "View",
    shortcut_fit_diagram: "Fit diagram to screen",
    shortcut_center_view: "Reset view",
    shortcut_zoom: "Zoom in / out",
    shortcut_pan: "Move the view",
    shortcut_deselect: "Clear selection",
    shortcut_search_table: "Search table",
    shortcut_list: "Shortcut list",
    shortcut_edit_selected: "Edit selected element",
    shortcut_field_summary: "Show field summary",
    shortcut_dbml_editor: "Open DBML editor",
    shortcut_theme: "Toggle light/dark theme",
    undo_hint: "Press Ctrl+Z to undo changes.",
    shortcut_hint_table: "Table created with the T shortcut. $t(undo_hint)",
    shortcut_hint_area: "Area created with the A shortcut. $t(undo_hint)",
    shortcut_hint_note: "Note created with the N shortcut. $t(undo_hint)",
    shortcut_hint_arrange:
      "Diagram arranged with the O shortcut. $t(undo_hint)",
    snap_button: "Snap objects to grid (Ctrl+Alt+G)",
    shortcut_typing_detected:
      "It looks like you are typing outside a text field, so the shortcut was ignored or undone. Click the field where you want to write.",
    shortcut_delete_blocked:
      "Delete ignored: you were typing in a field. Press Delete again to delete the selected element.",
    grid_menu: "Grid",
    grid_snap: "Snap objects to grid",
    grid_size: "Grid size",
    grid_size_small: "Small ({{size}} px)",
    grid_size_medium: "Medium ({{size}} px)",
    grid_size_large: "Large ({{size}} px)",
    image_empty_diagram: "Nothing to copy or export: the diagram is empty.",
    show_header: "Show menu bar",
  },
};

for (const [lng, translation] of Object.entries(resources)) {
  i18n.addResourceBundle(lng, "translation", translation, true, false);
}

// Ajustes em textos do upstream (sobrescrevem as traduções originais sem
// editar src/i18n/locales): nomes que precisam ser iguais em todos os lugares
// onde o mesmo comando aparece.
const overrides = {
  "pt-BR": {
    fit_window_reset: "Ajustar diagrama à tela",
    snap_to_grid: "Alinhar objetos à grade",
  },
  en: {
    fit_window_reset: "Fit diagram to screen",
    snap_to_grid: "Snap objects to grid",
  },
};

for (const [lng, translation] of Object.entries(overrides)) {
  i18n.addResourceBundle(lng, "translation", translation, true, true);
}

// Exportação e importação de arquivos (Sprint 1C), banco padrão e F2.
const fileTexts = {
  "pt-BR": {
    untitled_diagram: "Diagrama sem título",
    export_delivery: "Exportar para entrega…",
    export_dialog_title: "Exportar para entrega",
    export_option_zip: "Pacote ZIP (recomendado)",
    export_option_zip_hint:
      "Um único arquivo com o SQL, o diagrama completo, uma imagem e instruções. Ideal para enviar pelo Teams.",
    export_option_pair: "SQL + JSON",
    export_option_pair_hint:
      "Dois arquivos com o mesmo nome: o SQL e o diagrama completo, que reabre o desenho no editor.",
    export_option_sql: "Só o SQL",
    export_option_sql_hint:
      "Script para criar o banco de dados. Use quando só o SQL for pedido ou para levar o banco para produção.",
    export_dialect: "Banco de dados do SQL",
    export_dialect_hint:
      "O diagrama é Genérico: escolha para qual banco de dados o SQL será gerado.",
    export_files: "Arquivos gerados",
    export_download: "Baixar",
    export_download_both: "Baixar os dois",
    export_download_sql_only: "Só o .sql",
    export_download_json_only: "Só o .json",
    export_multiple_downloads_hint:
      "O navegador pode pedir permissão para baixar dois arquivos de uma vez.",
    export_started: "Download iniciado: {{files}}",
    export_failed: "Não foi possível gerar os arquivos.",
    import_file_child: "Arquivo do diagrama (.json, .sql, .zip)",
    import_dialog_title: "Importar arquivo",
    import_drop_here: "Arraste os arquivos para cá ou clique para escolher",
    import_accepted:
      "Aceita o .json do diagrama, o .sql, os dois juntos ou o pacote .zip.",
    import_reading: "Lendo os arquivos…",
    import_choose_other: "Escolher outros arquivos",
    import_database: "Banco de dados",
    import_tables: "Tabelas",
    import_exported_at: "Exportado em",
    import_from_package: "Do pacote",
    import_sql_match: "O SQL confere com o desenho.",
    import_sql_mismatch:
      "O SQL foi alterado depois da exportação. O diagrama será aberto pelo .json, com o desenho original.",
    import_sql_not_checked:
      "Arquivo .json antigo: não dá para conferir se o SQL corresponde ao desenho. O diagrama será aberto pelo .json.",
    import_sql_only:
      "Só o SQL: as tabelas serão organizadas automaticamente. Sem o .json, o desenho original não pode ser restaurado.",
    import_sql_dialect: "Banco de dados do SQL",
    import_duplicate: "Este arquivo já foi importado antes, como “{{name}}”.",
    import_open: "Abrir",
    import_open_existing: "Abrir o existente",
    import_new_copy: "Importar uma nova cópia",
    import_open_sql_instead: "Abrir o SQL como outro diagrama",
    import_open_json_instead: "Voltar e abrir pelo .json",
    import_error_no_files: "Nenhum arquivo escolhido.",
    import_error_rar_not_supported:
      "Arquivos .rar não são aceitos. Compacte em .zip (no Windows: botão direito → Enviar para → Pasta compactada) e tente de novo.",
    import_error_unsupported:
      "Formato não aceito ({{name}}). Use .json, .sql ou .zip.",
    import_error_ambiguous:
      "Escolha um diagrama por vez: há mais de um arquivo .json ou .sql na seleção.",
    import_error_invalid_zip:
      "O arquivo .zip está corrompido ou não pôde ser lido.",
    import_error_too_large: "Arquivo grande demais para importar.",
    import_error_too_many_files: "O .zip tem arquivos demais.",
    import_error_empty_package:
      "O .zip não tem nenhum arquivo .json ou .sql de diagrama.",
    import_error_invalid_json: "O arquivo .json está corrompido.",
    import_error_not_a_diagram: "O arquivo não é um diagrama.",
    import_error_unknown_database:
      "O diagrama usa um banco de dados que este editor não reconhece.",
    import_error_newer_format:
      "O arquivo foi gerado por uma versão mais nova do editor. Recarregue a página com Ctrl+F5 e tente de novo.",
    import_error_broken_relationships:
      "O diagrama tem relacionamentos com tabelas ou campos que não existem.",
    import_error_sql_syntax:
      "Erro no SQL na linha {{line}}, coluna {{column}}.",
    import_error_sql_syntax_no_position: "O SQL tem erros de sintaxe.",
    import_error_sql_unsupported:
      "Não foi possível converter este SQL em diagrama.",
    default_database: "Banco de dados padrão",
    default_database_current: "padrão",
    rename_selected: "Renomear elemento selecionado",
  },
  en: {
    untitled_diagram: "Untitled diagram",
    export_delivery: "Export for submission…",
    export_dialog_title: "Export for submission",
    export_option_zip: "ZIP package (recommended)",
    export_option_zip_hint:
      "A single file with the SQL, the full diagram, an image and instructions.",
    export_option_pair: "SQL + JSON",
    export_option_pair_hint:
      "Two files with the same name: the SQL and the full diagram, which reopens the drawing in the editor.",
    export_option_sql: "SQL only",
    export_option_sql_hint:
      "Script to create the database. Use it when only the SQL is required or to take the database to production.",
    export_dialect: "SQL database",
    export_dialect_hint:
      "The diagram is Generic: choose which database the SQL is generated for.",
    export_files: "Generated files",
    export_download: "Download",
    export_download_both: "Download both",
    export_download_sql_only: ".sql only",
    export_download_json_only: ".json only",
    export_multiple_downloads_hint:
      "The browser may ask for permission to download two files at once.",
    export_started: "Download started: {{files}}",
    export_failed: "Could not generate the files.",
    import_file_child: "Diagram file (.json, .sql, .zip)",
    import_dialog_title: "Import file",
    import_drop_here: "Drop the files here or click to choose",
    import_accepted:
      "Accepts the diagram .json, the .sql, both together or the .zip package.",
    import_reading: "Reading the files…",
    import_choose_other: "Choose other files",
    import_database: "Database",
    import_tables: "Tables",
    import_exported_at: "Exported at",
    import_from_package: "From package",
    import_sql_match: "The SQL matches the drawing.",
    import_sql_mismatch:
      "The SQL was changed after export. The diagram will open from the .json, with the original drawing.",
    import_sql_not_checked:
      "Old .json file: the SQL cannot be checked against the drawing. The diagram will open from the .json.",
    import_sql_only:
      "SQL only: tables will be arranged automatically. Without the .json, the original drawing cannot be restored.",
    import_sql_dialect: "SQL database",
    import_duplicate: "This file was already imported as “{{name}}”.",
    import_open: "Open",
    import_open_existing: "Open the existing one",
    import_new_copy: "Import a new copy",
    import_open_sql_instead: "Open the SQL as another diagram",
    import_open_json_instead: "Go back and open from the .json",
    import_error_no_files: "No file chosen.",
    import_error_rar_not_supported:
      ".rar files are not accepted. Compress as .zip and try again.",
    import_error_unsupported:
      "Unsupported format ({{name}}). Use .json, .sql or .zip.",
    import_error_ambiguous:
      "Choose one diagram at a time: there is more than one .json or .sql file.",
    import_error_invalid_zip:
      "The .zip file is corrupted or could not be read.",
    import_error_too_large: "File too large to import.",
    import_error_too_many_files: "The .zip has too many files.",
    import_error_empty_package: "The .zip has no diagram .json or .sql file.",
    import_error_invalid_json: "The .json file is corrupted.",
    import_error_not_a_diagram: "The file is not a diagram.",
    import_error_unknown_database:
      "The diagram uses a database this editor does not recognize.",
    import_error_newer_format:
      "The file was created by a newer version of the editor. Reload the page with Ctrl+F5 and try again.",
    import_error_broken_relationships:
      "The diagram has relationships to tables or fields that do not exist.",
    import_error_sql_syntax: "SQL error at line {{line}}, column {{column}}.",
    import_error_sql_syntax_no_position: "The SQL has syntax errors.",
    import_error_sql_unsupported: "Could not convert this SQL into a diagram.",
    default_database: "Default database",
    default_database_current: "default",
    rename_selected: "Rename selected element",
  },
};

for (const [lng, translation] of Object.entries(fileTexts)) {
  i18n.addResourceBundle(lng, "translation", translation, true, false);
}

// Título de diagramas novos, no idioma atual.
export function untitledTitle() {
  return i18n.t("untitled_diagram");
}
