import { Button, Modal } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";
import changelogText from "../../CHANGELOG.md?raw";
import { latestVersion, parseChangelog } from "./changelog";
import { DialogFooter, Summary } from "./dialogParts";
import { LICENSE_URL, REPOSITORY_URL, UPSTREAM_URL } from "./links";

// Ajuda > Novidades e Ajuda > Sobre.

const VERSIONS = parseChangelog(changelogText);
const IS_TEST_ENVIRONMENT = import.meta.env.VITE_APP_ENV === "homolog";

// Versão deste editor: a última publicada no CHANGELOG, ou null.
export const EDITOR_VERSION = latestVersion(VERSIONS);

function CloseFooter({ onClose }) {
  const { t } = useTranslation();
  return (
    <DialogFooter>
      <Button theme="solid" onClick={onClose}>
        {t("close")}
      </Button>
    </DialogFooter>
  );
}

const formatDate = (iso) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

export function ChangelogDialog({ visible, onClose }) {
  const { t } = useTranslation();
  return (
    <Modal
      title={t("changelog_title")}
      visible={visible}
      onCancel={onClose}
      centered
      width={680}
      footer={<CloseFooter onClose={onClose} />}
    >
      <div className="flex max-h-[60vh] flex-col gap-5 overflow-auto pe-2">
        {VERSIONS.length === 0 && <div>{t("changelog_empty")}</div>}
        {VERSIONS.map((version) => (
          <section key={version.version}>
            <div className="mb-2 text-base font-semibold">
              {version.unreleased
                ? t("changelog_unreleased")
                : t("changelog_version", {
                    version: version.version,
                    date: version.date ? formatDate(version.date) : "",
                  })}
            </div>
            {version.groups.map((group) => (
              <div key={group.title} className="mb-3">
                <div className="mb-1 text-sm font-semibold">{group.title}</div>
                <ul className="list-disc ps-5 text-sm">
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))}
      </div>
    </Modal>
  );
}

const ExternalLink = ({ href, children }) => (
  <a href={href} target="_blank" rel="noreferrer" className="text-sky-600">
    {children}
  </a>
);

export function AboutDialog({ visible, onClose }) {
  const { t } = useTranslation();
  const version = [
    EDITOR_VERSION ?? t("about_version_dev"),
    IS_TEST_ENVIRONMENT ? t("about_test_environment") : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <Modal
      title={t("about_title")}
      visible={visible}
      onCancel={onClose}
      centered
      width={560}
      footer={<CloseFooter onClose={onClose} />}
    >
      <p className="mb-4 text-sm">{t("about_description")}</p>
      <Summary
        rows={[
          [t("about_version"), version],
          [
            t("about_license"),
            <ExternalLink key="license" href={LICENSE_URL}>
              GNU AGPL-3.0
            </ExternalLink>,
          ],
          [
            t("about_source"),
            <ExternalLink key="source" href={REPOSITORY_URL}>
              {REPOSITORY_URL.replace("https://", "")}
            </ExternalLink>,
          ],
          [
            t("about_original"),
            <ExternalLink key="upstream" href={UPSTREAM_URL}>
              {t("about_original_credits")}
            </ExternalLink>,
          ],
        ]}
      />
    </Modal>
  );
}
