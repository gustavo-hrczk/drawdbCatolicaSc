import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { template1 } from "../../templates/template1";
import { template2 } from "../../templates/template2";
import { template3 } from "../../templates/template3";
import { template4 } from "../../templates/template4";
import { template5 } from "../../templates/template5";
import { template6 } from "../../templates/template6";
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
import {
  exportFileName,
  fileStamp,
  localIsoString,
  safeBaseName,
} from "./naming";
import { diagramSql, SQL_DIALECTS, sqlFingerprint } from "./sql";
import {
  buildDiagramJson,
  diagramContentKey,
  parseDiagramFile,
  serializeDiagramJson,
} from "./diagramJson";
import { buildPackage, LIMITS, readPackage } from "./zipPackage";
import { decodeText, planImport } from "./importPlan";
import { parseSqlDiagram } from "./sqlImport";
import { parseDbmlDiagram } from "./dbmlImport";
import { toDBML } from "../../utils/exportAs/dbml";

const TEMPLATES = [
  template1,
  template2,
  template3,
  template4,
  template5,
  template6,
];
const UPSTREAM_GENERIC = {
  [DB.POSTGRES]: jsonToPostgreSQL,
  [DB.MYSQL]: jsonToMySQL,
  [DB.MARIADB]: jsonToMariaDB,
  [DB.SQLITE]: jsonToSQLite,
  [DB.MSSQL]: jsonToSQLServer,
  [DB.ORACLESQL]: jsonToOracleSQL,
};
const EXPORTED_AT = new Date(2026, 9, 8, 21, 40, 5);

const asDiagram = (template, database = DB.GENERIC) => ({
  title: template.title,
  database,
  tables: template.tables,
  relationships: template.relationships,
  notes: template.notes ?? [],
  areas: template.subjectAreas ?? [],
  views: template.views ?? [],
  types: template.types ?? [],
  enums: template.enums ?? [],
  pan: { x: 120, y: -40 },
  zoom: 0.8,
});

const bytes = (text) => new TextEncoder().encode(text);

async function makeExport(template, dialect = DB.POSTGRES) {
  const diagram = asDiagram(template);
  const sql = diagramSql(diagram, dialect);
  const json = serializeDiagramJson(
    buildDiagramJson(diagram, {
      exportId: "exportacao-1",
      exportedAt: EXPORTED_AT,
      dialect,
      sqlFingerprint: await sqlFingerprint(sql),
    }),
  );
  return { diagram, sql, json };
}

describe("nomes e datas dos arquivos", () => {
  it("usa data e hora locais no formato AAAA-MM-DD_HHhMM", () => {
    expect(fileStamp(new Date(2026, 0, 5, 7, 3))).toBe("2026-01-05_07h03");
  });

  it("monta o nome do arquivo com título e data", () => {
    expect(exportFileName("Sistema Acadêmico", EXPORTED_AT, "sql")).toBe(
      "Sistema Acadêmico_2026-10-08_21h40.sql",
    );
  });

  it("troca caracteres inválidos no Windows por espaço", () => {
    expect(safeBaseName('a<b>c:d"e/f\\g|h?i*j')).toBe("a b c d e f g h i j");
  });

  it("evita nomes reservados do Windows", () => {
    expect(safeBaseName("con")).toBe("con_");
    expect(safeBaseName("LPT1")).toBe("LPT1_");
  });

  it("limita o tamanho sem partir acentos ou emojis", () => {
    const name = safeBaseName(`${"á".repeat(78)}🎓🎓🎓`);
    expect(Array.from(name)).toHaveLength(80);
    expect(name.endsWith("🎓🎓")).toBe(true);
  });

  it("usa um nome padrão quando o título fica vazio", () => {
    expect(safeBaseName("  ... ")).toBe("diagrama");
    expect(safeBaseName("Trabalho final. ")).toBe("Trabalho final");
  });

  it("grava a data dos metadados com o fuso horário", () => {
    expect(localIsoString(EXPORTED_AT)).toMatch(
      /^2026-10-08T21:40:05[+-]\d\d:\d\d$/,
    );
  });
});

