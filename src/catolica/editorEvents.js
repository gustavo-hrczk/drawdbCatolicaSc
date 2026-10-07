// Sinal emitido pelo Workspace quando um diagrama salvo acaba de ser carregado.
// O EditorGuardian usa para não tratar o próprio carregamento como alteração.
const target = new EventTarget();

export function notifyDiagramLoaded() {
  target.dispatchEvent(new Event("diagram-loaded"));
}

export function onDiagramLoaded(listener) {
  target.addEventListener("diagram-loaded", listener);
  return () => target.removeEventListener("diagram-loaded", listener);
}

// Sinal emitido quando o editor é limpo para um diagrama novo (Arquivo > Novo
// nesta aba, modelo em branco, link de diagrama inexistente). O indicador de
// salvamento volta a "Sem alterações".
export function notifyEditorReset() {
  target.dispatchEvent(new Event("editor-reset"));
}

export function onEditorReset(listener) {
  target.addEventListener("editor-reset", listener);
  return () => target.removeEventListener("editor-reset", listener);
}
