// Cópia reserva do último elemento copiado no editor. É usada quando o
// navegador não deixa ler a área de transferência (permissão negada, Firefox,
// Opera) e também permite colar em outra aba do mesmo navegador.
const KEY = `${import.meta.env.VITE_DB_NAME || "drawDB"}-catolica:clipboard`;

export function rememberCopied(text) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ text, copiedAt: Date.now() }));
  } catch {
    // Sem localStorage (modo privado restrito): a área de transferência do
    // sistema continua funcionando.
  }
}

export function lastCopied() {
  try {
    return JSON.parse(localStorage.getItem(KEY))?.text ?? null;
  } catch {
    return null;
  }
}

// Atalhos de copiar/colar dentro de campos de texto pertencem ao campo.
export function isTypingTarget(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      "input, textarea, select, [contenteditable=''], [contenteditable='true'], .monaco-editor",
    ),
  );
}

export function hasTextSelection() {
  const selection = window.getSelection?.();
  return Boolean(selection && selection.toString().length > 0);
}
