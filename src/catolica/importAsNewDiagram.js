import { v4 as uuidv4 } from "uuid";
import { db } from "../data/db";
import { DB } from "../data/constants";
import { databases } from "../data/databases";
import { mergeCustomTypes } from "../utils/customTypes";

// Salva um diagrama importado de arquivo (.json/.ddb, inclusive os do ZIP de
// "Exportar dados salvos") como um diagrama novo neste navegador, sem tocar no
// diagrama aberto. Retorna o diagramId criado.
export async function importAsNewDiagram(data) {
  const database = data.database || DB.GENERIC;
  const diagramId = uuidv4();

  await db.diagrams.add({
    diagramId,
    database,
    name: data.title || data.name || "Untitled diagram",
    gistId: "",
    loadedFromGistId: "",
    lastModified: new Date(),
    tables: data.tables,
    references: data.relationships,
    notes: data.notes ?? [],
    areas: data.subjectAreas ?? [],
    views: data.views ?? [],
    pan: data.pan ?? { x: 0, y: 0 },
    zoom: data.zoom ?? 1,
    ...(databases[database].hasEnums && { enums: data.enums ?? [] }),
    ...(databases[database].hasTypes && { types: data.types ?? [] }),
  });

  if (data.customTypes) mergeCustomTypes(data.customTypes);

  return diagramId;
}
