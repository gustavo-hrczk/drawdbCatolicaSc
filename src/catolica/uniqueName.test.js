import { describe, expect, it } from "vitest";
import { uniqueName } from "./uniqueName";

describe("nome único de diagrama", () => {
  it("nome livre continua igual", () => {
    expect(uniqueName("Diagrama1", ["Outro"], "cópia")).toBe("Diagrama1");
  });

  it("nome repetido ganha (cópia), (cópia 2)...", () => {
    expect(uniqueName("Diagrama1", ["Diagrama1"], "cópia")).toBe(
      "Diagrama1 (cópia)",
    );
    expect(
      uniqueName("Diagrama1", ["Diagrama1", "Diagrama1 (cópia)"], "cópia"),
    ).toBe("Diagrama1 (cópia 2)");
  });

  it("ignora maiúsculas e espaços nas pontas", () => {
    expect(uniqueName(" diagrama1 ", ["Diagrama1"], "cópia")).toBe(
      "diagrama1 (cópia)",
    );
  });

  it("cópia de uma cópia não acumula sufixos", () => {
    expect(
      uniqueName(
        "Diagrama1 (cópia)",
        ["Diagrama1", "Diagrama1 (cópia)"],
        "cópia",
      ),
    ).toBe("Diagrama1 (cópia 2)");
  });
});
