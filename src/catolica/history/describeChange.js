import { Action, ObjectType } from "../../data/constants";

// Frase de cada passo da linha do tempo ("Tabela "clientes" criada"), a
// partir das entradas da pilha de desfazer do upstream. Devolve a chave de
// tradução e os parâmetros (o texto sai no idioma do editor na hora de
// mostrar), o tipo de ação (ícone) e, para propriedades, a lista de chaves
// alteradas (traduzidas com history_prop_<chave>).
//
// state: { tables, relationships, notes, areas, types, enums, views }, como
// estava logo depois da ação (os nomes ficam registrados como eram).
//
// Resultado: { key, params, kind, props?, hidden? } ou null (sem descrição:
// a linha do tempo usa a mensagem do upstream). hidden: ação que só muda a
// exibição (recolher colunas), fora da linha do tempo.

const VIEW_ONLY_PROPS = new Set(["collapsed"]);

const ELEMENT_KEY = {
  [ObjectType.TABLE]: "table",
  [ObjectType.AREA]: "area",
  [ObjectType.NOTE]: "note",
  [ObjectType.RELATIONSHIP]: "rel",
  [ObjectType.TYPE]: "type",
  [ObjectType.ENUM]: "enum",
  [ObjectType.VIEW]: "view",
};

const KIND = {
  [Action.ADD]: "add",
  [Action.DELETE]: "delete",
  [Action.MOVE]: "move",
  [Action.EDIT]: "edit",
};

// Por id; tipos antigos usam a posição na lista no lugar do id.
const byId = (list = [], id) =>
  list.find((item) => item.id === id) ??
  (typeof id === "number" ? list[id] : undefined);

const nameOf = (item) => item?.name ?? item?.title ?? "";

// Propriedades que aparecem juntas com um nome só (x e y = posição).
const PROP_GROUP = {
  x: "position",
  y: "position",
  width: "dimensions",
  height: "dimensions",
};

// Chaves alteradas, na ordem em que aparecem (sem as de exibição). Com undo e
// redo, só as que mudaram de fato (o redimensionamento de área grava a área
// inteira no redo).
function changedProps(entry) {
  const { undo, redo } = entry;
  let keys = Object.keys(redo ?? undo ?? {});
  if (undo && redo) {
    keys = keys.filter((key) => key in undo && undo[key] !== redo[key]);
  }
  const props = keys
    .filter((key) => !VIEW_ONLY_PROPS.has(key))
    .map((key) => PROP_GROUP[key] ?? key);
  return [...new Set(props)];
}

function onlyViewChange(entry) {
  const source = entry.redo ?? entry.undo;
  if (!source) return false;
  const keys = Object.keys(source);
  return keys.length > 0 && keys.every((key) => VIEW_ONLY_PROPS.has(key));
}

// Renomeação: redo com nome (ou título, nas notas) e nada mais.
function renameOf(entry) {
  const prop = entry.element === ObjectType.NOTE ? "title" : "name";
  const props = changedProps(entry);
  if (props.length !== 1 || props[0] !== prop) return null;
  const from = entry.undo?.[prop];
  const to = entry.redo?.[prop];
  if (from === undefined || to === undefined || from === to) return null;
  return { from, to };
}

function element(entry, state) {
  switch (entry.element) {
    case ObjectType.TABLE:
      return byId(state.tables, entry.tid ?? entry.id);
    case ObjectType.AREA:
      return byId(state.areas, entry.aid ?? entry.id);
    case ObjectType.NOTE:
      return byId(state.notes, entry.nid ?? entry.id);
    case ObjectType.RELATIONSHIP:
      return byId(state.relationships, entry.rid ?? entry.id);
    case ObjectType.TYPE:
      return byId(state.types, entry.tid ?? entry.id);
    case ObjectType.ENUM:
      return byId(state.enums, entry.id ?? entry.eid);
    case ObjectType.VIEW:
      return byId(state.views, entry.vid ?? entry.id);
    default:
      return null;
  }
}

// Nome do elemento criado ou excluído (os dados vêm na própria entrada; área
// e nota criadas não trazem dados: é a última da lista, o que só vale logo
// depois da ação, e não em passos antigos descritos depois, com live).
function addedOrDeletedName(entry, state, live) {
  const data = entry.data ?? {};
  switch (entry.element) {
    case ObjectType.TABLE:
      return nameOf(data.table);
    case ObjectType.RELATIONSHIP:
      return nameOf(data.relationship ?? data);
    case ObjectType.TYPE:
      return nameOf(data.type);
    case ObjectType.ENUM:
      return nameOf(data.enum);
    case ObjectType.VIEW:
      return nameOf(data.view);
    case ObjectType.AREA:
      return nameOf(entry.data) || (live ? "" : nameOf(state.areas?.at(-1)));
    case ObjectType.NOTE:
      return nameOf(entry.data) || (live ? "" : nameOf(state.notes?.at(-1)));
    default:
      return "";
  }
}

