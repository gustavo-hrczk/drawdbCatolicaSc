import { v4 as uuidv4 } from "uuid";
import { db } from "../data/db";
import { DB } from "../data/constants";
import { databases } from "../data/databases";
import { mergeCustomTypes } from "../utils/customTypes";
import { untitledTitle } from "./i18n";
import { diagramContentKey } from "./files/diagramJson";

// Salva um diagrama importado de arquivo (.json/.ddb/.zip/.sql) como um
// diagrama novo neste navegador, sem tocar no diagrama aberto. Retorna o
// diagramId criado.
//
// source (opcional): { exportId } do arquivo, guardado em importedFrom para
// avisar se o mesmo arquivo for importado de novo.
export async function importAsNewDiagram(data, source = null) {
  const database = data.database || DB.GENERIC;
  const diagramId = uuidv4();
  const now = new Date();

  await db.diagrams.add({
    diagramId,
    database,
    name: data.title || data.name || untitledTitle(),
    gistId: "",
    loadedFromGistId: "",
    createdAt: now,
    lastModified: now,
    tables: data.tables,
    references: data.relationships,
    notes: data.notes ?? [],
    areas: data.subjectAreas ?? [],
    views: data.views ?? [],
    pan: data.pan ?? { x: 0, y: 0 },
    zoom: data.zoom ?? 1,
    ...(databases[database].hasEnums && { enums: data.enums ?? [] }),
    ...(databases[database].hasTypes && { types: data.types ?? [] }),
    ...(source?.exportId && {
      importedFrom: { exportId: source.exportId, importedAt: now },
    }),
  });

  if (data.customTypes) mergeCustomTypes(data.customTypes);

  return diagramId;
}

// Diagrama deste navegador igual ao que vai ser importado, se houver: o que
// veio do mesmo arquivo exportado (exportId) ou, para arquivos sem esse
// identificador (como os do drawDB original), um com o mesmo conteúdo. Um
// diagrama alterado depois da importação não conta mais como igual.
export async function findDuplicate(data, exportId) {
  const key = diagramContentKey(data);
  let sameContent = null;
  for (const diagram of await db.diagrams.toArray()) {
    if (exportId && diagram.importedFrom?.exportId === exportId) return diagram;
    if (!sameContent && diagramContentKey(diagram) === key)
      sameContent = diagram;
  }
  return sameContent;
}
