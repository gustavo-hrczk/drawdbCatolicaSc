import { Fragment } from "react";
import { Modal, Switch } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";
import { SHORTCUT_GROUPS } from "./shortcuts";

const kbdStyle = {
  backgroundColor: "var(--semi-color-fill-0)",
  border: "1px solid var(--semi-color-border)",
  color: "var(--semi-color-text-0)",
};

function Keys({ combos }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      {combos.map((combo, i) => (
        <Fragment key={combo.join("+")}>
          {i > 0 && <span className="text-xs opacity-60">/</span>}
          <span className="inline-flex items-center gap-0.5">
            {combo.map((key, j) => (
              <Fragment key={key}>
                {j > 0 && <span className="text-xs opacity-60">+</span>}
                <kbd
                  className="min-w-[1.6rem] rounded px-1.5 py-0.5 text-center font-mono text-xs"
                  style={kbdStyle}
                >
                  {key}
                </kbd>
              </Fragment>
            ))}
          </span>
        </Fragment>
      ))}
    </div>
  );
}

// Janela "Atalhos do teclado" (botão da barra de ferramentas, Ajuda →
// Atalhos ou tecla "?"). Lista todos os atalhos, inclusive os fixos do
// sistema, e liga/desliga os atalhos de uma tecla.
export default function ShortcutsModal({
  visible,
  onClose,
  prefs,
  onChangePrefs,
}) {
  const { t } = useTranslation();

  return (
    <Modal
      title={t("shortcuts_title")}
      visible={visible}
      onCancel={onClose}
      footer={null}
      centered
      width={680}
      bodyStyle={{
        maxHeight: "70vh",
        overflowY: "auto",
        overflowX: "hidden",
        paddingBottom: 16,
      }}
    >
      <div
        className="mb-4 flex items-start justify-between gap-4 rounded-md p-3"
        style={{ backgroundColor: "var(--semi-color-fill-0)" }}
      >
        <div>
          <div className="font-semibold">
            {t("shortcuts_single_key_toggle")}
          </div>
          <div className="mt-1 text-xs opacity-80">
            {t("shortcuts_single_key_help")}
          </div>
        </div>
        <Switch
          checked={prefs.singleKey}
          onChange={(checked) =>
            onChangePrefs({ ...prefs, singleKey: checked })
          }
          aria-label={t("shortcuts_single_key_toggle")}
        />
      </div>

      <table className="w-full table-fixed border-collapse text-sm">
        <colgroup>
          <col style={{ width: "42%" }} />
          <col style={{ width: "28%" }} />
          <col style={{ width: "30%" }} />
        </colgroup>
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide opacity-60">
            <th className="pb-2 font-medium">{t("shortcut_col_action")}</th>
            <th className="pb-2 font-medium">{t("shortcut_col_keys")}</th>
            <th className="pb-2 font-medium">{t("shortcut_col_notes")}</th>
          </tr>
        </thead>
        <tbody>
          {SHORTCUT_GROUPS.map(({ group, items }) => (
            <Fragment key={group}>
              <tr>
                <td
                  colSpan={3}
                  className="pb-1 pt-4 text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--semi-color-primary)" }}
                >
                  {t(group)}
                </td>
              </tr>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-t"
                  style={{ borderColor: "var(--semi-color-border)" }}
                >
                  <td className="py-1.5 pr-3 align-middle">{t(item.label)}</td>
                  <td className="py-1.5 pr-3 align-middle">
                    <Keys combos={item.keys} />
                  </td>
                  <td className="py-1.5 align-middle text-xs opacity-70">
                    {item.note ? t(item.note) : ""}
                  </td>
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>

      <div className="mt-4 text-xs opacity-70">
        {t("shortcuts_fixed_notice")}
      </div>
    </Modal>
  );
}