function describeMove(entry, state) {
  const elements = entry.elements ?? [];
  if (entry.view) {
    return { key: "history_arranged", params: {}, kind: "arrange" };
  }
  if (elements.length === 1) {
    const [moved] = elements;
    const kindKey = ELEMENT_KEY[moved.type];
    const item = element({ element: moved.type, id: moved.id }, state);
    if (kindKey && item) {
      return {
        key: `history_${kindKey}_move`,
        params: { name: nameOf(item) },
        kind: "move",
      };
    }
  }
  return {
    key: "history_moved_many",
    params: { count: elements.length },
    kind: "move",
  };
}

function describeTableEdit(entry, state) {
  const table = element(entry, state);
  const tableName = nameOf(table);
  const field = (fid) => table?.fields?.find((f) => f.id === fid);
  switch (entry.component) {
    case "field_add":
      return { key: "history_column_add", params: { table: tableName } };
    case "field_delete":
      return {
        key: "history_column_delete",
        params: { table: tableName, name: nameOf(entry.data?.field) },
      };
    case "field": {
      const props = changedProps(entry);
      if (props.length === 1 && props[0] === "name") {
        // Coluna nova (sem nome) recebendo o primeiro nome.
        if (!entry.undo.name) {
          return {
            key: "history_column_named",
            params: { table: tableName, name: entry.redo.name },
            kind: "rename",
          };
        }
        return {
          key: "history_column_rename",
          params: {
            table: tableName,
            from: entry.undo.name,
            to: entry.redo.name,
          },
          kind: "rename",
        };
      }
      return {
        key: "history_column_edit",
        params: { table: tableName, name: nameOf(field(entry.fid)) },
        props,
      };
    }
    case "index_add":
      return { key: "history_index_add", params: { table: tableName } };
    case "index_delete":
      return { key: "history_index_delete", params: { table: tableName } };
    case "index":
      return { key: "history_index_edit", params: { table: tableName } };
    case "unique_constraint_add":
      return { key: "history_unique_add", params: { table: tableName } };
    case "unique_constraint_delete":
      return { key: "history_unique_delete", params: { table: tableName } };
    case "unique_constraint":
      return { key: "history_unique_edit", params: { table: tableName } };
    default: {
      const rename = renameOf(entry);
      if (rename) {
        return { key: "history_table_rename", params: rename, kind: "rename" };
      }
      return {
        key: "history_table_edit",
        params: { name: tableName },
        props: changedProps(entry),
      };
    }
  }
}

function describeEdit(entry, state) {
  if (entry.element === ObjectType.TABLE)
    return describeTableEdit(entry, state);
  const kindKey = ELEMENT_KEY[entry.element];
  if (!kindKey) return null;
  const item = element(entry, state);
  if (entry.element === ObjectType.TYPE) {
    if (entry.component === "field_add") {
      return { key: "history_type_field_add", params: { name: nameOf(item) } };
    }
    if (entry.component === "field_delete") {
      return {
        key: "history_type_field_delete",
        params: { name: nameOf(item) },
      };
    }
  }
  const rename = renameOf(entry);
  if (rename) {
    return { key: `history_${kindKey}_rename`, params: rename, kind: "rename" };
  }
  return {
    key: `history_${kindKey}_edit`,
    params: { name: nameOf(item) },
    props: changedProps(entry),
  };
}

// options.live: passo antigo, sem frase registrada, descrito com o diagrama
// de agora (nomes que dependem do momento da ação ficam de fora).
export function describeChange(entry, state = {}, { live = false } = {}) {
  if (!entry || typeof entry !== "object") return null;
  if (entry.snapshot) {
    return {
      key: "history_version_restored",
      params: { name: entry.restoredVersion ?? "" },
      kind: "restore",
    };
  }
  if (entry.element === ObjectType.DBML) {
    return { key: "history_dbml", params: {}, kind: "dbml" };
  }
  if (entry.action === Action.EDIT && onlyViewChange(entry)) {
    return { key: "history_view_only", params: {}, kind: "edit", hidden: true };
  }

  let result = null;
  if (entry.action === Action.MOVE) {
    result = describeMove(entry, state);
  } else if (
    entry.bulk &&
    entry.action === Action.ADD &&
    entry.element === ObjectType.RELATIONSHIP
  ) {
    result = {
      key: "history_rel_auto",
      params: { count: entry.relationships?.length ?? 0 },
    };
  } else if (entry.action === Action.ADD || entry.action === Action.DELETE) {
    const kindKey = ELEMENT_KEY[entry.element];
    if (kindKey) {
      const verb = entry.action === Action.ADD ? "add" : "delete";
      const name = addedOrDeletedName(entry, state, live);
      result = name
        ? { key: `history_${kindKey}_${verb}`, params: { name } }
        : { key: `history_${kindKey}_${verb}_unnamed`, params: {} };
    }
  } else if (entry.action === Action.EDIT) {
    result = describeEdit(entry, state);
  }
  if (!result) return null;
  return { kind: KIND[entry.action] ?? "edit", ...result };
}
