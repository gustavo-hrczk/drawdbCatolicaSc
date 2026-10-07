import { useEffect, useMemo, useRef, useState } from "react";
import {
  Banner,
  Button,
  Modal,
  Select,
  Spin,
  TextArea,
  Toast,
} from "@douyinfe/semi-ui";
import { IconUpload } from "@douyinfe/semi-icons";
import { useTranslation } from "react-i18next";
import { useNavigateWithParams, useSettings } from "../hooks";
import { databases } from "../data/databases";
import { appUrl } from "../utils/appUrl";
import { autoArrange } from "../utils/autoArrange";
import { getTableHeight, getTableWidth } from "../utils/utils";
import { preferredDatabase, preferredSqlDialect } from "./databasePreference";
import { findImportedCopy, importAsNewDiagram } from "./importAsNewDiagram";
import { untitledTitle } from "./i18n";
import { planImport } from "./files/importPlan";
import { parseSqlDiagram } from "./files/sqlImport";
import { parseDbmlDiagram } from "./files/dbmlImport";
import { SQL_DIALECTS } from "./files/sql";
import { LIMITS } from "./files/zipPackage";

// Janela "Importar" (Arquivo > Importar, Ctrl+I): diagrama completo (.zip ou
// .json), SQL (.sql ou código colado) ou DBML. Mostra um resumo antes de abrir
// e avisa se o mesmo arquivo já foi importado. O importado é sempre salvo como
// um diagrama novo e aberto em uma nova aba; o diagrama desta aba não muda.

const ACCEPT = ".zip,.json,.ddb,.sql,.dbml,.rar";

const withoutExtension = (name) => name.replace(/\.[^.]+$/, "");

const diagramUrl = (diagramId) =>
  appUrl(`/editor/diagrams/${diagramId}${window.location.search}`);

// Formata a data gravada no arquivo (ISO com fuso) no formato local.
function formatDate(iso) {
  const date = iso ? new Date(iso) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : null;
}

function errorText(t, { error, detail }) {
  if (error === "sql_syntax" || error === "dbml_syntax") {
    return detail
      ? t(`import_error_${error}`, detail)
      : t(`import_error_${error}_no_position`);
  }
  const key = `import_error_${error}`;
  return t(key, {
    name: detail ?? "",
    defaultValue: t("oops_smth_went_wrong"),
  });
}

// SQL e DBML não guardam o desenho: organiza as tabelas e enquadra o diagrama
// na área do editor (como o "Organizar automaticamente").
function arrangeImported(data, settings) {
  const { relationships } = data;
  const positions = new Map(
    autoArrange(data.tables, relationships, settings).map((p) => [p.id, p]),
  );
  const tables = data.tables.map((table) => {
    const position = positions.get(table.id);
    return position ? { ...table, x: position.x, y: position.y } : table;
  });
  if (!tables.length) return { ...data, tables };

  const box = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  };
  for (const table of tables) {
    box.minX = Math.min(box.minX, table.x);
    box.minY = Math.min(box.minY, table.y);
    box.maxX = Math.max(box.maxX, table.x + getTableWidth(table));
    box.maxY = Math.max(
      box.maxY,
      table.y + getTableHeight(table, settings.showComments, relationships),
    );
  }
  const canvas = document.getElementById("canvas")?.getBoundingClientRect();
  const fit = canvas
    ? Math.min(
        canvas.width / (box.maxX - box.minX + 40),
        canvas.height / (box.maxY - box.minY + 40),
      )
    : 1;
  return {
    ...data,
    tables,
    pan: { x: (box.minX + box.maxX) / 2, y: (box.minY + box.maxY) / 2 },
    zoom: Math.max(0.1, Math.min(1, Math.floor(fit * 20) / 20)),
  };
}

async function readInputs(fileList) {
  const files = Array.from(fileList);
  const tooLarge = files.find((file) => file.size > LIMITS.maxZipBytes);
  if (tooLarge) return { ok: false, error: "too_large", detail: tooLarge.name };
  const inputs = await Promise.all(
    files.map(async (file) => ({
      name: file.name,
      bytes: new Uint8Array(await file.arrayBuffer()),
    })),
  );
  return planImport(inputs);
}

function Summary({ rows }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
      {rows
        .filter(([, value]) => value !== null && value !== undefined)
        .map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="opacity-70">{label}</dt>
            <dd className="break-all font-semibold">{value}</dd>
          </div>
        ))}
    </dl>
  );
}

function Notice({ type, children }) {
  return (
    <Banner
      type={type}
      fullMode={false}
      closeIcon={null}
      description={children}
    />
  );
}

