import { diagramContentKey } from "../files/diagramJson";

// Regras das versões do diagrama (Sprint 1E), sem banco: o que guardar e o
// que descartar. Ver versions.js para a gravação.

// Guarda: as 20 versões automáticas mais recentes; das mais antigas, uma por
// dia (a última do dia) por 30 dias. Versões com nome nunca são descartadas.
export const KEEP_RECENT_AUTO = 20;
export const KEEP_DAILY_DAYS = 30;
// Intervalo das versões automáticas durante a edição.
export const AUTO_INTERVAL_MS = 10 * 60 * 1000;

const DAY_MS = 24 * 60 * 60 * 1000;

const dayOf = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

// Ids das versões a descartar. versions: [{ id, kind, createdAt }].
export function versionsToDiscard(versions, now = Date.now()) {
  const autos = versions
    .filter((version) => version.kind !== "manual")
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const discard = [];
  const daysKept = new Set();
  autos.forEach((version, index) => {
    if (index < KEEP_RECENT_AUTO) return;
    const age = now - new Date(version.createdAt).getTime();
    const day = dayOf(version.createdAt);
    if (age <= KEEP_DAILY_DAYS * DAY_MS && !daysKept.has(day)) {
      daysKept.add(day);
      return;
    }
    discard.push(version.id);
  });
  return discard;
}

// Conteúdo do diagrama guardado numa versão (o mesmo formato do estado do
// editor; o nome do diagrama e o enquadramento não fazem parte).
export function snapshotOf(state) {
  return {
    database: state.database,
    tables: state.tables ?? [],
    relationships: state.relationships ?? [],
    notes: state.notes ?? [],
    areas: state.areas ?? [],
    types: state.types ?? [],
    enums: state.enums ?? [],
    views: state.views ?? [],
  };
}

export const snapshotKey = (snapshot) => diagramContentKey(snapshot);

export function isEmptySnapshot(snapshot) {
  return ["tables", "notes", "areas", "views", "types", "enums"].every(
    (key) => (snapshot[key] ?? []).length === 0,
  );
}
