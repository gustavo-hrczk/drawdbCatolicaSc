import { DB } from "../../data/constants";
import { exportSQL } from "../../utils/exportSQL";
import {
  jsonToMariaDB,
  jsonToMySQL,
  jsonToOracleSQL,
  jsonToPostgreSQL,
  jsonToSQLite,
  jsonToSQLServer,
} from "../../utils/exportSQL/generic";

// SQL dos arquivos de entrega. Chama os exportadores do upstream exatamente
// como o menu "Exportar SQL" (ControlPanel.jsx) e não acrescenta nada: o SQL
// de uma entrega tem de poder ir para produção sem nenhuma linha nossa.

const GENERIC_EXPORTERS = {
  [DB.POSTGRES]: jsonToPostgreSQL,
  [DB.MYSQL]: jsonToMySQL,
  [DB.MARIADB]: jsonToMariaDB,
  [DB.SQLITE]: jsonToSQLite,
  [DB.MSSQL]: jsonToSQLServer,
  [DB.ORACLESQL]: jsonToOracleSQL,
};

export const SQL_DIALECTS = Object.keys(GENERIC_EXPORTERS);

// Dialeto usado para um diagrama: o do próprio diagrama ou, se ele for
// "Genérico", o escolhido na exportação.
export function sqlDialectFor(database, preferredDialect) {
  return database === DB.GENERIC ? preferredDialect : database;
}

// diagram: { database, tables, relationships, types, enums, views }
export function diagramSql(diagram, dialect) {
  const { database, tables, relationships, types, enums, views } = diagram;
  if (database === DB.GENERIC) {
    const exporter = GENERIC_EXPORTERS[dialect];
    if (!exporter) throw new Error(`unknown SQL dialect: ${dialect}`);
    return exporter({
      tables,
      references: relationships,
      types,
      database,
      views,
    });
  }
  return exportSQL({
    tables,
    references: relationships,
    types,
    database,
    enums,
    views,
  });
}

// BOM (U+FEFF) que alguns editores e downloads colocam no início do arquivo.
const BOM = String.fromCharCode(0xfeff);
const BOM_AT_START = new RegExp(`^${BOM}`);

export function stripBom(text) {
  return String(text ?? "").replace(BOM_AT_START, "");
}

// Forma comparável do SQL: ignora BOM, tipo de quebra de linha e espaços no
// fim do arquivo, que editores e downloads costumam mudar sem alterar o SQL.
export function normalizeSql(text) {
  return String(text ?? "")
    .replace(BOM_AT_START, "")
    .replace(/\r\n?/g, "\n")
    .trimEnd();
}

export async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function sqlFingerprint(text) {
  return sha256Hex(normalizeSql(text));
}
