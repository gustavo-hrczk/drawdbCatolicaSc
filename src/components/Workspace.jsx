import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  createContext,
  useContext,
} from "react";
import { v4 as uuidv4 } from "uuid";
import ControlPanel from "./EditorHeader/ControlPanel";
import ExtensionsContext, { Slot } from "../context/ExtensionsContext";
import Canvas from "./EditorCanvas/Canvas";
import { CanvasContextProvider } from "../context/CanvasContext";
import SidePanel from "./EditorSidePanel/SidePanel";
import { DB, State } from "../data/constants";
import { db } from "../data/db";
import {
  useLayout,
  useSettings,
  useTransform,
  useDiagram,
  useUndoRedo,
  useAreas,
  useNotes,
  useTypes,
  useSaveState,
  useEnums,
  useViews,
  useNavigateWithParams,
} from "../hooks";
import FloatingControls from "./FloatingControls";
import { Button, Modal, Tag, Toast } from "@douyinfe/semi-ui";
import { IconAlertTriangle } from "@douyinfe/semi-icons";
import { useTranslation } from "react-i18next";
import { databases } from "../data/databases";
import { isRtl } from "../i18n/utils/rtl";
import { useMatch, useParams, useSearchParams } from "react-router-dom";
import { get, SHARE_FILENAME } from "../api/gists";
import { mergeCustomTypes } from "../utils/customTypes";
import {
  readDismissedBanners,
  addDismissedBanner,
} from "../utils/dismissedBanners";
import {
  compareWithSaved,
  loadHistory,
  pruneOrphanHistory,
  revisionOf,
  saveHistory,
  SaveConflictError,
} from "../catolica/editorHistory";
import {
  notifyDiagramLoaded,
  notifyEditorReset,
} from "../catolica/editorEvents";
import ConflictModal from "../catolica/ConflictModal";
import { tabTitle } from "../catolica/tabTitle";
import { untitledTitle } from "../catolica/i18n";
import { preferredDatabase } from "../catolica/databasePreference";

export const IdContext = createContext({
  gistId: "",
  setGistId: () => {},
  version: "",
  setVersion: () => {},
});

const SIDEPANEL_MIN_WIDTH = 374;

