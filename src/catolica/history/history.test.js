import { describe, expect, it } from "vitest";
import i18n from "../../i18n/i18n";
import "../i18n";
import { Action, ObjectType } from "../../data/constants";
import { describeChange } from "./describeChange";
import { historyRows, stepText } from "./historyRows";

const tables = [
  {
    id: "t1",
    name: "clientes",
    fields: [
      { id: "f1", name: "id" },
      { id: "f2", name: "nome" },
    ],
  },
];
const state = {
  tables,
  relationships: [{ id: "r1", name: "fk_pedidos_clientes" }],
  notes: [{ id: 0, title: "nota_1" }],
  areas: [{ id: 0, name: "area_1" }],
  types: [],
  enums: [],
  views: [],
};

const text = (entry) => stepText(entry, i18n.t.bind(i18n), state);

describe("frases da linha do tempo", () => {
  it("criar e excluir tabela com o nome", async () => {
    await i18n.changeLanguage("pt-BR");
    const add = {
      action: Action.ADD,
      element: ObjectType.TABLE,
      data: { table: tables[0] },
    };
    expect(text(add)).toBe('Tabela "clientes" criada');
    expect(text({ ...add, action: Action.DELETE })).toBe(
      'Tabela "clientes" excluída',
    );
  });

  it("área e nota criadas usam a última da lista, só logo depois da ação", () => {
    const stamped = (element) => {
      const entry = { action: Action.ADD, element };
      entry.desc = describeChange(entry, state);
      return entry;
    };
    expect(text(stamped(ObjectType.AREA))).toBe('Área "area_1" criada');
    expect(text(stamped(ObjectType.NOTE))).toBe('Nota "nota_1" criada');
    // Passo antigo, sem frase registrada: a última da lista agora pode ser
    // outra, então sai sem nome.
    expect(text({ action: Action.ADD, element: ObjectType.NOTE })).toBe(
      "Nota criada",
    );
  });

  it("renomear tabela e coluna mostra o nome antigo e o novo", () => {
    expect(
      text({
        action: Action.EDIT,
        element: ObjectType.TABLE,
        component: "self",
        tid: "t1",
        undo: { name: "tabela_1" },
        redo: { name: "clientes" },
      }),
    ).toBe('Tabela "tabela_1" renomeada para "clientes"');
    expect(
      text({
        action: Action.EDIT,
        element: ObjectType.TABLE,
        component: "field",
        tid: "t1",
        fid: "f2",
        undo: { name: "" },
        redo: { name: "nome" },
      }),
    ).toBe('Coluna "clientes.nome" nomeada');
  });

  it("alteração de coluna diz o que mudou", () => {
    expect(
      text({
        action: Action.EDIT,
        element: ObjectType.TABLE,
        component: "field",
        tid: "t1",
        fid: "f2",
        undo: { type: "", size: "" },
        redo: { type: "VARCHAR", size: 255 },
      }),
    ).toBe('Coluna "clientes.nome" alterada (tipo, tamanho)');
  });

  it("redimensionar área conta só o que mudou", () => {
    expect(
      text({
        action: Action.EDIT,
        element: ObjectType.AREA,
        aid: 0,
        undo: { x: 0, y: 0, width: 100, height: 100 },
        redo: { id: 0, name: "area_1", x: 0, y: 0, width: 200, height: 100 },
      }),
    ).toBe('Área "area_1" alterada (dimensões)');
  });

  it("mover um elemento ou vários", () => {
    const move = (elements) => ({ action: Action.MOVE, bulk: true, elements });
    expect(text(move([{ id: "t1", type: ObjectType.TABLE }]))).toBe(
      'Tabela "clientes" movida',
    );
    expect(
      text(
        move([
          { id: "t1", type: ObjectType.TABLE },
          { id: 0, type: ObjectType.NOTE },
        ]),
      ),
    ).toBe("2 elementos movidos");
    expect(text({ ...move([]), view: { before: {} } })).toBe(
      "Diagrama organizado automaticamente",
    );
  });

  it("recolher colunas fica fora da linha do tempo", () => {
    const desc = describeChange(
      {
        action: Action.EDIT,
        element: ObjectType.TABLE,
        component: "self",
        tid: "t1",
        undo: { collapsed: false },
        redo: { collapsed: true },
      },
      state,
    );
    expect(desc.hidden).toBe(true);
  });

  it("passo sem frase usa a mensagem do upstream sem marcações", () => {
    expect(
      text({ action: 99, message: "Edit table clientes [inherits]" }),
    ).toBe("Edit table clientes");
  });

  it("frase registrada sai no idioma atual", async () => {
    const entry = { action: Action.ADD, element: ObjectType.AREA };
    entry.desc = describeChange(entry, state);
    await i18n.changeLanguage("en");
    expect(text(entry)).toBe('Area "area_1" created');
    await i18n.changeLanguage("pt-BR");
  });
});

describe("linhas do painel", () => {
  const add = (name) => ({
    action: Action.ADD,
    element: ObjectType.TABLE,
    data: { table: { id: name, name } },
  });
  const rows = (undo, redo) =>
    historyRows(undo, redo, i18n.t.bind(i18n), state);

  it("ordem: desfeitos, atual, anteriores e início", () => {
    const result = rows([add("a"), add("b")], [add("d"), add("c")]);
    expect(result.map((r) => [r.text, r.status, r.steps])).toEqual([
      ['Tabela "d" criada', "undone", 2],
      ['Tabela "c" criada', "undone", 1],
      ['Tabela "b" criada', "current", 0],
      ['Tabela "a" criada', "done", -1],
      ["Início do histórico", "start", -2],
    ]);
  });

  it("passos iguais seguidos viram uma linha", () => {
    const move = {
      action: Action.MOVE,
      bulk: true,
      elements: [{ id: "t1", type: ObjectType.TABLE }],
    };
    const result = rows([add("a"), move, { ...move }, { ...move }], []);
    expect(result[0]).toMatchObject({
      text: 'Tabela "clientes" movida',
      count: 3,
      status: "current",
    });
    expect(result[1]).toMatchObject({ text: 'Tabela "a" criada', steps: -3 });
  });

  it("sem alterações, só o início, como ponto atual", () => {
    expect(rows([], [])).toEqual([
      expect.objectContaining({ kind: "start", status: "current" }),
    ]);
  });
});
