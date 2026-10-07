import { describe, expect, it } from "vitest";
import {
  KEEP_RECENT_AUTO,
  isEmptySnapshot,
  snapshotKey,
  snapshotOf,
  versionsToDiscard,
} from "./versionRules";

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date(2026, 9, 7, 12, 0).getTime();

const auto = (id, ageMs) => ({
  id,
  kind: "auto",
  createdAt: new Date(NOW - ageMs),
});

describe("guarda das versões", () => {
  it("mantém as 20 automáticas mais recentes", () => {
    const versions = Array.from({ length: KEEP_RECENT_AUTO }, (_, i) =>
      auto(i, i * 60 * 1000),
    );
    expect(versionsToDiscard(versions, NOW)).toEqual([]);
  });

  it("das mais antigas, fica a última de cada dia por 30 dias", () => {
    const recent = Array.from({ length: KEEP_RECENT_AUTO }, (_, i) =>
      auto(i, i * 1000),
    );
    const older = [
      auto("d2-late", 2 * DAY),
      auto("d2-early", 2 * DAY + 60 * 60 * 1000),
      auto("d5", 5 * DAY),
      auto("d40", 40 * DAY),
    ];
    expect(versionsToDiscard([...older, ...recent], NOW).sort()).toEqual(
      ["d2-early", "d40"].sort(),
    );
  });

  it("versões com nome nunca são descartadas", () => {
    const recent = Array.from({ length: KEEP_RECENT_AUTO }, (_, i) =>
      auto(i, i * 1000),
    );
    const named = {
      id: "n",
      kind: "manual",
      createdAt: new Date(NOW - 90 * DAY),
    };
    expect(versionsToDiscard([named, ...recent], NOW)).toEqual([]);
  });
});

describe("conteúdo da versão", () => {
  const state = {
    database: "postgresql",
    tables: [{ id: "t", name: "a" }],
    relationships: [],
    notes: [],
    areas: [],
  };

  it("mesmo conteúdo, mesma chave (enquadramento e nome não contam)", () => {
    const a = snapshotOf(state);
    const b = snapshotOf({ ...state, title: "outro", zoom: 2 });
    expect(snapshotKey(a)).toBe(snapshotKey(b));
    expect(snapshotKey(a)).not.toBe(
      snapshotKey(snapshotOf({ ...state, tables: [] })),
    );
  });

  it("diagrama vazio não gera versão automática", () => {
    expect(isEmptySnapshot(snapshotOf({ ...state, tables: [] }))).toBe(true);
    expect(isEmptySnapshot(snapshotOf(state))).toBe(false);
  });
});
