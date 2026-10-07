import { useEffect, useReducer } from "react";
import { useTranslation } from "react-i18next";
import { Button, TabPane, Tabs, Tooltip } from "@douyinfe/semi-ui";
import { IconClose } from "@douyinfe/semi-icons";
import { DateTime } from "luxon";
import {
  useAreas,
  useDiagram,
  useEnums,
  useLayout,
  useNotes,
  useTypes,
  useUndoRedo,
  useViews,
} from "../../hooks";
import { onHistoryStamped, requestHistoryJump } from "../editorEvents";
import {
  closeHistoryPanel,
  setHistoryTab,
  useHistoryPanel,
} from "./panelState";
import VersionsTab from "./VersionsTab";
import { historyRows } from "./historyRows";

// Painel "Histórico de alterações", à direita do desenho (encaixe
// "right-panel" do Workspace). Mostra cada passo com frase, ícone e horário;
// clicar num passo volta o diagrama até ele, e os passos desfeitos ficam
// esmaecidos até serem refeitos ou descartados por uma alteração nova.

const ICONS = {
  add: { icon: "fa-solid fa-plus", color: "var(--semi-color-success)" },
  delete: { icon: "fa-solid fa-trash-can", color: "var(--semi-color-danger)" },
  edit: { icon: "fa-solid fa-pen", color: "var(--semi-color-primary)" },
  rename: { icon: "fa-solid fa-i-cursor", color: "var(--semi-color-primary)" },
  move: {
    icon: "fa-solid fa-up-down-left-right",
    color: "var(--semi-color-text-2)",
  },
  arrange: {
    icon: "fa-solid fa-wand-magic-sparkles",
    color: "var(--semi-color-tertiary)",
  },
  dbml: { icon: "fa-solid fa-code", color: "var(--semi-color-tertiary)" },
  start: { icon: "fa-solid fa-flag", color: "var(--semi-color-text-2)" },
};

const REFRESH_MS = 30_000;

function timeLabel(at, t, locale) {
  if (!at) return { short: "", full: t("history_no_time") };
  const time = DateTime.fromMillis(at).setLocale(locale);
  const seconds = DateTime.now().diff(time, "seconds").seconds;
  return {
    short:
      seconds < 60 ? t("history_now") : time.toRelative({ style: "short" }),
    full: time.toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS),
  };
}

function HistoryRow({ row, readOnly, t, locale }) {
  const { icon, color } = ICONS[row.kind] ?? ICONS.edit;
  const time = timeLabel(row.at, t, locale);
  const clickable = !readOnly && row.status !== "current" && row.steps !== 0;
  const text =
    row.count > 1
      ? t("history_repeated", { text: row.text, count: row.count })
      : row.text;
  const action =
    row.status === "undone" ? t("history_redo_to") : t("history_go_to");
  const tip = [
    row.status === "undone" ? t("history_undone") : null,
    row.status !== "start" ? time.full : null,
    clickable ? action : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li>
      <button
        type="button"
        disabled={!clickable}
        onClick={() => requestHistoryJump(row.steps)}
        title={tip}
        aria-current={row.status === "current" ? "step" : undefined}
        className={`flex w-full items-start gap-3 px-4 py-2 text-left text-sm outline-none focus-visible:outline-2 focus-visible:outline-[var(--semi-color-primary)] ${
          clickable ? "hover-1 cursor-pointer" : "cursor-default"
        } ${row.status === "undone" ? "opacity-50" : ""}`}
        style={
          row.status === "current"
            ? { backgroundColor: "var(--semi-color-primary-light-default)" }
            : undefined
        }
      >
        <span
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs"
          style={{ color, backgroundColor: "var(--semi-color-fill-0)" }}
          aria-hidden
        >
          <i className={icon} />
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={`block break-words ${row.status === "current" ? "font-semibold" : ""}`}
          >
            {text}
          </span>
          {row.status === "current" && row.kind !== "start" && (
            <span
              className="text-xs"
              style={{ color: "var(--semi-color-primary)" }}
            >
              {t("history_current")}
            </span>
          )}
        </span>
        {time.short && (
          <span
            className="shrink-0 pt-0.5 text-xs"
            style={{ color: "var(--semi-color-text-2)" }}
          >
            {time.short}
          </span>
        )}
      </button>
    </li>
  );
}

function ChangesList() {
  const { t, i18n } = useTranslation();
  const { undoStack, redoStack } = useUndoRedo();
  const { layout } = useLayout();
  const { tables, relationships } = useDiagram();
  const { notes } = useNotes();
  const { areas } = useAreas();
  const { types } = useTypes();
  const { enums } = useEnums();
  const { views } = useViews();
  const [, refresh] = useReducer((n) => n + 1, 0);

  // Frases chegam logo depois de cada ação; horários relativos envelhecem.
  useEffect(() => onHistoryStamped(refresh), []);
  useEffect(() => {
    const timer = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  const state = { tables, relationships, notes, areas, types, enums, views };
  const rows = historyRows(undoStack, redoStack, t, state);

  if (rows.length === 1) {
    return (
      <p
        className="px-4 py-6 text-sm"
        style={{ color: "var(--semi-color-text-2)" }}
      >
        {t("history_empty")}
      </p>
    );
  }
  return (
    <>
      {layout.readOnly && (
        <p
          className="px-4 pt-3 text-xs"
          style={{ color: "var(--semi-color-text-2)" }}
        >
          {t("history_read_only")}
        </p>
      )}
      <ul className="py-2">
        {rows.map((row) => (
          <HistoryRow
            key={row.id}
            row={row}
            readOnly={layout.readOnly}
            t={t}
            locale={i18n.language}
          />
        ))}
      </ul>
    </>
  );
}

export default function HistoryPanel() {
  const { t } = useTranslation();
  const { open, tab } = useHistoryPanel();
  if (!open) return null;

  return (
    <aside
      aria-label={t("history_panel")}
      className="flex h-full w-[320px] shrink-0 flex-col border-s border-color sm:w-full"
      style={{ backgroundColor: "var(--semi-color-bg-0)" }}
    >
      <div className="flex items-center justify-between border-b border-color px-4 py-2">
        <h2 className="text-base font-semibold">{t("history_panel")}</h2>
        <Tooltip content={t("history_close")} position="left">
          <Button
            theme="borderless"
            type="tertiary"
            icon={<IconClose />}
            aria-label={t("history_close")}
            onClick={closeHistoryPanel}
          />
        </Tooltip>
      </div>
      <Tabs
        type="line"
        activeKey={tab}
        onChange={setHistoryTab}
        className="flex min-h-0 flex-1 flex-col px-2 [&_.semi-tabs-content]:min-h-0 [&_.semi-tabs-content]:flex-1 [&_.semi-tabs-content]:overflow-y-auto [&_.semi-tabs-content]:p-0"
      >
        <TabPane tab={t("history_tab_changes")} itemKey="changes">
          <ChangesList />
        </TabPane>
        <TabPane tab={t("history_tab_versions")} itemKey="versions">
          <VersionsTab />
        </TabPane>
      </Tabs>
    </aside>
  );
}
