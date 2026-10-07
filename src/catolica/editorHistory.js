import Dexie from "dexie";

// Histórico de desfazer/refazer por diagrama, num banco próprio do fork para não
// interferir nas migrações do banco do upstream ("drawDB").
const baseName = import.meta.env.VITE_DB_NAME || "drawDB";
export const catolicaDb = new Dexie(`${baseName}-catolica`);

catolicaDb.version(1).stores({
  history: "diagramId",
});

// 500 passos: é também o registro do painel "Histórico de alterações".
const MAX_STEPS = 500;
// Limite aproximado (em caracteres de JSON) de cada pilha: entradas do editor
// DBML guardam o diagrama inteiro e podem ser grandes.
const MAX_CHARS = 1_000_000;

// Revisão de um diagrama = instante (ms) do lastModified gravado. Serve para
// saber se o histórico guardado corresponde à versão salva do diagrama.
export function revisionOf(date) {
  const time = new Date(date ?? 0).getTime();
  return Number.isFinite(time) ? time : 0;
}

// Zoom e enquadramento são estado de visualização: mudam toda hora e não
// devem gerar revisão nova (nem conflito com outra aba).
const VIEW_KEYS = new Set(["pan", "zoom", "lastModified"]);

function contentOf(record) {
  return JSON.stringify(
    Object.keys(record)
      .filter(
        (key) => !VIEW_KEYS.has(key) && key !== "id" && key !== "diagramId",
      )
      .sort()
      .map((key) => [key, record[key] ?? null]),
  );
}

// Compara o que está gravado com o que vai ser gravado.
// "same": nada mudou; "view": só zoom/enquadramento; "content": o resto.
export function compareWithSaved(saved, fields) {
  const merged = { ...saved, ...fields };
  if (contentOf(saved) !== contentOf(merged)) return "content";
  const sameView =
    JSON.stringify(saved.pan ?? null) === JSON.stringify(fields.pan ?? null) &&
    saved.zoom === fields.zoom;
  return sameView ? "same" : "view";
}

export class SaveConflictError extends Error {
  constructor(savedAt) {
    super("diagram was saved elsewhere");
    this.name = "SaveConflictError";
    this.savedAt = savedAt;
  }
}

function trimStack(stack) {
  let trimmed = (stack ?? []).slice(-MAX_STEPS);
  while (trimmed.length > 0 && JSON.stringify(trimmed).length > MAX_CHARS) {
    trimmed = trimmed.slice(Math.ceil(trimmed.length / 4));
  }
  return trimmed;
}

// Nunca lança: falhar ao guardar o histórico não pode impedir o save do diagrama.
export async function saveHistory(diagramId, revision, undoStack, redoStack) {
  if (!diagramId) return false;
  try {
    await catolicaDb.history.put({
      diagramId,
      revision,
      undo: trimStack(undoStack),
      redo: trimStack(redoStack),
      updatedAt: new Date(),
    });
    return true;
  } catch (err) {
    console.warn("could not persist undo history:", err);
    return false;
  }
}

// Só devolve o histórico se ele foi gravado junto com esta mesma versão do
// diagrama; caso contrário as entradas poderiam não se aplicar ao conteúdo.
export async function loadHistory(diagramId, revision) {
  try {
    const entry = await catolicaDb.history.get(diagramId);
    if (!entry || entry.revision !== revision) return null;
    return { undo: entry.undo ?? [], redo: entry.redo ?? [] };
  } catch (err) {
    console.warn("could not load undo history:", err);
    return null;
  }
}

// Remove históricos de diagramas que não existem mais (excluídos, dados
// apagados em "Limpar armazenamento").
export async function pruneOrphanHistory(diagramsDb) {
  try {
    const existing = new Set(
      await diagramsDb.diagrams.orderBy("diagramId").keys(),
    );
    const stored = await catolicaDb.history.toCollection().primaryKeys();
    const orphans = stored.filter((id) => !existing.has(id));
    if (orphans.length > 0) await catolicaDb.history.bulkDelete(orphans);
  } catch (err) {
    console.warn("could not prune undo history:", err);
  }
}
