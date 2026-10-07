import EditorGuardian from "./EditorGuardian";
import HeaderRestoreButton from "./HeaderRestoreButton";
import HistoryPanel from "./history/HistoryPanel";

// Componentes do fork encaixados nos <Slot> que o upstream já oferece
// (src/context/ExtensionsContext.jsx). Não definir aqui chaves de nuvem
// (cloudSave, cloudLoad...): elas mudam o comportamento de salvamento.
export const catolicaExtensions = {
  "canvas-overlay": (
    <>
      <EditorGuardian />
      <HeaderRestoreButton />
    </>
  ),
  // Histórico de alterações, à direita do desenho (Sprint 1E).
  "right-panel": <HistoryPanel />,
};
