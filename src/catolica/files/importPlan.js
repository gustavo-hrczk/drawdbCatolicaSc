import { parseDiagramFile } from "./diagramJson";
import { historyFolderOf, parseHistoryFiles } from "./historyPackage";
import { sqlFingerprint } from "./sql";
import { LIMITS, looksLikeRar, looksLikeZip, readPackage } from "./zipPackage";

// Decide o que fazer com os arquivos escolhidos para importar (regras dos
// Sprints 1C e 1F em docs/sprints.md).
//
// - Os arquivos são agrupados por diagrama: a seleção solta, cada pasta de um
//   .zip e cada .zip dentro de outro (o "Baixar tudo" das Tarefas do Teams).
// - Num grupo, o .sql encaixa no .json pelo conteúdo (hash do SQL gravado no
//   .json), nunca pelo nome: downloads repetidos viram "nome (1).sql". Um
//   .json e um .sql sozinhos na mesma pasta formam um par mesmo sem conferir.
// - Arquivos que não são de diagrama (imagem, LEIA-ME, .docx) são ignorados
//   quando a seleção tem um diagrama; só eles na seleção é erro.
// - Com mais de um diagrama, a pessoa escolhe qual abrir.
//
// inputs: [{ name, bytes: Uint8Array }]
// Devolve { ok: false, error, detail? }, um diagrama
//   { ok: true, kind: "json" | "pair" | "sql" | "dbml", diagram?, sql?, dbml?,
//     sqlCheck, fromZip, location, history, ignored, warnings }
// ou a escolha { ok: true, kind: "choose", candidates, ignored, warnings }.
// sqlCheck: "match" | "mismatch" | "not_checked" (JSON sem hash) | "absent".
// history: pasta historico/ do pacote, ao lado do .json (historyPackage.js),
// ou null.

const utf8 = new TextDecoder("utf-8", { fatal: true }); // remove o BOM sozinho
const ansi = new TextDecoder("windows-1252");

// Texto do arquivo: UTF-8 ou, se não for (arquivo salvo como "ANSI" por
// editores antigos do Windows), Windows-1252, para não perder os acentos.
export function decodeText(bytes) {
  try {
    return utf8.decode(bytes);
  } catch {
    return ansi.decode(bytes);
  }
}

const kindOf = (name) => {
  if (/\.(json|ddb)$/i.test(name)) return "json";
  if (/\.sql$/i.test(name)) return "sql";
  if (/\.dbml$/i.test(name)) return "dbml";
  return null;
};

const folderOf = (path) =>
  path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";

const tooLarge = (name, size, limit) => ({
  ok: false,
  error: "too_large",
  detail: { name, size, limit },
});

async function jsonCandidate(json, parsed, sql, group) {
  let sqlCheck = "absent";
  if (sql) {
    const expected = parsed.meta?.sqlSha256;
    sqlCheck = !expected
      ? "not_checked"
      : (await sqlFingerprint(sql.text)) === expected
        ? "match"
        : "mismatch";
  }
  return {
    kind: sql ? "pair" : "json",
    diagram: { data: parsed.data, meta: parsed.meta, name: json.name },
    sql: sql ?? null,
    sqlCheck,
    fromZip: group.fromZip,
    location: group.location,
    history: group.history?.length ? parseHistoryFiles(group.history) : null,
  };
}

async function groupCandidates(group, failures) {
  const byKind = { json: [], sql: [], dbml: [] };
  for (const file of group.files) byKind[file.kind].push(file);

  const jsons = [];
  for (const json of byKind.json) {
    const parsed = json.text.trim()
      ? parseDiagramFile(json.text, json.name)
      : { ok: false, error: "empty_file" };
    if (parsed.ok) jsons.push({ json, parsed });
    else failures.push({ error: parsed.error, detail: json.name });
  }

  const candidates = [];
  const usedSql = new Set();
  if (jsons.length === 1 && byKind.sql.length === 1) {
    const [{ json, parsed }] = jsons;
    const [sql] = byKind.sql;
    usedSql.add(sql);
    candidates.push(await jsonCandidate(json, parsed, sql, group));
  } else {
    for (const { json, parsed } of jsons) {
      const expected = parsed.meta?.sqlSha256;
      let match = null;
      for (const sql of byKind.sql) {
        if (!expected || usedSql.has(sql)) continue;
        if ((await sqlFingerprint(sql.text)) === expected) {
          match = sql;
          break;
        }
      }
      if (match) usedSql.add(match);
      candidates.push(await jsonCandidate(json, parsed, match, group));
    }
  }
  const extra = { sqlCheck: "absent", fromZip: group.fromZip };
  for (const sql of byKind.sql) {
    if (usedSql.has(sql)) continue;
    candidates.push({ kind: "sql", sql, ...extra, location: group.location });
  }
  for (const dbml of byKind.dbml) {
    candidates.push({ kind: "dbml", dbml, ...extra, location: group.location });
  }
  return candidates;
}

