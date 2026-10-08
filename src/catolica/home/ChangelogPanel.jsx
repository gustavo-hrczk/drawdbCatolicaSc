import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Collapse } from "@douyinfe/semi-ui";
import changelogText from "../../../CHANGELOG.md?raw";
import { parseChangelog } from "../changelog";
import { ChangelogDialog } from "../InfoDialogs";

// "Novidades" na tela inicial, lidas do CHANGELOG.md: a versão mais recente
// aberta (ou a próxima, em testes) e as anteriores recolhidas.

const VERSIONS = parseChangelog(changelogText);
// Itens mostrados por grupo antes do "Ver todas".
const ITEMS_PER_GROUP = 4;

const formatDate = (iso) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

function VersionTitle({ version }) {
  const { t } = useTranslation();
  if (version.unreleased) return t("home_changelog_next");
  return t("changelog_version", {
    version: version.version,
    date: version.date ? formatDate(version.date) : "",
  });
}

function Groups({ version, limit }) {
  return version.groups.map((group) => (
    <div key={group.title} className="mb-3">
      <div className="mb-1 text-sm font-semibold">{group.title}</div>
      <ul className="list-disc ps-5 text-sm leading-relaxed">
        {group.items.slice(0, limit).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  ));
}

export default function ChangelogPanel() {
  const { t } = useTranslation();
  const [showAll, setShowAll] = useState(false);
  const [latest, ...older] = VERSIONS;
  const hidden =
    latest?.groups.some((g) => g.items.length > ITEMS_PER_GROUP) ||
    older.length > 0;

  return (
    <section
      id="novidades"
      aria-labelledby="home-changelog"
      className="flex min-h-0 flex-col rounded-2xl border border-color p-5"
      style={{ backgroundColor: "var(--semi-color-bg-1)" }}
    >
      <h2 id="home-changelog" className="home-title mb-3 text-xl">
        {t("home_changelog")}
      </h2>
      <div className="min-h-0 flex-1 overflow-y-auto pe-1">
        {!latest && <p className="text-sm">{t("changelog_empty")}</p>}
        {latest && (
          <>
            <div
              className="mb-2 text-sm font-semibold"
              style={{ color: "var(--semi-color-primary)" }}
            >
              <VersionTitle version={latest} />
            </div>
            <Groups version={latest} limit={ITEMS_PER_GROUP} />
          </>
        )}
        {older.length > 0 && (
          <Collapse accordion>
            {older.slice(0, 3).map((version) => (
              <Collapse.Panel
                key={version.version}
                itemKey={version.version}
                header={<VersionTitle version={version} />}
              >
                <Groups version={version} limit={ITEMS_PER_GROUP} />
              </Collapse.Panel>
            ))}
          </Collapse>
        )}
      </div>
      {hidden && (
        <div className="mt-3">
          <Button theme="borderless" onClick={() => setShowAll(true)}>
            {t("home_changelog_all")}
          </Button>
        </div>
      )}
      <ChangelogDialog visible={showAll} onClose={() => setShowAll(false)} />
    </section>
  );
}
