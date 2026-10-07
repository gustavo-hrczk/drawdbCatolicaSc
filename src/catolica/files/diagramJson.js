import { DB } from "../../data/constants";
import {
  ddbDiagramIsValid,
  jsonDiagramIsValid,
} from "../../utils/validateSchema";
import { localIsoString } from "./naming";
import { stripBom } from "./sql";

// Arquivo .json do diagrama (formato v1). Os campos do topo são os mesmos do
// "Exportar como JSON" do drawDB original, então o arquivo também abre lá;
// os metadados da exportação ficam em "exportacao". Arquivos exportados
// durante a homologação usavam "catolica" e continuam sendo lidos.

export const FILE_VERSION = 1;
const KNOWN_DATABASES = new Set(Object.values(DB));

// diagram: { title, database, tables, relationships, notes, areas, views,
//            types, enums, pan, zoom }
// meta: { exportId, exportedAt, createdAt, modifiedAt, dialect, sqlFingerprint }
export function buildDiagramJson(diagram, meta) {
  const {
    title,
    database,
    tables,
    relationships,
    notes,
    areas,
    views,
    types,
    enums,
    pan,
    zoom,
  } = diagram;
  const asIso = (date) => (date ? localIsoString(new Date(date)) : null);
  return {
    title,
    database,
    tables,
    relationships,
    notes: notes ?? [],
    subjectAreas: areas ?? [],
    views: views ?? [],
    ...(types?.length ? { types } : {}),
    ...(enums?.length ? { enums } : {}),
    pan: pan ?? { x: 0, y: 0 },
    zoom: zoom ?? 1,
    exportacao: {
      formato: FILE_VERSION,
      exportId: meta.exportId,
      exportadoEm: asIso(meta.exportedAt ?? new Date()),
      criadoEm: asIso(meta.createdAt),
      modificadoEm: asIso(meta.modifiedAt),
      dialetoSql: meta.dialect ?? null,
      sqlSha256: meta.sqlFingerprint ?? null,
      editor: "drawDB (versão modificada)",
    },
  };
}

export function serializeDiagramJson(json) {
  return `${JSON.stringify(json, null, 2)}\n`;
}

function relationshipsAreConsistent(data) {
  const tables = new Map((data.tables ?? []).map((t) => [t.id, t]));
  return (data.relationships ?? []).every((r) => {
    const start = tables.get(r.startTableId);
    const end = tables.get(r.endTableId);
    return (
      start &&
      end &&
      start.fields?.some((f) => f.id === r.startFieldId) &&
      end.fields?.some((f) => f.id === r.endFieldId)
    );
  });
}

// Lê um .json/.ddb de diagrama. Aceita o formato v1, o JSON do drawDB
// original, o .ddb antigo e os JSON do ZIP de "Exportar dados salvos".
// Devolve { ok: true, data, meta } ou { ok: false, error }.
export function parseDiagramFile(text, fileName = "") {
  let data;
  try {
    data = JSON.parse(stripBom(text));
  } catch {
    return { ok: false, error: "invalid_json" };
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { ok: false, error: "not_a_diagram" };
  }

  const isDdb = fileName.toLowerCase().endsWith(".ddb");
  const valid = isDdb ? ddbDiagramIsValid(data) : jsonDiagramIsValid(data);
  if (!valid) return { ok: false, error: "not_a_diagram" };

  const meta = data.exportacao ?? data.catolica ?? null;
  if (meta?.formato > FILE_VERSION) {
    return { ok: false, error: "newer_format" };
  }
  const database = data.database || DB.GENERIC;
  if (!KNOWN_DATABASES.has(database)) {
    return { ok: false, error: "unknown_database" };
  }
  if (!relationshipsAreConsistent(data)) {
    return { ok: false, error: "broken_relationships" };
  }

  return {
    ok: true,
    data: { ...data, database, title: data.title || data.name || "" },
    meta,
  };
}

// Conteúdo do diagrama, sem nome, datas e enquadramento: dois diagramas com a
// mesma chave são o mesmo desenho. Aceita o formato do arquivo (relationships,
// subjectAreas) e o do banco local (references, areas).
export function diagramContentKey(diagram) {
  return JSON.stringify([
    diagram.database || DB.GENERIC,
    diagram.tables ?? [],
    diagram.relationships ?? diagram.references ?? [],
    diagram.notes ?? [],
    diagram.subjectAreas ?? diagram.areas ?? [],
    diagram.views ?? [],
    diagram.types ?? [],
    diagram.enums ?? [],
  ]);
}
