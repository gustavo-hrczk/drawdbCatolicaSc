import { v4 as uuidv4 } from "uuid";
import { db } from "../../data/db";
import { databases } from "../../data/databases";
import { catolicaDb } from "../editorHistory";
import { importAsNewDiagram } from "../importAsNewDiagram";
import { buildDiagramJson, serializeDiagramJson } from "../files/diagramJson";
import { diagramSql, sqlDialectFor, sqlFingerprint } from "../files/sql";
import { exportFileName, fileStamp, safeBaseName } from "../files/naming";
import { buildPackage, packageReadme } from "../files/zipPackage";
import { buildHistoryFiles } from "../files/historyPackage";
import { listVersions } from "../history/versions";
import { stepText } from "../history/historyRows";

// Ações da tela inicial sobre os diagramas salvos neste navegador, sem abrir
// o editor: exportar, duplicar, excluir (com "Desfazer") e favoritar.

// Registro do banco local -> formato do diagrama usado na exportação.
export function asDiagram(record) {
  return {
    title: record.name,
    database: record.database,
    tables: record.tables ?? [],
    relationships: record.references ?? [],
    notes: record.notes ?? [],
    areas: record.areas ?? [],
    subjectAreas: record.areas ?? [],
    views: record.views ?? [],
    types: record.types ?? [],
    enums: record.enums ?? [],
    pan: record.pan,
    zoom: record.zoom,
  };
}

async function recordOf(diagramId) {
  return db.diagrams.where("diagramId").equals(diagramId).first();
}

// Arquivo para baixar: { blob, fileName }. kind: "zip" | "json" | "sql".
// O pacote .zip sai sem a imagem (ela é gerada a partir do desenho na tela,
// que só existe no editor) e com o histórico, se houver.
export async function exportDiagram(diagramId, kind, { dialect, t }) {
  const record = await recordOf(diagramId);
  if (!record) throw new Error("diagram not found");
  const diagram = asDiagram(record);
  const sqlDialect = sqlDialectFor(diagram.database, dialect);
  const now = new Date();
  const base = `${safeBaseName(record.name)}_${fileStamp(now)}`;

  const sql = () => diagramSql(diagram, sqlDialect);
  const json = async (sqlText) =>
    serializeDiagramJson(
      buildDiagramJson(diagram, {
        exportId: uuidv4(),
        exportedAt: now,
        createdAt: record.createdAt,
        modifiedAt: record.lastModified,
        dialect: sqlText ? sqlDialect : null,
        sqlFingerprint: sqlText ? await sqlFingerprint(sqlText) : null,
      }),
    );

  if (kind === "sql") {
    return {
      blob: new Blob([sql()], { type: "application/sql;charset=utf-8" }),
      fileName: exportFileName(record.name, now, "sql"),
    };
  }
  if (kind === "json") {
    return {
      blob: new Blob([await json(null)], { type: "application/json" }),
      fileName: exportFileName(record.name, now, "json"),
    };
  }

  const sqlText = sql();
  const history = await catolicaDb.history.get(diagramId);
  const versions = await listVersions(diagramId);
  const stacks = { undo: history?.undo ?? [], redo: history?.redo ?? [] };
  const state = { ...diagram };
  const extra =
    stacks.undo.length || stacks.redo.length || versions.length
      ? buildHistoryFiles({
          diagram,
          stacks,
          versions,
          describe: (entry) => stepText(entry, t, state),
          formatDate: (at) => new Date(at).toLocaleString(),
          labels: {
            title: t("export_history_title", { title: record.name }),
            noTime: t("history_no_time"),
            undone: t("history_undone").toLowerCase(),
            autoVersion: t("version_auto"),
          },
        })
      : [];
  const readme = packageReadme({
    title: record.name,
    exportedAt: now.toLocaleString(),
    dialectLabel: databases[sqlDialect]?.name,
    baseName: base,
    hasImage: false,
    hasHistory: extra.length > 0,
  });
  return {
    blob: await buildPackage({
      baseName: base,
      sql: sqlText,
      json: await json(sqlText),
      readme,
      extra,
    }),
    fileName: `${base}.zip`,
  };
}

// Cópia com nome único ("Nome (cópia)"). Devolve { diagramId, name }.
export async function duplicateDiagram(diagramId) {
  const record = await recordOf(diagramId);
  if (!record) throw new Error("diagram not found");
  return importAsNewDiagram(asDiagram(record));
}

// Exclui e devolve o que é preciso para desfazer (restoreDiagram). O
// histórico e as versões ficam até a próxima limpeza (editorHistory.js), para
// o "Desfazer" trazer tudo de volta.
export async function deleteDiagram(diagramId) {
  const record = await recordOf(diagramId);
  if (!record) return null;
  const favorite = await catolicaDb.favorites.get(diagramId);
  await db.diagrams.where("diagramId").equals(diagramId).delete();
  if (favorite) await catolicaDb.favorites.delete(diagramId);
  return { record, favorite };
}

export async function restoreDiagram(deleted) {
  if (!deleted) return;
  // Sem o id antigo: o banco do upstream numera os registros sozinho.
  const record = { ...deleted.record };
  delete record.id;
  await db.diagrams.add(record);
  if (deleted.favorite) await catolicaDb.favorites.put(deleted.favorite);
}

export async function renameDiagram(diagramId, name) {
  await db.diagrams
    .where("diagramId")
    .equals(diagramId)
    .modify({ name: name.trim() });
}

export async function toggleFavorite(diagramId, favorite) {
  if (favorite) await catolicaDb.favorites.delete(diagramId);
  else await catolicaDb.favorites.put({ diagramId, since: new Date() });
}
