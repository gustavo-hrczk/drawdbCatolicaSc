import { useCallback, useEffect, useRef, useState } from "react";
import { useMatch } from "react-router-dom";
import { Button } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";
import {
  useAreas,
  useDiagram,
  useEnums,
  useLayout,
  useNotes,
  useSaveState,
  useSettings,
  useTransform,
  useTypes,
  useViews,
} from "../hooks";
import { State } from "../data/constants";
import { onDiagramLoaded } from "./editorEvents";

// Pausa na edição após a qual o auto-save grava. Cobre o que o auto-save do
// upstream não pega: texto digitado sem sair do campo, mover o canvas etc.
const AUTOSAVE_DELAY_MS = 800;

const CHANNEL = `${import.meta.env.VITE_DB_NAME || "drawDB"}-catolica:tabs`;
const TAB_ID = Math.random().toString(36).slice(2);

// Montado no slot "canvas-overlay" do Workspace (ver src/catolica/extensions.jsx).
export default function EditorGuardian() {
  const { t } = useTranslation();
  const { tables, relationships } = useDiagram();
  const { notes } = useNotes();
  const { areas } = useAreas();
  const { views } = useViews();
  const { types } = useTypes();
  const { enums } = useEnums();
  const { transform } = useTransform();
  const { saveState, setSaveState } = useSaveState();
  const { settings, setSettings } = useSettings();
  const { layout } = useLayout();
  const diagramId = useMatch("/editor/diagrams/:id")?.params.id ?? null;

  const versionRef = useRef(0);
  const savingVersionRef = useRef(0);
  const savedVersionRef = useRef(0);
  const mountedRef = useRef(false);
  const loadedRef = useRef(false);
  const timerRef = useRef(null);
  const saveStateRef = useRef(saveState);
  saveStateRef.current = saveState;
  const [otherTabs, setOtherTabs] = useState(0);

  const isEmpty =
    !tables?.length &&
    !relationships?.length &&
    !notes?.length &&
    !areas?.length &&
    !views?.length &&
    !types?.length &&
    !enums?.length;
  const isEmptyRef = useRef(isEmpty);
  isEmptyRef.current = isEmpty;

  const scheduleSave = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = null;
    if (!settings.autosave || layout.readOnly || isEmptyRef.current) return;
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setSaveState(State.SAVING);
    }, AUTOSAVE_DELAY_MS);
  }, [settings.autosave, layout.readOnly, setSaveState]);

  const flushPendingSave = useCallback(() => {
    if (!timerRef.current) return;
    clearTimeout(timerRef.current);
    timerRef.current = null;
    setSaveState(State.SAVING);
  }, [setSaveState]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  // O carregamento de um diagrama salvo não conta como alteração.
  useEffect(
    () =>
      onDiagramLoaded(() => {
        loadedRef.current = true;
      }),
    [],
  );

  useEffect(() => {
    versionRef.current += 1;
    if (!mountedRef.current || loadedRef.current) {
      mountedRef.current = true;
      loadedRef.current = false;
      savedVersionRef.current = versionRef.current;
      return;
    }
    scheduleSave();
    // scheduleSave fica de fora de propósito: só mudanças de conteúdo agendam.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tables, relationships, notes, areas, views, types, enums, transform]);

  // Se o conteúdo mudou enquanto um save estava em andamento, grava de novo.
  useEffect(() => {
    if (saveState === State.SAVING) {
      savingVersionRef.current = versionRef.current;
    } else if (saveState === State.SAVED) {
      savedVersionRef.current = savingVersionRef.current;
      if (versionRef.current !== savedVersionRef.current) scheduleSave();
    }
  }, [saveState, scheduleSave]);

  // Religar o auto-save grava o que estiver pendente.
  useEffect(() => {
    if (settings.autosave && versionRef.current !== savedVersionRef.current) {
      scheduleSave();
    }
  }, [settings.autosave, scheduleSave]);

  // Ao trocar de aba, minimizar ou fechar, grava sem esperar a pausa.
  useEffect(() => {
    const onHidden = () => {
      if (document.visibilityState === "hidden") flushPendingSave();
    };
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("pagehide", flushPendingSave);
    return () => {
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("pagehide", flushPendingSave);
    };
  }, [flushPendingSave]);

  // Avisa ao fechar a aba se ainda houver algo não gravado.
  useEffect(() => {
    const onBeforeUnload = (e) => {
      const pending = timerRef.current != null;
      const dirty =
        versionRef.current !== savedVersionRef.current && !isEmptyRef.current;
      const state = saveStateRef.current;
      if (!pending && !dirty && state !== State.SAVING && state !== State.ERROR)
        return;
      flushPendingSave();
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [flushPendingSave]);

  // Detecta o mesmo diagrama aberto em outra aba deste navegador.
  useEffect(() => {
    if (!diagramId || typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(CHANNEL);
    const others = new Set();
    const update = () => setOtherTabs(others.size);

    channel.onmessage = ({ data }) => {
      if (!data || data.tab === TAB_ID) return;
      if (data.type === "bye" || data.diagramId !== diagramId) {
        others.delete(data.tab);
      } else {
        if (data.type === "hello") {
          channel.postMessage({ type: "here", tab: TAB_ID, diagramId });
        }
        others.add(data.tab);
      }
      update();
    };
    channel.postMessage({ type: "hello", tab: TAB_ID, diagramId });

    const sayBye = () =>
      channel.postMessage({ type: "bye", tab: TAB_ID, diagramId });
    window.addEventListener("pagehide", sayBye);
    return () => {
      window.removeEventListener("pagehide", sayBye);
      sayBye();
      channel.close();
      setOtherTabs(0);
    };
  }, [diagramId]);

  const showAutosaveOff = !settings.autosave && !layout.readOnly;
  if (!showAutosaveOff && otherTabs === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 z-40 flex flex-col items-center gap-2 px-4">
      {showAutosaveOff && (
        <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-amber-300 bg-amber-50 px-5 py-1.5 text-sm text-amber-900 shadow-md dark:border-amber-700/60 dark:bg-amber-900/40 dark:text-amber-100">
          <i className="bi bi-exclamation-triangle" />
          <span>{t("autosave_off_notice")}</span>
          <Button
            size="small"
            theme="solid"
            onClick={() => setSettings((prev) => ({ ...prev, autosave: true }))}
          >
            {t("turn_on_autosave")}
          </Button>
        </div>
      )}
      {otherTabs > 0 && (
        <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-blue-300 bg-blue-50 px-5 py-1.5 text-sm text-blue-900 shadow-md dark:border-sky-900/50 dark:bg-sky-900/40 dark:text-sky-100">
          <i className="bi bi-window-stack" />
          <span>{t("diagram_open_in_other_tab")}</span>
        </div>
      )}
    </div>
  );
}
