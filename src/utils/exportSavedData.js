import JSZip from "jszip";
import { db } from "../data/db";
import { saveAs } from "file-saver";

const formatDiagram = (diagram) => {
  const formattedDiagram = { ...diagram };
  formattedDiagram.relationships = diagram.references;
  formattedDiagram.subjectAreas = diagram.areas;

  delete formattedDiagram.references;
  delete formattedDiagram.areas;

  return formattedDiagram;
};

// Remove caracteres inválidos em nomes de arquivo (Windows/macOS/Linux).
const safeName = (name) =>
  String(name ?? "untitled").replace(/[\\/:*?"<>|]+/g, "_").trim() ||
  "untitled";

const pad = (n) => String(n).padStart(2, "0");

export async function exportSavedData() {
  // Um ZIP novo a cada exportação; reaproveitar a instância acumulava os
  // arquivos de exportações anteriores (inclusive diagramas já apagados).
  const zip = new JSZip();
  const diagramsFolder = zip.folder("diagrams");

  await db.diagrams.each((diagram) => {
    diagramsFolder.file(
      `${safeName(diagram.name)}(${diagram.id}).json`,
      JSON.stringify(formatDiagram(diagram), null, 2),
    );
  });

  const templatesFolder = zip.folder("templates");

  await db.templates.where({ custom: 1 }).each((template) => {
    templatesFolder.file(
      `${safeName(template.title)}(${template.id}).json`,
      JSON.stringify(formatDiagram(template), null, 2),
    );
  });

  const content = await zip.generateAsync({ type: "blob" });
  const date = new Date();
  saveAs(
    content,
    `${date.getFullYear()}_${pad(date.getMonth() + 1)}_${pad(date.getDate())}_export.zip`,
  );
}
