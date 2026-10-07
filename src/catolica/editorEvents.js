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

// Sinal emitido quando o usuário cria um elemento novo (não ao colar, duplicar
// ou desfazer): { type: ObjectType, id } para tabela, área e nota, ou
// { type: "field", tableId, fieldId } para coluna. O editor abre a edição
// com o nome já selecionado, pronto para digitar.
export function notifyElementCreated(detail) {
  target.dispatchEvent(new CustomEvent("element-created", { detail }));
}

export function onElementCreated(listener) {
  const handler = (e) => listener(e.detail);
  target.addEventListener("element-created", handler);
  return () => target.removeEventListener("element-created", handler);
}
