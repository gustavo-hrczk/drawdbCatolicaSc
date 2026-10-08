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

- Atalhos rápidos (uma tecla) com proteção contra digitação acidental: T (tabela), A (área) e N
  (nota) criam o elemento onde está o mouse; E abre a edição do elemento selecionado; C adiciona
  uma coluna à tabela selecionada; O organiza o diagrama; F ajusta o diagrama à tela; ? abre a
  lista de atalhos.
- Janela "Atalhos do teclado" com todos os atalhos e opção de desligar os atalhos rápidos.
- Novos atalhos: Esc (em etapas: sai do campo, fecha a edição e desmarca; também fecha
  mensagens), Ctrl+F (buscar tabela), Ctrl+Alt+D (tema
  claro/escuro), Ctrl+Alt+G (alinhar à grade), Ctrl+E (exportar, par com o Ctrl+I de importar) e
  Ctrl+Shift+Z (refazer).
- Botões de grade e de ímã (alinhar objetos à grade) na barra de ferramentas, com o mesmo visual
  de ligado e desligado e o estado na dica; a grade liga direto no ícone, e a seta ao lado escolhe
  o tamanho.
- Desfazer e refazer continuam funcionando depois de recarregar a página ou reabrir o diagrama
  (até 500 alterações por diagrama).
- Histórico de alterações (Editar → Histórico de alterações): painel ao lado do diagrama com cada
  alteração em uma frase, com ícone e horário. Clicar numa alteração volta o diagrama até ela, e
  as desfeitas ficam esmaecidas até serem refeitas.
- Histórico de versões (botão no lugar de "Compartilhar"): versões automáticas ao abrir o diagrama
  e a cada 10 minutos de edição, e versões com nome. Cada versão pode ser vista, restaurada (o
  diagrama atual é guardado antes e o Ctrl+Z desfaz), aberta como cópia, baixada, renomeada ou
  excluída.
- O pacote .zip pode levar o histórico (alterações e versões), que volta junto ao importar. A imagem
  e o histórico são opcionais, ligados por padrão.
- Aviso quando o mesmo diagrama está aberto em outra aba e escolha do que fazer em caso de
  conflito de gravação, sem perder nada.
- Nome do diagrama no título da aba do navegador.
- Botão para reexibir a barra de menu quando ela estiver oculta.
- Exportar: uma janela só, com o SQL, o diagrama completo (pacote .zip com o SQL, o desenho e uma
  imagem), imagem (PNG, JPEG, SVG ou PDF) e outros formatos (DBML, Mermaid e documentação), com o
  nome do diagrama editável e data e hora no nome do arquivo.
- Importar (Ctrl+I): uma janela só para o SQL (arquivo ou código colado), o diagrama completo
  (.zip ou .json) e o DBML, com resumo antes de abrir, conferência do SQL com o desenho e aviso
  quando o diagrama já existe no navegador.
- Importar um .zip com vários diagramas (como o "Baixar tudo" das Tarefas do Teams, com um pacote
  por aluno) mostra a lista para escolher qual abrir.
- Banco de dados padrão em Configurações (PostgreSQL, se nada for escolhido).
- F2 renomeia a tabela, área, nota ou view selecionada. Opção na janela "Atalhos do teclado" para
  o F2 renomear a coluna, tabela, nota ou área sob o mouse.
- Ajuda → Novidades mostra as mudanças de cada versão, e Ajuda → Sobre mostra a versão, a licença
  e o código-fonte.
- Ajuda → Relatar um problema abre uma issue no repositório do editor, já com um roteiro para o
  relato.

### Melhorias

- Relacionamentos: um clique na linha ou nos pontos seleciona (em destaque) e Delete exclui, como
  nas tabelas; o relacionamento criado já abre com o nome selecionado.
- Tabela, área, nota e coluna novas já abrem com o nome selecionado, pronto para digitar; pelas
  teclas T, A, N e C, o que for digitado logo em seguida já entra no nome.
- Nomes numerados para elementos novos (tabela_1, area_1, nota_1) no lugar de códigos aleatórios.
- Salvamento automático também enquanto você digita e ao trocar de aba, com aviso ao fechar a
  página se algo ainda não foi salvo.
- Aviso quando o salvamento automático está desligado, com botão para religar.
- Indicador "Última vez salvo" estável, sem piscar a cada alteração.
- Copiar e colar elementos funcionam entre abas e em todos os navegadores.
- Copiar como imagem e exportar PNG, JPEG, SVG e PDF: imagem fiel ao editor, recortada no
  conteúdo e gerada sem travar a página.
