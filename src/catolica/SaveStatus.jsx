import { useEffect, useState } from "react";
import { Spin, Tag } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";
import { State } from "../data/constants";

// Um save rápido não troca o texto: "Salvando..." só aparece se demorar.
const SLOW_SAVE_MS = 1000;

function formatSavedAt(date, language) {
  const sameDay = date.toDateString() === new Date().toDateString();
  return new Intl.DateTimeFormat(language, {
    ...(sameDay ? {} : { day: "2-digit", month: "2-digit" }),
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// Indicador de salvamento do cabeçalho. Mostra o horário com precisão de
// minuto, então o texto muda no máximo uma vez por minuto em vez de piscar a
// cada auto-save.
export default function SaveStatus({ saveState }) {
  const { t, i18n } = useTranslation();
  const [savedAt, setSavedAt] = useState(null);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (saveState === State.SAVED) setSavedAt(new Date());
    if (saveState !== State.SAVING && saveState !== State.LOADING) {
      setSlow(false);
      return;
    }
    const timer = setTimeout(() => setSlow(true), SLOW_SAVE_MS);
    return () => clearTimeout(timer);
  }, [saveState]);

  let text;
  if (slow) {
    text = saveState === State.LOADING ? t("loading") : t("saving");
  } else if (saveState === State.ERROR) {
    text = t("failed_to_save");
  } else if (saveState === State.FAILED_TO_LOAD) {
    text = t("failed_to_load");
  } else if (savedAt) {
    text = `${t("last_saved")} ${formatSavedAt(savedAt, i18n.language)}`;
  } else {
    text = t("no_changes");
  }

  const failed =
    saveState === State.ERROR || saveState === State.FAILED_TO_LOAD;

  return (
    <Tag
      size="small"
      type="light"
      color={failed ? "red" : undefined}
      prefixIcon={slow ? <Spin size="small" /> : null}
    >
      {text}
    </Tag>
  );
}
