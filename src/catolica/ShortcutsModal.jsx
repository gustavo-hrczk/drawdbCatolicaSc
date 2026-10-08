import { Fragment } from "react";
import { Modal, Switch } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";
import { SHORTCUT_GROUPS } from "./shortcuts";

const kbdStyle = {
  backgroundColor: "var(--semi-color-fill-0)",
  border: "1px solid var(--semi-color-border)",
  color: "var(--semi-color-text-0)",
};
const borderStyle = { borderColor: "var(--semi-color-border)" };

// Alternativas de teclas simples (← ↑ → ↓) ficam na mesma linha; combinações
// alternativas (Ctrl+Y ou Ctrl+Shift+Z) ficam uma por linha, com o "ou" no
// fim da linha de cima, para todas as teclas começarem na mesma coluna.
function Keys({ combos }) {
  const { t } = useTranslation();
  const stacked = combos.length > 1 && combos.some((combo) => combo.length > 1);
  return (
    <div
      className={`flex gap-1.5 whitespace-nowrap ${
        stacked ? "flex-col items-start" : "items-center"
      }`}
    >
      {combos.map((combo, i) => (
        <Fragment key={combo.join("+")}>
          {i > 0 && !stacked && <span className="text-xs opacity-50">/</span>}
          <span className="inline-flex items-center gap-0.5">
            {combo.map((key, j) => (
              <Fragment key={key}>
                {j > 0 && <span className="text-xs opacity-50">+</span>}
                <kbd
                  className="min-w-[1.4rem] rounded px-1 py-px text-center font-mono text-[11px]"
                  style={kbdStyle}
                >
                  {key}
                </kbd>
              </Fragment>
            ))}
            {stacked && i < combos.length - 1 && (
              <span className="ms-1 text-xs opacity-50">
                {t("shortcut_or")}
              </span>
            )}
          </span>
        </Fragment>
      ))}
    </div>
  );
}

function GroupHeader({ children, action }) {
  return (
    <tr>
      <td colSpan={2} className="pb-1 pt-3">
        <div className="flex min-h-6 items-center justify-between gap-3">
          <span
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: "var(--semi-color-primary)" }}
          >
            {children}
          </span>
          {action}
        </div>
      </td>
    </tr>
  );
}

// Janela "Atalhos do teclado" (botão da barra de ferramentas, Ajuda →
// Atalhos ou tecla "?"). Lista todos os atalhos, inclusive os fixos do
// sistema. A chave do grupo "Atalhos rápidos" liga/desliga esses atalhos e
// mostra ou oculta as linhas deles.
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
      width={460}
      bodyStyle={{
        maxHeight: "70vh",
        overflowY: "auto",
        overflowX: "hidden",
        // Reserva o espaço da barra de rolagem para ela não cobrir a chave.
        scrollbarGutter: "stable",
        paddingRight: 4,
        paddingBottom: 12,
      }}
    >
      {/* pe-3: a chave e as teclas não encostam na barra de rolagem (em
          tabela com bordas colapsadas o padding não vale, por isso o div). */}
      <div className="pe-3">
        <table className="w-full table-fixed border-collapse text-[13px]">
          <colgroup>
            <col style={{ width: "56%" }} />
            <col style={{ width: "44%" }} />
          </colgroup>
          <tbody>
            {SHORTCUT_GROUPS.map(({ group, items, singleKey }) => (
              <Fragment key={group}>
                <GroupHeader
                  action={
                    singleKey && (
                      <Switch
                        size="small"
                        checked={prefs.singleKey}
                        onChange={(checked) =>
                          onChangePrefs({ ...prefs, singleKey: checked })
                        }
                        aria-label={t(group)}
                      />
                    )
                  }
                >
                  {t(group)}
                </GroupHeader>
                {(!singleKey || prefs.singleKey) &&
                  items.map((item) => (
                    <Fragment key={item.id}>
                      <tr className="border-t" style={borderStyle}>
                        <td className="py-1 pr-3 align-middle">
                          {t(item.label)}
                        </td>
                        <td className="py-1 align-middle">
                          <Keys combos={item.keys} />
                        </td>
                      </tr>
                      {item.option && (
                        <tr>
                          <td colSpan={2} className="pb-1 ps-3">
                            <label className="flex items-center justify-between gap-3 text-xs opacity-80">
                              <span>{t(item.option.label)}</span>
                              <Switch
                                size="small"
                                checked={Boolean(prefs[item.option.pref])}
                                onChange={(checked) =>
                                  onChangePrefs({
                                    ...prefs,
                                    [item.option.pref]: checked,
                                  })
                                }
                              />
                            </label>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
