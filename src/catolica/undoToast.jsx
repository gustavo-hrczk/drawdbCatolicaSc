import { Toast } from "@douyinfe/semi-ui";
import i18n from "../i18n/i18n";
import { requestUndoOf } from "./editorEvents";

// Mensagem de ação destrutiva ou em massa com o botão "Desfazer", como no
// Gmail ("Conversa excluída · Desfazer"). A ação que acabou de ser feita é
// marcada (useHistoryStamps, na próxima entrada da pilha de desfazer); o botão
// só desfaz se ela ainda for o último passo. Se outra ação veio depois, o
// botão não faz nada, para nunca desfazer outra coisa.

const DURATION_S = 6;
// A entrada da ação chega na mesma renderização; depois disso a marca não
// vale mais (não pode acabar presa a outra ação).
const TOKEN_TTL_MS = 1000;
let pendingToken = null;
let pendingAt = 0;

// Chamado por useHistoryStamps ao marcar uma entrada nova: devolve a marca
// pendente (e a consome).
export function takeUndoToken() {
  const token =
    performance.now() - pendingAt < TOKEN_TTL_MS ? pendingToken : null;
  pendingToken = null;
  return token;
}

export function toastWithUndo(text) {
  const token = {};
  pendingToken = token;
  pendingAt = performance.now();
  const id = Toast.success({
    duration: DURATION_S,
    content: (
      <span className="inline-flex items-center gap-3">
        <span>{text}</span>
        <button
          type="button"
          className="font-semibold underline-offset-2 hover:underline"
          style={{ color: "var(--semi-color-primary)" }}
          onClick={() => {
            Toast.close(id);
            requestUndoOf((entry) => entry.undoToken === token);
          }}
        >
          {i18n.t("undo")}
        </button>
      </span>
    ),
  });
  return id;
}
