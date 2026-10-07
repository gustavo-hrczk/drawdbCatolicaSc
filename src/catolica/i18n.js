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
    shortcuts_single_key_group: "Atalhos rápidos",
    shortcut_or: "ou",
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
    shortcuts_single_key_group: "Quick shortcuts",
    shortcut_or: "or",
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
    template_saved: "Modelo salvo! Ele aparece em Arquivo → Novo.",
    timeline: "Histórico de alterações",
    no_activity: "Nenhuma alteração neste diagrama ainda.",
  },
  en: {
    fit_window_reset: "Fit diagram to screen",
    snap_to_grid: "Snap objects to grid",
    template_saved: "Template saved! It is shown in File → New.",
    timeline: "Change history",
    no_activity: "No changes in this diagram yet.",
  },
};

for (const [lng, translation] of Object.entries(overrides)) {
  i18n.addResourceBundle(lng, "translation", translation, true, true);
}

// Menu Arquivo, exportação e importação (Sprints 1C e 1F), banco padrão e F2.
// As descrições de opções dizem o que cada uma é ou contém, sem indicar usos
// nem citar outros produtos; mensagens de erro dizem como resolver.
const fileTexts = {
  "pt-BR": {
    untitled_diagram: "Diagrama sem título",
    new_dialog_title: "Novo diagrama",
    new_window_dialog_title: "Novo diagrama em nova janela",
    new_name_title: "Salvar diagrama atual",
    new_name_body:
      "O diagrama atual será salvo como “{{title}}”. Deseja renomeá-lo para encontrá-lo mais facilmente?",
    new_name_skip: "Manter nome padrão",
    new_name_save: "Renomear e continuar",
    diagram_name_placeholder: "Nome do diagrama",
    open_from_computer: "Abrir arquivo do computador",
    open_recent_all: "Ver todos os diagramas",
    save_as_template_option: "Salvar como modelo (aparece em Arquivo → Novo)",
    export_dialog_title: "Exportar",
    export_name: "Nome do diagrama",
    export_group_sql: "SQL",
    export_group_complete: "Diagrama completo",
    export_group_image: "Imagem",
    export_group_other: "Outros formatos",
    export_option_sql: "Arquivo .sql",
    export_option_sql_hint:
      "Script SQL com a estrutura do banco de dados do diagrama.",
    export_option_zip: "Pacote .zip",
    export_option_zip_hint: "Exporta um pacote .zip com os seguintes arquivos:",
    export_zip_file_sql: "Schema SQL (.sql)",
    export_zip_file_json: "Diagrama completo (.json)",
    export_zip_file_png: "Imagem do diagrama (.png)",
    export_zip_file_readme: "Instruções (README.txt)",
    export_option_png: "PNG",
    export_option_png_hint: "Imagem do diagrama em alta resolução.",
    export_option_jpeg: "JPEG",
    export_option_jpeg_hint: "Imagem compactada, com fundo sólido.",
    export_option_svg: "SVG",
    export_option_svg_hint:
      "Imagem vetorial, que pode ser ampliada sem perder qualidade.",
    export_option_pdf: "PDF",
    export_option_pdf_hint: "Documento de uma página, do tamanho do diagrama.",
    export_option_dbml: "DBML",
    export_option_dbml_hint: "Estrutura do banco de dados em texto DBML.",
    export_option_mermaid: "Mermaid",
    export_option_mermaid_hint:
      "Diagrama entidade-relacionamento em texto Mermaid.",
    export_option_markdown: "Documentação (Markdown)",
    export_option_markdown_hint:
      "Descrição das tabelas e dos campos em Markdown.",
    export_dialect: "Banco de dados do SQL",
    export_dialect_hint:
      "O diagrama é Genérico: escolha para qual banco de dados o SQL será gerado.",
    export_file: "Arquivo gerado",
    export_download: "Baixar",
    export_view_code: "Ver e copiar o código",
    export_started: "Download iniciado: {{files}}",
    export_failed: "Não foi possível gerar o arquivo.",
    export_empty_diagram: "O diagrama está vazio: não há o que exportar.",
    export_no_tables:
      "O diagrama não tem tabelas: não há o que gerar neste formato.",
    import_dialog_title: "Importar",
    import_drop_here: "Arraste um arquivo aqui ou clique para selecionar",
    import_accepted:
      "Aceita SQL (.sql), diagrama completo (.zip ou .json) ou DBML (.dbml).",
    import_opens_new_window: "O diagrama será aberto em uma nova janela.",
    import_paste_sql: "Colar código SQL diretamente",
    import_paste_placeholder: "Cole aqui o código SQL (CREATE TABLE …)",
    import_back: "Voltar",
    import_continue: "Continuar",
    import_back_to_list: "Voltar à lista",
    import_reading: "Lendo os arquivos…",
    import_choose_other: "Escolher outro arquivo",
    import_choose_intro:
      "Os arquivos têm {{count}} diagramas. Escolha qual abrir.",
    import_kind_json: "Diagrama completo (.json)",
    import_kind_pair: "Diagrama completo (.json e .sql)",
    import_kind_sql: "SQL (.sql)",
    import_kind_dbml: "DBML (.dbml)",
    import_tables_count: "Tabelas: {{count}}",
    import_ignored: "Ignorados",
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
      "As tabelas serão organizadas automaticamente, porque o SQL não guarda a posição dos elementos.",
    import_sql_dialect: "Banco de dados do SQL",
    import_dbml_database: "Banco de dados do diagrama",
    import_dbml_info:
      "As tabelas serão organizadas automaticamente, porque o DBML não guarda a posição dos elementos.",
    import_duplicate:
      "Este diagrama já existe neste navegador, como “{{name}}”.",
    import_open: "Abrir em nova janela",
    import_open_existing: "Abrir o existente",
    import_new_copy: "Importar uma nova cópia",
    import_open_sql_instead: "Abrir o SQL como outro diagrama",
    import_open_json_instead: "Voltar e abrir pelo .json",
    import_already_open: "Este diagrama já está aberto nesta janela.",
    diagram_imported_new_window:
      "Diagrama “{{title}}” salvo neste navegador e aberto em uma nova janela.",
    import_error_no_files: "Nenhum arquivo escolhido.",
    import_error_rar_not_supported:
      "Arquivos .rar não são aceitos. Compacte em .zip (no Windows: botão direito → Enviar para → Pasta compactada) e tente de novo.",
    import_error_unsupported:
      "Formato não aceito ({{name}}). Use .sql, .zip, .json ou .dbml.",
    import_error_invalid_zip:
      "O arquivo .zip está corrompido ou não pôde ser lido.",
    import_error_too_large:
      "Um arquivo dentro de “{{name}}” é grande demais para importar.",
    import_error_too_large_size:
      "“{{name}}” tem {{size}}; o limite é {{limit}}.",
    import_error_package_too_large:
      "O conteúdo de “{{name}}” é grande demais para importar.",
    import_error_too_many_files: "O .zip tem arquivos demais.",
    import_error_empty_file:
      "“{{name}}” está vazio. Baixe o arquivo de novo e tente outra vez.",
    import_error_empty_package:
      "O .zip não tem nenhum arquivo de diagrama (.sql, .json ou .dbml).",
    import_error_nested_package:
      "O .zip tem pacotes dentro de pacotes. Extraia os arquivos e importe um pacote por vez.",
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
    import_error_dbml_syntax:
      "Erro no DBML na linha {{line}}, coluna {{column}}.",
    import_error_dbml_syntax_no_position: "O DBML tem erros de sintaxe.",
    default_database: "Banco de dados padrão",
    default_database_current: "padrão",
    rename_selected: "Renomear",
  },
  en: {
    untitled_diagram: "Untitled diagram",
    new_dialog_title: "New diagram",
    new_window_dialog_title: "New diagram in a new window",
    new_name_title: "Save current diagram",
    new_name_body:
      "The current diagram will be saved as “{{title}}”. Do you want to rename it so it is easier to find?",
    new_name_skip: "Keep default name",
    new_name_save: "Rename and continue",
    diagram_name_placeholder: "Diagram name",
    open_from_computer: "Open a file from this computer",
    open_recent_all: "See all diagrams",
    save_as_template_option: "Save as template (shown in File → New)",
    export_dialog_title: "Export",
    export_name: "Diagram name",
    export_group_sql: "SQL",
    export_group_complete: "Full diagram",
    export_group_image: "Image",
    export_group_other: "Other formats",
    export_option_sql: ".sql file",
    export_option_sql_hint:
      "SQL script with the database structure of the diagram.",
    export_option_zip: ".zip package",
    export_option_zip_hint: "Exports a .zip package with the following files:",
    export_zip_file_sql: "SQL schema (.sql)",
    export_zip_file_json: "Full diagram (.json)",
    export_zip_file_png: "Diagram image (.png)",
    export_zip_file_readme: "Instructions (README.txt)",
    export_option_png: "PNG",
    export_option_png_hint: "High resolution image of the diagram.",
    export_option_jpeg: "JPEG",
    export_option_jpeg_hint: "Compressed image with a solid background.",
    export_option_svg: "SVG",
    export_option_svg_hint:
      "Vector image that can be enlarged without losing quality.",
    export_option_pdf: "PDF",
    export_option_pdf_hint: "Single-page document the size of the diagram.",
    export_option_dbml: "DBML",
    export_option_dbml_hint: "Database structure as DBML text.",
    export_option_mermaid: "Mermaid",
    export_option_mermaid_hint: "Entity-relationship diagram as Mermaid text.",
    export_option_markdown: "Documentation (Markdown)",
    export_option_markdown_hint:
      "Description of the tables and fields in Markdown.",
    export_dialect: "SQL database",
    export_dialect_hint:
      "The diagram is Generic: choose which database the SQL is generated for.",
    export_file: "Generated file",
    export_download: "Download",
    export_view_code: "View and copy the code",
    export_started: "Download started: {{files}}",
    export_failed: "Could not generate the file.",
    export_empty_diagram: "The diagram is empty: there is nothing to export.",
    export_no_tables:
      "The diagram has no tables: there is nothing to generate in this format.",
    import_dialog_title: "Import",
    import_drop_here: "Drop a file here or click to select",
    import_accepted:
      "Accepts SQL (.sql), full diagram (.zip or .json) or DBML (.dbml).",
    import_opens_new_window: "The diagram will open in a new window.",
    import_paste_sql: "Paste SQL code directly",
    import_paste_placeholder: "Paste the SQL code here (CREATE TABLE …)",
    import_back: "Back",
    import_continue: "Continue",
    import_back_to_list: "Back to the list",
    import_reading: "Reading the files…",
    import_choose_other: "Choose another file",
    import_choose_intro:
      "The files have {{count}} diagrams. Choose which one to open.",
    import_kind_json: "Full diagram (.json)",
    import_kind_pair: "Full diagram (.json and .sql)",
    import_kind_sql: "SQL (.sql)",
    import_kind_dbml: "DBML (.dbml)",
    import_tables_count: "Tables: {{count}}",
    import_ignored: "Ignored",
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
      "Tables will be arranged automatically, because SQL does not keep the position of elements.",
    import_sql_dialect: "SQL database",
    import_dbml_database: "Diagram database",
    import_dbml_info:
      "Tables will be arranged automatically, because DBML does not keep the position of elements.",
    import_duplicate:
      "This diagram already exists in this browser as “{{name}}”.",
    import_open: "Open in a new window",
    import_open_existing: "Open the existing one",
    import_new_copy: "Import a new copy",
    import_open_sql_instead: "Open the SQL as another diagram",
    import_open_json_instead: "Go back and open from the .json",
    import_already_open: "This diagram is already open in this window.",
    diagram_imported_new_window:
      "Diagram “{{title}}” saved in this browser and opened in a new window.",
    import_error_no_files: "No file chosen.",
    import_error_rar_not_supported:
      ".rar files are not accepted. Compress as .zip and try again.",
    import_error_unsupported:
      "Unsupported format ({{name}}). Use .sql, .zip, .json or .dbml.",
    import_error_invalid_zip:
      "The .zip file is corrupted or could not be read.",
    import_error_too_large: "A file inside “{{name}}” is too large to import.",
    import_error_too_large_size:
      "“{{name}}” is {{size}}; the limit is {{limit}}.",
    import_error_package_too_large:
      "The content of “{{name}}” is too large to import.",
    import_error_too_many_files: "The .zip has too many files.",
    import_error_empty_file:
      "“{{name}}” is empty. Download the file again and retry.",
    import_error_empty_package:
      "The .zip has no diagram file (.sql, .json or .dbml).",
    import_error_nested_package:
      "The .zip has packages inside packages. Extract the files and import one package at a time.",
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
    import_error_dbml_syntax: "DBML error at line {{line}}, column {{column}}.",
    import_error_dbml_syntax_no_position: "The DBML has syntax errors.",
    default_database: "Default database",
    default_database_current: "default",
    rename_selected: "Rename",
  },
};

