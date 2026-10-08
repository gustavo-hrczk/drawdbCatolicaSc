import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Button,
  Dropdown,
  Input,
  Modal,
  Select,
  Toast,
} from "@douyinfe/semi-ui";
import { IconMore, IconSearch } from "@douyinfe/semi-icons";
import { DateTime } from "luxon";
import { saveAs } from "file-saver";
import { db } from "../../data/db";
import { databases } from "../../data/databases";
import { useSettings } from "../../hooks";
import { appUrl } from "../../utils/appUrl";
import { catolicaDb } from "../editorHistory";
import { preferredSqlDialect } from "../databasePreference";
import { DialogFooter } from "../dialogParts";
import { toastWithAction } from "../undoToast";
import {
  deleteDiagram,
  duplicateDiagram,
  exportDiagram,
  renameDiagram,
  restoreDiagram,
  toggleFavorite,
} from "./homeActions";

// "Seus diagramas" na tela inicial: os diagramas salvos neste navegador, com
// busca, favoritos, ordenação e as ações de cada um.

// Busca sem diferenciar maiúsculas nem acentos.
const fold = (text) =>
  (text ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLocaleLowerCase();

function relative(date, locale) {
  if (!date) return "";
  return DateTime.fromJSDate(new Date(date)).setLocale(locale).toRelative();
}

function DiagramRow({ diagram, favorite, onAction, renaming, onRenamed }) {
  const { t, i18n } = useTranslation();
  const [name, setName] = useState(diagram.name);
  const database = databases[diagram.database];

  const actions = [
    ["open", t("home_open")],
    ["open_window", t("home_open_window")],
    ["rename", t("rename")],
    ["duplicate", t("duplicate")],
    { divider: true },
    ["export_zip", t("home_export_zip")],
    ["export_json", t("home_export_json")],
    ["export_sql", t("home_export_sql")],
    { divider: true },
    ["delete", t("delete"), "danger"],
  ];

  return (
    <li className="group flex items-center gap-3 rounded-lg px-3 py-2 hover-1">
      <button
        type="button"
        aria-pressed={favorite}
        aria-label={t(favorite ? "home_unfavorite" : "home_favorite")}
        title={t(favorite ? "home_unfavorite" : "home_favorite")}
        onClick={() => onAction("favorite", diagram, favorite)}
        className="text-lg outline-none focus-visible:outline-2 focus-visible:outline-[var(--semi-color-primary)]"
        style={{
          color: favorite
            ? "var(--drawdb-accent, #c0994f)"
            : "var(--semi-color-text-3)",
        }}
      >
        <i className={favorite ? "bi bi-star-fill" : "bi bi-star"} />
      </button>

      {database?.image ? (
        <img
          src={database.image}
          alt=""
          className="h-6 w-6 shrink-0 object-contain opacity-70"
        />
      ) : (
        <i
          className="bi bi-database w-6 shrink-0 text-center text-lg opacity-60"
          aria-hidden
        />
      )}

      <div className="min-w-0 flex-1">
        {renaming ? (
          <Input
            autoFocus
            size="small"
            value={name}
            onChange={setName}
            onEnterPress={() => onRenamed(diagram, name)}
            onBlur={() => onRenamed(diagram, name)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.stopPropagation();
                setName(diagram.name);
                onRenamed(diagram, diagram.name);
              }
            }}
            aria-label={t("rename")}
          />
        ) : (
          <button
            type="button"
            className="block w-full truncate text-left font-semibold outline-none focus-visible:underline"
            onClick={() => onAction("open", diagram)}
            title={diagram.name}
          >
            {diagram.name}
          </button>
        )}
        <div
          className="truncate text-xs"
          style={{ color: "var(--semi-color-text-2)" }}
        >
          {[
            database?.name,
            t("home_tables", { count: diagram.tableCount }),
            t("home_edited", {
              when: relative(diagram.lastModified, i18n.language),
            }),
          ]
            .filter(Boolean)
            .join(" · ")}
        </div>
      </div>

      <Dropdown
        trigger="click"
        clickToHide
        position="bottomRight"
        render={
          <Dropdown.Menu>
            {actions.map((action, i) =>
              action.divider ? (
                <Dropdown.Divider key={`d${i}`} />
              ) : (
                <Dropdown.Item
                  key={action[0]}
                  type={action[2]}
                  onClick={() => onAction(action[0], diagram)}
                >
                  {action[1]}
                </Dropdown.Item>
              ),
            )}
          </Dropdown.Menu>
        }
      >
        <Button
          theme="borderless"
          type="tertiary"
          icon={<IconMore />}
          aria-label={t("home_actions", { name: diagram.name })}
        />
      </Dropdown>
    </li>
  );
}

