// Recursos do upstream que dependem do servidor drawdb-server (gists).
// Sem um servidor configurado explicitamente (public/config.js ou
// VITE_*_BACKEND_URL), o padrão é http://localhost:5000, que não existe para
// quem usa o site: esses recursos ficam ocultos em vez de falhar.
const runtime =
  (typeof window !== "undefined" && window.__DRAWDB_CONFIG__) || {};

export const hasGistBackend = Boolean(
  runtime.gistBackendUrl ||
    runtime.backendUrl ||
    import.meta.env.VITE_GIST_BACKEND_URL ||
    import.meta.env.VITE_BACKEND_URL,
);
