import jsPDF from "jspdf";

// Gera imagens do diagrama: Copiar como imagem (Ctrl+Alt+C) e Exportar como
// PNG/JPEG/SVG/PDF.
//
// Não usa o html-to-image do upstream:
// - na 1.11.11 ele copia todas as propriedades de estilo de cada elemento,
//   inclusive as centenas de variáveis de tema do Semi UI (~24 KB por
//   elemento), e a página trava por segundos;
// - na 1.11.13 ele copia o <svg> inteiro de uma vez e as tabelas (HTML dentro
//   de <foreignObject>) saem sem estilo nenhum.
//
// Aqui o SVG do diagrama é clonado elemento por elemento, copiando só os
// estilos que diferem do padrão do navegador, e recortado para o conteúdo em
// tamanho real (zoom 100%), independentemente do zoom e da posição da tela.

const SVG_NS = "http://www.w3.org/2000/svg";

// Margem em volta do conteúdo e limites da imagem final.
const PADDING = 24;
const MAX_SIDE = 8192;
const MAX_PIXELS = 32_000_000;

// Controles da interface que não fazem parte do desenho: botões com ícone que
// aparecem ao passar o mouse (cadeado, recolher, "...", remover campo) e
// ícones de fonte. Botões vazios ficam: são os pontos azuis dos campos.
const EXCLUDE = "button:not(:empty), i";

// Propriedades herdadas: o filho só precisa delas se forem diferentes do pai.
const INHERITED = new Set([
  "color",
  "cursor",
  "direction",
  "font-family",
  "font-feature-settings",
  "font-kerning",
  "font-size",
  "font-stretch",
  "font-style",
  "font-variant",
  "font-variant-ligatures",
  "font-variant-numeric",
  "font-weight",
  "hyphens",
  "letter-spacing",
  "line-height",
  "list-style-image",
  "list-style-position",
  "list-style-type",
  "overflow-wrap",
  "tab-size",
  "text-align",
  "text-indent",
  "text-rendering",
  "text-shadow",
  "text-transform",
  "visibility",
  "white-space",
  "word-break",
  "word-spacing",
  "writing-mode",
  "-webkit-font-smoothing",
  "-webkit-text-fill-color",
  "fill",
  "fill-opacity",
  "fill-rule",
  "stroke",
  "stroke-dasharray",
  "stroke-dashoffset",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
  "stroke-opacity",
  "stroke-width",
  "paint-order",
  "shape-rendering",
  "text-anchor",
  "dominant-baseline",
]);

// Geometria de elementos SVG já está nos atributos; copiar como estilo só
// aumentaria o arquivo (e no <svg> raiz sobrescreveria o recorte).
const SVG_GEOMETRY = new Set([
  "d",
  "x",
  "y",
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "width",
  "height",
]);

// Propriedades sem efeito numa imagem estática.
const IGNORED_PREFIXES = [
  "transition",
  "animation",
  "will-change",
  "cursor",
  "pointer-events",
  "touch-action",
  "user-select",
  "-webkit-user-select",
  "caret-color",
];

let properties = null;
function styleProperties() {
  if (!properties) {
    properties = [...getComputedStyle(document.documentElement)].filter(
      (prop) =>
        !prop.startsWith("--") &&
        !IGNORED_PREFIXES.some((prefix) => prop.startsWith(prefix)),
    );
  }
  return properties;
}

// Estilos padrão de cada tipo de elemento, calculados num iframe sem o CSS da
// página. Só o que difere disso é copiado.
let sandbox = null;
function sandboxDocument() {
  if (!sandbox) {
    sandbox = document.createElement("iframe");
    sandbox.setAttribute("aria-hidden", "true");
    sandbox.tabIndex = -1;
    Object.assign(sandbox.style, {
      position: "fixed",
      left: "-10000px",
      width: "10px",
      height: "10px",
      border: "0",
      visibility: "hidden",
      pointerEvents: "none",
    });
    document.body.appendChild(sandbox);
    const doc = sandbox.contentDocument;
    doc.open();
    doc.write(
      `<!doctype html><html><body><svg xmlns="${SVG_NS}"></svg></body></html>`,
    );
    doc.close();
  }
  return sandbox.contentDocument;
}

