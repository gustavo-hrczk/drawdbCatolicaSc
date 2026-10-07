import { useEffect, useState } from "react";
import { Button, Input, Modal, Select, Toast } from "@douyinfe/semi-ui";
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
import { DialogFooter, Notice, SectionTitle } from "./dialogParts";
import { fileStamp, safeBaseName } from "./files/naming";
import {
  diagramSql,
  SQL_DIALECTS,
  sqlDialectFor,
  sqlFingerprint,
} from "./files/sql";
import { buildDiagramJson, serializeDiagramJson } from "./files/diagramJson";
import { buildPackage, packageReadme } from "./files/zipPackage";

// Janela "Exportar" (Arquivo > Exportar). A ordem das seções é a mesma da
// janela Importar: SQL, diagrama completo, imagem e outros formatos. O SQL é
// exatamente o dos exportadores do upstream; o diagrama completo é sempre o
// pacote .zip (SQL, .json, imagem e LEIA-ME).
//
// As descrições dizem o que cada arquivo é ou contém, sem indicar usos.

const GROUPS = [
  { id: "sql", options: ["sql"] },
  { id: "complete", options: ["zip"] },
  { id: "image", options: ["png", "jpeg", "svg", "pdf"] },
  { id: "other", options: ["dbml", "mermaid", "markdown"] },
];

// Opções que geram SQL: em diagramas "Genérico", pedem o banco de dados.
const USES_DIALECT = new Set(["sql", "zip"]);
// Opções geradas a partir das tabelas (sem tabelas, não há o que gerar).
const NEEDS_TABLES = new Set(["sql", "dbml", "mermaid", "markdown"]);
// Opções de texto, que também podem ser vistas e copiadas antes de baixar.
const CODE_EXTENSION = {
  sql: "sql",
  dbml: "dbml",
  mermaid: "md",
  markdown: "md",
};

const fileNameFor = (base, option) =>
  ({
    zip: `${base}.zip`,
    sql: `${base}.sql`,
    png: `${base}.png`,
    jpeg: `${base}.jpg`,
    svg: `${base}.svg`,
    pdf: `${base}.pdf`,
    dbml: `${base}.dbml`,
    mermaid: `${base}_mermaid.md`,
    markdown: `${base}_documentacao.md`,
  })[option];

const textBlob = (text, type = "text/plain") =>
  new Blob([text], { type: `${type};charset=utf-8` });

const withoutExtension = (name) => name.replace(/\.[^.]+$/, "");

export default function ExportDialog({
  visible,
  onClose,
  title,
  setTitle,
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

  const [option, setOption] = useState("sql");
  const [name, setName] = useState(title);
  const [dialect, setDialect] = useState(() => preferredSqlDialect(settings));
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => new Date());

  // Ao abrir a janela: nome atual do diagrama, horário novo no nome dos
  // arquivos e o banco de dados preferido para diagramas genéricos.
  useEffect(() => {
    if (!visible) return;
    setName(title);
    setNow(new Date());
    setDialect(preferredSqlDialect(settings));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const trimmedName = name.trim();
  const isGeneric = database === DB.GENERIC;
  const sqlDialect = sqlDialectFor(database, dialect);
  const fileBase = `${safeBaseName(trimmedName || title)}_${fileStamp(now)}`;
  const fileName = fileNameFor(fileBase, option);

  const isEmpty =
    tables.length === 0 &&
    notes.length === 0 &&
    areas.length === 0 &&
    views.length === 0;
  const unavailable = isEmpty
    ? t("export_empty_diagram")
    : NEEDS_TABLES.has(option) && tables.length === 0
      ? t("export_no_tables")
      : null;

  const diagram = () => ({
    title: trimmedName,
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
          title: trimmedName,
        });
      case "markdown":
        return jsonToDocumentation({
          tables,
          relationships,
          notes,
          subjectAreas: areas,
          views,
          database,
          title: trimmedName,
          ...(databases[database].hasTypes && { types }),
          ...(databases[database].hasEnums && { enums }),
        });
      default:
        return "";
    }
  };

  // O nome escrito aqui também renomeia o diagrama.
  const applyName = () => {
    if (trimmedName !== title) setTitle(trimmedName);
  };

  const packageBlob = async () => {
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
    // A imagem é um extra: se não puder ser gerada, o pacote sai sem ela.
    let png = null;
    try {
      png = (await diagramBlob({ scale: 2 })).blob;
    } catch (err) {
      if (!(err instanceof EmptyDiagramError)) console.warn(err);
    }
    const readme = packageReadme({
      title: trimmedName,
      exportedAt: exportedAt.toLocaleString(),
      dialectLabel: databases[sqlDialect]?.name,
      baseName: fileBase,
      hasImage: Boolean(png),
    });
    return buildPackage({ baseName: fileBase, sql, json, png, readme });
  };

  const blobFor = {
    zip: packageBlob,
    sql: async () => textBlob(textFor("sql"), "application/sql"),
    png: async () => (await diagramBlob({ scale: 2 })).blob,
    jpeg: async () =>
      (await diagramBlob({ type: "image/jpeg", quality: 0.95, scale: 2 })).blob,
    svg: async () => diagramSvgBlob(),
    pdf: diagramPdfBlob,
    dbml: async () => textBlob(textFor("dbml")),
    mermaid: async () => textBlob(textFor("mermaid")),
    markdown: async () => textBlob(textFor("markdown")),
  };

  const download = async () => {
    setBusy(true);
    try {
      saveAs(await blobFor[option](), fileName);
      applyName();
      Toast.success(t("export_started", { files: fileName }));
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

  // Mostra o código na janela de código do upstream (com botão de copiar).
  const showCode = () => {
    applyName();
    onShowCode({
      data: textFor(option),
      extension: CODE_EXTENSION[option],
      filename: withoutExtension(fileName),
    });
    onClose();
  };

  const blocked = Boolean(unavailable) || !trimmedName;

  const footer = (
    <DialogFooter>
      <Button onClick={onClose}>{t("cancel")}</Button>
      {CODE_EXTENSION[option] && (
        <Button disabled={blocked || busy} onClick={showCode}>
          {t("export_view_code")}
        </Button>
      )}
      <Button
        theme="solid"
        loading={busy}
        disabled={blocked}
        onClick={download}
      >
        {t("export_download")}
      </Button>
    </DialogFooter>
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
      <div className="mb-4">
        <div className="mb-1 font-semibold">{t("export_name")}</div>
        <Input
          value={name}
          onChange={setName}
          placeholder={t("export_name")}
          validateStatus={trimmedName ? "default" : "error"}
        />
      </div>

      <div className="grid grid-cols-[210px_1fr] gap-4 sm:grid-cols-1">
        <div role="radiogroup" className="flex flex-col gap-3">
          {GROUPS.map((group) => (
            <div key={group.id}>
              <SectionTitle>{t(`export_group_${group.id}`)}</SectionTitle>
              {group.options.map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={option === value}
                  onClick={() => setOption(value)}
                  className="block w-full rounded px-2 py-1 text-start text-sm"
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

        {/* "Arquivo gerado" fica sempre no rodapé desta coluna, na mesma
            altura para qualquer opção. */}
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

          {unavailable && <Notice type="info">{unavailable}</Notice>}

          <div className="mt-auto">
            <div className="mb-1 font-semibold">{t("export_file")}</div>
            <div className="break-all font-mono text-xs">{fileName}</div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