- Menu Arquivo mais enxuto: Novo, Nova janela, Abrir, Abrir recente, Salvar, Salvar como,
  Importar, Exportar e Sair.
- Novo começa o diagrama nesta janela, depois de salvar o atual, e oferece renomeá-lo se ele ainda
  tiver o nome padrão. Nova janela começa o diagrama em outra janela.
- Abrir recente mostra os 5 diagramas editados por último.
- Abrir mostra os diagramas mais recentes primeiro, abre com dois cliques e também abre arquivos
  do computador.
- Salvar como tem a opção de salvar como modelo.
- Lápis para renomear sempre visível ao lado do nome do diagrama.
- Importar sempre cria um diagrama novo e o abre em uma nova janela, sem mexer no que está aberto.
- Importar ignora os arquivos que acompanham o diagrama (imagem, LEIA-ME) quando todos os arquivos
  extraídos do .zip são escolhidos juntos.
- Importar mantém os acentos de arquivos .sql salvos em ANSI por editores antigos do Windows.
- Mensagens de importação mais claras: arquivo vazio, tamanho e limite de arquivos grandes demais
  e pacotes dentro de pacotes.
- Diagrama aberto a partir de um .sql ou .dbml vem organizado e enquadrado na tela.
- Janelas do menu Arquivo com o mesmo padrão de botões e textos que descrevem cada opção sem
  indicar usos.
- Menus mais enxutos: Ver mostra só o que muda a exibição do diagrama (com o submenu "Mostrar no
  diagrama") e deixa para a barra inferior o que já está lá; Configurações reúne as preferências e
  os dados do navegador; o histórico de alterações fica em Editar; Organizar automaticamente
  mostra o atalho O.
- Apagar todos os diagramas do navegador pede confirmação explícita.
- Diagramas novos se chamam "Diagrama sem título".
- Importar, abrir uma versão como cópia e "Salvar como" não repetem o nome de outro diagrama: a
  cópia de "Diagrama1" se chama "Diagrama1 (cópia)", depois "Diagrama1 (cópia 2)".
- Painel lateral: a aba Relacionamentos vem logo depois de Tabelas.
- Relacionamento: tabelas primária e estrangeira em destaque.
- Organizar automaticamente: desfazer também volta o zoom anterior.
- Delete logo depois de digitar em um campo pede confirmação.
- Menos mensagens: criar pelos atalhos T, A e N não mostra mais aviso. Excluir e organizar
  automaticamente mostram a mensagem com o botão "Desfazer".
- Mensagens revisadas em português.

### Correções

- Diagrama aberto por um link inexistente mostrava "Salvo" sem gravar nada.
- Abrir o editor pela página inicial criava uma cópia do último diagrama.
- "Exportar dados salvos" incluía arquivos antigos e gerava o nome com a data errada.
- Arquivo → Sair podia sair antes de terminar de salvar.
- Alterações muito rápidas ou troca de diagrama durante o salvamento podiam gravar o conteúdo
  errado.
- Exportar JPEG e PDF podia sair com fundo preto.
- Relatar um erro não funcionava (dependia de um servidor que esta versão não tem).
- Nova janela abria o mesmo diagrama da janela atual, com aviso de conflito entre abas.
- "Ver o código" de um diagrama vazio abria uma tela de carregamento sem fim.
- SQL para PostgreSQL de diagramas no banco Genérico saía com tipos que o PostgreSQL não aceita,
  como text(65535).

### Removido

- Botão Compartilhar, que dependia de um servidor que esta versão não tem (voltará com o
  compartilhamento por link).
- Versões do drawDB original, que dependiam de um servidor que esta versão não tem (substituídas
  pelo Histórico de versões).
- Atalho Ctrl+Alt+W, que fazia o mesmo que F.
- Excluir diagrama do menu Arquivo; voltará em outra tela, com mais segurança.
- Editar → Limpar, que apagava o diagrama inteiro de uma vez.
- Editar → Editar e o atalho Ctrl+E para editar o elemento selecionado: a edição fica na tecla E,
  no F2 e nos botões do próprio elemento, e o Ctrl+E passa a exportar.
- Ajuda → Perguntar no Discord (comunidade do drawDB original) e o atalho Ctrl+H da
  documentação, que é o atalho do histórico do navegador.
- Configurações → Limpar cache (de diagramas compartilhados por servidor, que esta versão não usa)
  e Ver → Mostrar coordenadas de depuração.
- Importar para dentro do diagrama aberto (o DBML substituía o diagrama atual e apagava o
  histórico de desfazer).
- Exportar o diagrama completo como .sql + .json ou só como .json: o diagrama completo sai sempre
  no pacote .zip, e a importação continua aceitando esses arquivos.
