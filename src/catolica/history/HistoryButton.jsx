import { useTranslation } from "react-i18next";
import { useMatch } from "react-router-dom";
import { Button } from "@douyinfe/semi-ui";
import { IconHistory } from "@douyinfe/semi-icons";
import { hasGistBackend } from "../features";
import { toggleHistoryPanel } from "./panelState";

// Botão da barra superior, no lugar de "Compartilhar" (que depende de um
// servidor que esta versão não tem): abre e fecha o painel do histórico na
// aba Versões. Mesmo visual do botão do upstream.
export default function HistoryButton() {
  const { t } = useTranslation();
  const isTemplate = useMatch("/editor/templates/:id");
  if (hasGistBackend || isTemplate) return null;
  return (
    <Button
      type="primary"
      className="!text-base !pe-6 !ps-5 !py-[18px] !rounded-md"
      size="default"
      icon={<IconHistory />}
      onClick={() => toggleHistoryPanel("versions")}
    >
      {t("version_history")}
    </Button>
  );
}
