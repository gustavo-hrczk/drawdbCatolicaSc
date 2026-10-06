import { DB } from "../data/constants";

// Banco de dados padrão (Sprint 1C). Ordem: escolha do usuário em
// Configurações → Banco de dados padrão (settings.defaultDatabase), depois o
// padrão da instalação (public/config.js: window.__DRAWDB_CONFIG__.
// defaultDatabase) e, por fim, PostgreSQL. Vale só para o que é novo: o banco
// sugerido para novos diagramas e o dialeto do SQL ao exportar diagramas
// "Genérico". Nunca muda diagramas existentes nem a leitura de arquivos.

const KNOWN = new Set(Object.values(DB));
const runtime =
  (typeof window !== "undefined" && window.__DRAWDB_CONFIG__) || {};

const INSTALL_DEFAULT = KNOWN.has(runtime.defaultDatabase)
  ? runtime.defaultDatabase
  : DB.POSTGRES;

export function preferredDatabase(settings) {
  return KNOWN.has(settings?.defaultDatabase)
    ? settings.defaultDatabase
    : INSTALL_DEFAULT;
}

// Dialeto do SQL para diagramas "Genérico": a preferência, se ela for um banco
// de verdade; senão PostgreSQL.
export function preferredSqlDialect(settings) {
  const preferred = preferredDatabase(settings);
  return preferred === DB.GENERIC ? DB.POSTGRES : preferred;
}
