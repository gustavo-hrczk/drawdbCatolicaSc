import { catolicaDb } from "../editorHistory";
import {
  isEmptySnapshot,
  snapshotKey,
  versionsToDiscard,
} from "./versionRules";

// Versões do diagrama (Sprint 1E), no banco do fork ("drawDB-catolica").
// Registro: { id, diagramId, createdAt, kind: "auto" | "manual",
//             reason: "open" | "interval" | "before_restore" | "manual",
//             name, key, snapshot }
// Listar e guardar nunca lançam: falhar ao guardar uma versão não pode
// atrapalhar a edição.

export async function listVersions(diagramId) {
  if (!diagramId) return [];
  try {
    const versions = await catolicaDb.versions
      .where("diagramId")
      .equals(diagramId)
      .toArray();
    return versions.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
  } catch (err) {
    console.warn("could not list versions:", err);
    return [];
  }
}

// Guarda uma versão. Automáticas iguais à última versão (mesmo conteúdo) ou
// de diagrama vazio não são guardadas. Devolve o registro ou null.
export async function addVersion(
  diagramId,
  snapshot,
  { kind = "auto", reason = "interval", name = "" } = {},
) {
  if (!diagramId) return null;
  try {
    const key = snapshotKey(snapshot);
    if (kind === "auto") {
      if (isEmptySnapshot(snapshot)) return null;
      const [latest] = await listVersions(diagramId);
      if (latest?.key === key) return null;
    }
    const record = {
      diagramId,
      createdAt: new Date(),
      kind,
      reason,
      name: name.trim(),
      key,
      snapshot,
    };
    record.id = await catolicaDb.versions.add(record);
    const discard = versionsToDiscard(await listVersions(diagramId));
    if (discard.length) await catolicaDb.versions.bulkDelete(discard);
    return record;
  } catch (err) {
    console.warn("could not save version:", err);
    return null;
  }
}

// Dar nome a uma versão automática a protege do descarte (vira "com nome").
export async function renameVersion(id, name) {
  const trimmed = name.trim();
  await catolicaDb.versions.update(id, {
    name: trimmed,
    ...(trimmed && { kind: "manual" }),
  });
}

export async function deleteVersion(id) {
  await catolicaDb.versions.delete(id);
}

// Data da versão mais recente do diagrama (ms), ou 0.
export async function latestVersionTime(diagramId) {
  const [latest] = await listVersions(diagramId);
  return latest ? new Date(latest.createdAt).getTime() : 0;
}

export async function latestVersionKey(diagramId) {
  const [latest] = await listVersions(diagramId);
  return latest?.key ?? null;
}
