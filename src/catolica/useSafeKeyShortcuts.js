import { useEffect, useRef } from "react";
import { Toast } from "@douyinfe/semi-ui";
import { isTypingTarget } from "./clipboard";
import { readShortcutPrefs, writeShortcutPrefs } from "./shortcuts";

// Proteções contra atalhos acionados sem querer (principalmente os de uma
// tecla, como T, A, N, O e F, que coincidem com letras digitadas):
//
// 1. Nunca disparam dentro de campos de texto, editores ou conteúdo editável.
// 2. Nunca disparam com Ctrl, Alt ou Cmd (nem com AltGr, que é Ctrl+Alt).
// 3. Tecla segurada (repetição automática) é ignorada, sem aviso.
// 4. Ignoram teclas pressionadas logo depois de digitar em um campo (o foco
//    saiu do campo, mas a pessoa continua digitando).
// 5. Letra no meio de uma palavra (outra tecla logo antes) não dispara.
// 6. A ação é imediata, mas se outra tecla chegar logo depois (era o começo
//    de uma palavra), ela é desfeita automaticamente.
// 7. Não disparam com janelas, painéis laterais ou menus abertos.
// 8. Criar e mover elementos é bloqueado no modo somente leitura.
// 9. Podem ser desligados na janela "Atalhos do teclado".
const TYPING_WINDOW_MS = 700;
const AFTER_FIELD_MS = 1500;
const DELETE_CONFIRM_MS = 3000;
const TYPING_WARNING_INTERVAL_MS = 10000;
const USAGE_HINTS = 3;

let lastFieldTypingAt = -Infinity;
let deleteBlockedAt = -Infinity;

if (typeof document !== "undefined") {
  document.addEventListener(
    "keydown",
    (e) => {
      if (isTypingTarget(e.target)) lastFieldTypingAt = performance.now();
    },
    true,
  );
}

const OVERLAY_SELECTOR = [
  ".semi-modal-wrap",
  ".semi-sidesheet",
  ".semi-dropdown-wrapper",
  ".semi-popover-wrapper",
].join(", ");

// Janelas e menus do Semi UI em animação de saída já contam como fechados.
// Janelas marcam a máscara com "-animate-hide"; menus e listas (popovers),
// o próprio elemento com "-animation-hide".
function isClosing(el) {
  const mask = el.parentElement?.querySelector(":scope > [class*='-mask']");
  return [el, mask].some((node) =>
    /animate-hide|animation-hide/.test(String(node?.className ?? "")),
  );
}

export function hasOpenOverlay() {
  return [...document.querySelectorAll(OVERLAY_SELECTOR)].some(
    (el) =>
      el.getClientRects().length > 0 &&
      getComputedStyle(el).visibility !== "hidden" &&
      !isClosing(el),
  );
}

function recentlyTypedInField() {
  return performance.now() - lastFieldTypingAt < AFTER_FIELD_MS;
}

// Delete logo depois de digitar em um campo costuma ser engano (a pessoa
// queria apagar texto). A primeira vez é ignorada; repetir confirma.
export function allowDelete() {
  if (!recentlyTypedInField()) return true;
  const now = performance.now();
  if (now - deleteBlockedAt < DELETE_CONFIRM_MS) {
    deleteBlockedAt = -Infinity;
    return true;
  }
  deleteBlockedAt = now;
  return false;
}

// singleKeys: { tecla: { run, rollback, label, changes, hint } }, com a tecla
// em minúscula (ou "?"). changes: altera o diagrama (bloqueado em somente
// leitura). hint: "first" (dica nas primeiras vezes) ou "always".
// onEscape e onFind: Esc e Ctrl+F; onFind devolve true se tratou o atalho.
export default function useSafeKeyShortcuts({
  singleKeys,
  enabled,
  readOnly,
  onEscape,
  onFind,
  t,
}) {
  const configRef = useRef(null);
  configRef.current = { singleKeys, enabled, readOnly, onEscape, onFind, t };

  useEffect(() => {
    let lastKeyAt = -Infinity;
    let lastRun = null; // { key, at }
    let warnedAt = -Infinity;

    const warnTyping = () => {
      const now = performance.now();
      if (now - warnedAt < TYPING_WARNING_INTERVAL_MS) return;
      warnedAt = now;
      Toast.info({
        content: configRef.current.t("shortcut_typing_detected"),
        duration: 4,
      });
    };

    const showHint = (key, action) => {
      if (!action.hint) return;
      if (action.hint === "first") {
        const prefs = readShortcutPrefs();
        const shown = prefs.hintsShown ?? 0;
        if (shown >= USAGE_HINTS) return;
        writeShortcutPrefs({ ...prefs, hintsShown: shown + 1 });
      }
      Toast.info({
        content: configRef.current.t("shortcut_used", {
          action: action.label,
          key: key.toUpperCase(),
        }),
        duration: 3,
      });
    };

    const onKeyDown = (e) => {
      const config = configRef.current;
      if (e.defaultPrevented || e.isComposing) return;
      if (e.key === "Process" || e.key === "Dead") return;
      if (isTypingTarget(e.target)) return;

      const withMod = e.ctrlKey || e.metaKey;
      if (withMod && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "f") {
        if (!hasOpenOverlay() && config.onFind?.()) e.preventDefault();
        return;
      }
      if (e.key === "Escape") {
        if (!hasOpenOverlay()) config.onEscape?.();
        return;
      }
      if (withMod || e.altKey || e.key.length !== 1) return;

      // Tecla segurada: só o primeiro toque conta, sem aviso.
      if (e.repeat) {
        if (lastRun) e.preventDefault();
        return;
      }

      const now = performance.now();
      const sinceLastKey = now - lastKeyAt;
      lastKeyAt = now;
      const key = e.key === "?" ? "?" : e.key.toLowerCase();

      // A mesma tecla de novo (T, T) é intencional: cria outro elemento.
      const repeatedShortcut =
        lastRun && lastRun.key === key && now - lastRun.at < TYPING_WINDOW_MS;

      // Outra tecla logo depois de um atalho: era o começo de uma palavra.
      // Desfaz o que o atalho fez.
      if (lastRun && now - lastRun.at < TYPING_WINDOW_MS && !repeatedShortcut) {
        const ran = config.singleKeys[lastRun.key];
        lastRun = null;
        // Espera o React aplicar a ação antes de desfazer.
        setTimeout(() => ran?.rollback?.(), 0);
        warnTyping();
        return;
      }
      lastRun = null;

      const action = config.singleKeys[key];
      if (!action || !config.enabled) return;
      if (e.shiftKey && key !== "?") return;
      // Letra no meio de uma palavra ou logo depois de digitar num campo.
      if (
        (sinceLastKey < TYPING_WINDOW_MS && !repeatedShortcut) ||
        recentlyTypedInField()
      ) {
        warnTyping();
        return;
      }
      if (hasOpenOverlay() || (action.changes && config.readOnly)) return;

      e.preventDefault();
      action.run();
      lastRun = { key, at: now };
      showHint(key, action);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);
}
