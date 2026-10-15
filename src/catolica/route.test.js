import { describe, expect, it } from "vitest";
import { calcPath, routeHandle } from "../utils/calcPath";

// Traçado arrastável do relacionamento (midOffset em calcPath.js).
const field = { id: "f", name: "id", type: "INT" };
const route = (extra = {}) => ({
  startTable: { x: 0, y: 0, width: 200, fields: [field] },
  endTable: { x: 600, y: 300, width: 200, fields: [field] },
  startFieldIndex: 0,
  endFieldIndex: 0,
  ...extra,
});

describe("traçado arrastável do relacionamento", () => {
  it("sem deslocamento, a linha é a mesma de antes", () => {
    expect(calcPath(route({ midOffset: 0 }))).toBe(calcPath(route()));
  });

  it("o deslocamento move o trecho do meio", () => {
    expect(routeHandle(route()).x).toBe(400);
    expect(routeHandle(route({ midOffset: 100 })).x).toBe(500);
    expect(calcPath(route({ midOffset: 100 }))).toContain("L 500");
  });

  it("o trecho do meio não entra nas tabelas", () => {
    expect(routeHandle(route({ midOffset: 9999 })).x).toBe(580);
    expect(routeHandle(route({ midOffset: -9999 })).x).toBe(220);
  });

  it("sem trecho do meio (tabelas sobrepostas na horizontal), sem alça", () => {
    expect(
      routeHandle(
        route({ endTable: { x: 100, y: 300, width: 200, fields: [field] } }),
      ),
    ).toBeNull();
  });
});
