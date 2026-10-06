import { useEffect, useMemo, useRef, useState } from "react";
import { Banner, Button, Modal, Select, Spin, Toast } from "@douyinfe/semi-ui";
import { IconUpload } from "@douyinfe/semi-icons";
import { useTranslation } from "react-i18next";
import { useNavigateWithParams, useSettings } from "../hooks";
import { databases } from "../data/databases";
import { autoArrange } from "../utils/autoArrange";
import { getTableHeight, getTableWidth } from "../utils/utils";
import { preferredSqlDialect } from "./databasePreference";
import { findImportedCopy, importAsNewDiagram } from "./importAsNewDiagram";
import { planImport } from "./files/importPlan";
import { parseSqlDiagram } from "./files/sqlImport";
import { SQL_DIALECTS } from "./files/sql";
import { LIMITS } from "./files/zipPackage";

// Janela "Importar arquivo" (Sprint 1C): aceita o .json do diagrama, o .sql,
// os dois juntos ou o pacote .zip. Mostra um resumo antes de abrir e avisa se
// o mesmo arquivo já foi importado. O diagrama importado é sempre salvo como
// um diagrama novo; o aberto não muda.

const ACCEPT = ".json,.ddb,.sql,.zip,.rar";

const withoutExtension = (name) => name.replace(/\.[^.]+$/, "");

// Formata a data gravada no arquivo (ISO com fuso) no formato local.
function formatDate(iso) {
  const date = iso ? new Date(iso) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : null;
}

function errorText(t, { error, detail }) {
  if (error === "sql_syntax") {
    return detail
      ? t("import_error_sql_syntax", detail)
      : t("import_error_sql_syntax_no_position");
  }
  const key = `import_error_${error}`;
  return t(key, {
    name: detail ?? "",
    defaultValue: t("oops_smth_went_wrong"),
  });
}

// Um .sql não guarda o desenho: organiza as tabelas e enquadra o diagrama
// na área do editor (como o "Organizar automaticamente").
function arrangeSqlDiagram(data, settings) {
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

export default function ImportDialog({ visible, onClose }) {
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
  const [importing, setImporting] = useState(false);

  const reset = () => {
    setPlan(null);
    setDuplicate(null);
    setUseSql(false);
    setReading(false);
    setDragging(false);
    setImporting(false);
  };

  useEffect(() => {
    if (visible) {
      reset();
      setDialect(preferredSqlDialect(settings));
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

  const openingSql = plan?.ok && (plan.kind === "sql" || useSql);

  // O .sql é convertido de novo a cada troca de banco de dados.
  const sqlResult = useMemo(
    () => (openingSql ? parseSqlDiagram(plan.sql.text, dialect) : null),
    [openingSql, plan, dialect],
  );

  const openDiagram = (diagramId) => {
    onClose();
    navigate(`/editor/diagrams/${diagramId}`);
  };

  const importDiagram = async () => {
    setImporting(true);
    try {
      let data;
      let source = null;
      if (openingSql) {
        data = {
          ...arrangeSqlDiagram(sqlResult.data, settings),
          title: withoutExtension(plan.sql.name),
        };
      } else {
        data = plan.diagram.data;
        source = { exportId: plan.diagram.meta?.exportId };
      }
      const diagramId = await importAsNewDiagram(data, source);
      Toast.success(t("diagram_imported", { title: data.title }));
      openDiagram(diagramId);
    } catch (err) {
      console.error(err);
      Toast.error(t("oops_smth_went_wrong"));
      setImporting(false);
    }
  };

  const pickFiles = () => inputRef.current?.click();

  const dropZone = (
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
  let canImport = false;
  if (!plan || reading) {
    body = dropZone;
  } else if (!plan.ok) {
    body = (
      <>
        <Banner
          type="danger"
          fullMode={false}
          closeIcon={null}
          description={errorText(t, plan)}
        />
        <div className="mt-3">{dropZone}</div>
      </>
    );
  } else if (openingSql) {
    canImport = sqlResult?.ok;
    body = (
      <div className="flex flex-col gap-3">
        <Summary
          rows={[
            [t("title"), withoutExtension(plan.sql.name)],
            [t("import_from_package"), plan.fromZip],
            [
              t("import_tables"),
              sqlResult?.ok ? sqlResult.data.tables.length : null,
            ],
          ]}
        />
        <div>
          <div className="mb-1 font-semibold">{t("import_sql_dialect")}</div>
          <Select
            value={dialect}
            onChange={setDialect}
            className="w-full"
            optionList={SQL_DIALECTS.map((value) => ({
              value,
              label: databases[value].name,
            }))}
          />
        </div>
        {sqlResult?.ok ? (
          <Banner
            type="info"
            fullMode={false}
            closeIcon={null}
            description={t("import_sql_only")}
          />
        ) : (
          <Banner
            type="danger"
            fullMode={false}
            closeIcon={null}
            description={errorText(t, sqlResult)}
          />
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
          <Banner
            type="success"
            fullMode={false}
            closeIcon={null}
            description={t("import_sql_match")}
          />
        )}
        {plan.sqlCheck === "mismatch" && (
          <Banner
            type="warning"
            fullMode={false}
            closeIcon={null}
            description={
              <>
                <div>{t("import_sql_mismatch")}</div>
                <Button
                  size="small"
                  className="mt-2"
                  onClick={() => setUseSql(true)}
                >
                  {t("import_open_sql_instead")}
                </Button>
              </>
            }
          />
        )}
        {plan.sqlCheck === "not_checked" && (
          <Banner
            type="info"
            fullMode={false}
            closeIcon={null}
            description={t("import_sql_not_checked")}
          />
        )}
        {duplicate && (
          <Banner
            type="warning"
            fullMode={false}
            closeIcon={null}
            description={t("import_duplicate", { name: duplicate.name })}
          />
        )}
      </div>
    );
  }

  const footer = plan?.ok && !reading && (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button onClick={pickFiles} disabled={importing}>
        {t("import_choose_other")}
      </Button>
      {duplicate && !openingSql && (
        <Button onClick={() => openDiagram(duplicate.diagramId)}>
          {t("import_open_existing")}
        </Button>
      )}
      <Button
        theme="solid"
        disabled={!canImport}
        loading={importing}
        onClick={importDiagram}
      >
        {duplicate && !openingSql ? t("import_new_copy") : t("import_open")}
      </Button>
    </div>
  );

  return (
    <Modal
      title={t("import_dialog_title")}
      visible={visible}
      onCancel={onClose}
      centered
      width={520}
      footer={footer || null}
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
