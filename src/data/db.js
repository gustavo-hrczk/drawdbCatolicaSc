import Dexie from "dexie";
import { v4 as uuidv4 } from "uuid";
import { templateSeeds } from "./seeds";

// VITE_DB_NAME isola o banco local da homologação (mesma origem que produção).
export const db = new Dexie(import.meta.env.VITE_DB_NAME || "drawDB");

db.version(67)
  .stores({
    diagrams: "++id, lastModified, loadedFromGistId, diagramId",
    templates: "++id, custom, templateId",
  })
  .upgrade(async (tx) => {
    await tx.diagrams.toCollection().modify((diagram) => {
      if (!diagram.diagramId) {
        diagram.diagramId = uuidv4();
      }
    });
    await tx.templates.toCollection().modify((template) => {
      if (!template.templateId) {
        template.templateId = uuidv4();
      }
    });
  });

db.on("populate", (transaction) => {
  transaction.templates.bulkAdd(templateSeeds).catch((e) => console.log(e));
});
