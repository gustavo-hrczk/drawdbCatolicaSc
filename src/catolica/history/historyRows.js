import { describeChange } from "./describeChange";

// Linhas da linha do tempo, da mais recente para a mais antiga:
// passos desfeitos (que o refazer traz de volta), passos feitos e, por fim,
// o início do histórico. Passos iguais seguidos viram uma linha só.
//
// Cada linha: { id, text, kind, at, count, status, steps }
// status: "undone" | "current" | "done" | "start"
// steps: o que clicar faz (< 0 desfaz, > 0 refaz, 0 nada).

// Texto do passo no idioma atual. Passos gravados antes desta versão não têm
// frase: usa a mensagem do upstream, sem as marcações técnicas ("[name]").
const describe = (entry, state) =>
  entry.desc ?? describeChange(entry, state, { live: true });

export function stepText(entry, t, state) {
  const desc = describe(entry, state);
  if (!desc) {
    return String(entry.message ?? "")
      .replace(/\s*\[[^\]]*\]/g, "")
      .trim();
  }
  const text = t(desc.key, desc.params);
  if (!desc.props?.length) return text;
  const props = desc.props
    .map((prop) => t(`history_prop_${prop}`, { defaultValue: prop }))
    .join(", ");
  return t("history_with_props", { text, props });
}

const isHidden = (entry, state) => Boolean(describe(entry, state)?.hidden);

function kindOf(entry, state) {
  return describe(entry, state)?.kind ?? "edit";
}

// Junta passos seguidos com o mesmo texto (ex.: mover a mesma tabela várias
// vezes). items: [{ entry, steps }] já na ordem de exibição.
function group(items, status, t, state) {
  const rows = [];
  for (const { entry, steps, index } of items) {
    if (isHidden(entry, state)) continue;
    const text = stepText(entry, t, state);
    const last = rows.at(-1);
    if (last && last.text === text) {
      last.count += 1;
      // Desfeitos: a linha refaz até o mais distante do grupo (o de baixo
      // para cima na tela é o próximo a refazer, então mantém o maior).
      if (status === "undone") last.steps = Math.max(last.steps, steps);
      continue;
    }
    rows.push({
      id: `${status}-${index}`,
      text,
      kind: kindOf(entry, state),
      at: entry.at ?? null,
      count: 1,
      status,
      steps,
    });
  }
  return rows;
}

export function historyRows(undoStack, redoStack, t, state) {
  // Desfeitos: o topo da pilha de refazer é o próximo a voltar; na tela fica
  // logo acima do passo atual. Clicar refaz até ele.
  const undone = redoStack
    .map((entry, index) => ({
      entry,
      index,
      steps: redoStack.length - index,
    }))
    .filter(({ entry }) => entry);

  // Feitos, do mais recente ao mais antigo. Clicar volta para logo depois do
  // passo (desfaz os mais recentes que ele).
  const done = undoStack
    .map((entry, index) => ({
      entry,
      index,
      steps: -(undoStack.length - 1 - index),
    }))
    .reverse();

  const doneRows = group(done, "done", t, state);
  // A primeira linha visível é o ponto atual (passos de exibição acima dela
  // não contam): clicar nela não faz nada.
  if (doneRows.length > 0) {
    doneRows[0].status = "current";
    doneRows[0].steps = 0;
  }
  return [
    ...group(undone, "undone", t, state),
    ...doneRows,
    {
      id: "start",
      text: t("history_start"),
      kind: "start",
      at: null,
      count: 1,
      status: doneRows.length === 0 ? "current" : "start",
      steps: -undoStack.length,
    },
  ];
}
