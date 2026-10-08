import { Banner } from "@douyinfe/semi-ui";

// Peças comuns das janelas do fork, para todas seguirem o mesmo padrão:
// rodapé com ações extras à esquerda e "Cancelar" + ação principal à direita.

// O Semi UI põe margem à esquerda em cada botão do rodapé; aqui o espaço vem
// só do gap, para os botões não quebrarem linha sem necessidade.
export function DialogFooter({ extra, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 [&_.semi-button]:ml-0!">
      <div className="flex flex-wrap items-center gap-2">{extra}</div>
      <div className="ms-auto flex flex-wrap items-center justify-end gap-2">
        {children}
      </div>
    </div>
  );
}

export function Notice({ type, children }) {
  return (
    <Banner
      type={type}
      fullMode={false}
      closeIcon={null}
      description={children}
    />
  );
}

// Lista de rótulo e valor; linhas sem valor não aparecem.
export function Summary({ rows }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
      {rows
        .filter(([, value]) => value !== null && value !== undefined)
        .map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="opacity-70">{label}</dt>
            <dd className="break-all font-semibold">{value}</dd>
          </div>
        ))}
    </dl>
  );
}

// Título de seção dentro de uma janela (Exportar).
export function SectionTitle({ children }) {
  return <div className="mb-1 px-2 text-sm font-semibold">{children}</div>;
}
