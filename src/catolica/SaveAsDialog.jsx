import { useEffect, useState } from "react";
import { Checkbox, Input, Modal } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";
import { focusDialogField } from "./renameField";
import { uniqueDiagramName } from "./uniqueName";

// Arquivo > Salvar como (Ctrl+Shift+S). Inclui a opção "Salvar como modelo",
// que antes era um item separado do menu: o modelo aparece em Arquivo > Novo.
export default function SaveAsDialog({
  visible,
  onClose,
  title,
  onSaveCopy,
  onSaveTemplate,
}) {
  const { t } = useTranslation();
  const [name, setName] = useState(title);
  const [asTemplate, setAsTemplate] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName(title);
    setAsTemplate(false);
    setSaving(false);
    // O Enter já é tratado pelo próprio campo (onEnterPress).
    focusDialogField({ submitOnEnter: false });
    // O nome é lido só ao abrir a janela.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const confirm = async () => {
    const trimmed = name.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      // A cópia não repete o nome de outro diagrama ("Nome (cópia)").
      await (asTemplate
        ? onSaveTemplate(trimmed)
        : onSaveCopy(await uniqueDiagramName(trimmed)));
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={t("save_as")}
      visible={visible}
      onCancel={onClose}
      onOk={confirm}
      okText={t("save_as")}
      cancelText={t("cancel")}
      okButtonProps={{ disabled: !name.trim(), loading: saving }}
      centered
      width={480}
    >
      <Input
        value={name}
        onChange={setName}
        onEnterPress={confirm}
        placeholder={t("name")}
      />
      <Checkbox
        className="mt-3"
        checked={asTemplate}
        onChange={(e) => setAsTemplate(e.target.checked)}
      >
        {t("save_as_template_option")}
      </Checkbox>
    </Modal>
  );
}
