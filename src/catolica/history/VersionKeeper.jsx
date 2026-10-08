import { useEffect, useRef } from "react";
import { useMatch } from "react-router-dom";
import {
  useAreas,
  useDiagram,
  useEnums,
  useLayout,
  useNotes,
  useTypes,
  useViews,
} from "../../hooks";
import { onDiagramLoaded } from "../editorEvents";
import { addVersion, listVersions } from "./versions";
import { AUTO_INTERVAL_MS, snapshotKey, snapshotOf } from "./versionRules";

// Versões automáticas (Sprint 1E): uma ao abrir o diagrama e outra a cada 10
// minutos de edição, só quando o conteúdo mudou desde a última versão.
// Fica montado o tempo todo (encaixe "canvas-overlay") e não desenha nada.

const CHECK_MS = 60 * 1000;
// O diagrama é aplicado ao editor logo depois do aviso de carregamento.
const AFTER_LOAD_MS = 1500;

export default function VersionKeeper() {
  const match = useMatch("/editor/diagrams/:id");
  const diagramId = match?.params.id;
  const { layout } = useLayout();
  const { database, tables, relationships } = useDiagram();
  const { notes } = useNotes();
  const { areas } = useAreas();
  const { types } = useTypes();
  const { enums } = useEnums();
  const { views } = useViews();

  const latest = useRef({});
  latest.current = {
    diagramId,
    readOnly: layout.readOnly,
    snapshot: snapshotOf({
      database,
      tables,
      relationships,
      notes,
      areas,
      types,
      enums,
      views,
    }),
  };
  // Hora e conteúdo da última versão do diagrama aberto (evita ler o banco a
  // cada minuto).
  const lastVersionAt = useRef({ diagramId: null, at: 0, key: null });

  useEffect(() => {
    const save = async (reason) => {
      const { diagramId, readOnly, snapshot } = latest.current;
      if (!diagramId || diagramId === "blank" || readOnly) return;
      const record = await addVersion(diagramId, snapshot, { reason });
      if (record) {
        lastVersionAt.current = { diagramId, at: Date.now(), key: record.key };
      }
    };

    let loadTimer;
    const stopLoaded = onDiagramLoaded(() => {
      clearTimeout(loadTimer);
      loadTimer = setTimeout(() => save("open"), AFTER_LOAD_MS);
    });

    const interval = setInterval(async () => {
      const { diagramId, readOnly, snapshot } = latest.current;
      if (!diagramId || readOnly) return;
      if (lastVersionAt.current.diagramId !== diagramId) {
        const [newest] = await listVersions(diagramId);
        lastVersionAt.current = {
          diagramId,
          at: newest ? new Date(newest.createdAt).getTime() : 0,
          key: newest?.key,
        };
      }
      if (Date.now() - lastVersionAt.current.at < AUTO_INTERVAL_MS) return;
      if (snapshotKey(snapshot) === lastVersionAt.current.key) return;
      await save("interval");
    }, CHECK_MS);

    return () => {
      stopLoaded();
      clearTimeout(loadTimer);
      clearInterval(interval);
    };
  }, []);

  return null;
}
