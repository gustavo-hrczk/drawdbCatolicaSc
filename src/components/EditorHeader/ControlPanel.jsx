import { appUrl } from "../../utils/appUrl";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Slot, useExtensions } from "../../context/ExtensionsContext";
import { createPortal } from "react-dom";
import {
  IconCaretdown,
  IconChevronRight,
  IconChevronLeft,
  IconSaveStroked,
  IconUndo,
  IconRedo,
  IconEdit,
  IconShareStroked,
} from "@douyinfe/semi-icons";
import { Link, useMatch, useParams } from "react-router-dom";
import icon from "../../assets/icon_dark_64.png";
import {
  Button,
  Divider,
  Dropdown,
  InputNumber,
  Tooltip,
  Tag,
  Toast,
  Popconfirm,
  Typography,
  Modal as SemiModal,
} from "@douyinfe/semi-ui";
import {
  copyDiagramImage,
  diagramDataUrl,
  diagramSvg,
  EmptyDiagramError,
  svgToDataUrl,
} from "../../catolica/canvasImage";
import {
  jsonToMySQL,
  jsonToPostgreSQL,
  jsonToSQLite,
  jsonToMariaDB,
  jsonToSQLServer,
  jsonToOracleSQL,
} from "../../utils/exportSQL/generic";
import {
  ObjectType,
  Action,
  Tab,
  State,
  MODAL,
  SIDESHEET,
  DB,
  IMPORT_FROM,
  noteWidth,
  keyboardPanStep,
  tableWidth,
  gridSize,
} from "../../data/constants";
import jsPDF from "jspdf";
import { useHotkeys } from "react-hotkeys-hook";
import { Validator } from "jsonschema";
import {
  areaSchema,
  noteSchema,
  tableSchema,
  viewSchema,
} from "../../data/schemas";
import { db } from "../../data/db";
import {
  useLayout,
  useSettings,
  useTransform,
  useDiagram,
  useUndoRedo,
  useSelect,
  useSaveState,
  useTypes,
  useNotes,
  useAreas,
  useEnums,
  useViews,
  useFullscreen,
  useNavigateWithParams,
} from "../../hooks";
import { enterFullscreen, exitFullscreen } from "../../utils/fullscreen";
import {
  IconAddArea,
  IconAddNote,
  IconAddTable,
  IconAddView,
} from "../../icons";
import LayoutDropdown from "./LayoutDropdown";
import Sidesheet from "./SideSheet/Sidesheet";
import Modal from "./Modal/Modal";
import { useTranslation } from "react-i18next";
import { exportSQL } from "../../utils/exportSQL";
import { databases } from "../../data/databases";
import { jsonToMermaid } from "../../utils/exportAs/mermaid";
import { isRtl } from "../../i18n/utils/rtl";
import { jsonToDocumentation } from "../../utils/exportAs/documentation";
import { IdContext } from "../Workspace";
import { socials } from "../../data/socials";
import { toDBML } from "../../utils/exportAs/dbml";
import { applyDiagramPlan } from "../../utils/dbml/applyPlan";
import { diffDiagram } from "../../utils/dbml/diff";
import { exportSavedData } from "../../utils/exportSavedData";
import { nanoid } from "nanoid";
import { getTableHeight, getTableWidth } from "../../utils/utils";
import {
  getViewHeight,
  getViewWidth,
  resolveViewColumns,
} from "../../utils/views";
import { autoArrange } from "../../utils/autoArrange";
import { findAutoFKRelationships } from "../../utils/autoRelationships";
import { deleteFromCache, STORAGE_KEY } from "../../utils/cache";
import { DateTime } from "luxon";
import ConfigureCustomTypes from "./ConfigureCustomTypes";
import { useDiagramList } from "./Modal/Open/hooks/useDiagramList";
import {
  hasTextSelection,
  isTypingTarget,
  lastCopied,
  rememberCopied,
} from "../../catolica/clipboard";
import SaveStatus from "../../catolica/SaveStatus";
import { hasGistBackend } from "../../catolica/features";
import ShortcutsModal from "../../catolica/ShortcutsModal";
import {
  readShortcutPrefs,
  writeShortcutPrefs,
} from "../../catolica/shortcuts";
import useSafeKeyShortcuts, {
  allowDelete,
  openOverlays,
} from "../../catolica/useSafeKeyShortcuts";
import { focusTableSearch } from "../../catolica/tableSearch";
import { pointerInDiagram } from "../../catolica/canvasPointer";
import GridDropdown, { SnapToGridButton } from "../../catolica/GridDropdown";
import { isDefaultTitle, untitledTitle } from "../../catolica/i18n";
import ExportDialog from "../../catolica/ExportDialog";
import ImportDialog from "../../catolica/ImportDialog";
import NewDialog from "../../catolica/NewDialog";
import OpenDialog from "../../catolica/OpenDialog";
import SaveAsDialog from "../../catolica/SaveAsDialog";
import {
  catolicaEditMenu,
  catolicaFileMenu,
  catolicaHelpMenu,
  catolicaSettingsMenu,
  catolicaViewMenu,
} from "../../catolica/menus";
import {
  AboutDialog,
  ChangelogDialog,
  EDITOR_VERSION,
} from "../../catolica/InfoDialogs";
import { newIssueUrl, UPSTREAM_DOCS_URL } from "../../catolica/links";
import { preferredDatabase } from "../../catolica/databasePreference";
import {
  focusDialogField,
  focusNameField,
  openForRename,
  renameTarget,
} from "../../catolica/renameField";
import { mergeDiagrams, sortDiagrams } from "./Modal/Open/diagram";

const EDITOR_HOTKEY = {
  preventDefault: true,
  ignoreEventWhen: (e) => Boolean(e.target?.closest?.(".monaco-editor")),
};

