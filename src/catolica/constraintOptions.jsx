import { Constraint } from "../data/constants";

// Opções de "Na atualização" e "Na exclusão" do relacionamento: o nome no
// idioma do editor e, na lista, o termo SQL ao lado (CASCADE, SET NULL...),
// que é o que aparece no código. O valor gravado continua o do upstream.
export function constraintOptions(t) {
  return Object.values(Constraint).map((value) => ({
    value,
    label: (
      <span className="flex w-full items-center justify-between gap-3">
        <span>{t(value)}</span>
        <span className="font-mono text-xs opacity-60">
          {value.toUpperCase()}
        </span>
      </span>
    ),
  }));
}

// Campo fechado: só o nome traduzido (o termo SQL não cabe na meia coluna).
export const constraintSelected = (t) => (option) => t(option.value);
