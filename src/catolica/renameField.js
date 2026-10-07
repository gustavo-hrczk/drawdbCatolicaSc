import { ObjectType, Tab } from "../data/constants";
import { openOverlays } from "./useSafeKeyShortcuts";

// F2: renomear o elemento selecionado (tabela, área, nota ou view). Abre a
// edição do elemento, como o Ctrl+E, e já coloca o cursor no campo do nome
// com o texto selecionado. Enter confirma; Esc volta o nome anterior. Sem
// nada selecionado, o F2 renomeia o próprio diagrama.

const WAIT_MS = 1500;
const RETRY_MS = 50;
const NAME_INPUT = "input:not([type=hidden])";

const RENAMABLE = {
  [ObjectType.TABLE]: {
    tab: Tab.TABLES,
    prefix: "scroll_table_",
    overlay: ".semi-sidesheet",
  },
  [ObjectType.AREA]: {
    tab: Tab.AREAS,
    prefix: "scroll_area_",
    overlay: ".semi-popover-wrapper",
    fromToolbar: true,
  },
  [ObjectType.NOTE]: {
    tab: Tab.NOTES,
    prefix: "scroll_note_",
    overlay: ".semi-popover-wrapper",
    fromToolbar: true,
  },
  [ObjectType.VIEW]: {
    tab: Tab.VIEWS,
    prefix: "scroll_view_",
    overlay: ".semi-sidesheet",
  },
};

export function canRename(selectedElement) {
  return Boolean(RENAMABLE[selectedElement?.element]);
}

// O que o F2 renomeia: "element", "diagram" (nada selecionado) ou null
// (seleção que não tem nome editável aqui, como um relacionamento).
export function renameTarget(selectedElement) {
  if (canRename(selectedElement)) return "element";
  const element = selectedElement?.element ?? ObjectType.NONE;
  return element === ObjectType.NONE ? "diagram" : null;
}

// Estado da seleção que abre a edição do elemento: no painel lateral (aba
// certa, item expandido) ou, sem painel, no popover/painel do próprio
// elemento. Para áreas e notas, editFromToolbar evita que o popover feche
// com o clique que o abriu (o mesmo que o Ctrl+E faz).
export function openForRename(prev, sidebar) {
  const target = RENAMABLE[prev.element];
  if (!target) return prev;
  if (sidebar) return { ...prev, open: true, currentTab: target.tab };
  return {
    ...prev,
    open: true,
    ...(target.fromToolbar && { editFromToolbar: true }),
  };
}

// Primeiro campo de texto do item no painel lateral ou do popover/painel de
// edição aberto.
function findNameInput(element, id, sidebar) {
  const target = RENAMABLE[element];
  if (sidebar) {
    const item = document.getElementById(`${target.prefix}${id}`);
    return item?.querySelector(NAME_INPUT) ?? null;
  }
  const overlay = openOverlays()
    .filter((el) => el.matches(target.overlay) && el.querySelector(NAME_INPUT))
    .pop();
  return overlay?.querySelector(NAME_INPUT) ?? null;
}

const setInputValue = (input, value) => {
  // O React só percebe a mudança se o valor for trocado pelo setter nativo.
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(
    input,
    value,
  );
  input.dispatchEvent(new Event("input", { bubbles: true }));
};

function startRename(input) {
  const original = input.value;
  input.scrollIntoView({ block: "nearest" });
  input.focus({ preventScroll: true });
  input.select();

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      input.blur();
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      if (input.value !== original) setInputValue(input, original);
      input.blur();
    }
  };
  const stop = () => {
    input.removeEventListener("keydown", onKeyDown);
    input.removeEventListener("blur", stop);
  };
  input.addEventListener("keydown", onKeyDown);
  input.addEventListener("blur", stop);
}

// Espera o campo aparecer (troca de aba, item expandindo, janela abrindo) e
// chama run com ele.
function whenFieldReady(find, run) {
  const startedAt = performance.now();
  const attempt = () => {
    const input = find();
    if (input && input.getClientRects().length > 0 && !input.readOnly) {
      run(input);
    } else if (performance.now() - startedAt < WAIT_MS) {
      setTimeout(attempt, RETRY_MS);
    }
  };
  setTimeout(attempt, 0);
}

export function focusNameField(element, id, sidebar) {
  whenFieldReady(() => findNameInput(element, id, sidebar), startRename);
}

// Campo de texto da janela aberta: cursor no campo e texto selecionado. Com
// submitOnEnter, Enter confirma (clica no botão principal da janela), como
// na janela "Renomear diagrama" do upstream, que não trata o Enter.
export function focusDialogField({ submitOnEnter = true } = {}) {
  const dialog = () =>
    openOverlays()
      .filter((el) => el.matches(".semi-modal-wrap"))
      .pop();
  whenFieldReady(
    () => dialog()?.querySelector(NAME_INPUT),
    (input) => {
      input.focus();
      input.select();
      if (!submitOnEnter) return;
      const onKeyDown = (e) => {
        if (e.key !== "Enter") return;
        e.preventDefault();
        dialog()
          ?.querySelector(".semi-modal-footer .semi-button-primary")
          ?.click();
      };
      input.addEventListener("keydown", onKeyDown);
      input.addEventListener(
        "blur",
        () => input.removeEventListener("keydown", onKeyDown),
        { once: true },
      );
    },
  );
}
