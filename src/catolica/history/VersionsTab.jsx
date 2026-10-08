import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMatch, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { Button, Dropdown, Input, Modal, Toast } from "@douyinfe/semi-ui";
import { IconMore, IconPlus } from "@douyinfe/semi-icons";
import { DateTime } from "luxon";
import { saveAs } from "file-saver";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../data/db";
import {
  useAreas,
  useDiagram,
  useEnums,
  useLayout,
  useNotes,
  useTypes,
  useViews,
} from "../../hooks";
import { appUrl } from "../../utils/appUrl";
import { buildDiagramJson, serializeDiagramJson } from "../files/diagramJson";
import { exportFileName } from "../files/naming";
import { importAsNewDiagram } from "../importAsNewDiagram";
import { requestVersionRestore } from "../editorEvents";
import { focusDialogField } from "../renameField";
import { DialogFooter } from "../dialogParts";
import VersionPreview from "./VersionPreview";
import {
  addVersion,
  deleteVersion,
  listVersions,
  renameVersion,
} from "./versions";
import { snapshotOf } from "./versionRules";

// Aba "Versões" do painel do histórico (Sprint 1E): versões automáticas (ao
// abrir e a cada 10 minutos de edição) e com nome, guardadas neste
// navegador. Cada versão pode ser vista, restaurada (o diagrama atual vira
// uma versão antes), aberta como cópia, baixada, renomeada ou excluída.

function versionTitle(version, t) {
  return version.name || t("version_auto");
}

function versionDate(version, locale) {
  return DateTime.fromJSDate(new Date(version.createdAt))
    .setLocale(locale)
    .toLocaleString(DateTime.DATETIME_MED);
}

// Nome usado na linha do tempo e nos arquivos: o nome dado ou a data.
function versionLabel(version, t, locale) {
  return (
    version.name ||
    t("version_auto_label", { date: versionDate(version, locale) })
  );
}

