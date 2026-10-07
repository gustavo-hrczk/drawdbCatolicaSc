import { useEffect, useState } from "react";
import { Button, Modal, Select, Toast } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";
import { saveAs } from "file-saver";
import { v4 as uuidv4 } from "uuid";
import {
  useAreas,
  useDiagram,
  useEnums,
  useNotes,
  useSettings,
  useTransform,
  useTypes,
  useViews,
} from "../hooks";
import { DB } from "../data/constants";
import { databases } from "../data/databases";
import { db } from "../data/db";
import { toDBML } from "../utils/exportAs/dbml";
import { jsonToMermaid } from "../utils/exportAs/mermaid";
import { jsonToDocumentation } from "../utils/exportAs/documentation";
import {
  diagramBlob,
  diagramPdfBlob,
  diagramSvgBlob,
  EmptyDiagramError,
} from "./canvasImage";
import { preferredSqlDialect } from "./databasePreference";
import { fileStamp, safeBaseName } from "./files/naming";
import {
  diagramSql,
  SQL_DIALECTS,
  sqlDialectFor,
  sqlFingerprint,
} from "./files/sql";
import { buildDiagramJson, serializeDiagramJson } from "./files/diagramJson";
import { buildPackage, packageReadme } from "./files/zipPackage";

// Janela "Exportar" (Arquivo > Exportar), que reúne o que antes ficava em
// "Exportar para entrega", "Exportar SQL" e "Exportar como". A ordem das
// seções é a mesma da janela Importar: diagrama completo, SQL, imagem e
// outros formatos. O SQL é exatamente o dos exportadores do upstream.

const GROUPS = [
  { id: "complete", options: ["zip", "pair", "json"] },
  { id: "sql", options: ["sql"] },
  { id: "image", options: ["png", "jpeg", "svg", "pdf"] },
  { id: "other", options: ["dbml", "mermaid", "markdown"] },
];

// Opções que geram SQL: em diagramas "Genérico", pedem o banco de dados.
const USES_DIALECT = new Set(["zip", "pair", "sql"]);
// Opções de texto, que também podem ser vistas e copiadas antes de baixar.
const CODE_EXTENSION = {
  sql: "sql",
  dbml: "dbml",
  mermaid: "md",
  markdown: "md",
};
const SECOND_DOWNLOAD_DELAY_MS = 500;

const fileNamesFor = (base) => ({
  zip: [`${base}.zip`],
  pair: [`${base}.sql`, `${base}.json`],
  json: [`${base}.json`],
  sql: [`${base}.sql`],
  png: [`${base}.png`],
  jpeg: [`${base}.jpg`],
  svg: [`${base}.svg`],
  pdf: [`${base}.pdf`],
  dbml: [`${base}.dbml`],
  mermaid: [`${base}_mermaid.md`],
  markdown: [`${base}_documentacao.md`],
});

const textBlob = (text, type = "text/plain") =>
  new Blob([text], { type: `${type};charset=utf-8` });

const withoutExtension = (name) => name.replace(/\.[^.]+$/, "");

