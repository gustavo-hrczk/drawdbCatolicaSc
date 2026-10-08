const MAX_CHARS = 40;
const SUFFIX = " | drawDB";

// Título da aba do navegador com o nome do diagrama, para distinguir várias
// abas abertas. Nomes longos são cortados com reticências; espaços e quebras
// de linha repetidos viram um espaço só.
export function tabTitle(diagramTitle) {
  const clean = String(diagramTitle ?? "")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean) return `Editor${SUFFIX}`;

  // Array.from separa por caractere visível, sem partir acentos e emojis.
  const chars = Array.from(clean);
  const short =
    chars.length > MAX_CHARS
      ? `${chars
          .slice(0, MAX_CHARS - 1)
          .join("")
          .trimEnd()}…`
      : clean;
  return `${short}${SUFFIX}`;
}
