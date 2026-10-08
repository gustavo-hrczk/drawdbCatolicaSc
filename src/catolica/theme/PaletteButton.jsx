import { useTranslation } from "react-i18next";
import { Tooltip } from "@douyinfe/semi-ui";
import { useSettings } from "../../hooks";

// Botão rápido de cores (Vinho <-> drawDB original), na barra inferior do
// editor e no topo da tela inicial. É o mesmo que Configurações > Cores.
export const PALETTES = ["vinho", "original"];

export default function PaletteButton({ className = "" }) {
  const { t } = useTranslation();
  const { settings, setSettings } = useSettings();
  const current = settings.palette ?? "vinho";
  const next = PALETTES[(PALETTES.indexOf(current) + 1) % PALETTES.length];
  const tip = t("palette_switch", {
    current: t(`palette_${current}`),
    next: t(`palette_${next}`),
  });

  return (
    <Tooltip content={tip} position="bottom">
      <button
        type="button"
        aria-label={tip}
        className={`py-1 px-2 hover-2 rounded-sm text-xl -mt-0.5 ${className}`}
        onClick={() => setSettings((prev) => ({ ...prev, palette: next }))}
      >
        <i className="bi bi-palette" />
      </button>
    </Tooltip>
  );
}
