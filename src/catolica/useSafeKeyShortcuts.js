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
//    de uma palavra), ela é desfeita automaticamente. Exceção: atalhos que
//    abrem o nome do elemento novo (T, A, N, C); aí o que vem depois é o nome.
// 7. Não disparam com janelas, painéis laterais ou menus abertos.
// 8. Criar e mover elementos é bloqueado no modo somente leitura.
// 9. Podem ser desligados na janela "Atalhos do teclado".
export const TYPING_WINDOW_MS = 700;
const AFTER_FIELD_MS = 1500;
const DELETE_CONFIRM_MS = 3000;
const TYPING_WARNING_INTERVAL_MS = 10000;
const USAGE_HINTS = 3;

let lastFieldTypingAt = -Infinity;
let deleteBlockedAt = -Infinity;

// Atalho que abre o nome do elemento novo: o campo leva alguns milissegundos
// para aparecer. O que for digitado nesse meio-tempo fica guardado e entra no
// campo quando ele abrir (takeHeldTyping), sem se perder nem desfazer o atalho.
const HOLD_MS = 1500;
let held = null; // { until, text }

const holding = () => held !== null && performance.now() < held.until;

// Texto digitado antes de o campo abrir (e encerra a espera).
export function takeHeldTyping() {
  const text = holding() ? held.text : "";
  held = null;
  return text;
}

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

// Janelas, painéis e menus abertos (visíveis e sem animação de saída).
export function openOverlays() {
  return [...document.querySelectorAll(OVERLAY_SELECTOR)].filter(
    (el) =>
      el.getClientRects().length > 0 &&
      getComputedStyle(el).visibility !== "hidden" &&
      !isClosing(el),
  );
}

export function hasOpenOverlay() {
  return openOverlays().length > 0;
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

// singleKeys: { tecla: { run, rollback, opensField, changes, hint,
// hintText } }, com a tecla em minúscula (ou "?"). opensField: o atalho abre
// o nome do elemento criado (run devolve false se não criou nada). changes:
// altera o diagrama (bloqueado em somente leitura). hint: "first" (dica nas primeiras vezes) ou "always";
// hintText: texto da dica. onEscape e onFind: Esc e Ctrl+F; onFind devolve
// true se tratou o atalho. Esc também fecha as mensagens flutuantes.
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

    const showHint = (action) => {
      if (!action.hint || !action.hintText) return;
      if (action.hint === "first") {
        const prefs = readShortcutPrefs();
        const shown = prefs.hintsShown ?? 0;
        if (shown >= USAGE_HINTS) return;
        writeShortcutPrefs({ ...prefs, hintsShown: shown + 1 });
      }
      Toast.info({ content: action.hintText, duration: 3 });
    };

    const onKeyDown = (e) => {
      const config = configRef.current;
      if (e.defaultPrevented || e.isComposing) return;
      if (e.key === "Process" || e.key === "Dead") return;
      // Esc em cascata, 1º nível: num campo do editor, sai do campo e mantém
      // o texto (as mudanças já valem e o Ctrl+Z desfaz). Janelas tratam o
      // próprio Esc; mensagens flutuantes fecham antes.
      if (e.key === "Escape" && isTypingTarget(e.target)) {
        if (!closedToastsOn.has(e) && !e.target.closest(".semi-modal-wrap")) {
          e.preventDefault();
          e.target.blur();
        }
        return;
      }
      if (isTypingTarget(e.target)) return;

      // Digitação logo depois de T, A, N ou C, antes de o campo do nome abrir.
      if (holding() && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key.length === 1) {
          e.preventDefault();
          held.text += e.key;
          return;
        }
        if (e.key === "Backspace") {
          e.preventDefault();
          held.text = held.text.slice(0, -1);
          return;
        }
      }

      const withMod = e.ctrlKey || e.metaKey;
      if (withMod && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "f") {
        if (!hasOpenOverlay() && config.onFind?.()) e.preventDefault();
        return;
      }
      // Demais níveis do Esc (fechar a edição, desmarcar): quem decide é o
      // onEscape, que também confere janelas e menus abertos.
      if (e.key === "Escape") {
        if (!closedToastsOn.has(e)) config.onEscape?.();
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

      // A mesma tecla de novo (O, O ou F, F) é intencional: repete a ação.
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
      const created = action.run();
      if (action.opensField) {
        if (created !== false) held = { until: now + HOLD_MS, text: "" };
      } else {
        lastRun = { key, at: now };
      }
      showHint(action);
    };

    // Esc fecha as mensagens flutuantes ("Tabela excluída" etc.), em qualquer
    // lugar da tela. Se fechou alguma, esse Esc não faz mais nada.
    const closedToastsOn = new WeakSet();
    const onEscapeToasts = (e) => {
      if (e.key !== "Escape") return;
      const visible = [...document.querySelectorAll(".semi-toast")].some(
        (toast) => !/animation-hide/.test(String(toast.className)),
      );
      if (!visible) return;
      Toast.destroyAll();
      closedToastsOn.add(e);
    };

    document.addEventListener("keydown", onEscapeToasts, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onEscapeToasts, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);
}
