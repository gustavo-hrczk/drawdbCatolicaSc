import { v4 as uuidv4 } from "uuid";
import {
  buildDiagramJson,
  parseDiagramFile,
  serializeDiagramJson,
} from "./diagramJson";
import { fileStamp, localIsoString, safeBaseName } from "./naming";

// Histórico no pacote .zip (Sprint 1E, fase C), na pasta "historico/":
//
// - alteracoes.json: as pilhas de desfazer e refazer do editor (com horário e
//   frase de cada passo), para a linha do tempo continuar no diagrama
//   importado, e a lista legível dos passos;
// - alteracoes.txt: a mesma lista, para ler sem o editor;
// - versoes/<data>_<nome>.json: cada versão guardada, no formato do .json do
//   diagrama (também abre sozinha no Importar), com os dados da versão em
//   "versao".
//
// O editor procura diagramas em qualquer .json do pacote, então a leitura
// (zipPackage.js) separa esta pasta e entrega os arquivos aqui.

export const HISTORY_DIR = "historico";
export const HISTORY_FORMAT = 1;
const CHANGES_FILE = "alteracoes";
const VERSIONS_DIR = "versoes";

// Pasta "historico/" (em qualquer nível): devolve o caminho de antes dela
// (a pasta do diagrama) ou null.
export function historyFolderOf(path) {
  const match = /^(.*?)(?:^|\/)historico\//i.exec(path);
  return match ? match[1] : null;
}

// steps: [{ entry, text, undone }] do mais recente ao mais antigo.
function changesText(steps, formatDate, labels) {
  const lines = steps.map(({ entry, text, undone }) => {
    const when = entry.at ? formatDate(entry.at) : labels.noTime;
    return `${when} - ${text}${undone ? ` (${labels.undone})` : ""}`;
  });
  return [labels.title, "", ...lines].join("\r\n");
}

// Arquivos da pasta historico/: [{ path, content }].
// diagram: { title, database, ... } (para os .json das versões);
// stacks: { undo, redo }; versions: registros de versions.js;
// describe(entry): frase do passo; formatDate(ms|Date): data legível;
// labels: { title, noTime, undone, autoVersion }.
export function buildHistoryFiles({
  diagram,
  stacks,
  versions,
  describe,
  formatDate,
  labels,
}) {
  const undone = [...stacks.redo];
  const done = [...stacks.undo].reverse();
  const steps = [
    ...undone.map((entry) => ({ entry, undone: true })),
    ...done.map((entry) => ({ entry, undone: false })),
  ].map((step) => ({ ...step, text: describe(step.entry) }));

  const files = [
    {
      path: `${HISTORY_DIR}/${CHANGES_FILE}.json`,
      content: `${JSON.stringify(
        {
          formato: HISTORY_FORMAT,
          desfazer: stacks.undo,
          refazer: stacks.redo,
          passos: steps.map(({ entry, text, undone }) => ({
            quando: entry.at ? localIsoString(new Date(entry.at)) : null,
            texto: text,
            desfeito: undone,
          })),
        },
        null,
        2,
      )}\n`,
    },
    {
      path: `${HISTORY_DIR}/${CHANGES_FILE}.txt`,
      content: changesText(steps, formatDate, labels),
    },
  ];

  const usedNames = new Set();
  for (const version of versions) {
    const createdAt = new Date(version.createdAt);
    const label = version.name || labels.autoVersion;
    let base = `${fileStamp(createdAt)}_${safeBaseName(label, "versao")}`;
    while (usedNames.has(base)) base += "_";
    usedNames.add(base);
    const { snapshot } = version;
    const json = buildDiagramJson(
      {
        ...diagram,
        title: `${diagram.title} (${label})`,
        database: snapshot.database ?? diagram.database,
        tables: snapshot.tables,
        relationships: snapshot.relationships,
        notes: snapshot.notes,
        areas: snapshot.areas,
        views: snapshot.views,
        types: snapshot.types,
        enums: snapshot.enums,
      },
      { exportId: uuidv4(), exportedAt: createdAt, modifiedAt: createdAt },
    );
    json.versao = {
      tipo: version.kind,
      motivo: version.reason,
      nome: version.name ?? "",
      criadaEm: localIsoString(createdAt),
    };
    files.push({
      path: `${HISTORY_DIR}/${VERSIONS_DIR}/${base}.json`,
      content: serializeDiagramJson(json),
    });
  }
  return files;
}

const isEntry = (entry) =>
  entry && typeof entry === "object" && !Array.isArray(entry);

// Lê os arquivos da pasta historico/ de um pacote: [{ path, text }].
// Devolve { stacks: { undo, redo } | null, versions: [...] } ou null, se não
// houver nada aproveitável. Arquivos com defeito são ignorados: o histórico é
// um extra e nunca impede a importação do diagrama.
export function parseHistoryFiles(files) {
  let stacks = null;
  const versions = [];
  for (const { path, text } of files) {
    const name = path.split("/").pop();
    let data;
    try {
      data = JSON.parse(text.replace(/^\uFEFF/, ""));
    } catch {
      continue;
    }
    if (name.toLowerCase() === `${CHANGES_FILE}.json`) {
      if (Array.isArray(data?.desfazer) && Array.isArray(data?.refazer)) {
        stacks = {
          undo: data.desfazer.filter(isEntry),
          redo: data.refazer.filter(isEntry),
        };
      }
      continue;
    }
    if (!new RegExp(`/${VERSIONS_DIR}/`, "i").test(`/${path}`)) continue;
    const parsed = parseDiagramFile(text, name);
    if (!parsed.ok) continue;
    const meta = data.versao ?? {};
    const createdAt = new Date(meta.criadaEm ?? parsed.meta?.exportedAt ?? 0);
    const { data: diagram } = parsed;
    versions.push({
      createdAt: Number.isNaN(createdAt.getTime()) ? new Date() : createdAt,
      kind: meta.tipo === "manual" ? "manual" : "auto",
      reason: meta.motivo ?? (meta.tipo === "manual" ? "manual" : "interval"),
      name: typeof meta.nome === "string" ? meta.nome : "",
      snapshot: {
        database: diagram.database,
        tables: diagram.tables ?? [],
        relationships: diagram.relationships ?? [],
        notes: diagram.notes ?? [],
        areas: diagram.subjectAreas ?? [],
        types: diagram.types ?? [],
        enums: diagram.enums ?? [],
        views: diagram.views ?? [],
      },
    });
  }
  if (!stacks && versions.length === 0) return null;
  return { stacks, versions };
}
