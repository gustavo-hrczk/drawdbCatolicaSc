import i18n from "../i18n/i18n";

// Nomes de elementos novos: tabela_1, tabela_2… (no idioma do editor), em vez
// dos nomes aleatórios do upstream (table_0ERuBXbqQA6rkvkrAos-D). Usa o
// primeiro número livre a partir da quantidade atual + 1.
export function nextName(prefix, existing) {
  const used = new Set(existing);
  let n = existing.length + 1;
  while (used.has(`${prefix}_${n}`)) n += 1;
  return `${prefix}_${n}`;
}

export const defaultTableName = (tables) =>
  nextName(
    i18n.t("default_table_prefix"),
    tables.map((table) => table.name),
  );

export const defaultAreaName = (areas) =>
  nextName(
    i18n.t("default_area_prefix"),
    areas.map((area) => area.name),
  );

export const defaultNoteTitle = (notes) =>
  nextName(
    i18n.t("default_note_prefix"),
    notes.map((note) => note.title),
  );
