import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { Button, Tooltip } from "@douyinfe/semi-ui";
import { IconMoon, IconSun } from "@douyinfe/semi-icons";
import logoLight from "../../assets/logo_light_160.png";
import logoDark from "../../assets/logo_dark_160.png";
import { useSettings, useThemedPage } from "../../hooks";
import NewDialog from "../NewDialog";
import ImportDialog from "../ImportDialog";
import { EDITOR_VERSION } from "../InfoDialogs";
import { REPOSITORY_URL, UPSTREAM_DOCS_URL } from "../links";
import DiagramList from "./DiagramList";
import ChangelogPanel from "./ChangelogPanel";
import PaletteButton from "../theme/PaletteButton";
import "./home.css";

// Tela inicial (rota "/"), no lugar da página de apresentação do drawDB
// original (src/pages/LandingPage.jsx, que continua no código sem uso):
// apresentação curta, os diagramas deste navegador e as novidades.
//
// O nome "drawDB" fica, com "versão modificada" e a versão logo abaixo, para
// não parecer o site oficial (decisão do mantenedor, 08/10/2026).

function Header() {
  const { t } = useTranslation();
  const { settings, setSettings } = useSettings();
  const dark = settings.mode === "dark";

  const links = [
    { to: "/editor", label: t("home_nav_editor") },
    { href: "#novidades", label: t("home_changelog") },
    { href: UPSTREAM_DOCS_URL, label: t("home_nav_docs"), external: true },
    { href: REPOSITORY_URL, label: t("home_nav_source"), external: true },
  ];

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 px-8 py-4 sm:px-4">
      <Link to="/" className="flex flex-col items-start">
        <img
          src={dark ? logoDark : logoLight}
          alt="drawDB"
          className="drawdb-logo h-[40px] sm:h-[32px]"
        />
        <span
          className="ms-1 text-xs"
          style={{ color: "var(--semi-color-text-2)" }}
        >
          {EDITOR_VERSION
            ? t("home_modified_version", { version: EDITOR_VERSION })
            : t("home_modified_version_testing")}
        </span>
      </Link>
      <nav className="flex flex-wrap items-center gap-6 sm:gap-3">
        {links.map((link) =>
          link.to ? (
            <Link key={link.label} to={link.to} className="home-nav-link">
              {link.label}
            </Link>
          ) : (
            <a
              key={link.label}
              href={link.href}
              className="home-nav-link"
              {...(link.external && {
                target: "_blank",
                rel: "noopener noreferrer",
              })}
            >
              {link.label}
            </a>
          ),
        )}
        <Tooltip content={t(dark ? "home_theme_light" : "home_theme_dark")}>
          <Button
            theme="borderless"
            type="tertiary"
            icon={dark ? <IconSun /> : <IconMoon />}
            aria-label={t(dark ? "home_theme_light" : "home_theme_dark")}
            onClick={() =>
              setSettings((prev) => ({
                ...prev,
                mode: dark ? "light" : "dark",
              }))
            }
          />
        </Tooltip>
        <PaletteButton className="!text-base" />
      </nav>
    </header>
  );
}

function Hero({ onNew, onImport }) {
  const { t } = useTranslation();
  const badges = [
    ["bi bi-person-x", t("home_badge_no_signup")],
    ["bi bi-gift", t("home_badge_free")],
    ["bi bi-lightning-charge", t("home_badge_quick")],
  ];
  return (
    <section className="home-hero rounded-2xl px-8 py-5 sm:px-5 sm:py-5">
      <h1 className="home-title text-3xl sm:text-2xl">{t("home_title")}</h1>
      <p
        className="mt-2 max-w-[720px] text-sm leading-relaxed"
        style={{ color: "var(--semi-color-text-1)" }}
      >
        {t("home_subtitle")}
      </p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {badges.map(([icon, label]) => (
          <li key={label} className="home-badge">
            <i className={icon} aria-hidden />
            {label}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button theme="solid" type="primary" onClick={onNew}>
          {t("home_new")}
        </Button>
        <Button onClick={onImport}>{t("import")}</Button>
      </div>
    </section>
  );
}

export default function HomePage() {
  useThemedPage();
  const { t } = useTranslation();
  useEffect(() => {
    document.title = t("home_tab_title");
  }, [t]);
  const navigate = useNavigate();
  const [newOpen, setNewOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "var(--semi-color-bg-0)",
        color: "var(--semi-color-text-0)",
      }}
    >
      <Header />
      <main className="mx-auto flex max-w-[1280px] flex-col gap-6 px-8 pb-10 sm:px-4">
        <Hero
          onNew={() => setNewOpen(true)}
          onImport={() => setImportOpen(true)}
        />
        {/* Mesma altura nas duas colunas, com rolagem dentro de cada uma. */}
        <div className="grid h-[560px] grid-cols-[3fr_2fr] gap-6 lg:h-auto lg:grid-cols-1 lg:[&>section]:h-[520px]">
          <DiagramList />
          <ChangelogPanel />
        </div>
      </main>
      <NewDialog
        mode={newOpen ? "here" : null}
        onClose={() => setNewOpen(false)}
        onCreate={(templateId) => {
          setNewOpen(false);
          navigate(`/editor/templates/${templateId}`);
        }}
        askName={false}
      />
      <ImportDialog visible={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}
