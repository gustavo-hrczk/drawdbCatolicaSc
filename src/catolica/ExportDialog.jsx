import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Modal,
  Radio,
  RadioGroup,
  Select,
  Toast,
} from "@douyinfe/semi-ui";
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
import { diagramBlob, EmptyDiagramError } from "./canvasImage";
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

// Janela "Exportar para entrega" (Sprint 1C): só o SQL, SQL + JSON ou o pacote
// ZIP. O SQL é exatamente o dos exportadores do upstream; o desenho vai no
// .json; o .zip junta os dois com uma imagem e um LEIA-ME.

const OPTIONS = ["zip", "pair", "sql"];
const SECOND_DOWNLOAD_DELAY_MS = 500;

const textBlob = (text, type) =>
  new Blob([text], { type: `${type};charset=utf-8` });

export default function ExportDialog({ visible, onClose, title, diagramId }) {
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
  const fileNames = useMemo(
    () => ({
      zip: [`${fileBase}.zip`],
      pair: [`${fileBase}.sql`, `${fileBase}.json`],
      sql: [`${fileBase}.sql`],
    }),
    [fileBase],
  );

  const buildFiles = async () => {
    const exportedAt = new Date();
    const diagram = {
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
    };
    const sql = diagramSql(diagram, sqlDialect);
    const record = diagramId
      ? await db.diagrams.where("diagramId").equals(diagramId).first()
      : null;
    const json = serializeDiagramJson(
      buildDiagramJson(diagram, {
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
      console.error(err);
      Toast.error(t("export_failed"));
    } finally {
      setBusy(false);
    }
  };

  const downloadSql = () =>
    run(async () => {
      const { sql } = await buildFiles();
      saveAs(textBlob(sql, "application/sql"), `${fileBase}.sql`);
      return [`${fileBase}.sql`];
    });

  const downloadJson = () =>
    run(async () => {
      const { json } = await buildFiles();
      saveAs(textBlob(json, "application/json"), `${fileBase}.json`);
      return [`${fileBase}.json`];
    });

  const downloadPair = () =>
    run(async () => {
      const { sql, json } = await buildFiles();
      saveAs(textBlob(sql, "application/sql"), `${fileBase}.sql`);
      // Um pequeno intervalo ajuda o navegador a aceitar o segundo download.
      await new Promise((resolve) =>
        setTimeout(resolve, SECOND_DOWNLOAD_DELAY_MS),
      );
      saveAs(textBlob(json, "application/json"), `${fileBase}.json`);
      return fileNames.pair;
    });

  const downloadZip = () =>
    run(async () => {
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
      saveAs(zip, `${fileBase}.zip`);
      return fileNames.zip;
    });

  const footer = {
    zip: (
      <Button theme="solid" loading={busy} onClick={downloadZip}>
        {t("export_download")}
      </Button>
    ),
    sql: (
      <Button theme="solid" loading={busy} onClick={downloadSql}>
        {t("export_download")}
      </Button>
    ),
    pair: (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button disabled={busy} onClick={downloadSql}>
          {t("export_download_sql_only")}
        </Button>
        <Button disabled={busy} onClick={downloadJson}>
          {t("export_download_json_only")}
        </Button>
        <Button theme="solid" loading={busy} onClick={downloadPair}>
          {t("export_download_both")}
        </Button>
      </div>
    ),
  }[option];

  return (
    <Modal
      title={t("export_dialog_title")}
      visible={visible}
      onCancel={onClose}
      centered
      width={520}
      footer={footer}
    >
      <RadioGroup
        type="pureCard"
        direction="vertical"
        value={option}
        onChange={(e) => setOption(e.target.value)}
        className="w-full"
      >
        {OPTIONS.map((value) => (
          <Radio
            key={value}
            value={value}
            extra={t(`export_option_${value}_hint`)}
            className="w-full"
          >
            {t(`export_option_${value}`)}
          </Radio>
        ))}
      </RadioGroup>

      {isGeneric && (
        <div className="mt-4">
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

      <div className="mt-4">
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
    </Modal>
  );
}
