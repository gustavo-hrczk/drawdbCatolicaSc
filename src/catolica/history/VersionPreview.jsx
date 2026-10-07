import {
  defaultBlue,
  noteWidth,
  tableFieldHeight,
  tableHeaderHeight,
  tableWidth,
} from "../../data/constants";

// Desenho simplificado de uma versão, só para conferir antes de restaurar:
// tabelas com nome e colunas, linhas dos relacionamentos, áreas e notas, nas
// posições gravadas. Não usa o canvas do editor (que mostra o diagrama
// aberto), então nada do diagrama atual é tocado.

const PADDING = 40;
const NOTE_HEIGHT = 80;

const tableHeight = (table) =>
  tableHeaderHeight + (table.fields?.length ?? 0) * tableFieldHeight;

function bounds(snapshot) {
  const boxes = [
    ...snapshot.tables.map((t) => ({
      x: t.x,
      y: t.y,
      w: t.width ?? tableWidth,
      h: tableHeight(t),
    })),
    ...snapshot.areas.map((a) => ({ x: a.x, y: a.y, w: a.width, h: a.height })),
    ...snapshot.notes.map((n) => ({
      x: n.x,
      y: n.y,
      w: n.width ?? noteWidth,
      h: n.height ?? NOTE_HEIGHT,
    })),
  ].filter((b) => [b.x, b.y, b.w, b.h].every(Number.isFinite));
  if (!boxes.length) return { x: 0, y: 0, w: 400, h: 200 };
  const minX = Math.min(...boxes.map((b) => b.x));
  const minY = Math.min(...boxes.map((b) => b.y));
  const maxX = Math.max(...boxes.map((b) => b.x + b.w));
  const maxY = Math.max(...boxes.map((b) => b.y + b.h));
  return {
    x: minX - PADDING,
    y: minY - PADDING,
    w: maxX - minX + PADDING * 2,
    h: maxY - minY + PADDING * 2,
  };
}

export default function VersionPreview({ snapshot }) {
  const box = bounds(snapshot);
  const byId = new Map(snapshot.tables.map((t) => [t.id, t]));
  const center = (t) => ({
    x: t.x + (t.width ?? tableWidth) / 2,
    y: t.y + tableHeight(t) / 2,
  });

  return (
    <svg
      viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
      preserveAspectRatio="xMidYMid meet"
      className="h-[55vh] w-full rounded-md"
      style={{ backgroundColor: "var(--semi-color-fill-0)" }}
      role="img"
    >
      {snapshot.areas.map((area, i) => (
        <g key={`a${i}`}>
          <rect
            x={area.x}
            y={area.y}
            width={area.width}
            height={area.height}
            rx={8}
            fill={area.color ?? defaultBlue}
            fillOpacity={0.15}
            stroke={area.color ?? defaultBlue}
            strokeOpacity={0.4}
          />
          <text
            x={area.x + 10}
            y={area.y + 22}
            fontSize={16}
            fill="var(--semi-color-text-1)"
          >
            {area.name}
          </text>
        </g>
      ))}
      {snapshot.relationships.map((r, i) => {
        const start = byId.get(r.startTableId);
        const end = byId.get(r.endTableId);
        if (!start || !end) return null;
        const a = center(start);
        const b = center(end);
        return (
          <line
            key={`r${i}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="var(--semi-color-text-2)"
            strokeWidth={2}
          />
        );
      })}
      {snapshot.tables.map((table) => {
        const width = table.width ?? tableWidth;
        return (
          <g key={table.id}>
            <rect
              x={table.x}
              y={table.y}
              width={width}
              height={tableHeight(table)}
              rx={8}
              fill="var(--semi-color-bg-0)"
              stroke="var(--semi-color-border)"
              strokeWidth={2}
            />
            <rect
              x={table.x}
              y={table.y}
              width={width}
              height={8}
              rx={4}
              fill={table.color ?? defaultBlue}
            />
            <text
              x={table.x + 12}
              y={table.y + 34}
              fontSize={16}
              fontWeight={700}
              fill="var(--semi-color-text-0)"
            >
              {table.name}
            </text>
            {(table.fields ?? []).map((field, i) => (
              <text
                key={field.id ?? i}
                x={table.x + 12}
                y={table.y + tableHeaderHeight + i * tableFieldHeight + 23}
                fontSize={14}
                fill="var(--semi-color-text-1)"
              >
                {field.name}
                {field.type ? `  ${field.type}` : ""}
              </text>
            ))}
          </g>
        );
      })}
      {snapshot.notes.map((note, i) => (
        <g key={`n${i}`}>
          <rect
            x={note.x}
            y={note.y}
            width={note.width ?? noteWidth}
            height={note.height ?? NOTE_HEIGHT}
            rx={4}
            fill={note.color ?? "#fcf7ac"}
            stroke="var(--semi-color-border)"
          />
          <text
            x={note.x + 10}
            y={note.y + 24}
            fontSize={14}
            fontWeight={700}
            fill="#333"
          >
            {note.title}
          </text>
        </g>
      ))}
    </svg>
  );
}
