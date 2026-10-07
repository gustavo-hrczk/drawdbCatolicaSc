import JSZip from "jszip";

// Pacote de entrega (.zip): nome.sql + nome.json + nome.png + LEIA-ME.txt.
// Extraído, vira exatamente o caso "SQL + JSON".

export const LIMITS = {
  maxZipBytes: 20 * 1024 * 1024,
  maxEntries: 200,
  maxEntryBytes: 20 * 1024 * 1024,
};

// Arquivos que o editor procura dentro de um pacote.
const RELEVANT = /\.(json|ddb|sql)$/i;

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
    "Gerado pelo drawDB Católica SC, uma versão do drawDB (https://github.com/drawdb-io/drawdb).",
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
  if (readme) zip.file("LEIA-ME.txt", readme);
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

// Lê o pacote só em memória e devolve os .json/.sql de qualquer pasta
// interna (o "Enviar para > Pasta compactada" do Windows cria uma pasta).
// Ignora pastas, arquivos de sistema do macOS e o que não for do diagrama.
// Devolve { ok: true, files: [{ name, text }] } ou { ok: false, error }.
export async function readPackage(bytes) {
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
  for (const entry of entries) {
    if (!RELEVANT.test(entry.name)) continue;
    // Tamanho declarado no próprio ZIP: evita descompactar um arquivo gigante.
    const declared = entry._data?.uncompressedSize;
    if (declared > LIMITS.maxEntryBytes) {
      return { ok: false, error: "too_large" };
    }
    let text;
    try {
      text = await entry.async("string");
    } catch {
      return { ok: false, error: "invalid_zip" };
    }
    if (text.length > LIMITS.maxEntryBytes) {
      return { ok: false, error: "too_large" };
    }
    files.push({ name: basename(entry.name), text });
  }
  return { ok: true, files };
}
