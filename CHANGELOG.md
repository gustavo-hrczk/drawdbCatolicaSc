# Novidades

Registro público das mudanças desta versão do editor em relação ao
[drawDB original](https://github.com/drawdb-io/drawdb). As versões seguem o
[versionamento semântico](https://semver.org/lang/pt-BR/) e as regras de
[`docs/versionamento.md`](docs/versionamento.md).

<!--
Formato (a tela inicial lê este arquivo; mantenha a estrutura):
- Uma seção "## [x.y.z] - AAAA-MM-DD" por versão publicada, da mais nova para a mais antiga.
- "## [Não lançado]" no topo acumula o que já está na homologação e ainda não foi publicado.
- Dentro de cada versão, só estes grupos, nesta ordem: "### Novidades", "### Melhorias",
  "### Correções", "### Removido".
- Cada item: uma linha, do ponto de vista de quem usa o editor, começando por verbo ou
  substantivo, sem detalhes técnicos.
-->

## [Não lançado]

### Novidades

- Atalhos de uma tecla com proteção contra digitação acidental: T (tabela), A (área) e N (nota)
  criam o elemento onde está o mouse; O organiza o diagrama; F ajusta o diagrama à tela; ? abre a
  lista de atalhos.
- Janela "Atalhos do teclado" com todos os atalhos e opção de desligar os de uma tecla.
- Novos atalhos: Esc (desmarcar e fechar mensagens), Ctrl+F (buscar tabela), Ctrl+Alt+D (tema
  claro/escuro), Ctrl+Alt+G (alinhar à grade) e Ctrl+Shift+Z (refazer).
- Menu da grade na barra de ferramentas (mostrar e tamanho) e botão de ímã para alinhar objetos.
- Desfazer e refazer continuam funcionando depois de recarregar a página ou reabrir o diagrama.
- Aviso quando o mesmo diagrama está aberto em outra aba e escolha do que fazer em caso de
  conflito de gravação, sem perder nada.
- Nome do diagrama no título da aba do navegador.
- Botão para reexibir a barra de menu quando ela estiver oculta.
- Exportar para entrega: só o SQL, SQL + JSON ou um pacote .zip com o SQL, o diagrama, uma imagem
  e instruções, com data e hora no nome dos arquivos.
- Importar arquivo (Ctrl+I): aceita o .json, o .sql, os dois juntos ou o pacote .zip, com resumo
  antes de abrir, conferência do SQL com o desenho e aviso de arquivo já importado.
- Banco de dados padrão em Configurações (PostgreSQL, se nada for escolhido).
- F2 renomeia a tabela, área, nota ou view selecionada.

### Melhorias

- Salvamento automático também enquanto você digita e ao trocar de aba, com aviso ao fechar a
  página se algo ainda não foi salvo.
- Aviso quando o salvamento automático está desligado, com botão para religar.
- Indicador "Última vez salvo" estável, sem piscar a cada alteração.
- Copiar e colar elementos funcionam entre abas e em todos os navegadores.
- Copiar como imagem e exportar PNG, JPEG, SVG e PDF: imagem fiel ao editor, recortada no
  conteúdo e gerada sem travar a página.
- Importar um arquivo abre um diagrama novo, sem substituir o que está aberto.
- Diagrama aberto a partir de um .sql vem organizado e enquadrado na tela.
- Diagramas novos se chamam "Diagrama sem título".
- Organizar automaticamente: desfazer também volta o zoom anterior.
- Delete logo depois de digitar em um campo pede confirmação.
- Mensagens revisadas em português.

### Correções

- Diagrama aberto por um link inexistente mostrava "Salvo" sem gravar nada.
- Abrir o editor pela página inicial criava uma cópia do último diagrama.
- "Exportar dados salvos" incluía arquivos antigos e gerava o nome com a data errada.
- Arquivo → Sair podia sair antes de terminar de salvar.
- Alterações muito rápidas ou troca de diagrama durante o salvamento podiam gravar o conteúdo
  errado.
- Exportar JPEG e PDF podia sair com fundo preto.

### Removido

- Versões (dependia de um servidor que esta versão não tem).
- Atalho Ctrl+Alt+W, que fazia o mesmo que F.