function NameDialog({ visible, title, okText, initial, onConfirm, onClose }) {
  const { t } = useTranslation();
  const [name, setName] = useState(initial ?? "");

  useEffect(() => {
    if (!visible) return;
    setName(initial ?? "");
    focusDialogField({ submitOnEnter: false });
    // O nome é lido só ao abrir a janela.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const confirm = () => {
    if (!name.trim()) return;
    onConfirm(name.trim());
  };

  return (
    <Modal
      title={title}
      visible={visible}
      onCancel={onClose}
      centered
      width={440}
      footer={
        <DialogFooter>
          <Button onClick={onClose}>{t("cancel")}</Button>
          <Button
            theme="solid"
            type="primary"
            disabled={!name.trim()}
            onClick={confirm}
          >
            {okText}
          </Button>
        </DialogFooter>
      }
    >
      <Input
        value={name}
        onChange={setName}
        onEnterPress={confirm}
        placeholder={t("version_name")}
        maxLength={80}
      />
    </Modal>
  );
}

function PreviewDialog({ version, onClose, onRestore, onOpenCopy, readOnly }) {
  const { t, i18n } = useTranslation();
  if (!version) return null;
  return (
    <Modal
      title={versionTitle(version, t)}
      visible
      onCancel={onClose}
      centered
      width={860}
      footer={
        <DialogFooter
          extra={
            <Button onClick={() => onOpenCopy(version)}>
              {t("version_open_copy")}
            </Button>
          }
        >
          <Button onClick={onClose}>{t("close")}</Button>
          <Button
            theme="solid"
            type="primary"
            disabled={readOnly}
            onClick={() => onRestore(version)}
          >
            {t("version_restore")}
          </Button>
        </DialogFooter>
      }
    >
      <p className="mb-3 text-sm" style={{ color: "var(--semi-color-text-2)" }}>
        {versionDate(version, i18n.language)} ·{" "}
        {t(`version_reason_${version.reason}`)}
      </p>
      <VersionPreview snapshot={version.snapshot} />
    </Modal>
  );
}

function VersionRow({ version, readOnly, onAction }) {
  const { t, i18n } = useTranslation();
  const named = version.kind === "manual";
  const { tables, relationships } = version.snapshot;
  const actions = [
    ["view", t("version_view")],
    ["restore", t("version_restore"), readOnly],
    ["copy", t("version_open_copy")],
    ["download", t("version_download")],
    ["rename", named ? t("version_rename") : t("version_give_name")],
    ["delete", t("delete"), false, "danger"],
  ];

  return (
    <li className="flex items-start gap-3 px-4 py-2 hover-1">
      <span
        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs"
        style={{
          color: named
            ? "var(--semi-color-primary)"
            : "var(--semi-color-text-2)",
          backgroundColor: "var(--semi-color-fill-0)",
        }}
        aria-hidden
      >
        <i className={named ? "fa-solid fa-bookmark" : "fa-regular fa-clock"} />
      </span>
      <button
        type="button"
        className="min-w-0 flex-1 text-left text-sm outline-none focus-visible:outline-2 focus-visible:outline-[var(--semi-color-primary)]"
        onClick={() => onAction("view", version)}
        title={t("version_view")}
      >
        <span className={`block break-words ${named ? "font-semibold" : ""}`}>
          {versionTitle(version, t)}
        </span>
        <span
          className="block text-xs"
          style={{ color: "var(--semi-color-text-2)" }}
        >
          {versionDate(version, i18n.language)} ·{" "}
          {t(`version_reason_${version.reason}`)}
        </span>
        <span
          className="block text-xs"
          style={{ color: "var(--semi-color-text-2)" }}
        >
          {t("version_counts", {
            tables: tables.length,
            relationships: relationships.length,
          })}
        </span>
      </button>
      <Dropdown
        trigger="click"
        position="bottomRight"
        render={
          <Dropdown.Menu>
            {actions.map(([key, label, disabled, type]) => (
              <Dropdown.Item
                key={key}
                disabled={disabled}
                type={type}
                onClick={() => onAction(key, version)}
              >
                {label}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        }
      >
        <Button
          theme="borderless"
          type="tertiary"
          size="small"
          icon={<IconMore />}
          aria-label={t("version_actions")}
        />
      </Dropdown>
    </li>
  );
}

export default function VersionsTab() {
  const { t, i18n } = useTranslation();
  const match = useMatch("/editor/diagrams/:id");
  const diagramId = match?.params.id;
  const { layout } = useLayout();
  const { database, tables, relationships } = useDiagram();
  const { notes } = useNotes();
  const { areas } = useAreas();
  const { types } = useTypes();
  const { enums } = useEnums();
  const { views } = useViews();
  const navigate = useNavigate();
  const versions = useLiveQuery(() => listVersions(diagramId), [diagramId]);

  const [naming, setNaming] = useState(null); // { version? }
  const [previewing, setPreviewing] = useState(null);
  const [confirm, setConfirm] = useState(null); // { kind, version }

  const current = () =>
    snapshotOf({
      database,
      tables,
      relationships,
      notes,
      areas,
      types,
      enums,
      views,
    });

  const diagramTitle = async () =>
    (await db.diagrams.where("diagramId").equals(diagramId).first())?.name ??
    "";

  const asDiagram = (version, title) => ({
    title,
    database: version.snapshot.database,
    tables: version.snapshot.tables,
    relationships: version.snapshot.relationships,
    notes: version.snapshot.notes,
    subjectAreas: version.snapshot.areas,
    areas: version.snapshot.areas,
    views: version.snapshot.views,
    types: version.snapshot.types,
    enums: version.snapshot.enums,
  });

  const restore = (version) => {
    requestVersionRestore({
      snapshot: version.snapshot,
      label: versionLabel(version, t, i18n.language),
    });
    setConfirm(null);
    setPreviewing(null);
    Toast.success(t("version_restored"));
  };

  // Abre em nova janela: aberta já no clique (senão o navegador bloqueia) e
  // recebe o endereço quando a cópia estiver salva.
  const openCopy = async (version) => {
    const target = window.open("", "_blank");
    const title = t("version_copy_title", {
      title: await diagramTitle(),
      version: versionLabel(version, t, i18n.language),
    });
    const { diagramId: id } = await importAsNewDiagram(
      asDiagram(version, title),
    );
    const url = appUrl(`/editor/diagrams/${id}${window.location.search}`);
    // Navegador bloqueou a nova janela: abre nesta (o diagrama atual já está
    // salvo).
    if (target && !target.closed) target.location.href = url;
    else navigate(`/editor/diagrams/${id}`);
    setPreviewing(null);
  };

  const download = async (version) => {
    const title = await diagramTitle();
    const label = versionLabel(version, t, i18n.language);
    const json = buildDiagramJson(asDiagram(version, `${title} (${label})`), {
      exportId: uuidv4(),
      exportedAt: new Date(),
      createdAt: version.createdAt,
      modifiedAt: version.createdAt,
    });
    saveAs(
      new Blob([serializeDiagramJson(json)], { type: "application/json" }),
      exportFileName(`${title} ${label}`, new Date(version.createdAt), "json"),
    );
  };

  const onAction = (key, version) => {
    if (key === "view") setPreviewing(version);
    else if (key === "restore") setConfirm({ kind: "restore", version });
    else if (key === "copy") openCopy(version);
    else if (key === "download") download(version);
    else if (key === "rename") setNaming({ version });
    else if (key === "delete") setConfirm({ kind: "delete", version });
  };

  const saveNamed = async (name) => {
    if (naming?.version) {
      await renameVersion(naming.version.id, name);
    } else {
      await addVersion(diagramId, current(), {
        kind: "manual",
        reason: "manual",
        name,
      });
      Toast.success(t("version_saved"));
    }
    setNaming(null);
  };

  if (!diagramId) {
    return (
      <p
        className="px-4 py-6 text-sm"
        style={{ color: "var(--semi-color-text-2)" }}
      >
        {t("versions_unsaved")}
      </p>
    );
  }

  return (
    <>
      <div className="px-4 pt-3">
        <Button
          block
          icon={<IconPlus />}
          disabled={layout.readOnly}
          onClick={() => setNaming({})}
        >
          {t("version_save")}
        </Button>
      </div>
      {versions?.length === 0 && (
        <p
          className="px-4 py-6 text-sm"
          style={{ color: "var(--semi-color-text-2)" }}
        >
          {t("versions_empty")}
        </p>
      )}
      <ul className="py-2">
        {(versions ?? []).map((version) => (
          <VersionRow
            key={version.id}
            version={version}
            readOnly={layout.readOnly}
            onAction={onAction}
          />
        ))}
      </ul>
      <p
        className="px-4 pb-4 text-xs"
        style={{ color: "var(--semi-color-text-2)" }}
      >
        {t("versions_note")}
      </p>

      <NameDialog
        visible={Boolean(naming)}
        title={naming?.version ? t("version_rename") : t("version_save")}
        okText={naming?.version ? t("version_rename") : t("version_save")}
        initial={naming?.version?.name}
        onConfirm={saveNamed}
        onClose={() => setNaming(null)}
      />
      <PreviewDialog
        version={previewing}
        readOnly={layout.readOnly}
        onClose={() => setPreviewing(null)}
        onRestore={(version) => setConfirm({ kind: "restore", version })}
        onOpenCopy={openCopy}
      />
      <Modal
        title={
          confirm?.kind === "restore"
            ? t("version_restore_title")
            : t("version_delete_title")
        }
        visible={Boolean(confirm)}
        onCancel={() => setConfirm(null)}
        centered
        width={480}
        footer={
          <DialogFooter>
            <Button onClick={() => setConfirm(null)}>{t("cancel")}</Button>
            <Button
              theme="solid"
              type={confirm?.kind === "delete" ? "danger" : "primary"}
              onClick={async () => {
                if (confirm.kind === "restore") restore(confirm.version);
                else {
                  await deleteVersion(confirm.version.id);
                  setConfirm(null);
                }
              }}
            >
              {confirm?.kind === "restore" ? t("version_restore") : t("delete")}
            </Button>
          </DialogFooter>
        }
      >
        {confirm && (
          <p className="text-sm">
            {t(
              confirm.kind === "restore"
                ? "version_restore_body"
                : "version_delete_body",
              { name: versionLabel(confirm.version, t, i18n.language) },
            )}
          </p>
        )}
      </Modal>
    </>
  );
}
