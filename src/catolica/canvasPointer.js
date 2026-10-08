// Última posição do mouse, para os atalhos criarem elementos onde o ponteiro
// está. Só vale se o ponteiro estiver sobre o desenho do diagrama.
let lastPointer = null;

if (typeof window !== "undefined") {
  window.addEventListener(
    "pointermove",
    (e) => {
      lastPointer = { x: e.clientX, y: e.clientY };
    },
    { passive: true },
  );
}

// Última posição do mouse na tela ({ x, y } em pixels), ou null.
export function lastPointerClient() {
  return lastPointer;
}

// Converte a posição do mouse para coordenadas do diagrama usando o viewBox
// do <svg> do canvas. Devolve null se o mouse não estiver sobre o desenho
// (aí o elemento nasce no centro da tela, como antes).
export function pointerInDiagram() {
  const svg = document.querySelector("#canvas svg");
  if (!svg || !lastPointer) return null;

  const rect = svg.getBoundingClientRect();
  const { x, y } = lastPointer;
  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
    return null;
  }
  // Algo por cima do desenho (painel, barra de ferramentas): não é o canvas.
  const top = document.elementFromPoint(x, y);
  if (!top || !svg.contains(top)) return null;

  const box = svg.viewBox.baseVal;
  if (!box?.width || !box?.height || !rect.width || !rect.height) return null;
  return {
    x: box.x + ((x - rect.left) / rect.width) * box.width,
    y: box.y + ((y - rect.top) / rect.height) * box.height,
  };
}