describe("SQL idêntico ao exportador do drawDB original", () => {
  for (const template of TEMPLATES) {
    for (const dialect of SQL_DIALECTS) {
      it(`${template.title} em ${dialect}`, () => {
        const diagram = asDiagram(template);
        const expected = UPSTREAM_GENERIC[dialect]({
          tables: diagram.tables,
          references: diagram.relationships,
          types: diagram.types,
          database: diagram.database,
          views: diagram.views,
        });
        expect(diagramSql(diagram, dialect)).toBe(expected);
      });
    }
  }

  it("diagrama com banco definido usa o exportador do próprio banco", () => {
    const diagram = asDiagram(template1, DB.POSTGRES);
    expect(diagramSql(diagram, DB.MYSQL)).toBe(
      exportSQL({
        tables: diagram.tables,
        references: diagram.relationships,
        types: diagram.types,
        database: diagram.database,
        enums: diagram.enums,
        views: diagram.views,
      }),
    );
  });

  it("o .sql dentro do pacote é exatamente o SQL exportado", async () => {
    const { sql, json } = await makeExport(template2);
    const zip = await buildPackage(
      { baseName: "blog", sql, json, readme: "x" },
      "uint8array",
    );
    const read = await JSZip.loadAsync(zip);
    expect(await read.file("blog.sql").async("string")).toBe(sql);
  });

  it("nenhuma linha do fork entra no SQL", async () => {
    const { sql } = await makeExport(template3);
    expect(sql).not.toMatch(/catolica|drawDB Católica/i);
  });
});

describe("comparação do SQL (hash)", () => {
  it("ignora BOM, quebra de linha do Windows e espaço no fim", async () => {
    const sql = "CREATE TABLE a (\n  id INT\n);\n";
    const base = await sqlFingerprint(sql);
    expect(await sqlFingerprint(`\uFEFF${sql}`)).toBe(base);
    expect(await sqlFingerprint(sql.replace(/\n/g, "\r\n"))).toBe(base);
    expect(await sqlFingerprint(`${sql}\n\n  `)).toBe(base);
  });

  it("muda quando o SQL é alterado", async () => {
    expect(await sqlFingerprint("CREATE TABLE a (id INT);")).not.toBe(
      await sqlFingerprint("CREATE TABLE b (id INT);"),
    );
  });
});

describe("arquivo .json do diagrama", () => {
  for (const template of TEMPLATES) {
    it(`ida e volta sem perdas: ${template.title}`, async () => {
      const { diagram, json } = await makeExport(template);
      const parsed = parseDiagramFile(json, "x.json");
      expect(parsed.ok).toBe(true);
      expect(parsed.data.title).toBe(diagram.title);
      expect(parsed.data.database).toBe(diagram.database);
      expect(parsed.data.tables).toEqual(diagram.tables);
      expect(parsed.data.relationships).toEqual(diagram.relationships);
      expect(parsed.data.notes).toEqual(diagram.notes);
      expect(parsed.data.subjectAreas).toEqual(diagram.areas);
      expect(parsed.data.pan).toEqual(diagram.pan);
      expect(parsed.data.zoom).toBe(diagram.zoom);
      expect(parsed.meta.exportId).toBe("exportacao-1");
      expect(parsed.meta.dialetoSql).toBe(DB.POSTGRES);
      expect(parsed.meta.sqlSha256).toMatch(/^[0-9a-f]{64}$/);
    });
  }

  it("aceita o JSON do drawDB original, sem metadados", () => {
    const upstream = JSON.stringify({
      tables: template1.tables,
      relationships: template1.relationships,
      notes: [],
      subjectAreas: [],
      views: [],
      database: DB.GENERIC,
      title: "Antigo",
    });
    const parsed = parseDiagramFile(upstream, "antigo.json");
    expect(parsed.ok).toBe(true);
    expect(parsed.meta).toBeNull();
    expect(parsed.data.title).toBe("Antigo");
  });

  it('aceita os JSON do ZIP de "Exportar dados salvos"', () => {
    const record = JSON.stringify({
      id: 3,
      diagramId: "abc",
      name: "Do backup",
      database: DB.GENERIC,
      lastModified: "2026-10-01T10:00:00.000Z",
      tables: template1.tables,
      relationships: template1.relationships,
      subjectAreas: [],
      notes: [],
      pan: { x: 0, y: 0 },
      zoom: 1,
    });
    const parsed = parseDiagramFile(record, "Do backup(3).json");
    expect(parsed.ok).toBe(true);
    expect(parsed.data.title).toBe("Do backup");
  });

  it("aceita arquivo com BOM", async () => {
    const { json } = await makeExport(template1);
    expect(parseDiagramFile(`\uFEFF${json}`, "x.json").ok).toBe(true);
  });

  it("recusa conteúdo inválido com o motivo", async () => {
    expect(parseDiagramFile("{ quebrado", "x.json").error).toBe("invalid_json");
    expect(parseDiagramFile('{"a": 1}', "x.json").error).toBe("not_a_diagram");

    const { json } = await makeExport(template1);
    const unknownDb = { ...JSON.parse(json), database: "dbase" };
    expect(parseDiagramFile(JSON.stringify(unknownDb), "x.json").error).toBe(
      "unknown_database",
    );

    const newer = JSON.parse(json);
    newer.exportacao.formato = 99;
    expect(parseDiagramFile(JSON.stringify(newer), "x.json").error).toBe(
      "newer_format",
    );

    const broken = JSON.parse(json);
    broken.relationships = [
      { ...broken.relationships[0], endTableId: "não-existe" },
    ];
    expect(parseDiagramFile(JSON.stringify(broken), "x.json").error).toBe(
      "broken_relationships",
    );
  });
});

