import { Button, Tooltip } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";
import { useLayout } from "../hooks";

// Com a barra de menu oculta (Ver → Barra de menu), não havia como trazê-la
// de volta se a barra de ferramentas também estivesse oculta. Este botão fica
// no canto do desenho enquanto a barra de menu estiver oculta.
export default function HeaderRestoreButton() {
  const { t } = useTranslation();
  const { layout, setLayout } = useLayout();
  if (layout.header) return null;

  return (
    <div className="absolute right-3 top-3 z-40">
      <Tooltip content={t("show_header")} position="left">
        <Button
          theme="light"
          type="tertiary"
          aria-label={t("show_header")}
          icon={<i className="fa-solid fa-bars" />}
          onClick={() => setLayout((prev) => ({ ...prev, header: true }))}
        />
      </Tooltip>
    </div>
  );
}
