import { useEffect, useState } from "react";
import { Button, Input, Modal } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";
import New from "../components/EditorHeader/Modal/New";
import { DialogFooter } from "./dialogParts";

// Arquivo > Novo e Arquivo > Nova janela: escolha entre "Em branco" e os
// modelos (a grade é a do upstream). mode: null (fechada), "here" (nesta
// janela) ou "window" (em nova janela).
//
// Novo nesta janela deixa o diagrama atual: se ele ainda tem o nome padrão,
// oferece renomeá-lo antes (o "Salvar como" do primeiro salvamento). onCreate
// recebe o modelo escolhido e o novo nome do diagrama atual (ou null).
export default function NewDialog({
  mode,
  onClose,
  onCreate,
  askName,
  currentTitle,
}) {
  const { t } = useTranslation();
  const [templateId, setTemplateId] = useState("blank");
  const [step, setStep] = useState("choose");
  const [name, setName] = useState("");

  useEffect(() => {
    if (!mode) return;
    setTemplateId("blank");
    setStep("choose");
    setName("");
  }, [mode]);

  const choose = () => {
    if (mode === "here" && askName) setStep("name");
    else onCreate(templateId, null);
  };

  const saveName = () => {
    if (name.trim()) onCreate(templateId, name.trim());
  };

  if (step === "name") {
    return (
      <Modal
        title={t("new_name_title")}
        visible={Boolean(mode)}
        onCancel={onClose}
        centered
        width={480}
        footer={
          <DialogFooter>
            <Button onClick={onClose}>{t("cancel")}</Button>
            <Button onClick={() => onCreate(templateId, null)}>
              {t("new_name_skip")}
            </Button>
            <Button theme="solid" disabled={!name.trim()} onClick={saveName}>
              {t("new_name_save")}
            </Button>
          </DialogFooter>
        }
      >
        <p className="mb-3 text-sm">
          {t("new_name_body", { title: currentTitle })}
        </p>
        <Input
          autoFocus
          value={name}
          onChange={setName}
          onEnterPress={saveName}
          placeholder={t("diagram_name_placeholder")}
        />
      </Modal>
    );
  }

  return (
    <Modal
      title={t(
        mode === "window" ? "new_window_dialog_title" : "new_dialog_title",
      )}
      visible={Boolean(mode)}
      onCancel={onClose}
      centered
      width={740}
      footer={
        <DialogFooter>
          <Button onClick={onClose}>{t("cancel")}</Button>
          <Button theme="solid" onClick={choose}>
            {t("create")}
          </Button>
        </DialogFooter>
      }
    >
      {/* Dois cliques num modelo também criam o diagrama. */}
      <div onDoubleClick={(e) => e.target.closest(".grid > *") && choose()}>
        <New
          selectedTemplateId={templateId}
          setSelectedTemplateId={setTemplateId}
        />
      </div>
    </Modal>
  );
}
