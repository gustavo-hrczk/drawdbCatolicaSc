// Selo exibido apenas no build de homologação (VITE_APP_ENV=homolog), para que
// ninguém confunda o ambiente de testes com o site usado pela turma.
export default function HomologBadge() {
  if (import.meta.env.VITE_APP_ENV !== "homolog") return null;

  return (
    <div
      role="status"
      className="fixed bottom-2 left-2 z-[9999] pointer-events-none select-none rounded-md bg-amber-500 px-2.5 py-1 text-xs font-semibold text-black shadow-md"
    >
      Ambiente de testes: os diagramas daqui não aparecem no site oficial
    </div>
  );
}
