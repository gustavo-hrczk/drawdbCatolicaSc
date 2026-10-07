import { fromDBML } from "../../utils/importFrom/dbml";
import { stripBom } from "./sql";

// Converte um arquivo .dbml em diagrama novo, com o mesmo conversor do
// "Importar > DBML" do upstream (que substituía o diagrama aberto). O DBML não
// guarda o desenho; as tabelas são organizadas depois, na importação.
//
// Devolve { ok: true, data } ou { ok: false, error, detail }.
export function parseDbmlDiagram(text, database) {
  let diagram;
  try {
    diagram = fromDBML(stripBom(text), database);
  } catch (error) {
    const start = error?.diags?.[0]?.location?.start;
    return {
      ok: false,
      error: "dbml_syntax",
      detail: start ? { line: start.line, column: start.column } : null,
    };
  }
  return {
    ok: true,
    data: {
      database,
      tables: diagram.tables,
      relationships: diagram.relationships,
      enums: diagram.enums ?? [],
      types: [],
      notes: [],
      subjectAreas: [],
      views: [],
    },
  };
}
