import { parseDiagramFile } from "./diagramJson";
import { sqlFingerprint } from "./sql";
import { looksLikeRar, looksLikeZip, readPackage } from "./zipPackage";

// Decide o que fazer com os arquivos escolhidos para importar (regras do
// Sprint 1C em docs/sprints.md). O encaixe entre .sql e .json é pelo
// conteúdo (hash do SQL gravado no JSON), nunca pelo nome: downloads repetidos
// viram "nome (1).sql".
//
// inputs: [{ name, bytes: Uint8Array }]
// Devolve { ok: false, error, detail? } ou
//   { ok: true, kind: "json" | "pair" | "sql" | "dbml", diagram?, sql?, dbml?,
//     sqlCheck, fromZip }
// sqlCheck: "match" | "mismatch" | "not_checked" (JSON sem hash) | "absent".

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const decoder = new TextDecoder("utf-8"); // remove o BOM sozinho

const kindOf = (name) => {
  if (/\.(json|ddb)$/i.test(name)) return "json";
  if (/\.sql$/i.test(name)) return "sql";
  if (/\.dbml$/i.test(name)) return "dbml";
  return null;
};

export async function planImport(inputs) {
  if (!inputs?.length) return { ok: false, error: "no_files" };

  const found = { json: [], sql: [], dbml: [] };
  let fromZip = null;

  for (const { name, bytes } of inputs) {
    if (bytes.byteLength > MAX_FILE_BYTES) {
      return { ok: false, error: "too_large", detail: name };
    }
    if (looksLikeRar(name, bytes)) {
      return { ok: false, error: "rar_not_supported", detail: name };
    }
    if (looksLikeZip(name, bytes)) {
      if (fromZip) return { ok: false, error: "ambiguous", detail: "zip" };
      const pkg = await readPackage(bytes);
      if (!pkg.ok) return { ok: false, error: pkg.error, detail: name };
      fromZip = name;
      for (const file of pkg.files) found[kindOf(file.name)].push(file);
      continue;
    }
    const kind = kindOf(name);
    if (!kind) return { ok: false, error: "unsupported", detail: name };
    found[kind].push({ name, text: decoder.decode(bytes) });
  }

  if (found.json.length > 1) {
    return { ok: false, error: "ambiguous", detail: "json" };
  }
  if (found.sql.length > 1) {
    return { ok: false, error: "ambiguous", detail: "sql" };
  }
  // DBML só sozinho: não há como conferir com um .json ou .sql.
  if (found.dbml.length) {
    if (found.dbml.length > 1 || found.json.length || found.sql.length) {
      return { ok: false, error: "ambiguous", detail: "dbml" };
    }
    const [dbml] = found.dbml;
    return { ok: true, kind: "dbml", dbml, sqlCheck: "absent", fromZip };
  }
  const [json] = found.json;
  const [sql] = found.sql;

  if (!json && !sql) {
    return { ok: false, error: fromZip ? "empty_package" : "unsupported" };
  }
  if (!json) return { ok: true, kind: "sql", sql, sqlCheck: "absent", fromZip };

  const parsed = parseDiagramFile(json.text, json.name);
  if (!parsed.ok) return { ok: false, error: parsed.error, detail: json.name };

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
    ok: true,
    kind: sql ? "pair" : "json",
    diagram: { data: parsed.data, meta: parsed.meta, name: json.name },
    sql: sql ?? null,
    sqlCheck,
    fromZip,
  };
}