const defaultsCache = new Map();
function defaultStyle(el) {
  const key = `${el.namespaceURI}|${el.localName}`;
  if (!defaultsCache.has(key)) {
    const doc = sandboxDocument();
    const parent =
      el.namespaceURI === SVG_NS ? doc.querySelector("svg") : doc.body;
    const probe = doc.createElementNS(el.namespaceURI, el.localName);
    parent.appendChild(probe);
    const computed = doc.defaultView.getComputedStyle(probe);
    const values = {};
    for (const prop of styleProperties()) {
      values[prop] = computed.getPropertyValue(prop);
    }
    probe.remove();
    defaultsCache.set(key, values);
  }
  return defaultsCache.get(key);
}

// Copia para o clone os estilos calculados do elemento original que diferem
// do padrão (ou, nos herdados, do pai). Devolve os valores herdáveis, que os
// filhos usam para comparar.
function inlineStyles(live, clone, computed, parentValues) {
  const defaults = defaultStyle(live);
  const isSvg = live.namespaceURI === SVG_NS;
  const values = {};
  for (const prop of styleProperties()) {
    if (isSvg && SVG_GEOMETRY.has(prop)) continue;
    const value = computed.getPropertyValue(prop);
    const inherited = INHERITED.has(prop);
    if (inherited) values[prop] = value;
    const differsFromParent =
      inherited && (!parentValues || value !== parentValues[prop]);
    if (value !== defaults[prop] || differsFromParent) {
      clone.style.setProperty(prop, value);
      // A espessura calculada é 0 quando o estilo é "none", então ela parece
      // igual ao padrão e seria descartada; mas com o estilo copiado (o CSS do
      // site usa "solid" com espessura 0 em tudo) a espessura voltaria ao
      // padrão de 3 px. Copia sempre as duas juntas.
      if (prop.endsWith("-style")) {
        const widthProp = prop.replace(/-style$/, "-width");
        const width = computed.getPropertyValue(widthProp);
        if (width) clone.style.setProperty(widthProp, width);
      }
    }
  }
  return values;
}

function cloneWithStyles(live, parentValues) {
  if (live.nodeType === Node.TEXT_NODE) return live.cloneNode(false);
  if (live.nodeType !== Node.ELEMENT_NODE) return null;
  if (live.matches(EXCLUDE)) return null;

  const computed = getComputedStyle(live);
  if (computed.display === "none") return null;

  const clone = live.cloneNode(false);
  clone.removeAttribute("class");
  const values = inlineStyles(live, clone, computed, parentValues);

  for (const child of live.childNodes) {
    const childClone = cloneWithStyles(child, values);
    if (childClone) clone.appendChild(childClone);
  }
  if (live instanceof HTMLTextAreaElement) clone.textContent = live.value;
  if (live instanceof HTMLInputElement) clone.setAttribute("value", live.value);
  return clone;
}

// Filhos do <svg> que são só interface: grade, linha de criação de
// relacionamento e retângulo de seleção.
function isContent(el) {
  if (el.localName === "defs") return false;
  const fill = el.getAttribute("fill") ?? "";
  if (el.localName === "rect" && (fill.startsWith("url(") || fill === "grey")) {
    return false;
  }
  if (el.localName === "path" && el.getAttribute("stroke") === "red") {
    return false;
  }
  return true;
}

function contentBox(svg) {
  let box = null;
  for (const child of svg.children) {
    if (!isContent(child)) continue;
    let b;
    try {
      b = child.getBBox();
    } catch {
      continue;
    }
    if (!b.width && !b.height) continue;
    box = box
      ? {
          x1: Math.min(box.x1, b.x),
          y1: Math.min(box.y1, b.y),
          x2: Math.max(box.x2, b.x + b.width),
          y2: Math.max(box.y2, b.y + b.height),
        }
      : { x1: b.x, y1: b.y, x2: b.x + b.width, y2: b.y + b.height };
  }
  return box;
}

// Fundo do editor (tema claro ou escuro).
function editorBackground(node) {
  return getComputedStyle(node.closest(".theme") ?? document.body)
    .backgroundColor;
}

export class EmptyDiagramError extends Error {}

