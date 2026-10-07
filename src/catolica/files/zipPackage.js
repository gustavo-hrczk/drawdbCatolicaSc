import JSZip from "jszip";

// Pacote de entrega (.zip): nome.sql + nome.json + nome.png + README.txt.
// Extraído, vira exatamente o caso "SQL + JSON".

export const LIMITS = {
  // Arquivo escolhido (inclusive o .zip inteiro, com a imagem).
  maxZipBytes: 20 * 1024 * 1024,
  // Arquivos dentro de um .zip (contando os .zip internos).
  maxEntries: 200,
  // Cada .json/.sql/.dbml ou .zip interno, já descompactado.
  maxEntryBytes: 20 * 1024 * 1024,
  // Soma de tudo o que é descompactado de um .zip (protege contra "bomba de
  // compactação": arquivo pequeno que cresce muito ao abrir).
  maxTotalBytes: 50 * 1024 * 1024,
};

// Arquivos que o editor procura dentro de um pacote.
const RELEVANT = /\.(json|ddb|sql|dbml)$/i;
const IS_ZIP = /\.zip$/i;

export function packageReadme({
  title,
  exportedAt,
  dialectLabel,
  baseName,
  hasImage = true,
}) {
  const lines = [
    `Diagrama: ${title || "(sem título)"}`,
    `Exportado em: ${exportedAt}`,
    dialectLabel ? `Banco de dados do SQL: ${dialectLabel}` : null,
    "",
    "Conteúdo:",
    `- ${baseName}.sql: script SQL para criar o banco de dados.`,
    `- ${baseName}.json: o diagrama completo, com o desenho. Para reabrir no editor, use`,
    "  Arquivo > Importar (ou Ctrl+I) e escolha este .zip inteiro ou o .json.",
    hasImage
      ? `- ${baseName}.png: imagem do diagrama, para visualizar sem o editor.`
      : null,
    "",
    "Gerado por uma versão modificada do drawDB, editor de código aberto (https://github.com/drawdb-io/drawdb).",
  ];
  // Quebras de linha do Windows, para abrir certo no Bloco de Notas.
  return lines.filter((line) => line !== null).join("\r\n");
}

// files: { sql, json, png (Blob/Uint8Array, opcional), readme }
// type: "blob" no navegador, "uint8array" nos testes.
export function buildPackage(
  { baseName, sql, json, png, readme },
  type = "blob",
) {
  const zip = new JSZip();
  zip.file(`${baseName}.sql`, sql);
  zip.file(`${baseName}.json`, json);
  if (png) zip.file(`${baseName}.png`, png);
  if (readme) zip.file("README.txt", readme);
  return zip.generateAsync({
    type,
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}

const RAR_SIGNATURE = [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07]; // "Rar!\x1a\x07"
const ZIP_SIGNATURE = [0x50, 0x4b]; // "PK"

const startsWith = (bytes, signature) =>
  signature.every((value, i) => bytes[i] === value);

export function looksLikeRar(name, bytes) {
  return /\.rar$/i.test(name) || (bytes && startsWith(bytes, RAR_SIGNATURE));
}

export function looksLikeZip(name, bytes) {
  return /\.zip$/i.test(name) || (bytes && startsWith(bytes, ZIP_SIGNATURE));
}

const basename = (path) => path.split("/").pop();

// Lê o pacote só em memória e devolve os arquivos de diagrama (.json, .ddb,
// .sql, .dbml) de qualquer pasta interna (o "Enviar para > Pasta compactada"
// do Windows cria uma pasta) e, com withZips, os .zip internos (o "Baixar
// tudo" das Tarefas do Teams junta as entregas, uma por aluno). Ignora pastas,
// arquivos de sistema do macOS e o que não for do diagrama.
//
// Devolve { ok: true, files, zips, deepZips } ou { ok: false, error }.
// files e zips: [{ path, name, bytes }]; deepZips: .zip internos ignorados
// (quando withZips é false).
export async function readPackage(bytes, { withZips = true } = {}) {
  if (bytes.byteLength > LIMITS.maxZipBytes) {
    return { ok: false, error: "too_large" };
  }
  let zip;
  try {
    zip = await JSZip.loadAsync(bytes);
  } catch {
    return { ok: false, error: "invalid_zip" };
  }

  const entries = Object.values(zip.files).filter(
    (entry) =>
      !entry.dir &&
      !entry.name.startsWith("__MACOSX/") &&
      !basename(entry.name).startsWith("._"),
  );
  if (entries.length > LIMITS.maxEntries) {
    return { ok: false, error: "too_many_files" };
  }

  const files = [];
  const zips = [];
  let deepZips = 0;
  let total = 0;
  for (const entry of entries) {
    const isZip = IS_ZIP.test(entry.name);
    if (!isZip && !RELEVANT.test(entry.name)) continue;
    if (isZip && !withZips) {
      deepZips += 1;
      continue;
    }
    // Tamanho declarado no próprio ZIP: evita descompactar um arquivo gigante.
    const declared = entry._data?.uncompressedSize;
    if (declared > LIMITS.maxEntryBytes) {
      return { ok: false, error: "too_large" };
    }
    let data;
    try {
      data = await entry.async("uint8array");
    } catch {
      return { ok: false, error: "invalid_zip" };
    }
    total += data.byteLength;
    if (data.byteLength > LIMITS.maxEntryBytes) {
      return { ok: false, error: "too_large" };
    }
    if (total > LIMITS.maxTotalBytes) {
      return { ok: false, error: "package_too_large" };
    }
    const file = { path: entry.name, name: basename(entry.name), bytes: data };
    (isZip ? zips : files).push(file);
  }
  return { ok: true, files, zips, deepZips };
}
