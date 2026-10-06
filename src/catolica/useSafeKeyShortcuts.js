import { useEffect, useRef } from "react";
import { Toast } from "@douyinfe/semi-ui";
import { isTypingTarget } from "./clipboard";
import { readShortcutPrefs, writeShortcutPrefs } from "./shortcuts";

// Proteções contra atalhos acionados sem querer (principalmente os de uma
// tecla, como T, A, N e F, que coincidem com letras digitadas):
//
// 1. Nunca disparam dentro de campos de texto, editores ou conteúdo editável.
// 2. Nunca disparam com Ctrl, Alt ou Cmd (nem com AltGr, que é Ctrl+Alt).
// 3. Ignoram a repetição de tecla segurada (não cria dez tabelas).
// 4. Ignoram teclas pressionadas logo depois de digitar em um campo (o foco
//    saiu do campo, mas a pessoa continua digitando).
// 5. Exigem isolamento: nenhuma outra letra logo antes e logo depois. Por
//    isso a ação espera ISOLATION_MS antes de executar; se outra letra chegar
//    nesse intervalo, é digitação e nada acontece.
// 6. Não disparam com janelas, painéis laterais ou menus abertos.
// 7. Criar elementos é bloqueado no modo somente leitura.
// 8. Podem ser desligados na janela "Atalhos do teclado".
const ISOLATION_MS = 400;
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

// singleKeys: { tecla: { run, label, creates } }, com a tecla em minúscula
// (ou "?"). onEscape e onFind: Esc e Ctrl+F; onFind devolve true se tratou.
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
    let lastPrintableAt = -Infinity;
    let pending = null;
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

    const blocked = (action) => {
      const config = configRef.current;
      return (
        !config.enabled ||
        hasOpenOverlay() ||
        (action.creates && config.readOnly)
      );
    };

    const run = (key, action) => {
      action.run();
      if (!action.creates) return;
      // Nas primeiras vezes, explica o que aconteceu e como desfazer.
      const prefs = readShortcutPrefs();
      const shown = prefs.hintsShown ?? 0;
      if (shown >= USAGE_HINTS) return;
      writeShortcutPrefs({ ...prefs, hintsShown: shown + 1 });
      Toast.info({
        content: configRef.current.t("shortcut_used", {
          action: action.label,
          key: key.toUpperCase(),
        }),
        duration: 4,
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

      const now = performance.now();
      const sincePrevious = now - lastPrintableAt;
      lastPrintableAt = now;

      // Outra letra durante a espera: era digitação, cancela o atalho.
      if (pending) {
        clearTimeout(pending);
        pending = null;
        warnTyping();
        return;
      }

      const key = e.key === "?" ? "?" : e.key.toLowerCase();
      const action = config.singleKeys[key];
      if (!action || !config.enabled) return;
      if (e.shiftKey && key !== "?") return;
      if (sincePrevious < ISOLATION_MS || recentlyTypedInField()) {
        warnTyping();
        return;
      }
      if (e.repeat || blocked(action)) return;

      e.preventDefault();
      pending = setTimeout(() => {
        pending = null;
        const current = configRef.current.singleKeys[key];
        if (current && !blocked(current)) run(key, current);
      }, ISOLATION_MS);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      clearTimeout(pending);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);
}
