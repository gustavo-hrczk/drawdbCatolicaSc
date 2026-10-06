// Nomes e datas dos arquivos exportados (critérios de aceite de save em
// docs/sprints.md): horário local, sem caracteres inválidos no Windows, sem
// nomes reservados e com tamanho limitado.

// Inválidos em nomes de arquivo no Windows: < > : " / \ | ? *
const INVALID_CHARS = /[<>:"/\\|?*]/g;
const RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
const MAX_CHARS = 80;

export function safeBaseName(title, fallback = "diagrama") {
  const cleanEnd = (text) => text.trim().replace(/[. ]+$/, "");
  let name = cleanEnd(
    String(title ?? "")
      .replace(INVALID_CHARS, " ")
      // Caracteres de controle (códigos 0 a 31) também são inválidos.
      .split("")
      .map((ch) => (ch.charCodeAt(0) < 32 ? " " : ch))
      .join("")
      .replace(/\s+/g, " "),
  );
  // Array.from corta por caractere visível, sem partir acentos e emojis.
  name = cleanEnd(Array.from(name).slice(0, MAX_CHARS).join(""));
  if (!name) name = fallback;
  if (RESERVED.test(name)) name = `${name}_`;
  return name;
}

const pad = (n) => String(n).padStart(2, "0");

// "2026-10-08_21h40", no horário local.
export function fileStamp(date = new Date()) {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `_${pad(date.getHours())}h${pad(date.getMinutes())}`
  );
}

export function exportFileName(title, date, extension) {
  return `${safeBaseName(title)}_${fileStamp(date)}.${extension}`;
}

// "2026-10-08T21:40:05-03:00": horário local com o fuso, para metadados.
export function localIsoString(date = new Date()) {
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const abs = Math.abs(offset);
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` +
    `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
  );
}
