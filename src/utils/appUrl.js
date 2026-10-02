// Monta URLs internas respeitando o caminho base (ex.: GitHub Pages em /nome-do-repo/).
const base = import.meta.env.BASE_URL.replace(/\/+$/, "");

export const appUrl = (path) => base + path;