describe("pacote ZIP", () => {
  it("monta e lê de volta o .sql e o .json", async () => {
    const { sql, json } = await makeExport(template4);
    const zip = await buildPackage(
      { baseName: "Loja", sql, json, png: bytes("png"), readme: "leia" },
      "uint8array",
    );
    const read = await readPackage(zip);
    expect(read.ok).toBe(true);
    expect(read.files.map((f) => f.name).sort()).toEqual([
      "Loja.json",
      "Loja.sql",
    ]);
  });

  it("aceita pasta interna, arquivos extras e lixo do macOS", async () => {
    const { sql, json } = await makeExport(template4);
    const zip = new JSZip();
    zip.file("Trabalho/Loja.sql", sql);
    zip.file("Trabalho/Loja.json", json);
    zip.file("Trabalho/anotacoes.docx", "x");
    zip.file("__MACOSX/Trabalho/._Loja.json", "x");
    const read = await readPackage(
      await zip.generateAsync({ type: "uint8array" }),
    );
    expect(read.ok).toBe(true);
    expect(read.files.map((f) => f.name).sort()).toEqual([
      "Loja.json",
      "Loja.sql",
    ]);
  });

  it("recusa ZIP corrompido", async () => {
    expect((await readPackage(bytes("PK isto não é um zip"))).error).toBe(
      "invalid_zip",
    );
  });

  it("recusa ZIP com arquivos demais", async () => {
    const zip = new JSZip();
    for (let i = 0; i < 205; i++) zip.file(`f${i}.txt`, "x");
    const read = await readPackage(
      await zip.generateAsync({ type: "uint8array" }),
    );
    expect(read.error).toBe("too_many_files");
  });
});

