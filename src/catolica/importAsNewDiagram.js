import { v4 as uuidv4 } from "uuid";
import { db } from "../data/db";
import { DB } from "../data/constants";
import { databases } from "../data/databases";
import { mergeCustomTypes } from "../utils/customTypes";
import { untitledTitle } from "./i18n";

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

// Diagrama deste navegador que veio do mesmo arquivo exportado, se houver.
export function findImportedCopy(exportId) {
  if (!exportId) return Promise.resolve(null);
  return db.diagrams
    .filter((diagram) => diagram.importedFrom?.exportId === exportId)
    .first();
}
