import { describe, expect, it } from "vitest";
import changelogText from "../../CHANGELOG.md?raw";
import { latestVersion, parseChangelog } from "./changelog";

const SAMPLE = `# Novidades

<!--
- Isto é um comentário com "## [9.9.9]" que não pode virar versão.
-->

## [Não lançado]

### Novidades

- Item de uma linha.
- Item que continua
  na linha de baixo.

### Correções

## [1.1.0] - 2026-11-02

### Melhorias

- Melhoria publicada.

## [1.0.0] - 2026-10-20

### Novidades

- Primeira versão.
`;

describe("CHANGELOG", () => {
  it("lê versões, grupos e itens de várias linhas", () => {
    const versions = parseChangelog(SAMPLE);
    expect(versions.map((v) => [v.version, v.date, v.unreleased])).toEqual([
      ["Não lançado", null, true],
      ["1.1.0", "2026-11-02", false],
      ["1.0.0", "2026-10-20", false],
    ]);
    expect(versions[0].groups).toEqual([
      {
        title: "Novidades",
        items: ["Item de uma linha.", "Item que continua na linha de baixo."],
      },
    ]);
  });

  it("última versão publicada ignora o que não foi lançado", () => {
    expect(latestVersion(parseChangelog(SAMPLE))).toBe("1.1.0");
    expect(latestVersion(parseChangelog("## [Não lançado]\n"))).toBeNull();
  });

  it("o CHANGELOG.md do repositório está no formato esperado", () => {
    const versions = parseChangelog(changelogText);
    expect(versions.length).toBeGreaterThan(0);
    for (const version of versions) {
      for (const group of version.groups) {
        expect(["Novidades", "Melhorias", "Correções", "Removido"]).toContain(
          group.title,
        );
        for (const item of group.items) expect(item).not.toMatch(/^\s|\s$/);
      }
    }
  });
});