export default function ImportDialog({ visible, onClose, currentDiagramId }) {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const navigate = useNavigateWithParams();
  const inputRef = useRef(null);

  const [reading, setReading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [plan, setPlan] = useState(null);
  const [duplicate, setDuplicate] = useState(null);
  // Abrir o .sql em vez do .json (só quando os dois não conferem).
  const [useSql, setUseSql] = useState(false);
  const [dialect, setDialect] = useState(() => preferredSqlDialect(settings));
  const [dbmlDatabase, setDbmlDatabase] = useState(() =>
    preferredDatabase(settings),
  );
  // Código SQL colado (null: fora do modo de colar).
  const [pastedSql, setPastedSql] = useState(null);
  const [importing, setImporting] = useState(false);

  const reset = () => {
    setPlan(null);
    setDuplicate(null);
    setUseSql(false);
    setPastedSql(null);
    setReading(false);
    setDragging(false);
    setImporting(false);
  };

  useEffect(() => {
    if (visible) {
      reset();
      setDialect(preferredSqlDialect(settings));
      setDbmlDatabase(preferredDatabase(settings));
    }
    // A preferência é lida só ao abrir a janela.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Com a janela aberta, um arquivo solto fora dela faria o navegador abrir o
  // arquivo no lugar do editor.
  useEffect(() => {
    if (!visible) return;
    const block = (e) => {
      if (e.dataTransfer?.types?.includes("Files")) e.preventDefault();
    };
    window.addEventListener("dragover", block);
    window.addEventListener("drop", block);
    return () => {
      window.removeEventListener("dragover", block);
      window.removeEventListener("drop", block);
    };
  }, [visible]);

  const handleFiles = async (fileList) => {
    if (!fileList?.length) return;
    reset();
    setReading(true);
    try {
      const result = await readInputs(fileList);
      if (result.ok && result.diagram) {
        const exportId = result.diagram.meta?.exportId;
        setDuplicate((await findImportedCopy(exportId)) ?? null);
        const dialetoSql = result.diagram.meta?.dialetoSql;
        if (dialetoSql && databases[dialetoSql]) setDialect(dialetoSql);
      }
      setPlan(result);
    } catch (err) {
      console.error(err);
      setPlan({ ok: false, error: "invalid_zip" });
    } finally {
      setReading(false);
    }
  };

  const usePastedSql = () => {
    setPlan({
      ok: true,
      kind: "sql",
      sql: { name: null, text: pastedSql },
      sqlCheck: "absent",
      fromZip: null,
    });
    setPastedSql(null);
  };

  const openingSql = plan?.ok && (plan.kind === "sql" || useSql);
  const openingDbml = plan?.ok && plan.kind === "dbml";
  const sourceTitle = (file) =>
    file.name ? withoutExtension(file.name) : untitledTitle();

  // Convertido de novo a cada troca de banco de dados.
  const parsed = useMemo(() => {
    if (openingSql) return parseSqlDiagram(plan.sql.text, dialect);
    if (openingDbml) return parseDbmlDiagram(plan.dbml.text, dbmlDatabase);
    return null;
  }, [openingSql, openingDbml, plan, dialect, dbmlDatabase]);

  // Abre em nova aba. A aba é aberta já no clique (senão o navegador a
  // bloqueia) e recebe o endereço quando o diagrama estiver salvo. Se o
  // navegador bloquear mesmo assim, abre nesta aba.
  const openInNewTab = async (createDiagram) => {
    const tab = window.open("", "_blank");
    try {
      const { diagramId, title } = await createDiagram();
      onClose();
      if (tab && !tab.closed) {
        tab.location.href = diagramUrl(diagramId);
        Toast.success(t("diagram_imported_new_tab", { title }));
      } else {
        navigate(`/editor/diagrams/${diagramId}`);
        Toast.success(t("diagram_imported", { title }));
      }
    } catch (err) {
      tab?.close();
      throw err;
    }
  };

  const importDiagram = () => {
    setImporting(true);
    openInNewTab(async () => {
      let data;
      let source = null;
      if (openingSql || openingDbml) {
        data = {
          ...arrangeImported(parsed.data, settings),
          title: sourceTitle(openingSql ? plan.sql : plan.dbml),
        };
      } else {
        data = plan.diagram.data;
        source = { exportId: plan.diagram.meta?.exportId };
      }
      const diagramId = await importAsNewDiagram(data, source);
      return { diagramId, title: data.title || untitledTitle() };
    }).catch((err) => {
      console.error(err);
      Toast.error(t("oops_smth_went_wrong"));
      setImporting(false);
    });
  };

  const openExisting = () => {
    if (duplicate.diagramId === currentDiagramId) {
      Toast.info(t("import_already_open"));
      onClose();
      return;
    }
    openInNewTab(async () => ({
      diagramId: duplicate.diagramId,
      title: duplicate.name,
    }));
  };

  const pickFiles = () => inputRef.current?.click();

  const dropZone = (
    <div className="flex flex-col gap-2">
      <div
        role="button"
        tabIndex={0}
        onClick={pickFiles}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            pickFiles();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center"
        style={{
          borderColor: dragging
            ? "var(--semi-color-primary)"
            : "var(--semi-color-border)",
          background: dragging ? "var(--semi-color-primary-light-default)" : "",
        }}
      >
        {reading ? (
          <>
            <Spin />
            <div>{t("import_reading")}</div>
          </>
        ) : (
          <>
            <IconUpload size="extra-large" />
            <div className="font-semibold">{t("import_drop_here")}</div>
            <div className="text-xs opacity-70">{t("import_accepted")}</div>
          </>
        )}
      </div>
      {!reading && (
        <div className="text-center">
          <Button theme="borderless" onClick={() => setPastedSql("")}>
            {t("import_paste_sql")}
          </Button>
        </div>
      )}
    </div>
  );

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      multiple
      accept={ACCEPT}
      className="hidden"
      onChange={(e) => {
        handleFiles(e.target.files);
        e.target.value = "";
      }}
    />
  );

  let body;
  let footer = null;
  let canImport = false;

  if (pastedSql !== null) {
    body = (
      <TextArea
        autoFocus
        rows={12}
        value={pastedSql}
        onChange={setPastedSql}
        placeholder={t("import_paste_placeholder")}
        style={{ fontFamily: "monospace" }}
      />
    );
    footer = (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button onClick={() => setPastedSql(null)}>{t("import_back")}</Button>
        <Button
          theme="solid"
          disabled={!pastedSql.trim()}
          onClick={usePastedSql}
        >
          {t("import_continue")}
        </Button>
      </div>
    );
  } else if (!plan || reading) {
    body = dropZone;
  } else if (!plan.ok) {
    body = (
      <div className="flex flex-col gap-3">
        <Notice type="danger">{errorText(t, plan)}</Notice>
        {dropZone}
      </div>
    );
  } else if (openingSql || openingDbml) {
    canImport = parsed?.ok;
    const file = openingSql ? plan.sql : plan.dbml;
    body = (
      <div className="flex flex-col gap-3">
        <Summary
          rows={[
            [t("title"), sourceTitle(file)],
            [t("import_from_package"), plan.fromZip],
            [t("import_tables"), parsed?.ok ? parsed.data.tables.length : null],
          ]}
        />
        <div>
          <div className="mb-1 font-semibold">
            {t(openingSql ? "import_sql_dialect" : "import_dbml_database")}
          </div>
          {openingSql ? (
            <Select
              value={dialect}
              onChange={setDialect}
              className="w-full"
              optionList={SQL_DIALECTS.map((value) => ({
                value,
                label: databases[value].name,
              }))}
            />
          ) : (
            <Select
              value={dbmlDatabase}
              onChange={setDbmlDatabase}
              className="w-full"
              optionList={Object.entries(databases).map(([value, info]) => ({
                value,
                label: info.name,
              }))}
            />
          )}
        </div>
        {parsed?.ok ? (
          <Notice type="info">
            {t(openingSql ? "import_sql_only" : "import_dbml_info")}
          </Notice>
        ) : (
          <Notice type="danger">{errorText(t, parsed)}</Notice>
        )}
        {useSql && (
          <div>
            <Button size="small" onClick={() => setUseSql(false)}>
              {t("import_open_json_instead")}
            </Button>
          </div>
        )}
      </div>
    );
  } else {
    const { data, meta } = plan.diagram;
    canImport = true;
    body = (
      <div className="flex flex-col gap-3">
        <Summary
          rows={[
            [t("title"), data.title || t("untitled_diagram")],
            [t("import_database"), databases[data.database]?.name],
            [t("import_tables"), data.tables.length],
            [t("import_exported_at"), formatDate(meta?.exportadoEm)],
            [t("import_from_package"), plan.fromZip],
          ]}
        />
        {plan.sqlCheck === "match" && (
          <Notice type="success">{t("import_sql_match")}</Notice>
        )}
        {plan.sqlCheck === "mismatch" && (
          <Notice type="warning">
            <div>{t("import_sql_mismatch")}</div>
            <Button
              size="small"
              className="mt-2"
              onClick={() => setUseSql(true)}
            >
              {t("import_open_sql_instead")}
            </Button>
          </Notice>
        )}
        {plan.sqlCheck === "not_checked" && (
          <Notice type="info">{t("import_sql_not_checked")}</Notice>
        )}
        {duplicate && (
          <Notice type="warning">
            {t("import_duplicate", { name: duplicate.name })}
          </Notice>
        )}
      </div>
    );
  }

  if (plan?.ok && !reading && pastedSql === null) {
    const offerExisting = duplicate && !openingSql;
    footer = (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button onClick={pickFiles} disabled={importing}>
          {t("import_choose_other")}
        </Button>
        {offerExisting && (
          <Button onClick={openExisting}>{t("import_open_existing")}</Button>
        )}
        <Button
          theme="solid"
          disabled={!canImport}
          loading={importing}
          onClick={importDiagram}
        >
          {offerExisting ? t("import_new_copy") : t("import_open")}
        </Button>
      </div>
    );
  }

  return (
    <Modal
      title={t("import_dialog_title")}
      visible={visible}
      onCancel={onClose}
      centered
      width={560}
      footer={footer}
    >
      {/* Arquivos soltos em qualquer ponto da janela, inclusive no resumo. */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!importing) handleFiles(e.dataTransfer.files);
        }}
      >
        {fileInput}
        {body}
      </div>
    </Modal>
  );
}
