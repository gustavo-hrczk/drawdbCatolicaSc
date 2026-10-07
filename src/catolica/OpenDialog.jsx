import { useEffect, useRef, useState } from "react";
import { Button, Modal } from "@douyinfe/semi-ui";
import { IconUpload } from "@douyinfe/semi-icons";
import { useTranslation } from "react-i18next";
import Open from "../components/EditorHeader/Modal/Open";

// Arquivo > Abrir (Ctrl+O): a lista de diagramas do upstream, que já vem com
// os mais recentes primeiro (por isso o "Abrir recente" saiu do menu). Dois
// cliques abrem o diagrama, e o botão "Abrir arquivo do computador" leva à
// janela Importar, para quem procura o .zip recebido pelo Teams em "Abrir".
export default function OpenDialog({ visible, onClose, onOpen, onOpenFile }) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(null);
  const selectedRef = useRef(null);
  selectedRef.current = selected;

  useEffect(() => {
    if (visible) setSelected(null);
  }, [visible]);

  return (
    <Modal
      title={t("open_diagram")}
      visible={visible}
      onCancel={onClose}
      centered
      width={740}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button icon={<IconUpload />} onClick={onOpenFile}>
            {t("open_from_computer")}
          </Button>
          <div className="flex gap-2">
            <Button onClick={onClose}>{t("cancel")}</Button>
            <Button
              theme="solid"
              disabled={!selected}
              onClick={() => onOpen(selected)}
            >
              {t("open")}
            </Button>
          </div>
        </div>
      }
    >
      <div
        onDoubleClick={(e) => {
          if (e.target.closest("tbody tr") && selectedRef.current) {
            onOpen(selectedRef.current);
          }
        }}
      >
        {visible && (
          <Open
            selectedDiagramId={selected}
            setSelectedDiagramId={setSelected}
          />
        )}
      </div>
    </Modal>
  );
}