export default function ExportDialog({
  visible,
  onClose,
  title,
  diagramId,
  onShowCode,
}) {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const { tables, relationships, database } = useDiagram();
  const { notes } = useNotes();
  const { areas } = useAreas();
  const { views } = useViews();
  const { types } = useTypes();
  const { enums } = useEnums();
  const { transform } = useTransform();

  const [option, setOption] = useState("zip");
  const [dialect, setDialect] = useState(() => preferredSqlDialect(settings));
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => new Date());

  // Ao abrir a janela: horário novo no nome dos arquivos e o banco de dados
  // preferido para o SQL de diagramas genéricos.
  useEffect(() => {
    if (!visible) return;
    setNow(new Date());
    setDialect(preferredSqlDialect(settings));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const isGeneric = database === DB.GENERIC;
  const sqlDialect = sqlDialectFor(database, dialect);
  const fileBase = `${safeBaseName(title)}_${fileStamp(now)}`;
  const fileNames = fileNamesFor(fileBase);

  const diagram = () => ({
    title,
    database,
    tables,
    relationships,
    notes,
    areas,
    views,
    types,
    enums,
    pan: transform.pan,
    zoom: transform.zoom,
  });

  const textFor = (kind) => {
    switch (kind) {
      case "sql":
        return diagramSql(diagram(), sqlDialect);
      case "dbml":
        return toDBML({ tables, relationships, enums, database });
      case "mermaid":
        return jsonToMermaid({
          tables,
          relationships,
          notes,
          subjectAreas: areas,
          database,
          title,
        });
      case "markdown":
        return jsonToDocumentation({
          tables,
          relationships,
          notes,
          subjectAreas: areas,
          views,
          database,
          title,
          ...(databases[database].hasTypes && { types }),
          ...(databases[database].hasEnums && { enums }),
        });
      default:
        return "";
    }
  };

  const buildFiles = async () => {
    const exportedAt = new Date();
    const sql = textFor("sql");
    const record = diagramId
      ? await db.diagrams.where("diagramId").equals(diagramId).first()
      : null;
    const json = serializeDiagramJson(
      buildDiagramJson(diagram(), {
        exportId: uuidv4(),
        exportedAt,
        createdAt: record?.createdAt,
        modifiedAt: record?.lastModified,
        dialect: sqlDialect,
        sqlFingerprint: await sqlFingerprint(sql),
      }),
    );
    return { sql, json, exportedAt };
  };

  const run = async (task) => {
    setBusy(true);
    try {
      const files = await task();
      Toast.success(t("export_started", { files: files.join(", ") }));
      onClose();
    } catch (err) {
      if (err instanceof EmptyDiagramError) {
        Toast.info(t("image_empty_diagram"));
      } else {
        console.error(err);
        Toast.error(t("export_failed"));
      }
    } finally {
      setBusy(false);
    }
  };

  const save = (blob, name) => {
    saveAs(blob, name);
    return [name];
  };

  const downloadSqlFile = async () =>
    save(
      textBlob((await buildFiles()).sql, "application/sql"),
      fileNames.sql[0],
    );

  const downloadJsonFile = async () =>
    save(
      textBlob((await buildFiles()).json, "application/json"),
      fileNames.json[0],
    );

  const downloadPair = async () => {
    const { sql, json } = await buildFiles();
    saveAs(textBlob(sql, "application/sql"), fileNames.pair[0]);
    // Um pequeno intervalo ajuda o navegador a aceitar o segundo download.
    await new Promise((resolve) =>
      setTimeout(resolve, SECOND_DOWNLOAD_DELAY_MS),
    );
    saveAs(textBlob(json, "application/json"), fileNames.pair[1]);
    return fileNames.pair;
  };

  const downloadZip = async () => {
    const { sql, json, exportedAt } = await buildFiles();
    // A imagem é um extra: se não puder ser gerada, o pacote sai sem ela.
    let png = null;
    try {
      png = (await diagramBlob({ scale: 2 })).blob;
    } catch (err) {
      if (!(err instanceof EmptyDiagramError)) console.warn(err);
    }
    const readme = packageReadme({
      title,
      exportedAt: exportedAt.toLocaleString(),
      dialectLabel: databases[sqlDialect]?.name,
      baseName: fileBase,
      hasImage: Boolean(png),
    });
    const zip = await buildPackage({
      baseName: fileBase,
      sql,
      json,
      png,
      readme,
    });
    return save(zip, fileNames.zip[0]);
  };

  const downloads = {
    zip: downloadZip,
    pair: downloadPair,
    json: downloadJsonFile,
    sql: downloadSqlFile,
    png: async () =>
      save((await diagramBlob({ scale: 2 })).blob, fileNames.png[0]),
    jpeg: async () =>
      save(
        (await diagramBlob({ type: "image/jpeg", quality: 0.95, scale: 2 }))
          .blob,
        fileNames.jpeg[0],
      ),
    svg: async () => save(diagramSvgBlob(), fileNames.svg[0]),
    pdf: async () => save(await diagramPdfBlob(), fileNames.pdf[0]),
    dbml: async () => save(textBlob(textFor("dbml")), fileNames.dbml[0]),
    mermaid: async () =>
      save(textBlob(textFor("mermaid")), fileNames.mermaid[0]),
    markdown: async () =>
      save(textBlob(textFor("markdown")), fileNames.markdown[0]),
  };

  // Mostra o código na janela de código do upstream (com botão de copiar).
  const showCode = () => {
    onShowCode({
      data: textFor(option),
      extension: CODE_EXTENSION[option],
      filename: withoutExtension(fileNames[option][0]),
    });
    onClose();
  };

  const footer = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {CODE_EXTENSION[option] && (
        <Button disabled={busy} onClick={showCode}>
          {t("export_view_code")}
        </Button>
      )}
      {option === "pair" && (
        <>
          <Button disabled={busy} onClick={() => run(downloadSqlFile)}>
            {t("export_download_sql_only")}
          </Button>
          <Button disabled={busy} onClick={() => run(downloadJsonFile)}>
            {t("export_download_json_only")}
          </Button>
        </>
      )}
      <Button
        theme="solid"
        loading={busy}
        onClick={() => run(downloads[option])}
      >
        {option === "pair" ? t("export_download_both") : t("export_download")}
      </Button>
    </div>
  );

  return (
    <Modal
      title={t("export_dialog_title")}
      visible={visible}
      onCancel={onClose}
      centered
      width={680}
      footer={footer}
    >
      <div className="grid grid-cols-[210px_1fr] gap-4 sm:grid-cols-1">
        <div role="radiogroup" className="flex flex-col gap-3">
          {GROUPS.map((group) => (
            <div key={group.id}>
              <div className="mb-1 px-2 text-xs font-semibold uppercase opacity-60">
                {t(`export_group_${group.id}`)}
              </div>
              {group.options.map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={option === value}
                  onClick={() => setOption(value)}
                  className="block w-full rounded px-2 py-1 text-start"
                  style={
                    option === value
                      ? {
                          background: "var(--semi-color-primary-light-default)",
                          color: "var(--semi-color-primary)",
                          fontWeight: 600,
                        }
                      : undefined
                  }
                >
                  {t(`export_option_${value}`)}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <div className="mb-1 font-semibold">
              {t(`export_option_${option}`)}
            </div>
            <div className="text-sm opacity-80">
              {t(`export_option_${option}_hint`)}
            </div>
          </div>

          {isGeneric && USES_DIALECT.has(option) && (
            <div>
              <div className="mb-1 font-semibold">{t("export_dialect")}</div>
              <Select
                value={dialect}
                onChange={setDialect}
                className="w-full"
                optionList={SQL_DIALECTS.map((value) => ({
                  value,
                  label: databases[value].name,
                }))}
              />
              <div className="mt-1 text-xs opacity-70">
                {t("export_dialect_hint")}
              </div>
            </div>
          )}

          <div>
            <div className="mb-1 font-semibold">{t("export_files")}</div>
            {fileNames[option].map((name) => (
              <div key={name} className="break-all font-mono text-xs">
                {name}
              </div>
            ))}
            {option === "pair" && (
              <div className="mt-2 text-xs opacity-70">
                {t("export_multiple_downloads_hint")}
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
