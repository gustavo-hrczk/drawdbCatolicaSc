import { toSvg } from "html-to-image";

// Gera imagens do desenho (copiar como imagem e exportar PNG/JPEG/SVG/PDF).
//
// Por que existe: o html-to-image copia, para cada elemento, todas as
// propriedades de estilo calculadas, inclusive as centenas de variáveis de
// tema do Semi UI (--semi-*). Eram ~24 KB por elemento: um diagrama com 7
// tabelas virava um SVG de 7,5 MB, e a página travava ~3 s. Copiando só as
// propriedades CSS reais, o SVG cai para ~60 KB e a imagem sai idêntica.

// Limite de pixels da imagem final, para telas grandes não estourarem a
// memória do navegador (32 milhões ≈ 7500 x 4200).
const MAX_PIXELS = 32_000_000;

let styleProps = null;
function styleProperties() {
  if (!styleProps) {
    styleProps = [...getComputedStyle(document.documentElement)].filter(
      (prop) => !prop.startsWith("--"),
    );
  }
  return styleProps;
}

// Ícones (<i>) são botões da interface que aparecem ao passar o mouse sobre
// uma tabela; não fazem parte do desenho. O texto usa fontes do sistema, então
// não é preciso embutir fontes (eram mais 4,3 MB de ícones a cada imagem).
const isNotIcon = (node) =>
  !(node.tagName && node.tagName.toLowerCase() === "i");

const svgOptions = () => ({
  skipFonts: true,
  includeStyleProperties: styleProperties(),
  filter: isNotIcon,
});

export function canvasToSvgDataUrl(node) {
  return toSvg(node, svgOptions());
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Fundo do editor (tema claro ou escuro), para formatos sem transparência.
export function editorBackground(node) {
  return getComputedStyle(node.closest(".theme") ?? document.body)
    .backgroundColor;
}

// O desenho final é feito aqui, e não no toBlob da biblioteca, porque a
// versão 1.11.13 espera um requestAnimationFrame que não acontece com a aba
// em segundo plano.
export async function canvasToBlob(
  node,
  { type = "image/png", quality, pixelRatio = 2, background } = {},
) {
  const width = node.offsetWidth;
  const height = node.offsetHeight;
  const ratio = Math.max(
    1,
    Math.min(pixelRatio, Math.sqrt(MAX_PIXELS / (width * height))),
  );
  const img = await loadImage(await canvasToSvgDataUrl(node));

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const ctx = canvas.getContext("2d");
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.scale(ratio, ratio);
  ctx.drawImage(img, 0, 0, width, height);

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      type,
      quality,
    ),
  );
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function canvasToDataUrl(node, options) {
  return blobToDataUrl(await canvasToBlob(node, options));
}

let copying = false;

// Ctrl+Alt+C: copia o desenho como PNG. Pressionar de novo enquanto a imagem
// é gerada não dispara outra cópia em paralelo. Devolve "ok" ou "busy".
export async function copyCanvasImage(node) {
  if (copying) return "busy";
  copying = true;
  try {
    const blob = canvasToBlob(node, { pixelRatio: 2 });
    try {
      // Passar a Promise ao ClipboardItem mantém válido o gesto do usuário
      // enquanto a imagem é gerada (exigido por alguns navegadores).
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
    } catch (err) {
      if (!(err instanceof TypeError)) throw err;
      // Navegador sem suporte a Promise no ClipboardItem.
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": await blob }),
      ]);
    }
    return "ok";
  } finally {
    copying = false;
  }
}
