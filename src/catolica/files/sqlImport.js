import { Parser } from "node-sql-parser";
import { Parser as OracleParser } from "oracle-sql-parser";
import { DB } from "../../data/constants";
import { importSQL } from "../../utils/importSQL";
import { stripBom } from "./sql";

// Converte um arquivo .sql em diagrama, com o mesmo parser e o mesmo conversor
// do "Importar de SQL" do upstream, mas para abrir como diagrama novo (o
// upstream aplica no diagrama aberto). As tabelas são organizadas
// automaticamente: um .sql não guarda o desenho.
//
// Devolve { ok: true, data } ou { ok: false, error, detail }.
export function parseSqlDiagram(text, dialect) {
  const source = stripBom(text);
  let ast;
  try {
    ast =
      dialect === DB.ORACLESQL
        ? new OracleParser().parse(source)
        : new Parser().astify(source, { database: dialect });
  } catch (error) {
    return {
      ok: false,
      error: "sql_syntax",
      detail: error.location
        ? {
            line: error.location.start.line,
            column: error.location.start.column,
          }
        : null,
    };
  }

  try {
    const diagram = importSQL(ast, dialect, dialect);
    return {
      ok: true,
      data: {
        database: dialect,
        tables: diagram.tables,
        relationships: diagram.relationships,
        types: diagram.types ?? [],
        enums: diagram.enums ?? [],
        notes: [],
        subjectAreas: [],
        views: [],
      },
    };
  } catch {
    return { ok: false, error: "sql_unsupported", detail: null };
  }
}
