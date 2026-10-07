// Endereços do repositório deste editor. Se o repositório mudar de dono ou de
// nome (ver "Governança" no CLAUDE.md), basta trocar aqui.
export const REPOSITORY_URL =
  "https://github.com/gustavo-hrczk/drawdbCatolicaSc";
export const LICENSE_URL = `${REPOSITORY_URL}/blob/main/LICENSE`;
export const UPSTREAM_URL = "https://github.com/drawdb-io/drawdb";
export const UPSTREAM_DOCS_URL = "https://drawdb-io.github.io/docs";

// Nova issue no GitHub com o texto já estruturado (exige conta no GitHub).
export function newIssueUrl(body) {
  return `${REPOSITORY_URL}/issues/new?body=${encodeURIComponent(body)}`;
}
