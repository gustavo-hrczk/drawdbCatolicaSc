import i18n from "../i18n/i18n";
import { db } from "../data/db";

// Nome de diagrama sem repetir os que já existem neste navegador: importar o
// mesmo arquivo de novo, abrir uma versão como cópia ou "Salvar como" com o
// mesmo nome geram "Diagrama1 (cópia)", "Diagrama1 (cópia 2)"... A
// comparação ignora maiúsculas e espaços nas pontas.

const normalize = (name) => (name ?? "").trim().toLocaleLowerCase();

// Tira um "(cópia)" / "(cópia N)" do fim, para a cópia de uma cópia não virar
// "Diagrama1 (cópia) (cópia)".
function baseOf(name, suffix) {
  const escaped = suffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`^(.*?) \\(${escaped}(?: \\d+)?\\)$`, "i").exec(
    name,
  );
  return match ? match[1] : name;
}

export function uniqueName(
  name,
  existingNames,
  suffix = i18n.t("copy_suffix"),
) {
  const taken = new Set(existingNames.map(normalize));
  const trimmed = (name ?? "").trim();
  if (!taken.has(normalize(trimmed))) return trimmed;
  const base = baseOf(trimmed, suffix);
  for (let n = 1; ; n += 1) {
    const candidate =
      n === 1 ? `${base} (${suffix})` : `${base} (${suffix} ${n})`;
    if (!taken.has(normalize(candidate))) return candidate;
  }
}

// O mesmo, conferindo os diagramas salvos. Se o banco falhar, mantém o nome.
export async function uniqueDiagramName(name) {
  try {
    const names = (await db.diagrams.toArray()).map((d) => d.name);
    return uniqueName(name, names);
  } catch (err) {
    console.warn("could not check diagram names:", err);
    return (name ?? "").trim();
  }
}