export async function planImport(inputs) {
  if (!inputs?.length) return { ok: false, error: "no_files" };

  const groups = new Map();
  const ignored = [];
  let rar = null;
  let unsupported = null;
  let emptyZip = null;
  let deepZips = 0;

  const groupFor = (groupKey, location, fromZip) => {
    if (!groups.has(groupKey)) {
      groups.set(groupKey, { location, fromZip, files: [], history: [] });
    }
    return groups.get(groupKey);
  };
  const addFile = (groupKey, location, fromZip, name, bytes) => {
    groupFor(groupKey, location, fromZip);
    groups.get(groupKey).files.push({
      name,
      kind: kindOf(name),
      text: decodeText(bytes),
    });
  };

  // Arquivos de um .zip, agrupados por pasta. A pasta historico/ vai junto
  // com o diagrama da pasta em que ela está.
  const addPackage = (files, zipLabel, fromZip, history = []) => {
    for (const file of history) {
      const folder = historyFolderOf(file.path);
      const location = folder ? `${zipLabel} › ${folder}` : zipLabel;
      groupFor(`${zipLabel}/${folder}`, location, fromZip).history.push({
        path: file.path,
        text: decodeText(file.bytes),
      });
    }
    for (const file of files) {
      const folder = folderOf(file.path);
      const location = folder ? `${zipLabel} › ${folder}` : zipLabel;
      addFile(
        `${zipLabel}/${folder}`,
        location,
        fromZip,
        file.name,
        file.bytes,
      );
    }
  };

  for (const { name, bytes } of inputs) {
    if (bytes.byteLength > LIMITS.maxZipBytes) {
      return tooLarge(name, bytes.byteLength, LIMITS.maxZipBytes);
    }
    if (looksLikeRar(name, bytes)) {
      rar ??= name;
      ignored.push(name);
      continue;
    }
    if (looksLikeZip(name, bytes)) {
      const pkg = await readPackage(bytes);
      if (!pkg.ok) return { ok: false, error: pkg.error, detail: name };
      addPackage(pkg.files, name, name, pkg.history);
      for (const inner of pkg.zips) {
        const sub = await readPackage(inner.bytes, { withZips: false });
        if (!sub.ok) {
          ignored.push(`${name} › ${inner.path}`);
          continue;
        }
        deepZips += sub.deepZips;
        addPackage(sub.files, `${name} › ${inner.path}`, name, sub.history);
      }
      if (!pkg.files.length && !pkg.zips.length) emptyZip ??= name;
      continue;
    }
    if (!kindOf(name)) {
      unsupported ??= name;
      ignored.push(name);
      continue;
    }
    if (!bytes.byteLength)
      return { ok: false, error: "empty_file", detail: name };
    addFile("", null, null, name, bytes);
  }

  const failures = [];
  const candidates = [];
  for (const group of groups.values()) {
    candidates.push(...(await groupCandidates(group, failures)));
  }

  if (!candidates.length) {
    if (failures.length) return { ok: false, ...failures[0] };
    if (rar) return { ok: false, error: "rar_not_supported", detail: rar };
    if (deepZips) return { ok: false, error: "nested_package" };
    if (emptyZip)
      return { ok: false, error: "empty_package", detail: emptyZip };
    return { ok: false, error: "unsupported", detail: unsupported };
  }

  // Arquivos de diagrama que não puderam ser lidos, quando há outros.
  const warnings = failures;
  if (candidates.length === 1) {
    return { ok: true, ...candidates[0], ignored, warnings };
  }
  return { ok: true, kind: "choose", candidates, ignored, warnings };
}