describe("importação: encaixe dos arquivos", () => {
  it("só o .json: abre o desenho", async () => {
    const { json } = await makeExport(template1);
    const plan = await planImport([{ name: "a.json", bytes: bytes(json) }]);
    expect(plan).toMatchObject({ ok: true, kind: "json", sqlCheck: "absent" });
  });

  it("só o .sql: importação de SQL comum", async () => {
    const { sql } = await makeExport(template1);
    const plan = await planImport([{ name: "a.sql", bytes: bytes(sql) }]);
    expect(plan).toMatchObject({ ok: true, kind: "sql" });
  });

  it("par que confere, mesmo com o .sql renomeado pelo navegador", async () => {
    const { sql, json } = await makeExport(template2);
    const plan = await planImport([
      { name: "Blog_2026-10-08_21h40 (1).sql", bytes: bytes(sql) },
      { name: "Blog_2026-10-08_21h40.json", bytes: bytes(json) },
    ]);
    expect(plan).toMatchObject({ ok: true, kind: "pair", sqlCheck: "match" });
  });

  it("par que confere com CRLF e BOM no .sql", async () => {
    const { sql, json } = await makeExport(template2);
    const changedLineEndings = `\uFEFF${sql.replace(/\n/g, "\r\n")}`;
    const plan = await planImport([
      { name: "a.sql", bytes: bytes(changedLineEndings) },
      { name: "a.json", bytes: bytes(json) },
    ]);
    expect(plan.sqlCheck).toBe("match");
  });

  it("par com SQL alterado depois da exportação", async () => {
    const { sql, json } = await makeExport(template2);
    const plan = await planImport([
      { name: "a.sql", bytes: bytes(`${sql}\nCREATE TABLE extra (id INT);`) },
      { name: "a.json", bytes: bytes(json) },
    ]);
    expect(plan).toMatchObject({
      ok: true,
      kind: "pair",
      sqlCheck: "mismatch",
    });
  });

  it("JSON antigo (sem hash) com SQL: não dá para conferir", async () => {
    const plan = await planImport([
      { name: "a.sql", bytes: bytes("CREATE TABLE a (id INT);") },
      {
        name: "a.json",
        bytes: bytes(
          JSON.stringify({
            tables: template1.tables,
            relationships: template1.relationships,
            notes: [],
            subjectAreas: [],
          }),
        ),
      },
    ]);
    expect(plan.sqlCheck).toBe("not_checked");
  });

  it("pacote .zip funciona como o par", async () => {
    const { sql, json } = await makeExport(template5);
    const zip = await buildPackage({ baseName: "x", sql, json }, "uint8array");
    const plan = await planImport([{ name: "x.zip", bytes: zip }]);
    expect(plan).toMatchObject({
      ok: true,
      kind: "pair",
      sqlCheck: "match",
      fromZip: "x.zip",
    });
  });

  it("dois .json: pede para escolher", async () => {
    const { json } = await makeExport(template1);
    const plan = await planImport([
      { name: "a.json", bytes: bytes(json) },
      { name: "b.json", bytes: bytes(json) },
    ]);
    expect(plan).toMatchObject({ ok: true, kind: "choose" });
    expect(plan.candidates.map((c) => c.diagram.name)).toEqual([
      "a.json",
      "b.json",
    ]);
  });

  it("RAR é recusado com explicação, pelo nome ou pelo conteúdo", async () => {
    const rar = new Uint8Array([0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0, 1, 2]);
    expect((await planImport([{ name: "t.rar", bytes: rar }])).error).toBe(
      "rar_not_supported",
    );
    expect((await planImport([{ name: "t.zip", bytes: rar }])).error).toBe(
      "rar_not_supported",
    );
  });

  it("outros formatos são recusados", async () => {
    const plan = await planImport([{ name: "t.docx", bytes: bytes("x") }]);
    expect(plan).toMatchObject({ ok: false, error: "unsupported" });
  });

  it(".dbml sozinho é aceito", async () => {
    const plan = await planImport([{ name: "Loja.DBML", bytes: bytes("x") }]);
    expect(plan).toMatchObject({ ok: true, kind: "dbml" });
    expect(plan.dbml.name).toBe("Loja.DBML");
  });

  it(".dbml junto com um .json: pede para escolher", async () => {
    const { json } = await makeExport(template1);
    const plan = await planImport([
      { name: "a.dbml", bytes: bytes("x") },
      { name: "a.json", bytes: bytes(json) },
    ]);
    expect(plan).toMatchObject({ ok: true, kind: "choose" });
    expect(plan.candidates.map((c) => c.kind).sort()).toEqual(["dbml", "json"]);
  });
});

