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