export default function WorkSpace({ forcedDiagramId } = {}) {
  const [gistId, setGistId] = useState("");
  const [version, setVersion] = useState("");
  const [loadedFromGistId, setLoadedFromGistId] = useState("");
  const [title, setTitle] = useState(untitledTitle);
  const [resize, setResize] = useState(false);
  const [toolbarContainer, setToolbarContainer] = useState(null);
  const [width, setWidth] = useState(SIDEPANEL_MIN_WIDTH);
  const [lastSaved, setLastSaved] = useState("");
  const [showSelectDbModal, setShowSelectDbModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedDb, setSelectedDb] = useState("");

  const [diagramSource, setDiagramSource] = useState(null);
  const [dismissedBanners, setDismissedBanners] =
    useState(readDismissedBanners);
  const pendingNewIdRef = useRef(null);
  const loadedIdRef = useRef(null);
  const notFoundToastRef = useRef(null);
  // Revisão (lastModified) da versão salva que esta aba conhece, atrelada ao
  // diagrama carregado. Se o banco tiver outra ao salvar, outra aba gravou no
  // meio: é um conflito.
  const baseRef = useRef({ diagramId: null, revision: null });
  // Diagrama que este editor acabou de criar no primeiro save: o endereço
  // muda para /editor/diagrams/<id>, mas o load não deve recarregá-lo do
  // banco (apagaria o que foi editado enquanto o save rodava, como o nome da
  // primeira tabela).
  const createdIdRef = useRef(null);
  const conflictRef = useRef(false);
  const forceSaveRef = useRef(false);
  // Um save local por vez; se outro for pedido no meio, roda em seguida com
  // os dados mais recentes (saveRef aponta para o save da última renderização).
  const savingRef = useRef(false);
  const pendingSaveRef = useRef(false);
  const saveRef = useRef(null);
  const [conflict, setConflict] = useState(null);
  const { layout, setLayout } = useLayout();
  const { settings } = useSettings();
  const { types, setTypes } = useTypes();
  const { areas, setAreas } = useAreas();
  const { notes, setNotes } = useNotes();
  const { saveState, setSaveState } = useSaveState();
  const { transform, setTransform } = useTransform();
  const { enums, setEnums } = useEnums();
  const { views, setViews } = useViews();
  const {
    tables,
    relationships,
    setTables,
    setRelationships,
    database,
    setDatabase,
  } = useDiagram();
  const { undoStack, redoStack, setUndoStack, setRedoStack } = useUndoRedo();
  const { t, i18n } = useTranslation();
  let [searchParams, setSearchParams] = useSearchParams();
  const { id: routeDiagramId } = useParams();
  const loadedDiagramId = forcedDiagramId ?? routeDiagramId;
  const editorDiagramMatch = useMatch("/editor/diagrams/:id");
  const isDiagram = forcedDiagramId ? true : editorDiagramMatch;
  const isTemplate = useMatch("/editor/templates/:id");

  const navigate = useNavigateWithParams();
  const extensionValues = useContext(ExtensionsContext);
  const extensions = useMemo(() => extensionValues ?? {}, [extensionValues]);
  const cloudOnly = typeof extensions.cloudSave === "function";
  const cloudLoad = extensions.cloudLoad;

  const handleResize = (e) => {
    if (!resize) return;
    const w = isRtl(i18n.language) ? window.innerWidth - e.clientX : e.clientX;
    if (w > SIDEPANEL_MIN_WIDTH) setWidth(w);
  };

  const buildCloudPayload = useCallback(
    (targetId) => ({
      diagramId: targetId,
      database,
      name: title,
      gistId: gistId ?? "",
      lastModified: new Date(),
      tables,
      references: relationships,
      notes,
      areas,
      views,
      pan: transform.pan,
      zoom: transform.zoom,
      ...(databases[database].hasEnums && { enums }),
      ...(databases[database].hasTypes && { types }),
    }),
    [
      database,
      title,
      gistId,
      tables,
      relationships,
      notes,
      areas,
      views,
      transform,
      enums,
      types,
    ],
  );

  const buildLocalFields = useCallback(
    () => ({
      database: database,
      name: title,
      lastModified: new Date(),
      tables: tables,
      references: relationships,
      notes: notes,
      areas: areas,
      views: views,
      gistId: gistId ?? "",
      pan: transform.pan,
      zoom: transform.zoom,
      loadedFromGistId: loadedFromGistId,
      ...(databases[database].hasEnums && { enums: enums }),
      ...(databases[database].hasTypes && { types: types }),
    }),
    [
      database,
      title,
      tables,
      relationships,
      notes,
      areas,
      views,
      gistId,
      transform,
      loadedFromGistId,
      enums,
      types,
    ],
  );

  const save = useCallback(async () => {
    if (searchParams.has("shareId")) {
      searchParams.delete("shareId");
      setSearchParams(searchParams, { replace: true });
    }

    if (cloudOnly && diagramSource !== "local") {
      const isNew =
        !loadedDiagramId || loadedDiagramId === "blank" || isTemplate;
      const targetId = isNew
        ? (pendingNewIdRef.current ??= uuidv4())
        : loadedDiagramId;
      try {
        await extensions.cloudSave(buildCloudPayload(targetId), { isNew });
        if (isNew) {
          pendingNewIdRef.current = null;
          navigate(`/editor/diagrams/${targetId}`, { replace: true });
        }
        setSaveState(State.SAVED);
        setLastSaved(new Date().toLocaleString());
      } catch (err) {
        console.warn("cloud autosave failed:", err);
        if (err?.response?.status === 402) {
          setSaveState(State.NONE);
          navigate("/checkout?tier=solo_pro");
          return;
        }
        setSaveState(State.ERROR);
      }
      return;
    }

    // Conflito pendente: não grava nada até o usuário decidir.
    if (conflictRef.current) {
      setSaveState(State.ERROR);
      return;
    }

    const isNew = isTemplate || (!loadedDiagramId && !isTemplate && !isDiagram);
    const savedId = isNew ? uuidv4() : loadedDiagramId;

    // A URL já aponta para outro diagrama, mas o load dele ainda não terminou:
    // o conteúdo em memória é do diagrama anterior. O load dispara o save de
    // novo quando aplicar o diagrama certo.
    if (!isNew && baseRef.current.diagramId !== savedId) return;

    if (savingRef.current) {
      pendingSaveRef.current = true;
      return;
    }
    savingRef.current = true;

    const fields = buildLocalFields();
    let revision = revisionOf(fields.lastModified);
    let failed = false;
    try {
      if (isNew) {
        await db.diagrams.add({
          diagramId: savedId,
          createdAt: new Date(),
          ...fields,
        });
      } else {
        // Ler e gravar na mesma transação: outra aba não consegue gravar
        // entre a verificação da revisão e a escrita.
        await db.transaction("rw", db.diagrams, async () => {
          const current = await db.diagrams
            .where("diagramId")
            .equals(savedId)
            .first();
          // O diagrama da URL não existe neste navegador (link de outro PC,
          // dados apagados): cria o registro em vez de "salvar" em nada.
          if (!current) {
            await db.diagrams.add({
              diagramId: savedId,
              createdAt: new Date(),
              ...fields,
            });
            return;
          }
          // Conteúdo igual ao gravado: não gera revisão nova, para não criar
          // conflito falso com outra aba que tenha o mesmo diagrama aberto.
          const change = compareWithSaved(current, fields);
          if (change !== "content") {
            if (change === "view") {
              await db.diagrams
                .where("diagramId")
                .equals(savedId)
                .modify({ pan: fields.pan, zoom: fields.zoom });
            }
            revision = revisionOf(current.lastModified);
            return;
          }
          const known = baseRef.current.revision;
          if (
            !forceSaveRef.current &&
            known != null &&
            revisionOf(current.lastModified) !== known
          ) {
            throw new SaveConflictError(current.lastModified);
          }
          await db.diagrams.where("diagramId").equals(savedId).modify(fields);
        });
      }
      forceSaveRef.current = false;
      baseRef.current = { diagramId: savedId, revision };
      await saveHistory(savedId, revision, undoStack, redoStack);
    } catch (err) {
      failed = true;
      if (err instanceof SaveConflictError) {
        conflictRef.current = true;
        setConflict({ savedAt: err.savedAt });
      } else {
        console.error("local save failed:", err);
      }
      setSaveState(State.ERROR);
    } finally {
      savingRef.current = false;
    }
    if (failed) return;

    if (pendingSaveRef.current) {
      pendingSaveRef.current = false;
      if (isNew) {
        // Fica em "Salvando": o load do diagrama recém-criado dispara o save
        // pendente já com o id novo (chamar agora criaria outro diagrama).
        createdIdRef.current = savedId;
        navigate(`/editor/diagrams/${savedId}`, { replace: true });
      } else {
        saveRef.current?.();
      }
      return;
    }
    if (isNew) {
      createdIdRef.current = savedId;
      navigate(`/editor/diagrams/${savedId}`, { replace: true });
    }
    setSaveState(State.SAVED);
    setLastSaved(new Date().toLocaleString());
  }, [
    buildLocalFields,
    undoStack,
    redoStack,
    cloudOnly,
    diagramSource,
    buildCloudPayload,
    extensions,
    searchParams,
    setSearchParams,
    setSaveState,
    setLastSaved,
    isDiagram,
    isTemplate,
    loadedDiagramId,
    navigate,
  ]);
  saveRef.current = save;

  const moveToCloud = useCallback(async () => {
    if (typeof extensions.cloudSave !== "function" || !loadedDiagramId) return;
    setSaveState(State.SAVING);
    try {
      await extensions.cloudSave(buildCloudPayload(loadedDiagramId), {
        isNew: true,
      });
      await db.diagrams.where("diagramId").equals(loadedDiagramId).delete();
      setDiagramSource("cloud");
      if (typeof cloudLoad === "function") {
        await cloudLoad(loadedDiagramId);
      }
      setSaveState(State.SAVED);
      setLastSaved(new Date().toLocaleString());
    } catch (err) {
      console.warn("move to cloud failed:", err);
      setSaveState(State.ERROR);
    }
  }, [extensions, loadedDiagramId, buildCloudPayload, setSaveState, cloudLoad]);

  const dismissMoveToCloud = () => {
    if (!loadedDiagramId) return;
    setDismissedBanners((prev) =>
      addDismissedBanner(prev, `move:${loadedDiagramId}`),
    );
  };

  const load = useCallback(async () => {
    const previousLoadedId = loadedIdRef.current;
    loadedIdRef.current = loadedDiagramId ?? null;

    // Recém-criado por este editor: o conteúdo em memória é o mais novo. Não
    // recarrega; só salva de novo, já com o id novo (grava o que mudou durante
    // o primeiro save, ou nada, se não mudou). Chama o save direto: o estado
    // pode já estar em "Salvando" (save pendente), e repetir o estado não
    // dispararia nada.
    if (loadedDiagramId && loadedDiagramId === createdIdRef.current) {
      createdIdRef.current = null;
      setDiagramSource("local");
      saveRef.current?.();
      return;
    }

    const fetchDiagram = async (id) => {
      const localDiagram = await db.diagrams
        .where("diagramId")
        .equals(id)
        .first();
      if (localDiagram) return { diagram: localDiagram, source: "local" };

      if (typeof cloudLoad === "function") {
        const cloudDiagram = await cloudLoad(id);
        if (cloudDiagram) return { diagram: cloudDiagram, source: "cloud" };
      }
      return { diagram: null, source: null };
    };

    const applyDiagramState = (diagram) => {
      setDatabase(diagram.database || DB.GENERIC);
      setGistId(diagram.gistId);
      setLoadedFromGistId(diagram.loadedFromGistId);
      setTitle(diagram.name);
      setTables(diagram.tables);
      setRelationships(diagram.references);
      setAreas(diagram.areas);
      setNotes(diagram.notes);
      setTransform({ pan: diagram.pan, zoom: diagram.zoom });
      setTypes(diagram.types ?? []);
      setEnums(diagram.enums ?? []);
      setViews(diagram.views ?? []);
    };

    const resetEditorState = () => {
      setTables([]);
      setRelationships([]);
      setAreas([]);
      setNotes([]);
      setTypes([]);
      setEnums([]);
      setViews([]);
      setUndoStack([]);
      setRedoStack([]);
      setTransform({ zoom: 1, pan: { x: 0, y: 0 } });
      setTitle(untitledTitle());
      setGistId("");
      setLoadedFromGistId("");
      setLayout((prev) => ({ ...prev, readOnly: false }));
      setDiagramSource(null);
      // Diagrama novo nesta mesma aba (Arquivo > Novo): pede o banco de novo
      // e o indicador de salvamento recomeça em "Sem alterações".
      setSelectedDb("");
      setSaveState(State.NONE);
      notifyEditorReset();
    };

    const loadLatestDiagram = async () => {
      let diagram;
      try {
        diagram = await db.diagrams.orderBy("lastModified").last();
      } catch (error) {
        console.log(error);
        return;
      }
      if (!diagram) {
        if (selectedDb === "") setShowSelectDbModal(true);
        return;
      }
      // Só redireciona; o load da nova URL aplica o diagrama. Aplicar aqui,
      // com a URL ainda em /editor, fazia o auto-save criar uma cópia dele.
      navigate(`/editor/diagrams/${diagram.diagramId}`, { replace: true });
    };

    const loadDiagram = async (id) => {
      const { diagram, source } = await fetchDiagram(id);
      if (!diagram) {
        // load roda de novo a cada clique no seletor de banco (depende de
        // selectedDb); só limpa e avisa no primeiro carregamento deste id.
        if (previousLoadedId !== loadedIdRef.current) {
          resetEditorState();
          notFoundToastRef.current = Toast.warning({
            content: (
              <div>
                <div className="font-semibold">
                  {i18n.t("diagram_not_found_title")}
                </div>
                <div>{i18n.t("diagram_not_found_body")}</div>
              </div>
            ),
            duration: 8,
          });
        }
        baseRef.current = { diagramId: id, revision: null };
        if (selectedDb === "") setShowSelectDbModal(true);
        return;
      }

      // Busca o histórico antes de aplicar o diagrama, para que estado e
      // pilhas de desfazer/refazer mudem juntos.
      const revision = revisionOf(diagram.lastModified);
      const history =
        source === "local" ? await loadHistory(id, revision) : null;
      baseRef.current = {
        diagramId: id,
        revision: source === "local" ? revision : null,
      };
      conflictRef.current = false;
      setConflict(null);
      notifyDiagramLoaded();

      setDiagramSource(source);
      if (source === "local") {
        setLayout((prev) => ({ ...prev, readOnly: false }));
      } else if (typeof diagram.canWrite === "boolean") {
        setLayout((prev) => ({ ...prev, readOnly: !diagram.canWrite }));
      }
      applyDiagramState(diagram);
      setUndoStack(history?.undo ?? []);
      setRedoStack(history?.redo ?? []);
    };

    const loadTemplate = async (id) => {
      const template = await db.templates
        .where("templateId")
        .equals(id)
        .first();
      if (!template) {
        if (previousLoadedId !== loadedIdRef.current) resetEditorState();
        if (selectedDb === "") setShowSelectDbModal(true);
        return;
      }
      setDiagramSource(null);
      setDatabase(template.database || DB.GENERIC);
      setTitle(template.title);
      setTables(template.tables);
      setRelationships(template.relationships);
      setAreas(template.subjectAreas);
      setNotes(template.notes);
      setTransform({ zoom: 1, pan: { x: 0, y: 0 } });
      setUndoStack([]);
      setRedoStack([]);
      setTypes(template.types ?? []);
      setEnums(template.enums ?? []);
      setViews(template.views ?? []);
    };

    const loadFromGist = async (shareId, diagramId = null) => {
      try {
        const { data } = await get(shareId);
        const parsed = JSON.parse(data.files[SHARE_FILENAME].content);
        setDiagramSource(null);
        setUndoStack([]);
        setRedoStack([]);
        setGistId(shareId);
        setLoadedFromGistId(shareId);
        setDatabase(parsed.database);
        setTitle(parsed.title);
        setTables(parsed.tables);
        setRelationships(parsed.relationships);
        setNotes(parsed.notes);
        setAreas(parsed.subjectAreas);
        setTransform(parsed.transform);
        setTypes(parsed.types ?? []);
        setEnums(parsed.enums ?? []);
        setViews(parsed.views ?? []);
        if (parsed.customTypes) mergeCustomTypes(parsed.customTypes);
        if (diagramId) {
          navigate(`/editor/diagrams/${diagramId}`, { replace: true });
        }
      } catch (e) {
        console.log(e);
        setSaveState(State.FAILED_TO_LOAD);
      }
    };

    const shareId = searchParams.get("shareId");
    if (shareId) {
      const existingDiagram = await db.diagrams.get({
        loadedFromGistId: shareId,
      });
      await loadFromGist(shareId, existingDiagram?.diagramId || null);
      return;
    }

    if (!loadedDiagramId) {
      if (cloudOnly) {
        if (previousLoadedId != null) resetEditorState();
        if (selectedDb === "") setShowSelectDbModal(true);
        return;
      }
      await loadLatestDiagram();
      return;
    }

    if (isDiagram && loadedDiagramId) {
      await loadDiagram(loadedDiagramId);
      return;
    }

    if (isTemplate && loadedDiagramId) {
      await loadTemplate(loadedDiagramId);
      return;
    }
  }, [
    cloudLoad,
    setTransform,
    setRedoStack,
    setUndoStack,
    setRelationships,
    setTables,
    setAreas,
    setNotes,
    setTypes,
    setDatabase,
    setEnums,
    setViews,
    selectedDb,
    setSaveState,
    setLayout,
    searchParams,
    navigate,
    isDiagram,
    isTemplate,
    loadedDiagramId,
    cloudOnly,
    i18n,
  ]);

  const resolveConflict = async (choice) => {
    if (choice === "copy") {
      // Mantém as duas versões: a do banco fica como está e o conteúdo desta
      // aba vira um diagrama novo.
      const newId = uuidv4();
      const fields = buildLocalFields();
      try {
        await db.diagrams.add({
          ...fields,
          diagramId: newId,
          createdAt: fields.lastModified,
          name: i18n.t("conflict_copy_name", {
            title,
            date: fields.lastModified.toLocaleString(),
          }),
          gistId: "",
          loadedFromGistId: "",
        });
        await saveHistory(
          newId,
          revisionOf(fields.lastModified),
          undoStack,
          redoStack,
        );
      } catch (err) {
        console.error(err);
        Toast.error(i18n.t("oops_smth_went_wrong"));
        return;
      }
      // A partir daqui esta aba é dona da cópia; nenhum save volta a tocar no
      // diagrama original.
      baseRef.current = {
        diagramId: newId,
        revision: revisionOf(fields.lastModified),
      };
      conflictRef.current = false;
      setConflict(null);
      setSaveState(State.SAVED);
      navigate(`/editor/diagrams/${newId}`);
      return;
    }

    conflictRef.current = false;
    setConflict(null);
    if (choice === "overwrite") {
      forceSaveRef.current = true;
      setSaveState(State.SAVING);
    } else {
      await load();
      setSaveState(State.NONE);
    }
  };

  useEffect(() => {
    pruneOrphanHistory(db);
  }, []);

  const returnToCurrentDiagram = async () => {
    await load();
    setLayout((prev) => ({ ...prev, readOnly: false }));
    setVersion(null);
  };

  useEffect(() => {
    if (
      tables?.length === 0 &&
      areas?.length === 0 &&
      notes?.length === 0 &&
      views?.length === 0 &&
      types?.length === 0
    )
      return;

    if (settings.autosave) {
      setSaveState(State.SAVING);
    }
  }, [
    undoStack,
    redoStack,
    settings.autosave,
    tables?.length,
    areas?.length,
    notes?.length,
    views?.length,
    types?.length,
    relationships?.length,
    transform.zoom,
    title,
    gistId,
    setSaveState,
  ]);

  useEffect(() => {
    if (layout.readOnly) return;

    if (saveState !== State.SAVING) return;

    save();
  }, [saveState, layout, save]);

  useEffect(() => {
    load();
  }, [load]);

  // Nome do diagrama na aba do navegador (antes era sempre "Editor | drawDB").
  useEffect(() => {
    document.title = tabTitle(title);
  }, [title]);

  return (
    <div className="h-full flex flex-col overflow-hidden theme">
      <IdContext.Provider value={{ gistId, setGistId, version, setVersion }}>
        <ControlPanel
          title={title}
          setTitle={setTitle}
          lastSaved={lastSaved}
          setLastSaved={setLastSaved}
          toolbarContainer={toolbarContainer}
        />
      </IdContext.Provider>
      <div
        className="flex h-full overflow-y-auto"
        onPointerUp={(e) => e.isPrimary && setResize(false)}
        onPointerLeave={(e) => e.isPrimary && setResize(false)}
        onPointerMove={(e) => e.isPrimary && handleResize(e)}
        onPointerDown={(e) => {
          // Required for onPointerLeave to trigger when a touch pointer leaves
          // https://stackoverflow.com/a/70976017/1137077
          e.target.releasePointerCapture(e.pointerId);
        }}
        style={isRtl(i18n.language) ? { direction: "rtl" } : {}}
      >
        {layout.sidebar && (
          <SidePanel resize={resize} setResize={setResize} width={width} />
        )}
        <div className="relative flex-1 min-w-0 h-full overflow-hidden">
          <CanvasContextProvider className="h-full w-full">
            <Canvas saveState={saveState} setSaveState={setSaveState} />
          </CanvasContextProvider>
          <Slot name="canvas-overlay" />
          {layout.toolbar && (
            <div
              ref={setToolbarContainer}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20"
            />
          )}
          {version && (
            <div className="absolute right-8 top-2 space-x-2">
              <Button
                icon={<i className="fa-solid fa-rotate-right mt-0.5"></i>}
                onClick={() => setShowRestoreModal(true)}
              >
                {t("restore_version")}
              </Button>
              <Button
                type="tertiary"
                onClick={returnToCurrentDiagram}
                icon={<i className="bi bi-arrow-return-right mt-1"></i>}
              >
                {t("return_to_current")}
              </Button>
            </div>
          )}
          {(cloudOnly || typeof extensions.moveToCloudUpgrade === "function") &&
            diagramSource === "local" &&
            !version &&
            !dismissedBanners.has(`move:${loadedDiagramId}`) && (
              <div className="pointer-events-none absolute inset-x-0 top-3 z-50 flex justify-center">
                <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-blue-300 bg-blue-50 px-5 py-1.5 shadow-md dark:border-sky-900/50 dark:bg-sky-900/30">
                  <i className="bi bi-hdd" />
                  <span className="text-sm">{t("move_to_cloud_prompt")}</span>
                  <Button
                    size="small"
                    theme="solid"
                    onClick={
                      cloudOnly ? moveToCloud : extensions.moveToCloudUpgrade
                    }
                  >
                    {t("move")}
                  </Button>
                  <Button
                    size="small"
                    theme="borderless"
                    type="tertiary"
                    aria-label={t("dismiss")}
                    icon={<i className="bi bi-x-lg" />}
                    onClick={dismissMoveToCloud}
                  />
                </div>
              </div>
            )}
          {!(layout.sidebar || layout.toolbar || layout.header) && (
            <div className="fixed right-5 bottom-4">
              <FloatingControls />
            </div>
          )}
        </div>
        <Slot name="right-panel" />
      </div>
      <Modal
        centered
        size="medium"
        closable={false}
        hasCancel={false}
        title={t("pick_db")}
        okText={t("confirm")}
        visible={showSelectDbModal}
        onOk={() => {
          // Sem escolha explícita, vale o banco padrão (Configurações).
          const choice = selectedDb || preferredDatabase(settings);
          setSelectedDb(choice);
          setDatabase(choice);
          setShowSelectDbModal(false);
        }}
      >
        <div className="grid grid-cols-3 gap-4 place-content-center">
          {Object.values(databases).map((x) => (
            <div
              key={x.name}
              onClick={() => {
                setSelectedDb(x.label);
                // A escolha do banco responde ao aviso de diagrama inexistente.
                if (notFoundToastRef.current) {
                  Toast.close(notFoundToastRef.current);
                  notFoundToastRef.current = null;
                }
              }}
              className={`space-y-3 p-3 rounded-md border-2 select-none ${
                settings.mode === "dark"
                  ? "bg-zinc-700 hover:bg-zinc-600"
                  : "bg-zinc-100 hover:bg-zinc-200"
              } ${(selectedDb || preferredDatabase(settings)) === x.label ? "border-zinc-400" : "border-transparent"}`}
            >
              <div className="flex items-center justify-between">
                <div className="font-semibold">{x.name}</div>
                {x.beta && (
                  <Tag size="small" color="light-blue">
                    Beta
                  </Tag>
                )}
              </div>
              {x.image && (
                <img
                  src={x.image}
                  className="h-8"
                  style={{
                    filter:
                      "opacity(0.4) drop-shadow(0 0 0 white) drop-shadow(0 0 0 white)",
                  }}
                />
              )}
              <div className="text-xs">{x.description}</div>
            </div>
          ))}
        </div>
      </Modal>
      <Modal
        visible={showRestoreModal}
        centered
        closable
        onCancel={() => setShowRestoreModal(false)}
        title={
          <span className="flex items-center gap-2">
            <IconAlertTriangle className="text-amber-400" size="extra-large" />{" "}
            {t("restore_version")}
          </span>
        }
        okText={t("continue")}
        cancelText={t("cancel")}
        onOk={() => {
          setLayout((prev) => ({ ...prev, readOnly: false }));
          setShowRestoreModal(false);
          setVersion(null);
        }}
      >
        {t("restore_warning")}
      </Modal>
      <ConflictModal conflict={conflict} onResolve={resolveConflict} />
    </div>
  );
}