describe("importação: casos reais de entrega (Sprint 1F)", () => {
  const zipOf = async (files) => {
    const zip = new JSZip();
    for (const [name, content] of Object.entries(files))
      zip.file(name, content);
    return zip.generateAsync({ type: "uint8array" });
  };

  it("arquivos extraídos do .zip, todos selecionados: ignora imagem e LEIA-ME", async () => {
    const { sql, json } = await makeExport(template2);
    const plan = await planImport([
      { name: "Blog.sql", bytes: bytes(sql) },
      { name: "Blog.json", bytes: bytes(json) },
      { name: "Blog.png", bytes: bytes("png") },
      { name: "LEIA-ME.txt", bytes: bytes("leia") },
    ]);
    expect(plan).toMatchObject({ ok: true, kind: "pair", sqlCheck: "match" });
    expect(plan.ignored).toEqual(["Blog.png", "LEIA-ME.txt"]);
  });

  it("só arquivos que não são de diagrama: formato não aceito", async () => {
    const plan = await planImport([
      { name: "Blog.png", bytes: bytes("png") },
      { name: "LEIA-ME.txt", bytes: bytes("leia") },
    ]);
    expect(plan).toMatchObject({
      ok: false,
      error: "unsupported",
      detail: "Blog.png",
    });
  });

  it("“Baixar tudo” do Teams: um .zip por aluno, dentro de outro .zip", async () => {
    const a = await makeExport(template1);
    const b = await makeExport(template3);
    const plan = await planImport([
      {
        name: "Tarefa.zip",
        bytes: await zipOf({
          "Aluno A/Blog.zip": await buildPackage(
            { baseName: "Blog", sql: a.sql, json: a.json },
            "uint8array",
          ),
          "Aluno B/Loja.zip": await buildPackage(
            { baseName: "Loja", sql: b.sql, json: b.json },
            "uint8array",
          ),
        }),
      },
    ]);
    expect(plan).toMatchObject({ ok: true, kind: "choose" });
    expect(plan.candidates).toHaveLength(2);
    for (const candidate of plan.candidates) {
      expect(candidate).toMatchObject({
        kind: "pair",
        sqlCheck: "match",
        fromZip: "Tarefa.zip",
      });
    }
    expect(plan.candidates.map((c) => c.location)).toEqual([
      "Tarefa.zip › Aluno A/Blog.zip",
      "Tarefa.zip › Aluno B/Loja.zip",
    ]);
  });

  it("uma pasta por aluno no .zip, com os arquivos soltos", async () => {
    const a = await makeExport(template1);
    const b = await makeExport(template3);
    const plan = await planImport([
      {
        name: "Turma.zip",
        bytes: await zipOf({
          "Aluno A/Blog.json": a.json,
          "Aluno A/Blog.sql": a.sql,
          "Aluno B/Loja.json": b.json,
          "Aluno B/Loja.sql": b.sql,
        }),
      },
    ]);
    expect(plan.kind).toBe("choose");
    expect(plan.candidates.map((c) => [c.location, c.sqlCheck])).toEqual([
      ["Turma.zip › Aluno A", "match"],
      ["Turma.zip › Aluno B", "match"],
    ]);
  });

  it("duas versões no mesmo .zip: pede para escolher", async () => {
    const { json } = await makeExport(template1);
    const plan = await planImport([
      {
        name: "v.zip",
        bytes: await zipOf({ "v1.json": json, "v2.json": json }),
      },
    ]);
    expect(plan).toMatchObject({ ok: true, kind: "choose" });
    expect(plan.candidates).toHaveLength(2);
  });

  it("pacotes dentro de pacotes dentro de pacotes: explica", async () => {
    const { json } = await makeExport(template1);
    const inner = await zipOf({ "a.json": json });
    const middle = await zipOf({ "a.zip": inner });
    const plan = await planImport([
      { name: "x.zip", bytes: await zipOf({ "b.zip": middle }) },
    ]);
    expect(plan).toMatchObject({ ok: false, error: "nested_package" });
  });

  it("arquivo vazio (download interrompido)", async () => {
    const plan = await planImport([
      { name: "a.json", bytes: new Uint8Array() },
    ]);
    expect(plan).toMatchObject({
      ok: false,
      error: "empty_file",
      detail: "a.json",
    });
  });

  it("arquivo grande demais informa o tamanho e o limite", async () => {
    const size = LIMITS.maxZipBytes + 1;
    const plan = await planImport([
      { name: "a.json", bytes: new Uint8Array(size) },
    ]);
    expect(plan).toMatchObject({
      ok: false,
      error: "too_large",
      detail: { name: "a.json", size, limit: LIMITS.maxZipBytes },
    });
  });

  it("conteúdo descompactado grande demais (bomba de compactação)", async () => {
    const saved = LIMITS.maxTotalBytes;
    LIMITS.maxTotalBytes = 1000;
    try {
      const zip = await zipOf({ "a.sql": "x".repeat(2000) });
      expect((await planImport([{ name: "a.zip", bytes: zip }])).error).toBe(
        "package_too_large",
      );
    } finally {
      LIMITS.maxTotalBytes = saved;
    }
  });

  it(".json corrompido com .sql na mesma pasta: abre o SQL e avisa", async () => {
    const { sql } = await makeExport(template1);
    const plan = await planImport([
      { name: "a.json", bytes: bytes("{ quebrado") },
      { name: "a.sql", bytes: bytes(sql) },
    ]);
    expect(plan).toMatchObject({ ok: true, kind: "sql" });
    expect(plan.warnings).toEqual([
      { error: "invalid_json", detail: "a.json" },
    ]);
  });

  it(".sql salvo em ANSI (Windows-1252) mantém os acentos", async () => {
    const text = "-- Descrição dos alunos\nCREATE TABLE aluno (id INT);";
    const ansi = Uint8Array.from([...text].map((c) => c.charCodeAt(0)));
    expect(decodeText(ansi)).toBe(text);
    const plan = await planImport([{ name: "a.sql", bytes: ansi }]);
    expect(plan.sql.text).toBe(text);
  });

  it("UTF-8 com BOM continua igual", () => {
    expect(decodeText(bytes("\uFEFFAção"))).toBe("Ação");
  });

  it("chave de conteúdo: o .json e o diagrama salvo no navegador conferem", async () => {
    const { json } = await makeExport(template4);
    const { data } = parseDiagramFile(json, "a.json");
    const stored = {
      name: "outro nome",
      database: data.database,
      tables: data.tables,
      references: data.relationships,
      notes: data.notes,
      areas: data.subjectAreas,
      views: data.views,
      types: data.types,
      enums: data.enums,
      pan: { x: 1, y: 2 },
      zoom: 3,
    };
    expect(diagramContentKey(stored)).toBe(diagramContentKey(data));
    const changed = { ...stored, tables: data.tables.slice(1) };
    expect(diagramContentKey(changed)).not.toBe(diagramContentKey(data));
  });
});

