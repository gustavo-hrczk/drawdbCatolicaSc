import i18n from "../i18n/i18n";

// Textos próprios do fork. Ficam aqui, e não em src/i18n/locales, para não
// gerar conflitos ao sincronizar as traduções com o upstream.
const resources = {
  "pt-BR": {
    diagram_not_found_locally:
      "Este diagrama não está salvo neste navegador. O que você criar aqui será salvo como um novo diagrama.",
    ready_to_import_as_new:
      "Tudo certo. O arquivo será aberto como um novo diagrama, e o diagrama atual não será alterado.",
    diagram_imported: 'Diagrama "{{title}}" aberto e salvo neste navegador.',
    unknown_database_in_file:
      "O arquivo usa um banco de dados que este editor não reconhece.",
  },
  en: {
    diagram_not_found_locally:
      "This diagram is not saved in this browser. Whatever you create here will be saved as a new diagram.",
    ready_to_import_as_new:
      "All set. The file will open as a new diagram and the current one will not change.",
    diagram_imported: 'Diagram "{{title}}" opened and saved in this browser.',
    unknown_database_in_file:
      "The file uses a database this editor does not recognize.",
  },
};

for (const [lng, translation] of Object.entries(resources)) {
  i18n.addResourceBundle(lng, "translation", translation, true, false);
}
