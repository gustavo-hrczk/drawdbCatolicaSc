import { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Modal,
  Select,
  Spin,
  TextArea,
  Toast,
} from "@douyinfe/semi-ui";
import { IconChevronLeft, IconUpload } from "@douyinfe/semi-icons";
import { useTranslation } from "react-i18next";
import { useNavigateWithParams, useSettings } from "../hooks";
import { databases } from "../data/databases";
import { appUrl } from "../utils/appUrl";
import { autoArrange } from "../utils/autoArrange";
import { getTableHeight, getTableWidth } from "../utils/utils";
import { preferredDatabase, preferredSqlDialect } from "./databasePreference";
import { findDuplicate, importAsNewDiagram } from "./importAsNewDiagram";
import { untitledTitle } from "./i18n";
import { DialogFooter, Notice, Summary } from "./dialogParts";
import { planImport } from "./files/importPlan";
import { parseSqlDiagram } from "./files/sqlImport";
import { parseDbmlDiagram } from "./files/dbmlImport";
import { SQL_DIALECTS } from "./files/sql";
import { LIMITS } from "./files/zipPackage";

// Janela "Importar" (Arquivo > Importar, Ctrl+I): SQL (arquivo ou código
// colado), diagrama completo (.zip ou .json) ou DBML. Mostra um resumo antes
// de abrir, avisa se o diagrama já existe neste navegador e, se os arquivos
// tiverem mais de um diagrama, pede para escolher. O importado é sempre salvo
// como um diagrama novo e aberto em uma nova janela; o desta não muda.

const ACCEPT = ".sql,.zip,.json,.ddb,.dbml,.rar";

const withoutExtension = (name) => name.replace(/\.[^.]+$/, "");

const diagramUrl = (diagramId) =>
  appUrl(`/editor/diagrams/${diagramId}${window.location.search}`);

// Formata a data gravada no arquivo (ISO com fuso) no formato local.
function formatDate(iso) {
  const date = iso ? new Date(iso) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : null;
}

function formatBytes(bytes) {
  const mb = bytes / (1024 * 1024);
  const number = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: mb >= 10 ? 0 : 1,
  });
  return mb >= 1
    ? `${number.format(mb)} MB`
    : `${number.format(bytes / 1024)} KB`;
}

