import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Action, ObjectType } from "../data/constants";
import {
  useDiagram,
  useLayout,
  useSettings,
  useTransform,
  useUndoRedo,
} from "../hooks";
import { routeHandle } from "../utils/calcPath";

// Alça do traçado do relacionamento selecionado: arrastar para os lados move
// o trecho vertical do meio da linha (midOffset no relacionamento); dois
// cliques voltam ao traçado automático. Cada arraste é um passo do desfazer.
// Só aparece quando o traçado tem esse trecho (tabelas lado a lado).
export default function RouteHandle({ data, pathValues }) {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const { layout } = useLayout();
  const { transform } = useTransform();
  const { updateRelationship } = useDiagram();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const drag = useRef(null);

  if (layout.readOnly) return null;
  const handle = routeHandle(
    { ...pathValues, midOffset: data.midOffset },
    1,
    settings.showComments,
  );
  if (!handle) return null;

  const record = (from, to) => {
    if (from === to) return;
    setUndoStack((prev) => [
      ...prev,
      {
        action: Action.EDIT,
        element: ObjectType.RELATIONSHIP,
        component: "self",
        rid: data.id,
        undo: { midOffset: from },
        redo: { midOffset: to },
        message: t("edit_relationship", {
          refName: data.name,
          extra: "[route]",
        }),
      },
    ]);
    setRedoStack([]);
  };

  return (
    <circle
      cx={handle.x}
      cy={handle.y}
      r={7}
      fill="var(--semi-color-bg-0)"
      stroke="var(--drawdb-highlight, #0084d1)"
      strokeWidth={2.5}
      cursor="ew-resize"
      data-export-ignore
      aria-label={t("route_handle")}
      onPointerDown={(e) => {
        if (!e.isPrimary) return;
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = {
          startX: e.clientX,
          from: Number(data.midOffset) || 0,
          last: Number(data.midOffset) || 0,
        };
      }}
      onPointerMove={(e) => {
        if (!drag.current) return;
        e.stopPropagation();
        const offset =
          drag.current.from +
          (e.clientX - drag.current.startX) / transform.zoom;
        // Grava só o deslocamento que cabe entre as tabelas (o excesso não
        // aparece e deixaria a alça "presa" ao voltar).
        const at = (midOffset) =>
          routeHandle({ ...pathValues, midOffset }, 1, settings.showComments).x;
        drag.current.last = Math.round(at(offset) - at(0));
        updateRelationship(data.id, { midOffset: drag.current.last });
      }}
      onPointerUp={(e) => {
        if (!drag.current) return;
        e.stopPropagation();
        record(drag.current.from, drag.current.last);
        drag.current = null;
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        const from = Number(data.midOffset) || 0;
        updateRelationship(data.id, { midOffset: 0 });
        record(from, 0);
      }}
    >
      <title>{t("route_handle")}</title>
    </circle>
  );
}