export default function ControlPanel({
  title,
  setTitle,
  setLastSaved,
  toolbarContainer,
}) {
  const { id: diagramId } = useParams();

  const [modal, setModal] = useState(MODAL.NONE);
  const [sidesheet, setSidesheet] = useState(SIDESHEET.NONE);
  const [showEditName, setShowEditName] = useState(false);
  const [showAutoConnectModal, setShowAutoConnectModal] = useState(false);
  const [importDb, setImportDb] = useState("");
  const [exportData, setExportData] = useState({
    data: null,
    filename: `${title}_${new Date().toISOString()}`,
    extension: "",
  });

  const openExportModal = (modalType) => {
    setExportData((prev) => ({
      ...prev,
      filename: `${title}_${new Date().toISOString()}`,
    }));
    setModal(modalType);
  };
  const [importFrom, setImportFrom] = useState(IMPORT_FROM.JSON);
  const { saveState, setSaveState } = useSaveState();
  const { layout, setLayout } = useLayout();
  const { settings, setSettings } = useSettings();
  const {
    relationships,
    tables,
    setTables,
    addTable,
    updateTable,
    deleteField,
    deleteTable,
    updateField,
    setRelationships,
    addRelationship,
    deleteRelationship,
    updateRelationship,
    database,
  } = useDiagram();
  const { enums, setEnums, deleteEnum, addEnum, updateEnum } = useEnums();
  const { types, addType, deleteType, updateType, setTypes } = useTypes();
  const { views, setViews, addView, updateView, deleteView } = useViews();
  const { notes, setNotes, updateNote, addNote, deleteNote } = useNotes();
  const { areas, setAreas, updateArea, addArea, deleteArea } = useAreas();
  const { undoStack, redoStack, setUndoStack, setRedoStack } = useUndoRedo();
  const { selectedElement, setSelectedElement } = useSelect();
  const { transform, setTransform } = useTransform();
  const { t, i18n } = useTranslation();
  const { version, gistId, setGistId } = useContext(IdContext);
  const isTemplate = useMatch("/editor/templates/:id");
  const navigate = useNavigateWithParams();
  const extensions = useExtensions();

  const swapDbmlSnapshot = (entry) => {
    const current = { tables, relationships, enums };
    applyDiagramPlan(diffDiagram(current, entry.data.snapshot), {
      addTable,
      updateTable,
      updateField,
      deleteTable,
      addRelationship,
      updateRelationship,
      deleteRelationship,
      setEnums,
    });
    return { ...entry, data: { snapshot: current } };
  };

  const undo = () => {
    if (undoStack.length === 0) return;
    const a = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.filter((_, i) => i !== prev.length - 1));

    if (a.bulk) {
      if (a.element === ObjectType.RELATIONSHIP && a.action === Action.ADD) {
        const idsToDelete = new Set((a.relationships || []).map((r) => r.id));
        setRelationships((prev) => prev.filter((r) => !idsToDelete.has(r.id)));
        setRedoStack((prev) => [...prev, a]);
        return;
      }
      for (const element of a.elements) {
        if (element.type === ObjectType.TABLE) {
          updateTable(element.id, element.undo);
        } else if (element.type === ObjectType.AREA) {
          updateArea(element.id, element.undo);
        } else if (element.type === ObjectType.NOTE) {
          updateNote(element.id, element.undo);
        } else if (element.type === ObjectType.VIEW) {
          updateView(element.id, element.undo);
        }
      }
      if (a.view) {
        // Volta o enquadramento e guarda o atual para o refazer.
        setRedoStack((prev) => [
          ...prev,
          { ...a, view: { ...a.view, after: transform } },
        ]);
        setTransform(a.view.before);
        return;
      }
      setRedoStack((prev) => [...prev, a]);
      return;
    }

    if (a.element === ObjectType.DBML) {
      setRedoStack((prev) => [...prev, swapDbmlSnapshot(a)]);
      return;
    }

    if (a.action === Action.ADD) {
      if (a.element === ObjectType.TABLE) {
        deleteTable(a.data.table.id, false);
      } else if (a.element === ObjectType.AREA) {
        deleteArea(areas[areas.length - 1].id, false);
      } else if (a.element === ObjectType.NOTE) {
        deleteNote(notes[notes.length - 1].id, false);
      } else if (a.element === ObjectType.RELATIONSHIP) {
        deleteRelationship(a.data.relationship.id, false);
      } else if (a.element === ObjectType.TYPE) {
        deleteType(a.data.type.id, false);
      } else if (a.element === ObjectType.ENUM) {
        deleteEnum(a.data.enum.id, false);
      } else if (a.element === ObjectType.VIEW) {
        deleteView(a.data.view.id, false);
      }
      setRedoStack((prev) => [...prev, a]);
    } else if (a.action === Action.MOVE) {
      if (a.element === ObjectType.TABLE) {
        const { x, y } = tables.find((t) => t.id === a.id);
        setRedoStack((prev) => [...prev, { ...a, x, y }]);
        updateTable(a.id, { x: a.x, y: a.y });
      } else if (a.element === ObjectType.AREA) {
        setRedoStack((prev) => [
          ...prev,
          { ...a, x: areas[a.id].x, y: areas[a.id].y },
        ]);
        updateArea(a.id, { x: a.x, y: a.y });
      } else if (a.element === ObjectType.NOTE) {
        setRedoStack((prev) => [
          ...prev,
          { ...a, x: notes[a.id].x, y: notes[a.id].y },
        ]);
        updateNote(a.id, { x: a.x, y: a.y });
      }
    } else if (a.action === Action.DELETE) {
      if (a.element === ObjectType.TABLE) {
        a.data.relationship.forEach((x) => addRelationship(x, false));
        addTable(a.data, false);
      } else if (a.element === ObjectType.RELATIONSHIP) {
        addRelationship(a.data, false);
      } else if (a.element === ObjectType.NOTE) {
        addNote(a.data, false);
      } else if (a.element === ObjectType.AREA) {
        addArea(a.data, false);
      } else if (a.element === ObjectType.TYPE) {
        addType(a.data, false);
      } else if (a.element === ObjectType.ENUM) {
        addEnum(a.data, false);
      } else if (a.element === ObjectType.VIEW) {
        addView(a.data, false);
      }
      setRedoStack((prev) => [...prev, a]);
    } else if (a.action === Action.EDIT) {
      if (a.element === ObjectType.AREA) {
        updateArea(a.aid, a.undo);
      } else if (a.element === ObjectType.NOTE) {
        updateNote(a.nid, a.undo);
      } else if (a.element === ObjectType.TABLE) {
        const table = tables.find((t) => t.id === a.tid);
        if (a.component === "field") {
          updateField(a.tid, a.fid, a.undo);
        } else if (a.component === "field_delete") {
          setRelationships((prev) => {
            let temp = [...prev];
            a.data.relationship.forEach((r) => {
              temp.splice(r.id, 0, r);
            });
            return temp;
          });
          const updatedFields = table.fields.slice();
          updatedFields.splice(a.data.index, 0, a.data.field);
          updateTable(a.tid, { fields: updatedFields });
        } else if (a.component === "field_add") {
          updateTable(a.tid, {
            fields: table.fields.filter((e) => e.id !== a.fid),
          });
        } else if (a.component === "index_add") {
          updateTable(a.tid, {
            indices: table.indices
              .filter((e) => e.id !== table.indices.length - 1)
              .map((t, i) => ({ ...t, id: i })),
          });
        } else if (a.component === "index") {
          updateTable(a.tid, {
            indices: table.indices.map((index) =>
              index.id === a.iid
                ? {
                    ...index,
                    ...a.undo,
                  }
                : index,
            ),
          });
        } else if (a.component === "index_delete") {
          const updatedIndices = table.indices.slice();
          updatedIndices.splice(a.data.id, 0, a.data);
          updateTable(a.tid, {
            indices: updatedIndices.map((t, i) => ({ ...t, id: i })),
          });
        } else if (a.component === "unique_constraint_add") {
          const constraints = table.uniqueConstraints || [];
          updateTable(a.tid, {
            uniqueConstraints: constraints
              .filter((e) => e.id !== constraints.length - 1)
              .map((t, i) => ({ ...t, id: i })),
          });
        } else if (a.component === "unique_constraint") {
          updateTable(a.tid, {
            uniqueConstraints: (table.uniqueConstraints || []).map(
              (constraint) =>
                constraint.id === a.cid
                  ? {
                      ...constraint,
                      ...a.undo,
                    }
                  : constraint,
            ),
          });
        } else if (a.component === "unique_constraint_delete") {
          const updatedConstraints = (table.uniqueConstraints || []).slice();
          updatedConstraints.splice(a.data.id, 0, a.data);
          updateTable(a.tid, {
            uniqueConstraints: updatedConstraints.map((t, i) => ({
              ...t,
              id: i,
            })),
          });
        } else if (a.component === "self") {
          updateTable(a.tid, a.undo);
        }
      } else if (a.element === ObjectType.RELATIONSHIP) {
        updateRelationship(a.rid, a.undo);
      } else if (a.element === ObjectType.TYPE) {
        if (a.component === "field_add") {
          const type = types.find((t, i) =>
            typeof a.tid === "number" ? i === a.tid : t.id === a.tid,
          );
          updateType(a.tid, {
            fields: type.fields.filter((f, i) =>
              f.id ? f.id !== a.data.field.id : i !== type.fields.length - 1,
            ),
          });
        }
        if (a.component === "field") {
          updateType(a.tid, {
            fields: types[a.tid].fields.map((e, i) =>
              i === a.fid ? { ...e, ...a.undo } : e,
            ),
          });
        } else if (a.component === "field_delete") {
          setTypes((prev) =>
            prev.map((t, i) => {
              if (i === a.tid) {
                const temp = t.fields.slice();
                temp.splice(a.fid, 0, a.data);
                return { ...t, fields: temp };
              }
              return t;
            }),
          );
        } else if (a.component === "self") {
          updateType(a.tid, a.undo);
          if (a.updatedFields) {
            if (a.undo.name) {
              a.updatedFields.forEach((x) =>
                updateField(x.tid, x.fid, { type: a.undo.name.toUpperCase() }),
              );
            }
          }
        }
      } else if (a.element === ObjectType.VIEW) {
        updateView(a.vid, a.undo);
      } else if (a.element === ObjectType.ENUM) {
        updateEnum(a.id, a.undo);
        if (a.updatedFields) {
          if (a.undo.name) {
            a.updatedFields.forEach((x) =>
              updateField(x.tid, x.fid, { type: a.undo.name.toUpperCase() }),
            );
          }
        }
      }
      setRedoStack((prev) => [...prev, a]);
    }
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const a = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.filter((e, i) => i !== prev.length - 1));

    if (a.bulk) {
      if (a.element === ObjectType.RELATIONSHIP && a.action === Action.ADD) {
        setRelationships((prev) => [...prev, ...(a.relationships || [])]);
        setUndoStack((prev) => [...prev, a]);
        return;
      }
      for (const element of a.elements) {
        if (element.type === ObjectType.TABLE) {
          updateTable(element.id, element.redo);
        } else if (element.type === ObjectType.AREA) {
          updateArea(element.id, element.redo);
        } else if (element.type === ObjectType.NOTE) {
          updateNote(element.id, element.redo);
        } else if (element.type === ObjectType.VIEW) {
          updateView(element.id, element.redo);
        }
      }
      if (a.view?.after) setTransform(a.view.after);
      setUndoStack((prev) => [...prev, a]);
      return;
    }

    if (a.element === ObjectType.DBML) {
      setUndoStack((prev) => [...prev, swapDbmlSnapshot(a)]);
      return;
    }

    if (a.action === Action.ADD) {
      if (a.element === ObjectType.TABLE) {
        addTable(a.data, false);
      } else if (a.element === ObjectType.AREA) {
        addArea(null, false);
      } else if (a.element === ObjectType.NOTE) {
        addNote(null, false);
      } else if (a.element === ObjectType.RELATIONSHIP) {
        addRelationship(a.data, false);
      } else if (a.element === ObjectType.TYPE) {
        addType(a.data, false);
      } else if (a.element === ObjectType.ENUM) {
        addEnum(a.data, false);
      } else if (a.element === ObjectType.VIEW) {
        addView(a.data, false);
      }
      setUndoStack((prev) => [...prev, a]);
    } else if (a.action === Action.MOVE) {
      if (a.element === ObjectType.TABLE) {
        const { x, y } = tables.find((t) => t.id == a.id);
        setUndoStack((prev) => [...prev, { ...a, x, y }]);
        updateTable(a.id, { x: a.x, y: a.y });
      } else if (a.element === ObjectType.AREA) {
        setUndoStack((prev) => [
          ...prev,
          { ...a, x: areas[a.id].x, y: areas[a.id].y },
        ]);
        updateArea(a.id, { x: a.x, y: a.y });
      } else if (a.element === ObjectType.NOTE) {
        setUndoStack((prev) => [
          ...prev,
          { ...a, x: notes[a.id].x, y: notes[a.id].y },
        ]);
        updateNote(a.id, { x: a.x, y: a.y });
      }
    } else if (a.action === Action.DELETE) {
      if (a.element === ObjectType.TABLE) {
        deleteTable(a.data.table.id, false);
      } else if (a.element === ObjectType.RELATIONSHIP) {
        deleteRelationship(a.data.relationship.id, false);
      } else if (a.element === ObjectType.NOTE) {
        deleteNote(a.data.id, false);
      } else if (a.element === ObjectType.AREA) {
        deleteArea(a.data.id, false);
      } else if (a.element === ObjectType.TYPE) {
        deleteType(a.data.type.id, false);
      } else if (a.element === ObjectType.ENUM) {
        deleteEnum(a.data.enum.id, false);
      } else if (a.element === ObjectType.VIEW) {
        deleteView(a.data.view.id, false);
      }
      setUndoStack((prev) => [...prev, a]);
    } else if (a.action === Action.EDIT) {
      if (a.element === ObjectType.AREA) {
        updateArea(a.aid, a.redo);
      } else if (a.element === ObjectType.NOTE) {
        updateNote(a.nid, a.redo);
      } else if (a.element === ObjectType.TABLE) {
        const table = tables.find((t) => t.id === a.tid);
        if (a.component === "field") {
          updateField(a.tid, a.fid, a.redo);
        } else if (a.component === "field_delete") {
          deleteField(a.data.field, a.tid, false);
        } else if (a.component === "field_add") {
          updateTable(a.tid, {
            fields: [
              ...table.fields,
              {
                name: "",
                type: "",
                default: "",
                check: "",
                primary: false,
                unique: false,
                notNull: false,
                increment: false,
                comment: "",
                id: nanoid(),
              },
            ],
          });
        } else if (a.component === "index_add") {
          updateTable(a.tid, {
            indices: [
              ...table.indices,
              {
                id: table.indices.length,
                name: `index_${table.indices.length}`,
                fields: [],
              },
            ],
          });
        } else if (a.component === "index") {
          updateTable(a.tid, {
            indices: table.indices.map((index) =>
              index.id === a.iid
                ? {
                    ...index,
                    ...a.redo,
                  }
                : index,
            ),
          });
        } else if (a.component === "index_delete") {
          updateTable(a.tid, {
            indices: table.indices
              .filter((e) => e.id !== a.data.id)
              .map((t, i) => ({ ...t, id: i })),
          });
        } else if (a.component === "unique_constraint_add") {
          const constraints = table.uniqueConstraints || [];
          updateTable(a.tid, {
            uniqueConstraints: [
              ...constraints,
              {
                id: constraints.length,
                name: `${table.name}_unique_${constraints.length}`,
                fields: [],
              },
            ],
          });
        } else if (a.component === "unique_constraint") {
          updateTable(a.tid, {
            uniqueConstraints: (table.uniqueConstraints || []).map(
              (constraint) =>
                constraint.id === a.cid
                  ? {
                      ...constraint,
                      ...a.redo,
                    }
                  : constraint,
            ),
          });
        } else if (a.component === "unique_constraint_delete") {
          updateTable(a.tid, {
            uniqueConstraints: (table.uniqueConstraints || [])
              .filter((e) => e.id !== a.data.id)
              .map((t, i) => ({ ...t, id: i })),
          });
        } else if (a.component === "self") {
          updateTable(a.tid, a.redo, false);
        }
      } else if (a.element === ObjectType.RELATIONSHIP) {
        updateRelationship(a.rid, a.redo);
      } else if (a.element === ObjectType.TYPE) {
        if (a.component === "field_add") {
          const type = types.find((t, i) =>
            typeof a.tid === "number" ? i === a.tid : t.id === a.tid,
          );
          updateType(a.tid, {
            fields: [...type.fields, a.data.field],
          });
        } else if (a.component === "field") {
          updateType(a.tid, {
            fields: types[a.tid].fields.map((e, i) =>
              i === a.fid ? { ...e, ...a.redo } : e,
            ),
          });
        } else if (a.component === "field_delete") {
          updateType(a.tid, {
            fields: types[a.tid].fields.filter((field, i) => i !== a.fid),
          });
        } else if (a.component === "self") {
          updateType(a.tid, a.redo);
          if (a.updatedFields) {
            if (a.redo.name) {
              a.updatedFields.forEach((x) =>
                updateField(x.tid, x.fid, { type: a.redo.name.toUpperCase() }),
              );
            }
          }
        }
      } else if (a.element === ObjectType.VIEW) {
        updateView(a.vid, a.redo);
      } else if (a.element === ObjectType.ENUM) {
        updateEnum(a.id, a.redo);
        if (a.updatedFields) {
          if (a.redo.name) {
            a.updatedFields.forEach((x) =>
              updateField(x.tid, x.fid, { type: a.redo.name.toUpperCase() }),
            );
          }
        }
      }
      setUndoStack((prev) => [...prev, a]);
    }
  };

  // Janelas do menu Arquivo do fork (ver src/catolica/fileMenu.js).
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [showSaveAsDialog, setShowSaveAsDialog] = useState(false);
  const [newMode, setNewMode] = useState(null); // null, "here" ou "window"
  const fileImport = () => setShowImportDialog(true);
  const viewGrid = () =>
    setSettings((prev) => ({ ...prev, showGrid: !prev.showGrid }));
  const snapToGrid = () =>
    setSettings((prev) => ({ ...prev, snapToGrid: !prev.snapToGrid }));
  const zoomIn = () =>
    setTransform((prev) => ({ ...prev, zoom: prev.zoom * 1.2 }));
  const zoomOut = () =>
    setTransform((prev) => ({ ...prev, zoom: prev.zoom / 1.2 }));
  const panBy = (dx, dy) =>
    setTransform((prev) => ({
      ...prev,
      pan: {
        x: prev.pan.x + dx / prev.zoom,
        y: prev.pan.y + dy / prev.zoom,
      },
    }));
  const panLeft = () => panBy(-keyboardPanStep, 0);
  const panRight = () => panBy(keyboardPanStep, 0);
  const panUp = () => panBy(0, -keyboardPanStep);
  const panDown = () => panBy(0, keyboardPanStep);
  const viewStrictMode = () => {
    setSettings((prev) => ({ ...prev, strictMode: !prev.strictMode }));
  };
  const viewFieldSummary = () => {
    setSettings((prev) => ({
      ...prev,
      showFieldSummary: !prev.showFieldSummary,
    }));
  };
  // Imagens do diagrama: recortadas no conteúdo, em tamanho real
  // (src/catolica/canvasImage.js).
  const imageError = (err) => {
    if (err instanceof EmptyDiagramError) {
      Toast.info(t("image_empty_diagram"));
    } else {
      console.error(err);
      Toast.error(t("oops_smth_went_wrong"));
    }
  };
  const copyAsImage = () => {
    copyDiagramImage()
      .then((status) => {
        if (status === "ok") Toast.success(t("copied_to_clipboard"));
        if (status === "empty") Toast.info(t("image_empty_diagram"));
      })
      .catch(imageError);
  };
  const exportDiagramImage = (extension, options) => {
    const image =
      extension === "svg"
        ? Promise.resolve().then(() => svgToDataUrl(diagramSvg().markup))
        : diagramDataUrl(options).then((result) => result.dataUrl);
    openExportModal(MODAL.IMG);
    image
      .then((dataUrl) =>
        setExportData((prev) => ({ ...prev, data: dataUrl, extension })),
      )
      .catch((err) => {
        setModal(MODAL.NONE);
        imageError(err);
      });
  };
  const resetView = () =>
    setTransform((prev) => ({ ...prev, zoom: 1, pan: { x: 0, y: 0 } }));
  const fitWindow = () => fitToView(tables);
  const fitToView = (tablesToFit) => {
    const canvas = document.getElementById("canvas").getBoundingClientRect();

    const minMaxXY = {
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity,
    };

    tablesToFit.forEach((table) => {
      minMaxXY.minX = Math.min(minMaxXY.minX, table.x);
      minMaxXY.minY = Math.min(minMaxXY.minY, table.y);
      minMaxXY.maxX = Math.max(minMaxXY.maxX, table.x + getTableWidth(table));
      minMaxXY.maxY = Math.max(
        minMaxXY.maxY,
        table.y + getTableHeight(table, settings.showComments, relationships),
      );
    });

    views.forEach((view) => {
      minMaxXY.minX = Math.min(minMaxXY.minX, view.x);
      minMaxXY.minY = Math.min(minMaxXY.minY, view.y);
      minMaxXY.maxX = Math.max(minMaxXY.maxX, view.x + getViewWidth(view));
      minMaxXY.maxY = Math.max(
        minMaxXY.maxY,
        view.y +
          getViewHeight(
            view,
            resolveViewColumns(view, tables),
            settings.showComments,
          ),
      );
    });

    areas.forEach((area) => {
      minMaxXY.minX = Math.min(minMaxXY.minX, area.x);
      minMaxXY.minY = Math.min(minMaxXY.minY, area.y);
      minMaxXY.maxX = Math.max(minMaxXY.maxX, area.x + area.width);
      minMaxXY.maxY = Math.max(minMaxXY.maxY, area.y + area.height);
    });

    notes.forEach((note) => {
      minMaxXY.minX = Math.min(minMaxXY.minX, note.x);
      minMaxXY.minY = Math.min(minMaxXY.minY, note.y);
      minMaxXY.maxX = Math.max(
        minMaxXY.maxX,
        note.x + (note.width ?? noteWidth),
      );
      minMaxXY.maxY = Math.max(minMaxXY.maxY, note.y + note.height);
    });

    const padding = 10;
    const width = minMaxXY.maxX - minMaxXY.minX + padding;
    const height = minMaxXY.maxY - minMaxXY.minY + padding;

    const scaleX = canvas.width / width;
    const scaleY = canvas.height / height;
    // Making sure the scale is a multiple of 0.05
    const scale = Math.floor(Math.min(scaleX, scaleY) * 20) / 20;

    const centerX = (minMaxXY.minX + minMaxXY.maxX) / 2;
    const centerY = (minMaxXY.minY + minMaxXY.maxY) / 2;

    setTransform((prev) => ({
      ...prev,
      zoom: scale,
      pan: { x: centerX, y: centerY },
    }));
  };
  const autoArrangeTables = () => {
    const positions = autoArrange(tables, relationships, settings);
    const positionById = new Map(positions.map((p) => [p.id, p]));

    const elements = [];
    const arrangedTables = tables.map((table) => {
      const pos = positionById.get(table.id);
      if (!pos || (pos.x === table.x && pos.y === table.y)) return table;
      elements.push({
        id: table.id,
        type: ObjectType.TABLE,
        undo: { x: table.x, y: table.y },
        redo: { x: pos.x, y: pos.y },
      });
      return { ...table, x: pos.x, y: pos.y };
    });

    if (elements.length === 0) return;

    for (const element of elements) {
      updateTable(element.id, element.redo);
    }
    setUndoStack((prev) => [
      ...prev,
      {
        action: Action.MOVE,
        bulk: true,
        message: t("auto_arrange"),
        elements,
        // Enquadramento de antes, para o desfazer voltar também o zoom.
        view: { before: transform },
      },
    ]);
    setRedoStack([]);
    fitToView(arrangedTables);
  };
  const autoConnectFKs = () => {
    if (layout.readOnly) return;
    setShowAutoConnectModal(true);
  };
  const confirmAutoConnectFKs = () => {
    setShowAutoConnectModal(false);
    const newRels = findAutoFKRelationships(tables, relationships);
    if (newRels.length === 0) {
      Toast.info(t("all_relations_already_connected"));
      return;
    }
    setRelationships((prev) => [...prev, ...newRels]);
    setUndoStack((prev) => [
      ...prev,
      {
        action: Action.ADD,
        element: ObjectType.RELATIONSHIP,
        bulk: true,
        message: t("auto_connect_fk"),
        relationships: newRels,
      },
    ]);
    setRedoStack([]);
    Toast.success(t("auto_connect_fk_success", { count: newRels.length }));
  };
  const edit = () => {
    if (selectedElement.element === ObjectType.TABLE) {
      if (!layout.sidebar) {
        setSelectedElement((prev) => ({
          ...prev,
          open: true,
        }));
      } else {
        setSelectedElement((prev) => ({
          ...prev,
          open: true,
          currentTab: Tab.TABLES,
        }));
        if (selectedElement.currentTab !== Tab.TABLES) return;
        document
          .getElementById(`scroll_table_${selectedElement.id}`)
          .scrollIntoView({ behavior: "smooth" });
      }
    } else if (selectedElement.element === ObjectType.VIEW) {
      if (!layout.sidebar) {
        setSelectedElement((prev) => ({ ...prev, open: true }));
      } else {
        setSelectedElement((prev) => ({
          ...prev,
          open: true,
          currentTab: Tab.VIEWS,
        }));
        if (selectedElement.currentTab !== Tab.VIEWS) return;
        document
          .getElementById(`scroll_view_${selectedElement.id}`)
          ?.scrollIntoView({ behavior: "smooth" });
      }
    } else if (selectedElement.element === ObjectType.AREA) {
      if (layout.sidebar) {
        setSelectedElement((prev) => ({
          ...prev,
          currentTab: Tab.AREAS,
        }));
        if (selectedElement.currentTab !== Tab.AREAS) return;
        document
          .getElementById(`scroll_area_${selectedElement.id}`)
          .scrollIntoView({ behavior: "smooth" });
      } else {
        setSelectedElement((prev) => ({
          ...prev,
          open: true,
          editFromToolbar: true,
        }));
      }
    } else if (selectedElement.element === ObjectType.NOTE) {
      if (layout.sidebar) {
        setSelectedElement((prev) => ({
          ...prev,
          currentTab: Tab.NOTES,
          open: false,
        }));
        if (selectedElement.currentTab !== Tab.NOTES) return;
        document
          .getElementById(`scroll_note_${selectedElement.id}`)
          .scrollIntoView({ behavior: "smooth" });
      } else {
        setSelectedElement((prev) => ({
          ...prev,
          open: true,
          editFromToolbar: true,
        }));
      }
    }
  };
  // F2: abre a edição do elemento selecionado com o campo do nome em foco;
  // sem nada selecionado, renomeia o diagrama.
  const rename = () => {
    if (layout.readOnly) return;
    if (openOverlays().some((el) => el.matches(".semi-modal-wrap"))) return;
    const target = renameTarget(selectedElement);
    if (target === "diagram") {
      setModal(MODAL.RENAME);
      focusDialogField();
    } else if (target === "element") {
      setSelectedElement((prev) => openForRename(prev, layout.sidebar));
      focusNameField(
        selectedElement.element,
        selectedElement.id,
        layout.sidebar,
      );
    }
  };
  const del = () => {
    if (layout.readOnly) {
      return;
    }
    switch (selectedElement.element) {
      case ObjectType.TABLE:
        deleteTable(selectedElement.id);
        break;
      case ObjectType.NOTE:
        deleteNote(selectedElement.id);
        break;
      case ObjectType.AREA:
        deleteArea(selectedElement.id);
        break;
      case ObjectType.VIEW:
        deleteView(selectedElement.id);
        break;
      default:
        break;
    }
  };
  const duplicate = () => {
    if (layout.readOnly) {
      return;
    }
    switch (selectedElement.element) {
      case ObjectType.TABLE: {
        const copiedTable = tables.find((t) => t.id === selectedElement.id);
        addTable({
          table: {
            ...copiedTable,
            x: copiedTable.x + 20,
            y: copiedTable.y + 20,
            id: nanoid(),
          },
        });
        break;
      }
      case ObjectType.NOTE:
        addNote({
          ...notes[selectedElement.id],
          x: notes[selectedElement.id].x + 20,
          y: notes[selectedElement.id].y + 20,
          id: notes.length,
        });
        break;
      case ObjectType.AREA:
        addArea({
          ...areas[selectedElement.id],
          x: areas[selectedElement.id].x + 20,
          y: areas[selectedElement.id].y + 20,
          id: areas.length,
        });
        break;
      case ObjectType.VIEW: {
        const copiedView = views.find((v) => v.id === selectedElement.id);
        addView({
          view: {
            ...copiedView,
            x: copiedView.x + 20,
            y: copiedView.y + 20,
            id: nanoid(),
            columns: copiedView.columns.map((c) => ({ ...c, id: nanoid() })),
            joins: copiedView.joins.map((j) => ({ ...j, id: nanoid() })),
            conditions: copiedView.conditions.map((c) => ({
              ...c,
              id: nanoid(),
            })),
          },
          index: views.length,
        });
        break;
      }
      default:
        break;
    }
  };
  const selectionAsText = () => {
    let element = null;
    switch (selectedElement.element) {
      case ObjectType.TABLE:
        element = tables.find((t) => t.id === selectedElement.id);
        break;
      case ObjectType.NOTE:
        element = notes[selectedElement.id] && { ...notes[selectedElement.id] };
        break;
      case ObjectType.AREA:
        element = areas[selectedElement.id] && { ...areas[selectedElement.id] };
        break;
      case ObjectType.VIEW:
        element = views.find((v) => v.id === selectedElement.id);
        break;
      default:
        break;
    }
    return element ? JSON.stringify(element) : null;
  };
  const copy = () => {
    const text = selectionAsText();
    if (!text) return;
    // A cópia reserva garante o colar mesmo se o navegador bloquear a área
    // de transferência do sistema.
    rememberCopied(text);
    navigator.clipboard?.writeText(text).catch(() => {});
  };
  // Devolve true se o texto era um elemento do diagrama e foi colado.
  const pasteText = (text) => {
    let obj = null;
    try {
      obj = JSON.parse(text);
    } catch (error) {
      return false;
    }
    if (!obj || typeof obj !== "object") return false;
    const v = new Validator();
    if (v.validate(obj, viewSchema).valid) {
      addView({
        view: {
          ...obj,
          x: obj.x + 20,
          y: obj.y + 20,
          id: nanoid(),
          columns: (obj.columns ?? []).map((c) => ({ ...c, id: nanoid() })),
          joins: (obj.joins ?? []).map((j) => ({ ...j, id: nanoid() })),
          conditions: (obj.conditions ?? []).map((c) => ({
            ...c,
            id: nanoid(),
          })),
        },
        index: views.length,
      });
    } else if (v.validate(obj, tableSchema).valid) {
      addTable({
        table: {
          ...obj,
          x: obj.x + 20,
          y: obj.y + 20,
          id: nanoid(),
        },
      });
    } else if (v.validate(obj, areaSchema).valid) {
      addArea({
        ...obj,
        x: obj.x + 20,
        y: obj.y + 20,
        id: areas.length,
      });
    } else if (v.validate(obj, noteSchema).valid) {
      addNote({
        ...obj,
        x: obj.x + 20,
        y: obj.y + 20,
        id: notes.length,
      });
    } else {
      return false;
    }
    return true;
  };
  // Menu Editar → Colar. Ctrl+V usa o evento nativo "paste" (ver efeito abaixo),
  // que não depende de permissão do navegador.
  const paste = async () => {
    if (layout.readOnly) {
      return;
    }
    let text = null;
    try {
      text = await navigator.clipboard.readText();
    } catch {
      text = lastCopied();
    }
    if (!pasteText(text)) Toast.info(t("nothing_to_paste"));
  };
  const cut = () => {
    if (layout.readOnly) {
      return;
    }
    copy();
    del();
  };

  // Ctrl+C / Ctrl+X / Ctrl+V pelos eventos nativos da área de transferência:
  // funcionam no Chrome, Edge, Opera e Firefox sem pedir permissão. As refs
  // evitam registrar os ouvintes de novo a cada renderização.
  const clipboardRef = useRef({});
  clipboardRef.current = {
    selectionAsText,
    pasteText,
    del,
    readOnly: layout.readOnly,
  };
  useEffect(() => {
    const onCopyOrCut = (e) => {
      if (isTypingTarget(e.target) || hasTextSelection()) return;
      const { selectionAsText, del, readOnly } = clipboardRef.current;
      const text = selectionAsText();
      if (!text) return;
      e.preventDefault();
      e.clipboardData?.setData("text/plain", text);
      rememberCopied(text);
      if (e.type === "cut" && !readOnly) del();
    };
    const onPaste = (e) => {
      if (isTypingTarget(e.target)) return;
      const { pasteText, readOnly } = clipboardRef.current;
      if (readOnly) return;
      e.preventDefault();
      const text = e.clipboardData?.getData("text/plain") || lastCopied();
      if (!pasteText(text)) Toast.info(t("nothing_to_paste"));
    };
    document.addEventListener("copy", onCopyOrCut);
    document.addEventListener("cut", onCopyOrCut);
    document.addEventListener("paste", onPaste);
    return () => {
      document.removeEventListener("copy", onCopyOrCut);
      document.removeEventListener("cut", onCopyOrCut);
      document.removeEventListener("paste", onPaste);
    };
  }, [t]);
  const toggleDBMLEditor = () => {
    setLayout((prev) => ({ ...prev, dbmlEditor: !prev.dbmlEditor }));
  };
  const save = async () => {
    if (typeof extensions.cloudSave === "function") {
      // TODO: dont have blank here have null
      const isNew = diagramId === "blank";
      const newId = isNew ? uuidv4() : diagramId;
      const diagramData = {
        diagramId: newId,
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
      };
      try {
        await extensions.cloudSave(diagramData, { isNew });
        if (isNew) {
          navigate(`/editor/diagrams/${newId}`, { replace: true });
        }
        setSaveState(State.SAVED);
        if (typeof setLastSaved === "function") {
          setLastSaved(new Date().toLocaleString());
        }
      } catch (err) {
        if (err?.response?.status === 402) {
          setSaveState(State.NONE);
          navigate("/checkout?tier=solo_pro");
          return;
        }
        setSaveState(State.ERROR);
      }
      return;
    }
    setSaveState(State.SAVING);
  };
  const { cloud, local } = useDiagramList();
  const recentlyOpenedDiagrams = useMemo(() => {
    const sorted = sortDiagrams(mergeDiagrams(cloud, local), {
      key: "lastModified",
      dir: "desc",
    });
    const seen = new Set();
    const recent = [];
    for (const entry of sorted) {
      if (entry.diagramId == null || seen.has(entry.diagramId)) continue;
      seen.add(entry.diagramId);
      recent.push(entry);
      if (recent.length === 10) break;
    }
    return recent;
  }, [cloud, local]);

  const open = () => setShowOpenDialog(true);
  const saveDiagramAs = () => setShowSaveAsDialog(true);
  const saveAsTemplate = async (templateTitle) => {
    await db.templates.add({
      title: templateTitle,
      tables: tables,
      database: database,
      relationships: relationships,
      notes: notes,
      subjectAreas: areas,
      views: views,
      custom: 1,
      templateId: uuidv4(),
      ...(databases[database].hasEnums && { enums: enums }),
      ...(databases[database].hasTypes && { types: types }),
    });
    Toast.success(t("template_saved"));
  };

  const saveAsCopy = async (newTitle) => {
    const newId = uuidv4();
    const diagramData = {
      diagramId: newId,
      database,
      name: newTitle,
      gistId: "",
      loadedFromGistId: "",
      createdAt: new Date(),
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
    };

    if (typeof extensions.cloudSave === "function") {
      try {
        await extensions.cloudSave(diagramData, { isNew: true });
      } catch (err) {
        if (err?.response?.status === 402) {
          setSaveState(State.NONE);
          navigate("/checkout?tier=solo_pro");
          return;
        }
        setSaveState(State.ERROR);
        Toast.error(t("oops_smth_went_wrong"));
        return;
      }
    } else {
      try {
        await db.diagrams.add(diagramData);
      } catch (err) {
        console.error(err);
        setSaveState(State.ERROR);
        Toast.error(t("oops_smth_went_wrong"));
        return;
      }
    }

    let toastId;
    toastId = Toast.success({
      duration: 8,
      content: (
        <span>
          {t("saved_as_copy")}{" "}
          <Typography.Text
            link={{
              href: appUrl(
                `/editor/diagrams/${newId}${window.location.search}`,
              ),
              target: "_blank",
              rel: "noopener noreferrer",
            }}
            underline
            onClick={() => Toast.close(toastId)}
          >
            {newTitle}
          </Typography.Text>
        </span>
      ),
    });
  };

  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [shortcutPrefs, setShortcutPrefs] = useState(readShortcutPrefs);
  const changeShortcutPrefs = (prefs) => {
    setShortcutPrefs(prefs);
    writeShortcutPrefs(prefs);
  };

  // Sair e Novo (nesta aba) só deixam o diagrama depois que o save termina.
  const [leaveTarget, setLeaveTarget] = useState(null);
  useEffect(() => {
    if (!leaveTarget) return;
    if (saveState === State.SAVED || saveState === State.NONE) {
      setLeaveTarget(null);
      navigate(leaveTarget);
    } else if (saveState === State.ERROR) {
      setLeaveTarget(null);
      Toast.error(t("failed_to_save"));
    }
  }, [leaveTarget, saveState, navigate, t]);

  const diagramIsEmpty = () =>
    tables.length === 0 &&
    areas.length === 0 &&
    notes.length === 0 &&
    views.length === 0 &&
    types.length === 0;

  // Novo (nesta janela ou em nova janela). Nesta, salva o diagrama atual
  // antes, com o nome escolhido se ele ainda tinha o nome padrão.
  const createNew = (templateId, newTitle) => {
    const path = `/editor/templates/${templateId}`;
    const mode = newMode;
    setNewMode(null);
    if (mode === "window") {
      window.open(appUrl(path + window.location.search), "_blank");
      return;
    }
    if (layout.readOnly || diagramIsEmpty()) {
      navigate(path);
      return;
    }
    if (newTitle) setTitle(newTitle);
    setLeaveTarget(path);
    save();
  };

  // Código mostrado na janela de código do upstream (Exportar > Ver código).
  const showExportCode = ({ data, extension, filename }) => {
    setExportData({ data, extension, filename });
    setModal(MODAL.CODE);
  };

  const fullscreen = useFullscreen();

  useEffect(() => {
    if (!fullscreen)
      setLayout((p) => ({ ...p, header: true, sidebar: true, toolbar: true }));
  }, [fullscreen, setLayout]);

  const menu = {
    file: {
      new: {
        function: () => setModal(MODAL.NEW),
      },
      new_window: {
        function: () => window.open(appUrl("/editor"), "_blank"),
      },
      open: {
        function: open,
        shortcut: "Ctrl+O",
      },
      open_recent: {
        children: [
          ...(recentlyOpenedDiagrams && recentlyOpenedDiagrams.length > 0
            ? [
                ...recentlyOpenedDiagrams.map((diagram) => ({
                  name: diagram.name,
                  label: DateTime.fromJSDate(new Date(diagram.lastModified))
                    .setLocale(i18n.language)
                    .toRelative(),
                  function: () => {
                    navigate(`/editor/diagrams/${diagram.diagramId}`);
                  },
                })),
                { divider: true },
                {
                  name: t("see_all"),
                  function: () => open(),
                },
              ]
            : [
                {
                  name: t("no_saved_diagrams"),
                  disabled: true,
                },
              ]),
        ],

        function: () => {},
      },
      save: {
        function: save,
        shortcut: "Ctrl+S",
        disabled: layout.readOnly,
      },
      save_as: {
        function: saveDiagramAs,
        shortcut: "Ctrl+Shift+S",
        disabled: layout.readOnly,
      },
      save_as_template: {
        function: () => saveAsTemplate(title),
      },
      rename: {
        function: () => {
          setModal(MODAL.RENAME);
        },
        disabled: layout.readOnly,
      },
      delete_diagram: {
        warning: {
          title: t("delete_diagram"),
          message: t("are_you_sure_delete_diagram"),
        },
        function: async () => {
          try {
            if (typeof extensions.cloudDelete === "function") {
              await extensions.cloudDelete(diagramId);
            } else {
              await db.diagrams.where("diagramId").equals(diagramId).delete();
            }
            setTitle(untitledTitle());
            setTables([]);
            setRelationships([]);
            setAreas([]);
            setNotes([]);
            setTypes([]);
            setEnums([]);
            setViews([]);
            setUndoStack([]);
            setRedoStack([]);
            setGistId("");
            navigate("/editor/templates/blank", { replace: true });
          } catch {
            Toast.error(t("oops_smth_went_wrong"));
          }
        },
      },
      import_from: {
        children: [
          {
            function: () => {
              setModal(MODAL.IMPORT);
              setImportFrom(IMPORT_FROM.JSON);
            },
            name: "JSON",
            disabled: layout.readOnly,
          },
          {
            function: () => {
              setModal(MODAL.IMPORT);
              setImportFrom(IMPORT_FROM.DBML);
            },
            name: "DBML",
            disabled: layout.readOnly,
          },
        ],
      },
      import_from_source: {
        ...(database === DB.GENERIC && {
          children: [
            {
              function: () => {
                setModal(MODAL.IMPORT_SRC);
                setImportDb(DB.MYSQL);
              },
              name: "MySQL",
              disabled: layout.readOnly,
            },
            {
              function: () => {
                setModal(MODAL.IMPORT_SRC);
                setImportDb(DB.POSTGRES);
              },
              name: "PostgreSQL",
              disabled: layout.readOnly,
            },
            {
              function: () => {
                setModal(MODAL.IMPORT_SRC);
                setImportDb(DB.SQLITE);
              },
              name: "SQLite",
              disabled: layout.readOnly,
            },
            {
              function: () => {
                setModal(MODAL.IMPORT_SRC);
                setImportDb(DB.MARIADB);
              },
              name: "MariaDB",
              disabled: layout.readOnly,
            },
            {
              function: () => {
                setModal(MODAL.IMPORT_SRC);
                setImportDb(DB.MSSQL);
              },
              name: "MSSQL",
              disabled: layout.readOnly,
            },
            {
              function: () => {
                setModal(MODAL.IMPORT_SRC);
                setImportDb(DB.ORACLESQL);
              },
              name: "Oracle",
              label: "Beta",
              disabled: layout.readOnly,
            },
          ],
        }),
        function: () => {
          if (database === DB.GENERIC) return;

          setModal(MODAL.IMPORT_SRC);
        },
        disabled: layout.readOnly,
      },
      export_source: {
        ...(database === DB.GENERIC && {
          children: [
            {
              name: "MySQL",
              function: () => {
                openExportModal(MODAL.CODE);
                const src = jsonToMySQL({
                  tables: tables,
                  references: relationships,
                  types: types,
                  database: database,
                  views: views,
                });
                setExportData((prev) => ({
                  ...prev,
                  data: src,
                  extension: "sql",
                }));
              },
            },
            {
              name: "PostgreSQL",
              function: () => {
                openExportModal(MODAL.CODE);
                const src = jsonToPostgreSQL({
                  tables: tables,
                  references: relationships,
                  types: types,
                  database: database,
                  views: views,
                });
                setExportData((prev) => ({
                  ...prev,
                  data: src,
                  extension: "sql",
                }));
              },
            },
            {
              name: "SQLite",
              function: () => {
                openExportModal(MODAL.CODE);
                const src = jsonToSQLite({
                  tables: tables,
                  references: relationships,
                  types: types,
                  database: database,
                  views: views,
                });
                setExportData((prev) => ({
                  ...prev,
                  data: src,
                  extension: "sql",
                }));
              },
            },
            {
              name: "MariaDB",
              function: () => {
                openExportModal(MODAL.CODE);
                const src = jsonToMariaDB({
                  tables: tables,
                  references: relationships,
                  types: types,
                  database: database,
                  views: views,
                });
                setExportData((prev) => ({
                  ...prev,
                  data: src,
                  extension: "sql",
                }));
              },
            },
            {
              name: "MSSQL",
              function: () => {
                openExportModal(MODAL.CODE);
                const src = jsonToSQLServer({
                  tables: tables,
                  references: relationships,
                  types: types,
                  database: database,
                  views: views,
                });
                setExportData((prev) => ({
                  ...prev,
                  data: src,
                  extension: "sql",
                }));
              },
            },
            {
              label: "Beta",
              name: "Oracle",
              function: () => {
                openExportModal(MODAL.CODE);
                const src = jsonToOracleSQL({
                  tables: tables,
                  references: relationships,
                  types: types,
                  database: database,
                  views: views,
                });
                setExportData((prev) => ({
                  ...prev,
                  data: src,
                  extension: "sql",
                }));
              },
            },
          ],
        }),
        function: () => {
          if (database === DB.GENERIC) return;
          openExportModal(MODAL.CODE);
          const src = exportSQL({
            tables: tables,
            references: relationships,
            types: types,
            database: database,
            enums: enums,
            views: views,
          });
          setExportData((prev) => ({
            ...prev,
            data: src,
            extension: "sql",
          }));
        },
      },
      export_as: {
        children: [
          {
            name: "PNG",
            function: () => exportDiagramImage("png", { scale: 2 }),
          },
          {
            name: "JPEG",
            function: () =>
              exportDiagramImage("jpeg", {
                type: "image/jpeg",
                quality: 0.95,
                scale: 2,
              }),
          },
          {
            name: "SVG",
            function: () => exportDiagramImage("svg"),
          },
          {
            name: "JSON",
            function: () => {
              openExportModal(MODAL.CODE);
              const result = JSON.stringify(
                {
                  tables: tables,
                  relationships: relationships,
                  notes: notes,
                  subjectAreas: areas,
                  views: views,
                  database: database,
                  ...(databases[database].hasTypes && { types: types }),
                  ...(databases[database].hasEnums && { enums: enums }),
                  title: title,
                },
                null,
                2,
              );
              setExportData((prev) => ({
                ...prev,
                data: result,
                extension: "json",
              }));
            },
          },
          {
            name: "DBML",
            function: () => {
              openExportModal(MODAL.CODE);
              const result = toDBML({
                tables,
                relationships,
                enums,
                database,
              });
              setExportData((prev) => ({
                ...prev,
                data: result,
                extension: "dbml",
              }));
            },
          },
          {
            name: "PDF",
            function: () => {
              const filename = `${title}_${new Date().toISOString()}`;
              diagramDataUrl({ type: "image/jpeg", quality: 0.95, scale: 2 })
                .then(({ dataUrl, svgWidth, svgHeight }) => {
                  // Página do tamanho do conteúdo do diagrama.
                  const doc = new jsPDF(
                    svgWidth >= svgHeight ? "l" : "p",
                    "px",
                    [svgWidth, svgHeight],
                  );
                  doc.addImage(dataUrl, "jpeg", 0, 0, svgWidth, svgHeight);
                  doc.save(`${filename}.pdf`);
                })
                .catch(imageError);
            },
          },
          {
            name: "Mermaid",
            function: () => {
              openExportModal(MODAL.CODE);
              const result = jsonToMermaid({
                tables: tables,
                relationships: relationships,
                notes: notes,
                subjectAreas: areas,
                database: database,
                title: title,
              });
              setExportData((prev) => ({
                ...prev,
                data: result,
                extension: "md",
              }));
            },
          },
          {
            name: "Markdown",
            function: () => {
              openExportModal(MODAL.CODE);
              const result = jsonToDocumentation({
                tables: tables,
                relationships: relationships,
                notes: notes,
                subjectAreas: areas,
                views: views,
                database: database,
                title: title,
                ...(databases[database].hasTypes && { types: types }),
                ...(databases[database].hasEnums && { enums: enums }),
              });
              setExportData((prev) => ({
                ...prev,
                data: result,
                extension: "md",
              }));
            },
          },
        ],
        function: () => {},
      },
      exit: {
        function: () => {
          if (layout.readOnly) {
            navigate("/");
            return;
          }
          // Sai só depois que o save terminar (ver efeito de leaveTarget).
          setLeaveTarget("/");
          save();
        },
      },
    },
    edit: {
      undo: {
        function: undo,
        shortcut: "Ctrl+Z",
        disabled: layout.readOnly || undoStack.length === 0,
      },
      redo: {
        function: redo,
        shortcut: "Ctrl+Y",
        disabled: layout.readOnly || redoStack.length === 0,
      },
      clear: {
        warning: {
          title: t("clear"),
          message: t("are_you_sure_clear"),
        },
        function: async () => {
          setTables([]);
          setRelationships([]);
          setAreas([]);
          setNotes([]);
          setEnums([]);
          setTypes([]);
          setViews([]);
          setUndoStack([]);
          setRedoStack([]);
        },
        disabled: layout.readOnly,
      },
      edit: {
        function: edit,
        shortcut: "Ctrl+E",
        disabled: layout.readOnly,
      },
      rename_selected: {
        function: rename,
        shortcut: "F2",
        disabled: layout.readOnly || !renameTarget(selectedElement),
      },
      cut: {
        function: cut,
        shortcut: "Ctrl+X",
        disabled: layout.readOnly,
      },
      copy: {
        function: copy,
        shortcut: "Ctrl+C",
      },
      paste: {
        function: paste,
        shortcut: "Ctrl+V",
        disabled: layout.readOnly,
      },
      duplicate: {
        function: duplicate,
        shortcut: "Ctrl+D",
        disabled: layout.readOnly,
      },
      delete: {
        function: del,
        shortcut: "Del",
        disabled: layout.readOnly,
      },
      auto_arrange: {
        function: autoArrangeTables,
        disabled: layout.readOnly,
      },
      auto_connect_fk: {
        function: autoConnectFKs,
        disabled: layout.readOnly,
      },
      copy_as_image: {
        function: copyAsImage,
        shortcut: "Ctrl+Alt+C",
      },
    },
    view: {
      header: {
        state: layout.header ? (
          <i className="bi bi-toggle-on" />
        ) : (
          <i className="bi bi-toggle-off" />
        ),
        function: () =>
          setLayout((prev) => ({ ...prev, header: !prev.header })),
      },
      sidebar: {
        state: layout.sidebar ? (
          <i className="bi bi-toggle-on" />
        ) : (
          <i className="bi bi-toggle-off" />
        ),
        function: () =>
          setLayout((prev) => ({ ...prev, sidebar: !prev.sidebar })),
      },
      issues: {
        state: layout.issues ? (
          <i className="bi bi-toggle-on" />
        ) : (
          <i className="bi bi-toggle-off" />
        ),
        function: () =>
          setLayout((prev) => ({ ...prev, issues: !prev.issues })),
      },
      dbml_view: {
        state: layout.dbmlEditor ? (
          <i className="bi bi-toggle-on" />
        ) : (
          <i className="bi bi-toggle-off" />
        ),
        function: toggleDBMLEditor,
        shortcut: "Alt+E",
      },
      strict_mode: {
        state: settings.strictMode ? (
          <i className="bi bi-toggle-off" />
        ) : (
          <i className="bi bi-toggle-on" />
        ),
        function: viewStrictMode,
        shortcut: "Ctrl+Shift+M",
      },
      presentation_mode: {
        function: () => {
          setLayout((prev) => ({
            ...prev,
            header: false,
            sidebar: false,
            toolbar: false,
          }));
          enterFullscreen();
        },
      },
      field_details: {
        state: settings.showFieldSummary ? (
          <i className="bi bi-toggle-on" />
        ) : (
          <i className="bi bi-toggle-off" />
        ),
        function: viewFieldSummary,
        shortcut: "Ctrl+Shift+F",
      },
      reset_view: {
        function: resetView,
        shortcut: "Enter/Return",
      },
      show_comments: {
        state: settings.showComments ? (
          <i className="bi bi-toggle-on" />
        ) : (
          <i className="bi bi-toggle-off" />
        ),
        function: () =>
          setSettings((prev) => ({
            ...prev,
            showComments: !prev.showComments,
          })),
      },
      show_datatype: {
        state: settings.showDataTypes ? (
          <i className="bi bi-toggle-on" />
        ) : (
          <i className="bi bi-toggle-off" />
        ),
        function: () =>
          setSettings((prev) => ({
            ...prev,
            showDataTypes: !prev.showDataTypes,
          })),
      },
      show_grid: {
        state: settings.showGrid ? (
          <i className="bi bi-toggle-on" />
        ) : (
          <i className="bi bi-toggle-off" />
        ),
        function: viewGrid,
        shortcut: "Ctrl+Shift+G",
      },
      snap_to_grid: {
        state: settings.snapToGrid ? (
          <i className="bi bi-toggle-on" />
        ) : (
          <i className="bi bi-toggle-off" />
        ),
        function: snapToGrid,
      },
      show_cardinality: {
        state: settings.showCardinality ? (
          <i className="bi bi-toggle-on" />
        ) : (
          <i className="bi bi-toggle-off" />
        ),
        function: () =>
          setSettings((prev) => ({
            ...prev,
            showCardinality: !prev.showCardinality,
          })),
      },
      show_relationship_labels: {
        state: settings.showRelationshipLabels ? (
          <i className="bi bi-toggle-on" />
        ) : (
          <i className="bi bi-toggle-off" />
        ),
        function: () =>
          setSettings((prev) => ({
            ...prev,
            showRelationshipLabels: !prev.showRelationshipLabels,
          })),
      },
      show_debug_coordinates: {
        state: settings.showDebugCoordinates ? (
          <i className="bi bi-toggle-on" />
        ) : (
          <i className="bi bi-toggle-off" />
        ),
        function: () =>
          setSettings((prev) => ({
            ...prev,
            showDebugCoordinates: !prev.showDebugCoordinates,
          })),
      },
      theme: {
        children: [
          {
            name: t("light"),
            function: () => setSettings((prev) => ({ ...prev, mode: "light" })),
          },
          {
            name: t("dark"),
            function: () => setSettings((prev) => ({ ...prev, mode: "dark" })),
          },
        ],
        function: () => {},
      },
      zoom_in: {
        function: zoomIn,
        shortcut: "Ctrl+(Up/Wheel)",
      },
      zoom_out: {
        function: zoomOut,
        shortcut: "Ctrl+(Down/Wheel)",
      },
      fullscreen: {
        state: fullscreen ? (
          <i className="bi bi-toggle-on" />
        ) : (
          <i className="bi bi-toggle-off" />
        ),
        function: fullscreen ? exitFullscreen : enterFullscreen,
      },
    },
    settings: {
      show_timeline: {
        function: () => setSidesheet(SIDESHEET.TIMELINE),
      },
      autosave: {
        state: settings.autosave ? (
          <i className="bi bi-toggle-on" />
        ) : (
          <i className="bi bi-toggle-off" />
        ),
        function: () =>
          setSettings((prev) => ({ ...prev, autosave: !prev.autosave })),
      },
      configure_custom_types: {
        function: () => setModal(MODAL.CONFIG_CUSTOM_TYPES),
        disabled: layout.readOnly,
      },
      default_database: {
        children: Object.entries(databases).map(([key, info]) => ({
          name: info.name,
          label:
            key === preferredDatabase(settings)
              ? t("default_database_current")
              : undefined,
          function: () =>
            setSettings((prev) => ({ ...prev, defaultDatabase: key })),
        })),
        function: () => {},
      },
      language: {
        function: () => setModal(MODAL.LANGUAGE),
      },
      export_saved_data: {
        function: exportSavedData,
      },
      clear_cache: {
        function: () => {
          deleteFromCache(gistId);
          Toast.success(t("cache_cleared"));
        },
      },
      flush_storage: {
        warning: {
          title: t("flush_storage"),
          message: t("are_you_sure_flush_storage"),
        },
        function: async () => {
          localStorage.removeItem(STORAGE_KEY);
          db.delete()
            .then(() => {
              Toast.success(t("storage_flushed"));
              navigate("/editor", { replace: true });
              window.location.reload();
            })
            .catch(() => {
              Toast.error(t("oops_smth_went_wrong"));
            });
        },
      },
    },
    help: {
      docs: {
        function: () => window.open(`${socials.docs}`, "_blank"),
        shortcut: "Ctrl+H",
      },
      shortcuts: {
        function: () => setShowShortcuts(true),
      },
      ask_on_discord: {
        function: () => window.open(socials.discord, "_blank"),
      },
      report_bug: {
        function: () => window.open(appUrl("/bug-report"), "_blank"),
      },
    },
  };

  // Menus do fork (ver src/catolica/menus.jsx), montados a partir dos itens
  // do upstream acima.
  const upstreamMenu = { ...menu };
  const confirmErase = (erase) =>
    SemiModal.confirm({
      title: t("browser_data_erase_title"),
      content: t("browser_data_erase_body"),
      okText: t("browser_data_erase_confirm"),
      cancelText: t("cancel"),
      okButtonProps: { type: "danger", theme: "solid" },
      onOk: erase,
    });
  const reportProblem = () => {
    const body = t("report_issue_body", {
      version: EDITOR_VERSION ?? t("about_version_dev"),
      environment:
        import.meta.env.VITE_APP_ENV === "homolog"
          ? `(${t("about_test_environment")})`
          : "",
      browser: navigator.userAgent,
    });
    window.open(newIssueUrl(body), "_blank");
  };
  menu.file = catolicaFileMenu(upstreamMenu.file, {
    newHere: () => setNewMode("here"),
    newWindow: () => setNewMode("window"),
    importFile: fileImport,
    exportFile: () => setShowExportDialog(true),
    recent: recentlyOpenedDiagrams,
    currentId: diagramId,
    openDiagram: (id) => navigate(`/editor/diagrams/${id}`),
    openAll: open,
    t,
    language: i18n.language,
  });
  menu.edit = catolicaEditMenu(upstreamMenu.edit, {
    singleKeyShortcuts: shortcutPrefs.singleKey,
    history: upstreamMenu.settings.show_timeline,
  });
  menu.view = catolicaViewMenu(upstreamMenu.view, { t });
  menu.settings = catolicaSettingsMenu(upstreamMenu.settings, {
    strictMode: upstreamMenu.view.strict_mode,
    t,
    confirmErase,
  });
  menu.help = catolicaHelpMenu(upstreamMenu.help, {
    showShortcuts: () => setShowShortcuts(true),
    singleKeyShortcuts: shortcutPrefs.singleKey,
    openDocs: () => window.open(UPSTREAM_DOCS_URL, "_blank"),
    showChangelog: () => setShowChangelog(true),
    reportProblem,
    showAbout: () => setShowAbout(true),
  });

  useHotkeys("mod+i", fileImport, EDITOR_HOTKEY);
  useHotkeys("mod+z", undo, EDITOR_HOTKEY);
  useHotkeys("mod+y", redo, EDITOR_HOTKEY);
  useHotkeys("mod+shift+z", redo, EDITOR_HOTKEY);
  useHotkeys("mod+s", save, EDITOR_HOTKEY);
  useHotkeys("mod+o", open, EDITOR_HOTKEY);
  // Ctrl+E exporta (par com o Ctrl+I de importar); editar o elemento
  // selecionado ficou na tecla E (atalhos rápidos, abaixo).
  useHotkeys("mod+e", () => setShowExportDialog(true), EDITOR_HOTKEY);
  // F2 não digita texto: funciona também com o cursor num campo (por exemplo,
  // no texto de uma nota recém-clicada).
  useHotkeys("f2", rename, { ...EDITOR_HOTKEY, enableOnFormTags: true });
  useHotkeys("mod+d", duplicate, EDITOR_HOTKEY);
  useHotkeys(
    "delete",
    () => {
      // Delete logo após digitar num campo costuma ser engano: avisa antes.
      if (allowDelete()) del();
      else Toast.info(t("shortcut_delete_blocked"));
    },
    EDITOR_HOTKEY,
  );
  useHotkeys("mod+shift+g", viewGrid, EDITOR_HOTKEY);
  useHotkeys("mod+alt+g", snapToGrid, EDITOR_HOTKEY);
  useHotkeys(
    "mod+alt+d",
    () =>
      setSettings((prev) => ({
        ...prev,
        mode: prev.mode === "dark" ? "light" : "dark",
      })),
    EDITOR_HOTKEY,
  );
  useHotkeys("mod+up", zoomIn, EDITOR_HOTKEY);
  useHotkeys("mod+down", zoomOut, EDITOR_HOTKEY);
  useHotkeys("mod+shift+m", viewStrictMode, EDITOR_HOTKEY);
  useHotkeys("mod+shift+f", viewFieldSummary, EDITOR_HOTKEY);
  useHotkeys("mod+shift+s", saveDiagramAs, EDITOR_HOTKEY);
  useHotkeys("mod+alt+c", copyAsImage, EDITOR_HOTKEY);
  useHotkeys("enter", resetView, EDITOR_HOTKEY);
  useHotkeys("alt+e", toggleDBMLEditor, EDITOR_HOTKEY);
  useHotkeys("left", panLeft, EDITOR_HOTKEY);
  useHotkeys("right", panRight, EDITOR_HOTKEY);
  useHotkeys("up", panUp, EDITOR_HOTKEY);
  useHotkeys("down", panDown, EDITOR_HOTKEY);
  // Atalhos de uma tecla, Esc e Ctrl+F, com proteção contra acionamento
  // acidental (ver src/catolica/useSafeKeyShortcuts.js).
  // Desfaz a última ação se ela for a que o atalho acabou de fazer (usado
  // quando o atalho era, na verdade, o começo de uma palavra digitada).
  const undoIfLast = (matches) => {
    const last = undoStack[undoStack.length - 1];
    if (!last || !matches(last)) return;
    undo();
    setRedoStack((prev) => prev.slice(0, -1));
  };
  const isAdd = (element) => (entry) =>
    entry.action === Action.ADD && entry.element === element;
  const transformBeforeShortcut = useRef(null);
  const selectionBeforeShortcut = useRef(null);
  // Dica dos botões com a tecla do atalho rápido, só quando eles estão ligados.
  const withQuickKey = (label, key) =>
    shortcutPrefs.singleKey ? `${label} (${key})` : label;
  const rememberTransform = () => {
    transformBeforeShortcut.current = transform;
  };
  const restoreTransform = () => {
    if (transformBeforeShortcut.current) {
      setTransform(transformBeforeShortcut.current);
    }
  };
  // Posição do mouse no diagrama (ou null, e o elemento nasce no centro).
  const tableAtPointer = () => {
    const pointer = pointerInDiagram();
    if (!pointer) return null;
    const step = settings.gridSize ?? gridSize;
    const snap = (v) => (settings.snapToGrid ? Math.round(v / step) * step : v);
    return { x: snap(pointer.x - tableWidth / 2), y: snap(pointer.y - 20) };
  };

  useSafeKeyShortcuts({
    t,
    enabled: shortcutPrefs.singleKey,
    readOnly: layout.readOnly,
    singleKeys: {
      t: {
        run: () => addTable(undefined, true, tableAtPointer()),
        rollback: () => undoIfLast(isAdd(ObjectType.TABLE)),
        hintText: t("shortcut_hint_table"),
        changes: true,
        hint: "first",
      },
      a: {
        run: () => addArea(undefined, true, pointerInDiagram()),
        rollback: () => undoIfLast(isAdd(ObjectType.AREA)),
        hintText: t("shortcut_hint_area"),
        changes: true,
        hint: "first",
      },
      n: {
        run: () => addNote(undefined, true, pointerInDiagram()),
        rollback: () => undoIfLast(isAdd(ObjectType.NOTE)),
        hintText: t("shortcut_hint_note"),
        changes: true,
        hint: "first",
      },
      e: {
        run: () => {
          selectionBeforeShortcut.current = selectedElement;
          edit();
        },
        rollback: () => {
          if (selectionBeforeShortcut.current) {
            setSelectedElement(selectionBeforeShortcut.current);
          }
        },
        changes: true,
      },
      o: {
        run: () => {
          rememberTransform();
          autoArrangeTables();
        },
        rollback: () => {
          undoIfLast(
            (entry) => entry.bulk && entry.message === t("auto_arrange"),
          );
          restoreTransform();
        },
        hintText: t("shortcut_hint_arrange"),
        changes: true,
        hint: "always",
      },
      f: {
        run: () => {
          rememberTransform();
          fitWindow();
        },
        rollback: restoreTransform,
      },
      "?": {
        run: () => setShowShortcuts(true),
        rollback: () => setShowShortcuts(false),
      },
    },
    onEscape: () =>
      setSelectedElement((prev) => ({
        ...prev,
        element: ObjectType.NONE,
        id: -1,
        open: false,
      })),
    onFind: focusTableSearch,
  });

  return (
    <>
      <div>
        {layout.header && (
          <div
            className="flex justify-between items-center border-b border-color pb-2"
            style={isRtl(i18n.language) ? { direction: "rtl" } : {}}
          >
            {header()}
            <div className="flex items-center gap-2 me-7">
              <Slot name="header-actions-start" />
              {!isTemplate && (
                <Button
                  type="primary"
                  className="!text-base !pe-6 !ps-5 !py-[18px] !rounded-md"
                  size="default"
                  icon={<IconShareStroked />}
                  onClick={() => setModal(MODAL.SHARE)}
                >
                  {t("share")}
                </Button>
              )}
              <Slot name="header-actions-end" />
            </div>
          </div>
        )}
        {layout.toolbar &&
          toolbarContainer &&
          createPortal(toolbar(), toolbarContainer)}
      </div>
      <ShortcutsModal
        visible={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        prefs={shortcutPrefs}
        onChangePrefs={changeShortcutPrefs}
      />
      <ExportDialog
        visible={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        title={title}
        setTitle={setTitle}
        diagramId={diagramId}
        onShowCode={showExportCode}
      />
      <ImportDialog
        visible={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        currentDiagramId={diagramId}
      />
      <ChangelogDialog
        visible={showChangelog}
        onClose={() => setShowChangelog(false)}
      />
      <AboutDialog visible={showAbout} onClose={() => setShowAbout(false)} />
      <NewDialog
        mode={newMode}
        onClose={() => setNewMode(null)}
        onCreate={createNew}
        askName={
          newMode === "here" &&
          !layout.readOnly &&
          !diagramIsEmpty() &&
          isDefaultTitle(title)
        }
        currentTitle={title}
      />
      <OpenDialog
        visible={showOpenDialog}
        onClose={() => setShowOpenDialog(false)}
        onOpen={(id) => {
          setShowOpenDialog(false);
          navigate(`/editor/diagrams/${id}`);
        }}
        onOpenFile={() => {
          setShowOpenDialog(false);
          setShowImportDialog(true);
        }}
      />
      <SaveAsDialog
        visible={showSaveAsDialog}
        onClose={() => setShowSaveAsDialog(false)}
        title={title}
        onSaveCopy={saveAsCopy}
        onSaveTemplate={saveAsTemplate}
      />
      <Modal
        modal={modal}
        exportData={exportData}
        setExportData={setExportData}
        title={title}
        setTitle={setTitle}
        setModal={setModal}
        importFrom={importFrom}
        importDb={importDb}
        saveAsCopy={saveAsCopy}
      />
      <Sidesheet
        type={sidesheet}
        title={title}
        setTitle={setTitle}
        onClose={() => setSidesheet(SIDESHEET.NONE)}
      />
      <ConfigureCustomTypes
        open={modal === MODAL.CONFIG_CUSTOM_TYPES}
        onClose={() => setModal(MODAL.NONE)}
      />
      <SemiModal
        title={t("auto_connect_fk_modal_title")}
        centered
        visible={showAutoConnectModal}
        onOk={confirmAutoConnectFKs}
        onCancel={() => setShowAutoConnectModal(false)}
        okText={t("auto_connect_fk")}
        cancelText={t("cancel")}
      >
        <div className="space-y-3">
          <p className="text-sm">
            {t("auto_connect_fk_modal_description")}
          </p>
          <ol className="list-decimal ps-5 space-y-1 text-sm">
            <li>{t("auto_connect_fk_rule_1")}</li>
            <li>{t("auto_connect_fk_rule_2")}</li>
          </ol>
          <p className="text-sm font-medium mt-2">
            {t("auto_connect_fk_modal_question")}
          </p>
        </div>
      </SemiModal>
    </>
  );

  function toolbar() {
    return (
      <div
        className="py-1.5 px-3 flex items-center gap-1 rounded-xl select-none overflow-hidden toolbar-theme shadow-lg"
        style={isRtl(i18n.language) ? { direction: "rtl" } : {}}
      >
        <div className="flex justify-start items-center">
          <LayoutDropdown />
          <Divider layout="vertical" margin="8px" />
          <Tooltip content={`${t("zoom_out")} (Ctrl+↓)`} position="bottom">
            <button
              className="py-1 px-2 hover-2 rounded-sm text-lg"
              onClick={() =>
                setTransform((prev) => ({ ...prev, zoom: prev.zoom / 1.2 }))
              }
            >
              <i className="fa-solid fa-magnifying-glass-minus" />
            </button>
          </Tooltip>
          <Dropdown
            style={{ width: "240px" }}
            position={isRtl(i18n.language) ? "bottomRight" : "bottomLeft"}
            render={
              <Dropdown.Menu
                style={isRtl(i18n.language) ? { direction: "rtl" } : {}}
              >
                <Dropdown.Item
                  onClick={fitWindow}
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <div>{t("fit_window_reset")}</div>
                  <div className="text-gray-400">Ctrl+Alt+W</div>
                </Dropdown.Item>
                <Dropdown.Divider />
                {[0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0].map((e, i) => (
                  <Dropdown.Item
                    key={i}
                    onClick={() => {
                      setTransform((prev) => ({ ...prev, zoom: e }));
                    }}
                  >
                    {Math.floor(e * 100)}%
                  </Dropdown.Item>
                ))}
                <Dropdown.Divider />
                <Dropdown.Item>
                  <InputNumber
                    field="zoom"
                    label={t("zoom")}
                    placeholder={t("zoom")}
                    suffix={<div className="p-1">%</div>}
                    onChange={(v) =>
                      setTransform((prev) => ({
                        ...prev,
                        zoom: parseFloat(v) * 0.01,
                      }))
                    }
                  />
                </Dropdown.Item>
              </Dropdown.Menu>
            }
            trigger="click"
          >
            <div className="py-1 px-2 hover-2 rounded-sm flex items-center justify-center">
              <div className="w-[40px]">
                {Math.floor(transform.zoom * 100)}%
              </div>
              <div>
                <IconCaretdown />
              </div>
            </div>
          </Dropdown>
          <Tooltip content={`${t("zoom_in")} (Ctrl+↑)`} position="bottom">
            <button
              className="py-1 px-2 hover-2 rounded-sm text-lg"
              onClick={() =>
                setTransform((prev) => ({ ...prev, zoom: prev.zoom * 1.2 }))
              }
            >
              <i className="fa-solid fa-magnifying-glass-plus" />
            </button>
          </Tooltip>
          <Divider layout="vertical" margin="8px" />
          <GridDropdown />
          <SnapToGridButton />
          <Divider layout="vertical" margin="8px" />
          <Tooltip content={`${t("undo")} (Ctrl+Z)`} position="bottom">
            <button
              className="py-1 px-2 hover-2 rounded-sm flex items-center disabled:opacity-50"
              disabled={undoStack.length === 0 || layout.readOnly}
              onClick={undo}
            >
              <IconUndo size="large" />
            </button>
          </Tooltip>
          <Tooltip content={`${t("redo")} (Ctrl+Y)`} position="bottom">
            <button
              className="py-1 px-2 hover-2 rounded-sm flex items-center disabled:opacity-50"
              disabled={redoStack.length === 0 || layout.readOnly}
              onClick={redo}
            >
              <IconRedo size="large" />
            </button>
          </Tooltip>
          <Divider layout="vertical" margin="8px" />
          <Tooltip content={withQuickKey(t("add_table"), "T")} position="bottom">
            <button
              className="flex items-center py-1 px-2 hover-2 rounded-sm disabled:opacity-50"
              onClick={() => addTable()}
              disabled={layout.readOnly}
            >
              <IconAddTable />
            </button>
          </Tooltip>
          <Tooltip content={t("add_view")} position="bottom">
            <button
              className="flex items-center py-1 px-2 hover-2 rounded-sm disabled:opacity-50"
              onClick={() => addView()}
              disabled={layout.readOnly}
            >
              <IconAddView />
            </button>
          </Tooltip>
          <Tooltip content={withQuickKey(t("add_area"), "A")} position="bottom">
            <button
              className="py-1 px-2 hover-2 rounded-sm flex items-center disabled:opacity-50"
              onClick={() => addArea()}
              disabled={layout.readOnly}
            >
              <IconAddArea />
            </button>
          </Tooltip>
          <Tooltip content={withQuickKey(t("add_note"), "N")} position="bottom">
            <button
              className="py-1 px-2 hover-2 rounded-sm flex items-center disabled:opacity-50"
              onClick={() => addNote()}
              disabled={layout.readOnly}
            >
              <IconAddNote />
            </button>
          </Tooltip>
          <Divider layout="vertical" margin="8px" />
          <Tooltip content={withQuickKey(t("auto_arrange"), "O")} position="bottom">
            <button
              className="py-1 px-2 hover-2 rounded-sm text-xl -mt-0.5 disabled:opacity-50"
              onClick={autoArrangeTables}
              disabled={layout.readOnly}
            >
              <i className="fa-solid fa-wand-magic-sparkles" />
            </button>
          </Tooltip>
          <Divider layout="vertical" margin="8px" />
          <Tooltip content={`${t("save")} (Ctrl+S)`} position="bottom">
            <button
              className="py-1 px-2 hover-2 rounded-sm flex items-center disabled:opacity-50"
              onClick={save}
              disabled={layout.readOnly}
            >
              <IconSaveStroked size="extra-large" />
            </button>
          </Tooltip>
          <Divider layout="vertical" margin="8px" />
          <Tooltip content={withQuickKey(t("help_shortcuts"), "?")} position="bottom">
            <button
              className="py-1 px-2 hover-2 rounded-sm text-xl -mt-0.5"
              onClick={() => setShowShortcuts(true)}
              aria-label={t("shortcuts_title")}
            >
              <i className="fa-regular fa-keyboard" />
            </button>
          </Tooltip>
          {/* Versões grava em gists no drawdb-server; sem servidor, só falharia. */}
          {hasGistBackend && (
            <>
              <Divider layout="vertical" margin="8px" />
              <Tooltip content={t("versions")} position="bottom">
                <button
                  className="py-1 px-2 hover-2 rounded-sm text-xl -mt-0.5"
                  onClick={() => setSidesheet(SIDESHEET.VERSIONS)}
                >
                  <i className="fa-solid fa-code-branch" />
                </button>
              </Tooltip>
            </>
          )}
          <Divider layout="vertical" margin="8px" />
          <Tooltip content={`${t("theme")} (Ctrl+Alt+D)`} position="bottom">
            <button
              className="py-1 px-2 hover-2 rounded-sm text-xl -mt-0.5"
              onClick={() => {
                const body = document.body;
                if (body.hasAttribute("theme-mode")) {
                  if (body.getAttribute("theme-mode") === "light") {
                    menu["view"]["theme"].children[1].function();
                  } else {
                    menu["view"]["theme"].children[0].function();
                  }
                }
              }}
            >
              <i className="fa-solid fa-circle-half-stroke" />
            </button>
          </Tooltip>
        </div>
      </div>
    );
  }

  function header() {
    return (
      <nav
        className="flex justify-between pt-1 items-center whitespace-nowrap"
        style={isRtl(i18n.language) ? { direction: "rtl" } : {}}
      >
        <div className="flex justify-start items-center">
          <Link to="/">
            <img
              width={54}
              src={icon}
              alt={t("logo")}
              className="ms-7 min-w-[54px]"
            />
          </Link>
          <div className="ms-1 mt-1">
            <div className="flex items-center ms-3 gap-2">
              {databases[database].image && (
                <img
                  src={databases[database].image}
                  className="h-5"
                  style={{
                    filter:
                      "opacity(0.4) drop-shadow(0 0 0 white) drop-shadow(0 0 0 white)",
                  }}
                  alt={t("database_icon", { databaseName: databases[database].name })}
                  title={t("database_diagram", { databaseName: databases[database].name })}
                />
              )}
              <Slot name="diagram-title-prefix" />
              <div
                className="text-xl flex items-center gap-1 me-1"
                onPointerEnter={(e) => e.isPrimary && setShowEditName(true)}
                onPointerLeave={(e) => e.isPrimary && setShowEditName(false)}
                onPointerDown={(e) => {
                  // Required for onPointerLeave to trigger when a touch pointer leaves
                  // https://stackoverflow.com/a/70976017/1137077
                  e.target.releasePointerCapture(e.pointerId);
                }}
                onClick={!layout.readOnly && (() => setModal(MODAL.RENAME))}
              >
                <span>{isTemplate ? t("templates") : t("diagrams")}</span>
                <span className="select-none text-zinc-400 dark:text-zinc-500 mx-1">
                  /
                </span>
                <span>{title}</span>
                {version && (
                  <Tag className="mt-1" color="blue" size="small">
                    {version.substring(0, 7)}
                  </Tag>
                )}
              </div>
              {/* Lápis sempre visível: Renomear saiu do menu Arquivo. */}
              {!layout.readOnly && (
                <IconEdit
                  role="button"
                  aria-label={t("rename_diagram")}
                  className="cursor-pointer"
                  style={{
                    opacity: showEditName || modal === MODAL.RENAME ? 1 : 0.55,
                  }}
                  onClick={() => setModal(MODAL.RENAME)}
                />
              )}
            </div>
            <div className="flex items-center">
              <div className="flex justify-start text-md select-none me-2">
                {Object.keys(menu).map((category) => (
                  <Dropdown
                    key={category}
                    position="bottomLeft"
                    style={{
                      width: "240px",
                      direction: isRtl(i18n.language) ? "rtl" : "ltr",
                    }}
                    render={
                      <Dropdown.Menu className="menu max-h-[calc(100vh-80px)] overflow-auto">
                        {Object.keys(menu[category]).map((item, index) => {
                          if (menu[category][item].children) {
                            return (
                              <Dropdown
                                className="min-w-36 max-w-72"
                                key={item}
                                position="rightTop"
                                render={
                                  <Dropdown.Menu>
                                    {menu[category][item].children.map(
                                      (e, i) => {
                                        if (e.divider) {
                                          return (
                                            <Dropdown.Divider
                                              key={`divider-${i}`}
                                            />
                                          );
                                        }
                                        return (
                                          <Dropdown.Item
                                            key={i}
                                            onClick={e.function}
                                            className="flex w-full items-center justify-between gap-1"
                                            disabled={e.disabled}
                                          >
                                            <span className="truncate flex-1 min-w-0">
                                              {e.name}
                                            </span>
                                            {e.label && (
                                              <Tag
                                                size="small"
                                                className="flex-shrink-0"
                                              >
                                                {e.label}
                                              </Tag>
                                            )}
                                          </Dropdown.Item>
                                        );
                                      },
                                    )}
                                  </Dropdown.Menu>
                                }
                              >
                                <Dropdown.Item
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                  }}
                                  onClick={menu[category][item].function}
                                >
                                  {t(item)}

                                  {isRtl(i18n.language) ? (
                                    <IconChevronLeft />
                                  ) : (
                                    <IconChevronRight />
                                  )}
                                </Dropdown.Item>
                              </Dropdown>
                            );
                          }
                          if (
                            menu[category][item].warning &&
                            !menu[category][item].disabled
                          ) {
                            return (
                              <Popconfirm
                                key={index}
                                title={menu[category][item].warning.title}
                                content={menu[category][item].warning.message}
                                onConfirm={menu[category][item].function}
                                position="right"
                                okText={t("confirm")}
                                cancelText={t("cancel")}
                              >
                                <Dropdown.Item>{t(item)}</Dropdown.Item>
                              </Popconfirm>
                            );
                          }
                          return (
                            <Dropdown.Item
                              key={index}
                              disabled={menu[category][item].disabled}
                              onClick={menu[category][item].function}
                              style={
                                menu[category][item].shortcut && {
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }
                              }
                            >
                              <div className="w-full flex items-center justify-between">
                                <div>{t(item)}</div>
                                <div className="flex items-center gap-1">
                                  {menu[category][item].shortcut && (
                                    <div className="text-gray-400">
                                      {menu[category][item].shortcut}
                                    </div>
                                  )}
                                  {menu[category][item].state &&
                                    menu[category][item].state}
                                </div>
                              </div>
                            </Dropdown.Item>
                          );
                        })}
                      </Dropdown.Menu>
                    }
                  >
                    <div className="px-3 py-1 hover-2 rounded-sm">
                      {t(category)}
                    </div>
                  </Dropdown>
                ))}
              </div>
              {layout.readOnly && <Tag size="small">{t("read_only")}</Tag>}
              {!layout.readOnly && <SaveStatus saveState={saveState} />}
            </div>
          </div>
        </div>
      </nav>
    );
  }
}