export default function DiagramList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("recent");
  const [renamingId, setRenamingId] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const diagrams = useLiveQuery(async () =>
    (await db.diagrams.toArray()).map((d) => ({
      diagramId: d.diagramId,
      name: d.name,
      database: d.database,
      lastModified: d.lastModified,
      tableCount: d.tables?.length ?? 0,
    })),
  );
  const favorites = useLiveQuery(
    async () =>
      new Set(await catolicaDb.favorites.toCollection().primaryKeys()),
  );

  const visible = useMemo(() => {
    if (!diagrams) return [];
    const term = fold(query.trim());
    return diagrams
      .filter((d) => filter === "all" || favorites?.has(d.diagramId))
      .filter((d) => !term || fold(d.name).includes(term))
      .sort((a, b) =>
        sort === "name"
          ? a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
          : new Date(b.lastModified) - new Date(a.lastModified),
      );
  }, [diagrams, favorites, query, filter, sort]);

  const download = async (diagram, kind) => {
    try {
      const { blob, fileName } = await exportDiagram(diagram.diagramId, kind, {
        dialect: preferredSqlDialect(settings),
        t,
      });
      saveAs(blob, fileName);
      Toast.success(t("export_started", { files: fileName }));
    } catch (err) {
      console.error(err);
      Toast.error(t("export_failed"));
    }
  };

  const onAction = async (key, diagram, favorite) => {
    const path = `/editor/diagrams/${diagram.diagramId}`;
    if (key === "open") navigate(path);
    else if (key === "open_window") window.open(appUrl(path), "_blank");
    else if (key === "favorite") toggleFavorite(diagram.diagramId, favorite);
    else if (key === "rename") setRenamingId(diagram.diagramId);
    else if (key === "duplicate") {
      const { name } = await duplicateDiagram(diagram.diagramId);
      Toast.success(t("home_duplicated", { name }));
    } else if (key === "export_zip") download(diagram, "zip");
    else if (key === "export_json") download(diagram, "json");
    else if (key === "export_sql") download(diagram, "sql");
    else if (key === "delete") setDeleting(diagram);
  };

  const onRenamed = async (diagram, name) => {
    setRenamingId(null);
    if (name.trim() && name.trim() !== diagram.name) {
      await renameDiagram(diagram.diagramId, name);
    }
  };

  const confirmDelete = async () => {
    const target = deleting;
    setDeleting(null);
    const deleted = await deleteDiagram(target.diagramId);
    toastWithAction(t("home_deleted", { name: target.name }), t("undo"), () =>
      restoreDiagram(deleted),
    );
  };

  const total = diagrams?.length ?? 0;
  const favoriteCount = favorites?.size ?? 0;

  return (
    <section
      aria-labelledby="home-diagrams"
      className="flex min-h-0 flex-col rounded-2xl border border-color p-5"
      style={{ backgroundColor: "var(--semi-color-bg-1)" }}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id="home-diagrams" className="home-title text-xl">
          {t("home_your_diagrams")}
        </h2>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Input
          prefix={<IconSearch />}
          placeholder={t("home_search")}
          value={query}
          onChange={setQuery}
          showClear
          className="min-w-[180px] flex-1"
          aria-label={t("home_search")}
        />
        <Select
          value={filter}
          onChange={setFilter}
          optionList={[
            { value: "all", label: t("home_filter_all", { count: total }) },
            {
              value: "favorites",
              label: t("home_filter_favorites", { count: favoriteCount }),
            },
          ]}
          aria-label={t("home_filter")}
          style={{ width: 150 }}
        />
        <Select
          value={sort}
          onChange={setSort}
          optionList={[
            { value: "recent", label: t("home_sort_recent") },
            { value: "name", label: t("home_sort_name") },
          ]}
          aria-label={t("home_sort")}
          style={{ width: 170 }}
        />
      </div>

      <ul className="-mx-2 min-h-[120px] flex-1 overflow-y-auto">
        {diagrams && visible.length === 0 && (
          <li
            className="px-3 py-8 text-center text-sm"
            style={{ color: "var(--semi-color-text-2)" }}
          >
            {total === 0
              ? t("home_empty")
              : filter === "favorites" && !query
                ? t("home_no_favorites")
                : t("home_no_results")}
          </li>
        )}
        {visible.map((diagram) => (
          <DiagramRow
            key={diagram.diagramId}
            diagram={diagram}
            favorite={Boolean(favorites?.has(diagram.diagramId))}
            onAction={onAction}
            renaming={renamingId === diagram.diagramId}
            onRenamed={onRenamed}
          />
        ))}
      </ul>

      <p
        className="mt-3 flex items-center gap-2 text-xs"
        style={{ color: "var(--semi-color-text-2)" }}
      >
        <i className="bi bi-info-circle" aria-hidden />
        {t("home_local_notice")}
      </p>

      <Modal
        title={t("home_delete_title")}
        visible={Boolean(deleting)}
        onCancel={() => setDeleting(null)}
        centered
        width={460}
        footer={
          <DialogFooter>
            <Button onClick={() => setDeleting(null)}>{t("cancel")}</Button>
            <Button theme="solid" type="danger" onClick={confirmDelete}>
              {t("delete")}
            </Button>
          </DialogFooter>
        }
      >
        <p className="text-sm">
          {t("home_delete_body", { name: deleting?.name ?? "" })}
        </p>
      </Modal>
    </section>
  );
}
