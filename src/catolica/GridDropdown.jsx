import { IconCaretdown, IconCheckboxTick } from "@douyinfe/semi-icons";
import { Dropdown, Tooltip } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";
import { useSettings } from "../hooks";
import { gridSize as defaultGridSize } from "../data/constants";

const GRID_SIZES = [
  { size: 12, label: "grid_size_small" },
  { size: defaultGridSize, label: "grid_size_medium" },
  { size: 48, label: "grid_size_large" },
];

const tick = (on) => (on ? <IconCheckboxTick /> : <div className="px-2" />);

// Contorno só na navegação por teclado (o clique do mouse não deixa borda).
const FOCUS =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--semi-color-primary)]";

// Padrão dos botões de liga/desliga da barra de ferramentas: ligado, fundo
// azul-claro e ícone azul; desligado, ícone neutro, sem fundo e sem
// transparência (transparência parece "desabilitado"). A dica diz o estado e
// o atalho, e o estado também é anunciado a leitores de tela (aria-pressed).
export function ToolbarToggle({ on, onClick, label, keys, icon, className }) {
  const { t } = useTranslation();
  const tip = t("toolbar_toggle_tip", {
    label,
    state: t(on ? "toolbar_toggle_on" : "toolbar_toggle_off"),
    keys,
  });
  return (
    <Tooltip content={tip} position="bottom">
      <button
        type="button"
        aria-pressed={on}
        aria-label={label}
        onClick={onClick}
        className={`hover-2 rounded-sm px-2 py-1 text-lg ${FOCUS} ${className ?? ""}`}
        style={
          on
            ? {
                color: "var(--semi-color-primary)",
                backgroundColor: "var(--semi-color-primary-light-default)",
              }
            : undefined
        }
      >
        {icon}
      </button>
    </Tooltip>
  );
}

// Grade na barra de ferramentas, como botão dividido: o ícone liga e desliga
// a grade direto (como Ctrl+Shift+G); a seta ao lado abre o tamanho.
export default function GridDropdown() {
  const { t } = useTranslation();
  const { settings, setSettings } = useSettings();
  const current = settings.gridSize ?? defaultGridSize;

  return (
    <div className="flex items-center">
      <ToolbarToggle
        on={Boolean(settings.showGrid)}
        onClick={() =>
          setSettings((prev) => ({ ...prev, showGrid: !prev.showGrid }))
        }
        label={t("show_grid")}
        keys="Ctrl+Shift+G"
        icon={<i className="fa-solid fa-border-none" />}
        className="rounded-e-none"
      />
      <Dropdown
        position="bottomLeft"
        style={{ width: "240px" }}
        trigger="click"
        render={
          <Dropdown.Menu>
            <Dropdown.Title>{t("grid_size")}</Dropdown.Title>
            {GRID_SIZES.map(({ size, label }) => (
              <Dropdown.Item
                key={size}
                icon={tick(current === size)}
                onClick={() =>
                  setSettings((prev) => ({
                    ...prev,
                    gridSize: size,
                    showGrid: true,
                  }))
                }
              >
                {t(label, { size })}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        }
      >
        <div>
          <Tooltip content={t("grid_size")} position="bottom">
            <button
              type="button"
              aria-label={t("grid_size")}
              className={`hover-2 flex items-center self-stretch rounded-sm rounded-s-none px-1 py-2 ${FOCUS}`}
            >
              <IconCaretdown size="small" />
            </button>
          </Tooltip>
        </div>
      </Dropdown>
    </div>
  );
}

// Botão de ímã ao lado da grade: liga/desliga o alinhamento dos objetos à
// grade (mesmo que Ctrl+Alt+G).
export function SnapToGridButton() {
  const { t } = useTranslation();
  const { settings, setSettings } = useSettings();

  return (
    <ToolbarToggle
      on={Boolean(settings.snapToGrid)}
      onClick={() =>
        setSettings((prev) => ({ ...prev, snapToGrid: !prev.snapToGrid }))
      }
      label={t("grid_snap")}
      keys="Ctrl+Alt+G"
      icon={<i className="fa-solid fa-magnet" />}
    />
  );
}
