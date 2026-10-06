import EditorGuardian from "./EditorGuardian";

// Componentes do fork encaixados nos <Slot> que o upstream já oferece
// (src/context/ExtensionsContext.jsx). Não definir aqui chaves de nuvem
// (cloudSave, cloudLoad...): elas mudam o comportamento de salvamento.
export const catolicaExtensions = {
  "canvas-overlay": <EditorGuardian />,
};
