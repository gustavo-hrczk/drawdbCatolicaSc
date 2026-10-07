// Lê o CHANGELOG.md (formato descrito no comentário do topo dele) para mostrar
// as novidades no editor (Ajuda > Novidades) e, no futuro, na página inicial.
//
// Devolve [{ version, date, unreleased, groups: [{ title, items }] }], da
// versão mais nova para a mais antiga. Só versões com algum item entram.

const VERSION = /^## \[(.+?)\](?:\s*-\s*(\d{4}-\d{2}-\d{2}))?\s*$/;
const GROUP = /^### (.+?)\s*$/;
const ITEM = /^- (.*)$/;
const CONTINUATION = /^ {2,}(\S.*)$/;

export function parseChangelog(text) {
  const withoutComments = text.replace(/<!--[\s\S]*?-->/g, "");
  const versions = [];
  let version = null;
  let group = null;
  let item = null;

  for (const line of withoutComments.split(/\r?\n/)) {
    let match;
    if ((match = line.match(VERSION))) {
      const [, name, date] = match;
      const unreleased = !/^\d+\.\d+\.\d+/.test(name);
      version = { version: name, date: date ?? null, unreleased, groups: [] };
      versions.push(version);
      group = item = null;
    } else if (version && (match = line.match(GROUP))) {
      group = { title: match[1], items: [] };
      version.groups.push(group);
      item = null;
    } else if (group && (match = line.match(ITEM))) {
      group.items.push(match[1]);
      item = group.items.length - 1;
    } else if (group && item !== null && (match = line.match(CONTINUATION))) {
      group.items[item] += ` ${match[1]}`;
    } else if (!line.trim()) {
      item = null;
    }
  }

  return versions
    .map((entry) => ({
      ...entry,
      groups: entry.groups.filter((g) => g.items.length > 0),
    }))
    .filter((entry) => entry.groups.length > 0);
}

// Última versão publicada (ignora a seção "Não lançado"), ou null.
export function latestVersion(versions) {
  return versions.find((entry) => !entry.unreleased)?.version ?? null;
}
