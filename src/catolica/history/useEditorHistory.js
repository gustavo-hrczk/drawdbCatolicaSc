import { useEffect, useRef, useState } from "react";
import { describeChange } from "./describeChange";
import { notifyHistoryStamped, onHistoryJump } from "../editorEvents";
import { takeUndoToken } from "../undoToast";

// Cada passo novo da pilha de desfazer ganha o horário (at) e a frase da
// linha do tempo (desc), calculada com o diagrama logo depois da ação, para os
// nomes ficarem como eram. Os dois vão junto com a entrada: sobrevivem ao
// desfazer/refazer e ao recarregar a página (editorHistory.js grava a pilha).
//
// Só entram passos acrescentados no fim da pilha que nunca foram marcados.
// Quando a pilha muda de outro jeito (abrir diagrama, desfazer), os passos
// sem horário (gravados antes desta versão) ficam com at = null, "sem horário
// registrado", para não ganharem o horário de um refazer.
export function useHistoryStamps(undoStack, redoStack, state) {
  const previous = useRef(undoStack);
  const latest = useRef({ redoStack, state });
  latest.current = { redoStack, state };

  useEffect(() => {
    const prev = previous.current;
    previous.current = undoStack;
    const appended =
      undoStack.length > prev.length &&
      prev.every((entry, i) => undoStack[i] === entry) &&
      !(prev.length === 0 && undoStack.length > 1);

    if (!appended) {
      for (const entry of [...undoStack, ...latest.current.redoStack]) {
        if (entry && entry.at === undefined) entry.at = null;
      }
      return;
    }
    let stamped = false;
    for (const entry of undoStack.slice(prev.length)) {
      if (entry.at !== undefined) continue;
      entry.at = Date.now();
      entry.desc = describeChange(entry, latest.current.state);
      // Mensagem com "Desfazer" mostrada para esta ação (undoToast.jsx).
      const token = takeUndoToken();
      if (token) entry.undoToken = token;
      stamped = true;
    }
    if (stamped) notifyHistoryStamped();
  }, [undoStack]);
}

// Voltar a um ponto da linha do tempo: desfaz (steps < 0) ou refaz (steps > 0)
// um passo por vez, esperando o React aplicar cada um (o desfazer do upstream
// lê o estado atual: área e nota criadas, por exemplo, são a última da lista).
export function useHistoryJump({ undoStack, redoStack, undo, redo, enabled }) {
  const [steps, setSteps] = useState(0);

  useEffect(() => onHistoryJump((count) => setSteps(count)), []);

  useEffect(() => {
    if (steps === 0) return;
    const stack = steps < 0 ? undoStack : redoStack;
    if (!enabled || stack.length === 0) {
      setSteps(0);
      return;
    }
    if (steps < 0) {
      undo();
      setSteps((count) => count + 1);
    } else {
      redo();
      setSteps((count) => count - 1);
    }
  }, [steps, undoStack, redoStack, undo, redo, enabled]);
}
