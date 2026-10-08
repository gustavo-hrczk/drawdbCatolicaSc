import { db } from "../../data/db";
import { catolicaDb, revisionOf, saveHistory } from "../editorHistory";
import { snapshotKey } from "./versionRules";

// Histórico vindo de um pacote .zip (files/historyPackage.js) aplicado ao
// diagrama recém-importado: as pilhas de desfazer/refazer (a linha do tempo
// continua de onde parou) e as versões, com as datas originais. Os ids dos
// elementos são os do arquivo, então os passos continuam válidos.
// Nunca lança: o diagrama já foi importado e o histórico é um extra.
export async function importHistory(diagramId, history) {
  if (!diagramId || !history) return;
  try {
    const record = await db.diagrams
      .where("diagramId")
      .equals(diagramId)
      .first();
    if (history.stacks && record) {
      await saveHistory(
        diagramId,
        revisionOf(record.lastModified),
        history.stacks.undo,
        history.stacks.redo,
      );
    }
    if (history.versions.length) {
      await catolicaDb.versions.bulkAdd(
        history.versions.map((version) => ({
          ...version,
          diagramId,
          key: snapshotKey(version.snapshot),
        })),
      );
    }
  } catch (err) {
    console.warn("could not import history:", err);
  }
}

// Resumo para a janela Importar: quantos passos e versões vêm no pacote.
export function historySummary(history) {
  if (!history) return null;
  return {
    changes: history.stacks
      ? history.stacks.undo.length + history.stacks.redo.length
      : 0,
    versions: history.versions.length,
  };
}