function errorText(t, { error, detail }) {
  if (error === "sql_syntax" || error === "dbml_syntax") {
    return detail
      ? t(`import_error_${error}`, detail)
      : t(`import_error_${error}_no_position`);
  }
  if (error === "too_large" && typeof detail === "object" && detail) {
    return t("import_error_too_large_size", {
      name: detail.name,
      size: formatBytes(detail.size),
      limit: formatBytes(detail.limit),
    });
  }
  return t(`import_error_${error}`, {
    name: (typeof detail === "string" ? detail : detail?.name) ?? "",
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
  // Antes de ler: um arquivo enorme nem é carregado na memória.
  const tooLarge = files.find((file) => file.size > LIMITS.maxZipBytes);
  if (tooLarge) {
    return {
      ok: false,
      error: "too_large",
      detail: {
        name: tooLarge.name,
        size: tooLarge.size,
        limit: LIMITS.maxZipBytes,
      },
    };
  }
  const inputs = await Promise.all(
    files.map(async (file) => ({
      name: file.name,
      bytes: new Uint8Array(await file.arrayBuffer()),
    })),
  );
  return planImport(inputs);
}

const fileTitle = (file) =>
  file.name ? withoutExtension(file.name) : untitledTitle();

// Título e detalhes de um diagrama encontrado nos arquivos.
function describeCandidate(t, candidate) {
  if (candidate.kind === "sql" || candidate.kind === "dbml") {
    const file = candidate[candidate.kind];
    return {
      title: fileTitle(file),
      details: [candidate.location, t(`import_kind_${candidate.kind}`)],
    };
  }
  const { data, meta, name } = candidate.diagram;
  return {
    title: data.title || withoutExtension(name),
    details: [
      candidate.location,
      t(`import_kind_${candidate.kind}`),
      t("import_tables_count", { count: data.tables.length }),
      formatDate(meta?.exportadoEm),
    ],
  };
}

export default function ImportDialog({ visible, onClose, currentDiagramId }) {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const navigate = useNavigateWithParams();
  const inputRef = useRef(null);

  const [reading, setReading] = useState(false);
  const [dragging, setDragging] = useState(false);
  // Resultado da leitura com mais de um diagrama (a pessoa escolhe qual).
  const [choices, setChoices] = useState(null);
  const [chosen, setChosen] = useState(0);
  // Diagrama a abrir (ou o erro da leitura).
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
    setChoices(null);
    setChosen(0);
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

  // Mostra o resumo de um diagrama e confere se ele já existe aqui.
  const showPlan = async (next) => {
    setUseSql(false);
    setDuplicate(null);
    if (next.ok && next.diagram) {
      const { data, meta } = next.diagram;
      setDuplicate((await findDuplicate(data, meta?.exportId)) ?? null);
      if (meta?.dialetoSql && databases[meta.dialetoSql]) {
        setDialect(meta.dialetoSql);
      }
    }
    setPlan(next);
  };

  const handleFiles = async (fileList) => {
    if (!fileList?.length) return;
    reset();
    setReading(true);
    try {
      const result = await readInputs(fileList);
      if (result.ok && result.kind === "choose") setChoices(result);
      else await showPlan(result);
    } catch (err) {
      console.error(err);
      setPlan({ ok: false, error: "invalid_zip" });
    } finally {
      setReading(false);
    }
  };

  const chooseCandidate = (index) => {
    const { ignored, warnings } = choices;
    showPlan({ ok: true, ...choices.candidates[index], ignored, warnings });
  };

  const usePastedSql = () => {
    showPlan({
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

  // Convertido de novo a cada troca de banco de dados.
  const parsed = useMemo(() => {
    if (openingSql) return parseSqlDiagram(plan.sql.text, dialect);
    if (openingDbml) return parseDbmlDiagram(plan.dbml.text, dbmlDatabase);
    return null;
  }, [openingSql, openingDbml, plan, dialect, dbmlDatabase]);

  // Abre em nova janela. Ela é aberta já no clique (senão o navegador a
  // bloqueia) e recebe o endereço quando o diagrama estiver salvo. Se o
  // navegador bloquear mesmo assim, abre nesta.
  const openInNewWindow = async (createDiagram) => {
    const target = window.open("", "_blank");
    try {
      const { diagramId, title } = await createDiagram();
      onClose();
      if (target && !target.closed) {
        target.location.href = diagramUrl(diagramId);
        Toast.success(t("diagram_imported_new_window", { title }));
      } else {
        navigate(`/editor/diagrams/${diagramId}`);
        Toast.success(t("diagram_imported", { title }));
      }
    } catch (err) {
      target?.close();
      throw err;
    }
  };

  const importDiagram = () => {
    setImporting(true);
    openInNewWindow(async () => {
      let data;
      let source = null;
      if (openingSql || openingDbml) {
        data = {
          ...arrangeImported(parsed.data, settings),
          title: fileTitle(openingSql ? plan.sql : plan.dbml),
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
    openInNewWindow(async () => ({
      diagramId: duplicate.diagramId,
      title: duplicate.name,
    }));
  };

  const pickFiles = () => inputRef.current?.click();
  const cancel = <Button onClick={onClose}>{t("cancel")}</Button>;
  const chooseOther = (
    <Button onClick={pickFiles} disabled={importing}>
      {t("import_choose_other")}
    </Button>
  );

  const dropZone = (
    <div className="flex flex-col gap-3">
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
            <div className="text-xs opacity-70">
              <div>{t("import_accepted")}</div>
              <div>{t("import_opens_new_window")}</div>
            </div>
          </>
        )}
      </div>
      {!reading && (
        <div className="pb-1 text-center">
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

  // Arquivos ignorados e arquivos de diagrama que não puderam ser lidos.
  const fileNotes = plan?.ok && (
    <>
      {plan.warnings?.length > 0 && (
        <Notice type="warning">
          {plan.warnings.map((warning) => (
            <div key={warning.detail}>
              {warning.detail}: {errorText(t, warning)}
            </div>
          ))}
        </Notice>
      )}
    </>
  );
  const ignoredRow = [
    t("import_ignored"),
    plan?.ignored?.length ? plan.ignored.join(", ") : null,
  ];

  let body;
  let footer;

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
      <DialogFooter
        extra={
          <Button onClick={() => setPastedSql(null)}>{t("import_back")}</Button>
        }
      >
        {cancel}
        <Button
          theme="solid"
          disabled={!pastedSql.trim()}
          onClick={usePastedSql}
        >
          {t("import_continue")}
        </Button>
      </DialogFooter>
    );
  } else if (reading || (!plan && !choices)) {
    body = dropZone;
    footer = <DialogFooter>{cancel}</DialogFooter>;
  } else if (plan && !plan.ok) {
    body = (
      <div className="flex flex-col gap-3">
        <Notice type="danger">{errorText(t, plan)}</Notice>
        {dropZone}
      </div>
    );
    footer = <DialogFooter>{cancel}</DialogFooter>;
  } else if (!plan) {
    body = (
      <div className="flex flex-col gap-3">
        <div className="text-sm">
          {t("import_choose_intro", { count: choices.candidates.length })}
        </div>
        <div
          role="radiogroup"
          className="flex max-h-80 flex-col gap-1 overflow-auto"
        >
          {choices.candidates.map((candidate, index) => {
            const { title, details } = describeCandidate(t, candidate);
            const selected = index === chosen;
            return (
              <button
                key={index}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setChosen(index)}
                onDoubleClick={() => chooseCandidate(index)}
                className="rounded-md border px-3 py-2 text-start"
                style={{
                  borderColor: selected
                    ? "var(--semi-color-primary)"
                    : "var(--semi-color-border)",
                  background: selected
                    ? "var(--semi-color-primary-light-default)"
                    : undefined,
                }}
              >
                <div className="font-semibold">{title}</div>
                <div className="text-xs opacity-70">
                  {details.filter(Boolean).join(" · ")}
                </div>
              </button>
            );
          })}
        </div>
        {choices.ignored?.length > 0 && (
          <div className="text-xs opacity-70">
            {t("import_ignored")}: {choices.ignored.join(", ")}
          </div>
        )}
      </div>
    );
    footer = (
      <DialogFooter extra={chooseOther}>
        {cancel}
        <Button theme="solid" onClick={() => chooseCandidate(chosen)}>
          {t("import_continue")}
        </Button>
      </DialogFooter>
    );
  } else {
    let canImport;
    if (openingSql || openingDbml) {
      canImport = parsed?.ok;
      const file = openingSql ? plan.sql : plan.dbml;
      body = (
        <div className="flex flex-col gap-3">
          <Summary
            rows={[
              [t("title"), fileTitle(file)],
              [t("import_from_package"), plan.location],
              [
                t("import_tables"),
                parsed?.ok ? parsed.data.tables.length : null,
              ],
              ignoredRow,
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
          {fileNotes}
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
              [t("import_from_package"), plan.location],
              ignoredRow,
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
          {fileNotes}
        </div>
      );
    }

    // Veio da lista de diagramas: link para voltar a ela.
    if (choices) {
      body = (
        <div className="flex flex-col gap-2">
          <div>
            <Button
              theme="borderless"
              size="small"
              icon={<IconChevronLeft />}
              disabled={importing}
              onClick={() => setPlan(null)}
            >
              {t("import_back_to_list")}
            </Button>
          </div>
          {body}
        </div>
      );
    }

    const offerExisting = duplicate && !openingSql;
    footer = (
      <DialogFooter extra={chooseOther}>
        {cancel}
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
      </DialogFooter>
    );
  }

  return (
    <Modal
      title={t("import_dialog_title")}
      visible={visible}
      onCancel={onClose}
      centered
      width={680}
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