// Menus Editar, Ver, Configurações e Ajuda (Sprint 1F).
const menuTexts = {
  "pt-BR": {
    change_history: "Histórico de alterações",
    view_on_diagram: "Mostrar no diagrama",
    browser_data: "Dados do navegador",
    browser_data_export: "Exportar todos os diagramas",
    browser_data_erase: "Apagar todos os diagramas deste navegador",
    browser_data_erase_title: "Apagar todos os diagramas?",
    browser_data_erase_body:
      "Todos os diagramas e modelos salvos neste navegador serão apagados, e isso não pode ser desfeito. Para guardar uma cópia antes, use Dados do navegador → Exportar todos os diagramas.",
    browser_data_erase_confirm: "Apagar tudo",
    help_shortcuts: "Atalhos do teclado",
    help_docs: "Documentação do drawDB (em inglês)",
    help_changelog: "Novidades",
    help_report: "Relatar um problema",
    help_about: "Sobre",
    changelog_title: "Novidades",
    changelog_unreleased: "Próxima versão (em testes)",
    changelog_version: "Versão {{version}} · {{date}}",
    changelog_empty: "Nenhuma novidade registrada.",
    about_title: "Sobre",
    about_description:
      "Editor de diagramas de banco de dados baseado no drawDB, um projeto de código aberto. Esta é uma versão modificada, distribuída sob a mesma licença.",
    about_version: "Versão",
    about_version_dev: "Em desenvolvimento",
    about_test_environment: "Ambiente de testes",
    about_license: "Licença",
    about_source: "Código-fonte",
    about_original: "Projeto original",
    about_original_credits: "drawDB, de drawdb-io e colaboradores",
    report_issue_body:
      "**O que aconteceu?**\n\n\n**Como reproduzir (passo a passo):**\n1. \n\n**O que era esperado?**\n\n\n---\nVersão: {{version}} {{environment}}\nNavegador: {{browser}}",
  },
  en: {
    change_history: "Change history",
    view_on_diagram: "Show on diagram",
    browser_data: "Browser data",
    browser_data_export: "Export all diagrams",
    browser_data_erase: "Delete all diagrams in this browser",
    browser_data_erase_title: "Delete all diagrams?",
    browser_data_erase_body:
      "All diagrams and templates saved in this browser will be deleted, and this cannot be undone. To keep a copy first, use Browser data → Export all diagrams.",
    browser_data_erase_confirm: "Delete everything",
    help_shortcuts: "Keyboard shortcuts",
    help_docs: "drawDB documentation",
    help_changelog: "What's new",
    help_report: "Report a problem",
    help_about: "About",
    changelog_title: "What's new",
    changelog_unreleased: "Next version (in testing)",
    changelog_version: "Version {{version}} · {{date}}",
    changelog_empty: "No changes recorded.",
    about_title: "About",
    about_description:
      "Database diagram editor based on drawDB, an open source project. This is a modified version, distributed under the same license.",
    about_version: "Version",
    about_version_dev: "In development",
    about_test_environment: "Test environment",
    about_license: "License",
    about_source: "Source code",
    about_original: "Original project",
    about_original_credits: "drawDB, by drawdb-io and contributors",
    report_issue_body:
      "**What happened?**\n\n\n**How to reproduce (step by step):**\n1. \n\n**What was expected?**\n\n\n---\nVersion: {{version}} {{environment}}\nBrowser: {{browser}}",
  },
};

for (const [lng, translation] of Object.entries(menuTexts)) {
  i18n.addResourceBundle(lng, "translation", translation, true, false);
}

for (const [lng, translation] of Object.entries(fileTexts)) {
  i18n.addResourceBundle(lng, "translation", translation, true, false);
}

// Título de diagramas novos, no idioma atual.
export function untitledTitle() {
  return i18n.t("untitled_diagram");
}

// Nomes padrão de diagrama (de qualquer idioma e os antigos do upstream).
const DEFAULT_TITLES = new Set([
  "Untitled Diagram",
  "Untitled diagram",
  ...Object.values(fileTexts).map((texts) => texts.untitled_diagram),
]);

export function isDefaultTitle(title) {
  const value = (title ?? "").trim();
  return !value || DEFAULT_TITLES.has(value);
}