// Monta o SVG do diagrama recortado no conteúdo. Lança EmptyDiagramError se
// não houver nada desenhado.
export function diagramSvg() {
  const svg = document.querySelector("#canvas svg");
  const box = svg && contentBox(svg);
  if (!box) throw new EmptyDiagramError();

  const x = Math.floor(box.x1 - PADDING);
  const y = Math.floor(box.y1 - PADDING);
  const width = Math.ceil(box.x2 - box.x1 + 2 * PADDING);
  const height = Math.ceil(box.y2 - box.y1 + 2 * PADDING);

  const root = svg.cloneNode(false);
  root.removeAttribute("class");
  root.removeAttribute("id");
  const rootValues = inlineStyles(svg, root, getComputedStyle(svg), null);
  root.setAttribute("xmlns", SVG_NS);
  root.setAttribute("viewBox", `${x} ${y} ${width} ${height}`);
  root.setAttribute("width", width);
  root.setAttribute("height", height);
  root.style.removeProperty("position");

  const background = document.createElementNS(SVG_NS, "rect");
  background.setAttribute("x", x);
  background.setAttribute("y", y);
  background.setAttribute("width", width);
  background.setAttribute("height", height);
  background.setAttribute("fill", editorBackground(svg));
  root.appendChild(background);

  for (const child of svg.children) {
    if (!isContent(child)) continue;
    const clone = cloneWithStyles(child, rootValues);
    if (clone) root.appendChild(clone);
  }

  return {
    markup: new XMLSerializer().serializeToString(root),
    width,
    height,
  };
}

export function svgToDataUrl(markup) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// scale: pixels por unidade do diagrama (1 = tamanho real).
async function renderBlob(
  { markup, width, height },
  { type = "image/png", quality, scale = 1 } = {},
) {
  const ratio = Math.max(
    0.1,
    Math.min(
      scale,
      MAX_SIDE / width,
      MAX_SIDE / height,
      Math.sqrt(MAX_PIXELS / (width * height)),
    ),
  );
  const img = await loadImage(svgToDataUrl(markup));

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const ctx = canvas.getContext("2d");
  ctx.scale(ratio, ratio);
  ctx.drawImage(img, 0, 0, width, height);

  const blob = await new Promise((resolve, reject) =>
    canvas.toBlob(
      (result) =>
        result ? resolve(result) : reject(new Error("toBlob failed")),
      type,
      quality,
    ),
  );
  return {
    blob,
    width: canvas.width,
    height: canvas.height,
    svgWidth: width,
    svgHeight: height,
  };
}

export function diagramBlob(options) {
  return renderBlob(diagramSvg(), options);
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function diagramDataUrl(options) {
  const result = await diagramBlob(options);
  return { ...result, dataUrl: await blobToDataUrl(result.blob) };
}

export function diagramSvgBlob() {
  return new Blob([diagramSvg().markup], { type: "image/svg+xml" });
}

// PDF de uma página do tamanho do conteúdo do diagrama (como o "Exportar como
// PDF").
export async function diagramPdfBlob() {
  const { dataUrl, svgWidth, svgHeight } = await diagramDataUrl({
    type: "image/jpeg",
    quality: 0.95,
    scale: 2,
  });
  const doc = new jsPDF(svgWidth >= svgHeight ? "l" : "p", "px", [
    svgWidth,
    svgHeight,
  ]);
  doc.addImage(dataUrl, "jpeg", 0, 0, svgWidth, svgHeight);
  return doc.output("blob");
}

let copying = false;

// Ctrl+Alt+C: copia o diagrama como PNG em tamanho real, na densidade da tela
// (como um print). Pressionar de novo enquanto a imagem é gerada não dispara
// outra cópia. Devolve "ok", "busy" ou "empty".
export async function copyDiagramImage() {
  if (copying) return "busy";
  copying = true;
  try {
    const svgData = diagramSvg();
    const blob = renderBlob(svgData, {
      scale: window.devicePixelRatio || 1,
    }).then((result) => result.blob);
    try {
      // Passar a Promise ao ClipboardItem mantém válido o gesto do usuário
      // enquanto a imagem é gerada (exigido por alguns navegadores).
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
    } catch (err) {
      if (!(err instanceof TypeError)) throw err;
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": await blob }),
      ]);
    }
    return "ok";
  } catch (err) {
    if (err instanceof EmptyDiagramError) return "empty";
    throw err;
  } finally {
    copying = false;
  }
}