describe("abrir um .dbml como diagrama novo", () => {
  for (const template of TEMPLATES) {
    it(`${template.title} exportado e reimportado`, () => {
      const diagram = asDiagram(template);
      const text = toDBML({ ...diagram, enums: template.enums ?? [] });
      const parsed = parseDbmlDiagram(`\uFEFF${text}`, DB.POSTGRES);
      expect(parsed.ok).toBe(true);
      expect(parsed.data.database).toBe(DB.POSTGRES);
      expect(parsed.data.tables.map((t) => t.name).sort()).toEqual(
        diagram.tables.map((t) => t.name).sort(),
      );
      expect(parsed.data.relationships).toHaveLength(
        diagram.relationships.length,
      );
    });
  }

  it("DBML com erro informa linha e coluna", () => {
    const parsed = parseDbmlDiagram("Table a {\n  id int\n", DB.POSTGRES);
    expect(parsed).toMatchObject({
      ok: false,
      error: "dbml_syntax",
      detail: { line: 3, column: 1 },
    });
  });
});

describe("abrir um .sql como diagrama novo", () => {
  // Defeito do exportador do upstream (docs/sprints.md, "Defeito conhecido"): de
  // "Genérico" para PostgreSQL, campos TEXT com tamanho viram "text(65535)", que
  // o PostgreSQL não aceita. it.fails passa enquanto o defeito existir e avisa
  // quando ele for corrigido.
  const knownUpstreamBug = (template, dialect) =>
    dialect === DB.POSTGRES &&
    ["Human resources schema", "E-commerce schema"].includes(template.title);

  for (const dialect of [DB.POSTGRES, DB.MYSQL]) {
    for (const template of TEMPLATES) {
      const test = knownUpstreamBug(template, dialect) ? it.fails : it;
      test(`${template.title} exportado e reimportado em ${dialect}`, () => {
        const diagram = asDiagram(template);
        const sql = diagramSql(diagram, dialect);
        const parsed = parseSqlDiagram(`\uFEFF${sql}`, dialect);
        expect(parsed.ok).toBe(true);
        expect(parsed.data.database).toBe(dialect);
        expect(parsed.data.tables.map((t) => t.name).sort()).toEqual(
          diagram.tables.map((t) => t.name).sort(),
        );
        expect(parsed.data.relationships).toHaveLength(
          diagram.relationships.length,
        );
      });
    }
  }

  it("SQL com erro de sintaxe informa linha e coluna", () => {
    const parsed = parseSqlDiagram("CREATE TABLE (\n  id INT", DB.POSTGRES);
    expect(parsed.ok).toBe(false);
    expect(parsed.error).toBe("sql_syntax");
    expect(parsed.detail.line).toBeGreaterThan(0);
  });
});
