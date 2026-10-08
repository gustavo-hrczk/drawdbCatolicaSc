import { describe, expect, it } from "vitest";
import i18n from "../i18n/i18n";
import "./i18n";
import { defaultTableName, nextName } from "./defaultNames";

describe("nomes padrão de elementos novos", () => {
  it("numera a partir da quantidade atual + 1", () => {
    expect(nextName("tabela", [])).toBe("tabela_1");
    expect(nextName("tabela", ["clientes", "pedidos"])).toBe("tabela_3");
  });

  it("pula nomes já usados", () => {
    expect(nextName("tabela", ["tabela_1"])).toBe("tabela_2");
    expect(nextName("tabela", ["tabela_2", "tabela_3"])).toBe("tabela_4");
  });

  it("usa o idioma do editor", async () => {
    await i18n.changeLanguage("pt-BR");
    expect(defaultTableName([{ name: "x" }])).toBe("tabela_2");
    await i18n.changeLanguage("en");
    expect(defaultTableName([])).toBe("table_1");
  });
});
