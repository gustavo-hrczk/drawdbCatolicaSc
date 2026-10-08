import { Button, Modal } from "@douyinfe/semi-ui";
import { IconAlertTriangle } from "@douyinfe/semi-icons";
import { useTranslation } from "react-i18next";

// Exibido quando o save percebe que outra aba/janela gravou este diagrama
// depois que ele foi aberto aqui. Nenhuma opção descarta dados sem avisar.
export default function ConflictModal({ conflict, onResolve }) {
  const { t } = useTranslation();
  const options = [
    {
      choice: "copy",
      type: "primary",
      theme: "solid",
      label: "save_conflict_copy",
      hint: "save_conflict_copy_hint",
    },
    {
      choice: "reload",
      type: "tertiary",
      theme: "light",
      label: "save_conflict_reload",
      hint: "save_conflict_reload_hint",
    },
    {
      choice: "overwrite",
      type: "danger",
      theme: "light",
      label: "save_conflict_overwrite",
      hint: "save_conflict_overwrite_hint",
    },
  ];

  return (
    <Modal
      visible={Boolean(conflict)}
      centered
      closable={false}
      maskClosable={false}
      footer={null}
      title={
        <span className="flex items-center gap-2">
          <IconAlertTriangle className="text-amber-400" size="extra-large" />
          {t("save_conflict_title")}
        </span>
      }
    >
      <p className="mb-4">
        {t("save_conflict_body", {
          date: conflict?.savedAt
            ? new Date(conflict.savedAt).toLocaleString()
            : "",
        })}
      </p>
      <div className="flex flex-col gap-3 pb-4">
        {options.map((option) => (
          <div key={option.choice}>
            <Button
              block
              type={option.type}
              theme={option.theme}
              onClick={() => onResolve(option.choice)}
            >
              {t(option.label)}
            </Button>
            <div className="mt-1 text-xs opacity-70">{t(option.hint)}</div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
