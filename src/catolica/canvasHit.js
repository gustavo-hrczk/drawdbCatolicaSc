import { noteWidth, ObjectType } from "../data/constants";
import { getVisibleFields } from "../utils/utils";
import { lastPointerClient, pointerInDiagram } from "./canvasPointer";

// O que está sob o mouse no desenho (para o F2 renomear o item sob o mouse):
// { type: "field", tableId, fieldId }, { type: TABLE|NOTE|AREA, id } ou null.
// Coluna e tabela vêm da própria página; notas e áreas, da posição.

const inside = (point, { x, y, width, height }) =>
  point.x >= x && point.x <= x + width && point.y >= y && point.y <= y + height;

const sameNumber = (a, b) => Math.abs(Number(a) - Number(b)) < 0.01;

// Linhas de coluna da tabela desenhada (cada uma tem a linha de 36px).
const fieldRows = (foreignObject) =>
  [
    ...foreignObject.querySelectorAll("div.group.w-full.overflow-hidden"),
  ].filter((row) =>
    String(row.firstElementChild?.className).includes("h-[36px]"),
  );

export function elementUnderPointer({ tables, relationships, notes, areas }) {
  const client = lastPointerClient();
  const point = pointerInDiagram();
  if (!client || !point) return null;

  const top = document.elementFromPoint(client.x, client.y);
  const foreignObject = top?.closest("foreignObject");
  const table =
    foreignObject &&
    tables.find(
      (t) =>
        sameNumber(foreignObject.getAttribute("x"), t.x) &&
        sameNumber(foreignObject.getAttribute("y"), t.y),
    );
  if (table) {
    const rows = fieldRows(foreignObject);
    const index = rows.findIndex((row) => row.contains(top));
    const field = index >= 0 && getVisibleFields(table, relationships)[index];
    return field
      ? { type: "field", tableId: table.id, fieldId: field.id }
      : { type: ObjectType.TABLE, id: table.id };
  }

  const note = [...notes]
    .reverse()
    .find((n) => inside(point, { ...n, width: n.width ?? noteWidth }));
  if (note) return { type: ObjectType.NOTE, id: note.id };
  const area = [...areas].reverse().find((a) => inside(point, a));
  if (area) return { type: ObjectType.AREA, id: area.id };
  return null;
}
