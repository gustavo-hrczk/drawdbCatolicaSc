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

// Texto do item com o atalho alinhado à direita, como nos menus do cabeçalho.
function WithShortcut({ keys, children }) {
  return (
    <div className="flex w-full items-center justify-between gap-4">
      <span>{children}</span>
      <span className="text-xs opacity-60">{keys}</span>
    </div>
  );
}

// Menu da grade na barra de ferramentas: mostrar/ocultar, alinhar objetos à
// grade e tamanho. Segue o padrão do LayoutDropdown do upstream.
export default function GridDropdown() {
  const { t } = useTranslation();
  const { settings, setSettings } = useSettings();
  const current = settings.gridSize ?? defaultGridSize;
  const toggle = (key) =>
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <Dropdown
      position="bottomLeft"
      style={{ width: "290px" }}
      trigger="click"
      render={
        <Dropdown.Menu>
          <Dropdown.Item
            icon={tick(settings.showGrid)}
            onClick={() => toggle("showGrid")}
          >
            <WithShortcut keys="Ctrl+Shift+G">{t("show_grid")}</WithShortcut>
          </Dropdown.Item>
          <Dropdown.Item
            icon={tick(settings.snapToGrid)}
            onClick={() => toggle("snapToGrid")}
          >
            <WithShortcut keys="Ctrl+Alt+G">{t("grid_snap")}</WithShortcut>
          </Dropdown.Item>
          <Dropdown.Divider />
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
        <Tooltip content={`${t("grid_menu")} (Ctrl+Shift+G)`} position="bottom">
          <div
            className={`py-1 px-2 hover-2 rounded-sm flex items-center justify-center gap-1 ${
              settings.showGrid ? "" : "opacity-50"
            }`}
          >
            <i className="fa-solid fa-border-none text-lg" />
            <IconCaretdown />
          </div>
        </Tooltip>
      </div>
    </Dropdown>
  );
}
