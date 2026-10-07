# Micro sprints

Plano de evolução do fork, um sprint por vez. Os sprints são desenvolvidos na branch `homolog`
e validados no ambiente de testes (`/drawdbCatolicaSc/teste/`). Quando a homologação chega a um
ponto estável e validado, o mantenedor publica uma versão (PR para a `main`, tag e release),
conforme `docs/versionamento.md` (decisão de 06/10/2026; antes era um PR único no fim). Toda
mudança visível ao usuário entra no `CHANGELOG.md`. Atualize o status ao concluir.

Princípio: código institucional em arquivos próprios; o núcleo do upstream só é alterado quando
for inevitável (ver `CLAUDE.md`).

| # | Sprint | Status |
|---|---|---|
| 0 | Base do projeto | em parte: branch e homologação prontas |
| 1 | Persistência I: nenhuma perda silenciosa de dados | concluído na `homolog` |
| 1B | Persistência da edição: auto-save, Ctrl+C/V, Ctrl+Z/Y, conflito entre abas | concluído na `homolog` (falta teste manual nos 4 navegadores) |
| 1C | Exportação e importação: os três casos de entrega | concluído na `homolog` (falta o aceite pelo MS Teams) |
| 1D | Atalhos do teclado, menu da grade e proteção contra acionamento acidental | fase A concluída na `homolog`; fase B (personalização) pendente |
| 1E | Histórico de alterações e versões (inclui a nova Linha do tempo) | próximo (aprovado) |
| 1F | Menus enxutos e janelas padronizadas | concluído na `homolog` |
| 2 | Home em português, sem seção de depoimentos | pendente |
| 3 | Acesso rápido na home | pendente |
| 4 | Compartilhar e recursos sem servidor | pendente |
| 5 | Persistência II: durabilidade e verificação | pendente |
| 6 | Persistência III: arquivo no computador como fonte | pendente |
| 7 | Compartilhar via URL (sem servidor) | pendente |
| 8 | Revisão de layout, exibição e usabilidade | a definir após revisões |

---

## Critérios de aceite de save

Valem para todo sprint que mexer com gravação, exportação ou importação (1B, 1C, 5 e 6).

- **Nenhuma perda silenciosa:** toda falha de gravação aparece para o usuário; nada mostra
  "Salvo" sem ter gravado.
- **Nada sobrescrito sem confirmação:** importar cria um diagrama novo; o diagrama aberto nunca é
  alterado por uma importação.
- **Gravação atômica:** cada operação grava tudo ou nada (uma transação); nunca fica um diagrama
  pela metade.
- **Conflitos tratados:** duas abas no mesmo diagrama, importar o mesmo arquivo duas vezes e
  arquivo alterado fora do editor geram aviso com opções claras, nunca "a última gravação vence"
  em silêncio.
- **Nomes:** título padrão em português; nomes de arquivo sem caracteres inválidos no Windows,
  sem nomes reservados (`CON`, `PRN`, `AUX`...) e com tamanho limitado.
- **Datas:** sempre no horário local (`AAAA-MM-DD_HHhMM` nos nomes de arquivo); nunca
  `toISOString()` (UTC, contém `:`). Guardar data de criação, de modificação e de exportação.
- **Erros do navegador:** cota excedida, armazenamento bloqueado (modo privado) e arquivo
  inválido têm mensagem própria em português.
- **Compatibilidade:** testado no Chrome, Edge, Opera e Firefox.

## Sprint 0: Base do projeto

- ~~Atualizar `CLAUDE.md`: o commit do 404 já está no `origin/main`.~~ Feito.
- ~~Branch `homolog` e ambiente de testes.~~ Feito (05/10/2026); branch liberada no ambiente
  `github-pages` em 06/10/2026.
- `git remote add upstream https://github.com/drawdb-io/drawdb.git`.
- Labels e template de issue no GitHub.
- Decidir o domínio definitivo (conta pessoal, organização ou domínio próprio). O IndexedDB é
  isolado por origem: trocar de origem faz os alunos "perderem" os diagramas salvos no navegador.

## Sprint 1: Persistência I, nenhuma perda silenciosa de dados

Prioridade máxima. São correções genéricas que podem ser contribuídas ao upstream.

- **Saves fantasmas:** abrir `/editor/diagrams/<id>` com um id inexistente neste navegador mostra
  "Salvo", mas o `modify()` atualiza 0 registros (`Workspace.jsx`). Detectar o caso, avisar
  ("diagrama não encontrado neste navegador") e oferecer criar um novo ou abrir um arquivo.
- **Importar JSON como diagrama novo**, em vez de sobrescrever o diagrama aberto (`Modal.jsx`).
- **Exportar dados salvos:** criar o `JSZip` a cada exportação (hoje acumula arquivos de
  exportações anteriores) e corrigir a data no nome (`getMonth()` começa em 0 e `getDay()` é
  o dia da semana).
- **Arquivo → Sair:** esperar o save terminar antes de sair.

Aceite: reproduzir cada bug no build de produção antes de corrigir e confirmar a correção depois.

**Resultado (05/10/2026):** os quatro itens foram corrigidos e validados no build de homologação
local. Detalhes:
- Saves fantasmas: o save agora cria o registro quando o `modify()` não acha o diagrama, e falhas
  de gravação aparecem como "Falha ao salvar" em vez de ficarem em "Salvando". Ao abrir um id
  inexistente, o editor é limpo, mostra um aviso e pede o banco de dados.
- Importar `.json`/`.ddb` cria um diagrama novo com o banco do próprio arquivo
  (`src/catolica/importAsNewDiagram.js`). Os JSON do ZIP de "Exportar dados salvos" também são
  aceitos. Com extensões de nuvem, o comportamento original é mantido.
- O ZIP é criado a cada exportação, os nomes de arquivo são higienizados e a data sai no formato
  `AAAA_MM_DD`.
- "Sair" espera o save terminar; se o save falhar, avisa e não sai.
- Correção pós-homologação (06/10/2026): o aviso de diagrama inexistente se repetia a cada clique
  no seletor de banco (o `load` roda de novo quando `selectedDb` muda). Agora avisa uma vez por
  diagrama, fecha sozinho após 5 segundos e some assim que um banco é escolhido.

## Sprint 1B: Persistência da edição (auto-save, Ctrl+C/V, Ctrl+Z/Y)

Pedido do mantenedor em 05/10/2026. Diagnóstico do comportamento atual:

- **Auto-save:** já vem ligado e grava a cada alteração registrada no desfazer/refazer, no
  título ou no zoom. Lacunas: o aluno pode desligá-lo em Configurações sem nenhum aviso; mover o
  canvas (pan) não dispara save; o texto digitado num campo só entra no histórico quando o campo
  perde o foco, então fechar a aba durante a digitação perde a última edição.
- **Ctrl+C / Ctrl+V:** usa a área de transferência do sistema (`navigator.clipboard`), que já
  funciona entre abas e diagramas. Lacunas: no Firefox e no Opera a leitura (`readText`) pode
  pedir permissão ou falhar; a falha é silenciosa (sem `catch`); copia só um elemento por vez.
- **Ctrl+Z / Ctrl+Y:** o histórico fica só na memória. Recarregar a página, trocar de diagrama
  ou reabrir o navegador apaga o histórico. Não há limite de tamanho, e Ctrl+Shift+Z (atalho
  comum para refazer) não funciona.

Entregas:

- **Auto-save:**
  - Ligado por padrão para todos. Se for desligado, mostrar um aviso persistente no cabeçalho.
  - Gravar também ao perder o foco da janela (`visibilitychange`/`pagehide`) e confirmar a
    última digitação pendente.
  - Aviso ao fechar a aba quando houver um save em andamento ou com falha.
- **Ctrl+C / Ctrl+V:**
  - Usar os eventos nativos `copy`/`paste`, que funcionam no Chrome, Edge, Opera e Firefox sem
    pedir permissão.
  - Guardar uma cópia do último elemento copiado no `localStorage` como reserva para o menu
    Editar → Colar e para navegadores que bloqueiam a área de transferência.
  - Mensagem clara quando colar falhar.
- **Ctrl+Z / Ctrl+Y:**
  - Salvar o histórico por diagrama num banco local próprio (`drawDB-catolica`, separado do
    banco do upstream, para não conflitar com migrações dele), com limite de passos.
  - Restaurar o histórico ao reabrir o diagrama.
  - Aceitar Ctrl+Shift+Z como refazer.
- **Conflito entre abas** (trazido do Sprint 5, porque o histórico persistido depende disso):
  detectar o mesmo diagrama aberto em duas abas (`BroadcastChannel` e um número de revisão
  gravado junto com o diagrama). A aba que ficar desatualizada avisa e oferece recarregar, em vez
  de sobrescrever a gravação da outra.

Aceite: testar recarregar, fechar e reabrir, trocar de diagrama, duas abas no mesmo diagrama e
copiar/colar entre abas no Chrome, Edge, Opera e Firefox. Cumprir os critérios de aceite de save.

**Resultado (06/10/2026):** implementado e validado no build de homologação local (Chromium).
Falta o teste manual com teclado e mouse reais no Chrome, Edge, Opera e Firefox.

- **Auto-save:** além do save do upstream (a cada ação de desfazer), grava 0,8 s depois de
  qualquer mudança de conteúdo, inclusive texto digitado sem sair do campo e zoom/enquadramento.
  Grava na hora ao trocar de aba ou minimizar, avisa ao fechar a aba se algo não foi gravado e
  mostra um aviso com botão "Ligar" quando o auto-save está desligado
  (`src/catolica/EditorGuardian.jsx`, encaixado no slot `canvas-overlay`).
- **Ctrl+Z / Ctrl+Y:** histórico salvo por diagrama no banco próprio `drawDB-catolica`
  (100 passos, ~1 MB por pilha) e restaurado ao reabrir, só se a revisão bater com a do diagrama
  (`src/catolica/editorHistory.js`). Ctrl+Shift+Z refaz.
- **Ctrl+C / Ctrl+V / Ctrl+X:** eventos nativos `copy`/`cut`/`paste` (sem permissão), ignorados
  dentro de campos de texto; cópia reserva no `localStorage` usada pelo menu Editar → Colar
  quando o navegador bloqueia a leitura; aviso quando não há o que colar
  (`src/catolica/clipboard.js`).
- **Conflito entre abas:** o save confere a revisão dentro de uma transação. Se outra aba gravou
  antes, nada é sobrescrito e a janela de conflito oferece salvar como cópia (recomendado),
  descartar e recarregar ou substituir (`src/catolica/ConflictModal.jsx`). Aviso quando o mesmo
  diagrama está aberto em outra aba (`BroadcastChannel`). Gravações sem mudança de conteúdo não
  geram revisão nova, para não criar conflito falso.
- **Correções no save encontradas durante os testes:**
  - Saves simultâneos na mesma aba (o upstream chama o save de novo a cada mudança durante um
    save em andamento) agora rodam em fila.
  - O save ignora o intervalo entre a troca de URL e o fim do load, que podia gravar o conteúdo
    do diagrama anterior no novo.
  - **Bug do upstream:** abrir `/editor` (link "Editor" da home) duplicava o último diagrama a
    cada visita, e o aluno passava a editar a cópia. Reproduzido no build de produção e corrigido.
- **Validação manual (06/10/2026):** os quatro testes manuais foram aprovados pelo mantenedor.
- **Ajustes pós-homologação:**
  - Indicador de salvamento sem piscar: horário com precisão de minuto e "Salvando..." só se o
    save demorar mais de 1 s (`src/catolica/SaveStatus.jsx`).
  - Aviso de outra aba: "Este diagrama já está aberto em outra aba. Edite em apenas uma aba para
    evitar conflitos de salvamento."
  - **Versões removida:** dependia de gists no drawdb-server ("Registrar versão" falhava com a
    requisição para `localhost:5000`). O botão só aparece se houver servidor configurado
    (`src/catolica/features.js`).
  - Nome do diagrama no título da aba do navegador, cortado em 40 caracteres
    (`src/catolica/tabTitle.js`). O link continua com o código do diagrama (decisão do
    mantenedor).
  - Mensagem para link de diagrama inexistente explica que links só abrem diagramas do mesmo
    navegador e perfil e como receber o diagrama de outra pessoa. Validado: o mesmo link em
    outra aba do mesmo navegador abre normalmente.

## Sprint 1D: Atalhos do teclado

Pedido do mantenedor em 06/10/2026, feito antes do 1C. A prioridade é evitar atalhos acionados
sem querer.

**Fase A (concluída, 06/10/2026):**

- Novos atalhos: **T** (tabela), **A** (área), **N** (nota), **F** (ajustar à tela), **?** (lista de
  atalhos), **Esc** (desmarcar) e **Ctrl+F** (abre a busca da aba Tabelas; fora dela, continua
  sendo a busca do navegador). Dicas dos botões mostram a tecla.
- Proteções dos atalhos de uma tecla (`src/catolica/useSafeKeyShortcuts.js`):
  1. nunca em campos de texto, editores ou conteúdo editável;
  2. nunca com Ctrl, Alt, Cmd ou AltGr;
  3. tecla segurada (repetição) é ignorada;
  4. ignorados por 1,5 s depois de digitar em um campo;
  5. isolamento: a ação espera 0,4 s e é cancelada se outra letra chegar logo antes ou logo
     depois (digitação), com aviso explicando;
  6. bloqueados com janelas, painéis ou menus abertos;
  7. criar elementos é bloqueado no modo somente leitura;
  8. podem ser desligados na janela de atalhos (preferência por navegador).
  Nas três primeiras vezes, um aviso diz qual atalho foi usado e que Ctrl+Z desfaz.
- **Delete protegido:** logo depois de digitar em um campo, o primeiro Delete é ignorado com
  aviso; repetir em até 3 s confirma. Backspace não exclui elementos (risco alto de engano).
- Janela **Atalhos do teclado** (`src/catolica/ShortcutsModal.jsx`): botão na barra de
  ferramentas no lugar de Versões, Ajuda → Atalhos e tecla ?. Lista todos os atalhos, inclusive
  os fixos do sistema (copiar, colar, recortar), em colunas alinhadas, e liga/desliga os de uma
  tecla.
- Testado no build local: T isolado cria; digitação rápida, tecla segurada, digitação logo após
  campo, modificadores e janela aberta não criam; Delete protegido; Ctrl+F; ?; desligar.
- Limite conhecido: quem digita muito devagar fora de um campo (mais de 0,4 s entre letras) pode
  acionar um atalho; a dica de Ctrl+Z e a opção de desligar cobrem esse caso.

**Ajustes pós-homologação (06/10/2026):**

- **Sem atraso:** a espera de 0,4 s incomodava. Agora a ação é imediata e, se outra tecla chegar
  em até 0,7 s (começo de uma palavra), ela é desfeita sozinha, sem deixar rastro no Refazer.
  Letra no meio de palavra continua sendo ignorada. A mesma tecla duas vezes (T, T) cria dois
  elementos.
- **Tecla segurada:** cria um elemento só e não mostra aviso.
- **Posição do mouse:** T, A e N criam o elemento onde está o ponteiro (respeitando "alinhar à
  grade"); fora do desenho, no centro da tela como antes. `addTable`, `addArea` e `addNote`
  ganharam um parâmetro opcional de posição (mudança mínima no upstream).
- **Organizar automaticamente: tecla O**, com as mesmas proteções; sempre avisa que Ctrl+Z
  desfaz, por ser uma mudança grande.
- **Menu da grade** na barra de ferramentas (um botão com menu, no padrão do menu de layout):
  mostrar grade, alinhar objetos à grade e tamanho (12, 24 ou 48 px). O tamanho passou a ser
  configuração (`settings.gridSize`, padrão 24).
- **Janela de atalhos compacta:** linhas de 23 px, atalhos em uma linha, observações curtas. Os
  atalhos de uma tecla viraram um grupo com a chave no cabeçalho; desligado, o grupo encolhe para
  uma linha. Saiu o aviso de "atalhos fixos".

**Segunda rodada de ajustes (06/10/2026):**

- Janela de atalhos com duas colunas (sem "Observação" e sem textos de ajuda), largura 460 px,
  espaço reservado para a barra de rolagem (a chave do grupo ficava parcialmente coberta).
- Atalhos nas dicas de todos os botões da barra (zoom, grade, desfazer, refazer, salvar, tema).
- Novos atalhos: **Ctrl+Alt+D** alterna tema claro/escuro e **Ctrl+Alt+G** alinha objetos à grade
  (Ctrl+Alt com essas letras não produz caractere no AltGr do ABNT2). O menu da grade mostra os
  atalhos ao lado das opções.
- Dicas reescritas: "Tabela criada pelo atalho T. Pressione Ctrl+Z para desfazer." (idem área e
  nota) e "Diagrama organizado pelo atalho O. Pressione Ctrl+Z para voltar ao layout e ao zoom
  anteriores."
- **Esc fecha as mensagens flutuantes** ("Tabela excluída" etc.); se havia mensagem, esse Esc não
  faz mais nada.
- **Organizar automaticamente guarda o enquadramento:** Ctrl+Z volta posições e zoom; Ctrl+Y
  reaplica os dois (vale para o botão e para a tecla O).

**Fase B (pendente):** personalização das teclas. O catálogo `src/catolica/shortcuts.js` já tem
ids estáveis por ação; falta ler as teclas do catálogo nos `useHotkeys` do `ControlPanel.jsx`,
captura de nova combinação, bloqueio de conflitos e de combinações reservadas pelo navegador.

## Sprint 1C: Exportação e importação, os três casos de entrega

As entregas acontecem normalmente pelo MS Teams. Decisão do mantenedor (06/10/2026): suportar três
casos, todos importáveis pelo editor.

| Caso | Arquivos | Uso principal |
|---|---|---|
| 1. SQL | `nome_AAAA-MM-DD_HHhMM.sql` | Criar o banco, produção, quando só o SQL é pedido |
| 2. SQL + JSON | `nome_AAAA-MM-DD_HHhMM.sql` e `nome_AAAA-MM-DD_HHhMM.json` | Entrega em que o professor quer ler o SQL e reabrir o desenho |
| 3. Pacote | `nome_AAAA-MM-DD_HHhMM.zip` | Entrega em anexo único, com imagem para ver o desenho sem o editor |

**Regras de formato:**

- **SQL (casos 1, 2 e 3) idêntico ao exportador atual**, byte a byte. Nenhuma linha nossa
  (cabeçalho, marcador, dados pessoais), para não comprometer a migração para produção. Um teste
  automatizado garante isso.
- **JSON v1 é a fonte de verdade do desenho:** modelo, posições, cores, notas, áreas, views, zoom
  e enquadramento, mais metadados (`formato`, `versao`, `exportId`, dialeto, SHA-256 do SQL
  exportado junto, datas de criação/modificação/exportação no horário local). JSON antigos (sem
  metadados) continuam aceitos.
- **Pacote ZIP** contém `nome.sql` (caso 1), `nome.json` (caso 2), `nome.png` (imagem do
  diagrama) e `LEIA-ME.txt` (como abrir). Extrair o ZIP resulta exatamente no caso 2.
- **RAR não é gerado nem lido.** É um formato proprietário: não existe forma livre e legal de criar
  RAR no navegador, e a leitura exigiria uma biblioteca pesada. Se o aluno enviar `.rar`, o editor
  explica que deve usar `.zip`. O ZIP é aberto e criado nativamente pelo Windows, macOS e Linux.

**Encaixe na importação (caso 2):** o mesmo nome base ajuda as pessoas, mas o encaixe é feito
pelo **conteúdo**, não pelo nome, porque downloads repetidos viram `nome (1).sql`. O editor
compara o SHA-256 do SQL gravado no JSON com o arquivo SQL recebido.

| Arquivos selecionados | Comportamento |
|---|---|
| `.json` | Abre o desenho exato como diagrama novo |
| `.sql` | Importação de SQL atual (organização automática), com aviso de que sem o `.json` o desenho não pode ser restaurado |
| `.sql` + `.json` que conferem | Abre o desenho exato; informa que o SQL confere |
| `.sql` + `.json` que não conferem | Abre o desenho a partir do JSON e avisa que o SQL foi alterado depois da exportação; oferece importar o SQL como outro diagrama. Nunca mistura os dois |
| `.zip` | Igual ao caso 2, usando os arquivos de dentro (aceita pasta interna e arquivos extras, como no ZIP refeito pelo "Enviar para → Pasta compactada" do Windows) |
| Vários `.json` ou combinação ambígua | Pede para o usuário escolher |
| `.rar` ou outro formato | Mensagem explicando os formatos aceitos |

**Entregas complementares:**

- Menu Exportar com as três opções e uma descrição curta de cada. O caso 2 abre uma janela com
  "Baixar os dois" e os botões individuais (navegadores Chromium pedem permissão para vários
  downloads de uma vez).
- Tela de resumo antes de importar: nome, banco, data de exportação, situação do encaixe.
- Detecção de duplicatas: o mesmo `exportId` e conteúdo já existente oferece abrir o diagrama
  existente em vez de criar outro.
- Limites de tamanho na importação (inclusive descompressão do ZIP); leitura só em memória, sem
  usar os caminhos internos do ZIP.
- **Banco padrão configurável:** PostgreSQL por padrão. Ordem: preferência do usuário
  (Configurações) > padrão da instalação (`public/config.js`) > PostgreSQL. Afeta só o que é
  novo (seletor de banco de novos diagramas e dialeto sugerido ao exportar diagramas "Genérico");
  nunca muda diagramas existentes nem a leitura de arquivos.
- Título padrão em português e nomes/datas conforme os critérios de aceite de save.

**Testes (Vitest, adicionado como dependência de desenvolvimento):** SQL idêntico ao exportador
atual; ida e volta dos 6 modelos prontos em JSON e ZIP; encaixe com arquivos renomeados
(`nome (1).sql`); SQL alterado; CRLF e BOM; ZIP refeito pelo Windows, corrompido ou com arquivos
extras; JSON antigo sem metadados; acentos e emojis nos nomes.

Aceite: enviar e baixar os três casos pelo MS Teams da instituição (chat e Tarefas), conferindo
nomes, abertura no Windows e reimportação no editor; Chrome, Edge, Opera e Firefox.

**1C.1, núcleo (06/10/2026):** módulos sem interface em `src/catolica/files/`: `naming.js` (nomes e
datas locais), `sql.js` (SQL pelos exportadores do upstream, sem nenhuma linha nossa; hash
normalizado), `diagramJson.js` (JSON v1 compatível com o drawDB original, metadados em
`catolica`), `zipPackage.js` (pacote e leitura com limites) e `importPlan.js` (encaixe por
conteúdo). 72 testes com Vitest (`npm test`, também rodam no deploy da homologação); conferido
que quebrar de propósito a normalização de CRLF, a remoção de BOM ou a comparação do hash faz os
testes certos falharem.

**1C.2, interface (06/10/2026):**

- Arquivo → **Exportar para entrega…**: janela com as três opções e os nomes dos arquivos. Em
  diagramas "Genérico", escolhe o banco do SQL (vem marcado o banco padrão). O pacote leva a
  imagem em 2×; se ela não puder ser gerada, o pacote sai sem a imagem e o LEIA-ME não a cita.
- Arquivo → Importar → **Arquivo do diagrama (.json, .sql, .zip)** e Ctrl+I: uma janela só, com
  arrastar e soltar em qualquer ponto dela, resumo antes de abrir e situação do encaixe. Mesmo
  arquivo importado de novo (`importedFrom.exportId`): oferece "Abrir o existente" ou "Importar
  uma nova cópia". SQL que não confere: abre pelo JSON e oferece abrir o SQL como outro diagrama
  (com volta). O importado é sempre um diagrama novo. A importação antiga de JSON, que substituía
  o diagrama aberto, saiu do menu; `Modal.jsx` e `ImportDiagram.jsx` voltaram ao código do
  upstream.
- Só o SQL: mesmo conversor do "Importar de SQL" do upstream, com escolha do banco, tabelas
  organizadas como no "Organizar automaticamente" e diagrama enquadrado na tela.
- Configurações → **Banco de dados padrão** (marca o atual); o seletor de banco de diagramas
  novos já vem com ele marcado. Título padrão "Diagrama sem título". Diagramas novos e
  importados gravam a data de criação.
- **F2** (pedido do mantenedor nesta etapa): renomeia a tabela, área, nota ou view selecionada.
  Abre a edição do elemento com o nome selecionado; Enter confirma e Esc volta o nome anterior,
  sem deixar entrada no desfazer. Funciona com e sem o painel lateral, também com o cursor no
  texto de uma nota, e está no menu Editar e na janela de atalhos.
- Conferido no build de homologação local: os três casos de exportação (conteúdo do ZIP, imagem e
  LEIA-ME), ida e volta do ZIP, duplicata, par com nomes diferentes, SQL alterado, CRLF com BOM,
  RAR, `.docx`, dois JSON, SQL com erro (linha e coluna) e SQL sozinho; F2 em tabela e nota, com
  e sem painel lateral; banco padrão no menu e no seletor de diagramas novos.

**Defeito conhecido (upstream, decisão pendente):** o exportador do drawDB original, ao gerar
PostgreSQL a partir de um diagrama "Genérico", escreve tipos que o PostgreSQL não aceita, como
`text(65535)`. Nos modelos prontos, isso afeta "Human resources schema" e "E-commerce schema": o
SQL não roda no PostgreSQL nem é reimportado pelo editor. Os testes marcam esses dois casos como
falha esperada (`it.fails`) e vão avisar quando o defeito for corrigido. Como o SQL precisa ser
idêntico ao do exportador, a correção deve ser feita no próprio exportador
(`src/utils/exportSQL/generic.js`) e, de preferência, contribuída ao projeto original.

## Sprint 1F: Menu Arquivo enxuto

Pedido do mantenedor em 07/10/2026, antes de seguir com os próximos sprints: higienizar o menu
Arquivo, que tinha 15 itens, alguns repetidos e um com defeito.

**Diagnóstico:**

- **Nova janela** abria `/editor` sem diagrama; o editor carrega o último salvo, que era o próprio
  diagrama aberto, e aparecia o aviso de conflito entre abas.
- **Novo** escolhia o modelo e abria em outra aba.
- Abrir e Abrir recente, Importar e Importar de SQL, e Exportar SQL, Exportar como e Exportar para
  entrega faziam a mesma coisa por caminhos diferentes.

**Decisões do mantenedor:**

- Menu com 8 itens: Novo, Nova aba, Abrir, Salvar, Salvar como, Importar, Exportar e Sair.
- **Novo** começa o diagrama nesta aba, salvando o atual antes; se o atual ainda tem o nome padrão,
  pede um nome (o "Salvar como" do primeiro salvamento). **Nova aba** (antes "Nova janela") faz o
  mesmo em outra aba, sem mexer na atual. Os dois usam a escolha de modelo.
- **Abrir** fica com a lista (os recentes primeiro), dois cliques para abrir e o botão "Abrir
  arquivo do computador". Os modelos ficam em Novo.
- **Salvar como modelo** vira opção de Salvar como.
- **Renomear** sai do menu: lápis sempre visível ao lado do nome e F2 sem nada selecionado.
- **Excluir diagrama** sai do menu; voltará em outra tela (sugestão: na janela Abrir ou na home
  do Sprint 3, com confirmação). Até lá, só "Limpar armazenamento" apaga, e apaga tudo.
- **Importar e Exportar** com a mesma ordem: diagrama completo, SQL, imagem (só exportar) e outros
  formatos. Todo diagrama importado (inclusive SQL e DBML) abre como diagrama novo em uma nova aba;
  saem as opções do upstream de adicionar ao diagrama aberto ou substituí-lo.

**Implementação:**

- `src/catolica/fileMenu.js` monta o menu a partir dos itens do upstream, que continuam em
  `ControlPanel.jsx` sem alteração de conteúdo (menos conflito ao sincronizar).
- Janelas próprias em `src/catolica/`: `NewDialog.jsx` (grade de modelos do upstream),
  `OpenDialog.jsx` (lista do upstream), `SaveAsDialog.jsx`, `ExportDialog.jsx` (quatro seções)
  e `ImportDialog.jsx` (DBML e SQL colado). Exportar reaproveita os geradores do upstream (DBML,
  Mermaid, documentação) e "Ver e copiar o código" usa a janela de código do upstream.
- Abrir em nova aba: a aba é aberta já no clique (senão o navegador bloqueia) e recebe o endereço
  quando o diagrama está salvo; se o navegador bloquear, abre nesta aba.
- Novo nesta aba usa o mesmo mecanismo do Sair: navega só depois que o save termina.
- Correções que apareceram nos testes: o editor não pedia o banco de dados de novo ao começar um
  diagrama na mesma aba (o upstream só pedia uma vez por aba) e o indicador continuava com o
  horário do diagrama anterior (`notifyEditorReset` em `editorEvents.js`).
- Testes: DBML no plano de importação e ida e volta dos 6 modelos em DBML (94 testes).
- Conferido no build de homologação local: menu, Importar (diagrama completo, SQL, SQL colado,
  DBML, erros, duplicata do diagrama aberto), Exportar (os 11 formatos, nomes e conteúdo dos
  arquivos, "Ver e copiar o código"), Abrir (dois cliques, abrir arquivo do computador), Novo com
  e sem nome, Nova aba, Salvar como (cópia e modelo), F2 sem seleção, lápis e Sair. O painel de
  testes não abre abas por `window.open`; o caminho principal foi conferido simulando o
  `window.open`, e o plano B (abrir nesta aba) na prática.

**Ajustes de textos, janelas e importação (07/10/2026):** pedidos do mantenedor depois do teste
da homologação, analisados um a um e depois em conjunto.

- **Menu:** rótulos do drawDB original, sem reticências: Novo, Nova janela, Abrir, Abrir recente,
  Salvar, Salvar como, Importar, Exportar e Sair. "Nova janela" (termo do original e do mercado)
  vale em todo lugar, inclusive na importação. **Abrir recente** volta com os 5 diagramas
  editados por último, sem o que está aberto, e "Ver todos os diagramas".
- **Exportar:** SQL primeiro (opção já marcada), depois diagrama completo, imagem e outros
  formatos; títulos das seções maiores; nome do diagrama editável na própria janela (renomeia o
  diagrama); "Arquivo gerado" sempre na mesma altura; diagrama vazio (ou sem tabelas, nos
  formatos de texto) mostra aviso e desativa os botões, em vez de abrir a tela de carregamento sem
  fim do upstream. **Saem ".sql + .json" e "Só o .json":** o diagrama completo sai sempre no
  pacote .zip; a importação continua aceitando .json, .sql e o par.
- **Textos sem recomendação:** descrições dizem o que cada opção é ou contém, sem indicar usos,
  sem dizer qual é "melhor" e sem citar outros produtos (Teams, dbdiagram.io, GitHub). Mensagens
  de erro continuam dizendo como resolver. Orientações de uso ficam no LEIA-ME.
- **Padrão de janelas** (`src/catolica/dialogParts.jsx`): rodapé com ações extras à esquerda e
  "Cancelar" + ação principal à direita, em todas as janelas do fork; blocos repetidos sempre no
  mesmo lugar; Importar e Exportar com a mesma largura.
- **Janela do nome antes do Novo:** "Salvar diagrama atual", com "Manter nome padrão" e
  "Renomear e continuar"; o X ou "Cancelar" desistem do Novo.
- **Marca:** os arquivos exportados não usam mais o nome da instituição (autorização pendente): o
  LEIA-ME diz "versão modificada do drawDB" e os metadados do .json ficam em `exportacao` (os
  exportados na homologação, em `catolica`, continuam sendo lidos).
- **Importação**, depois de testar 14 cenários contra o código:
  - nada é gravado antes de tudo ser validado; o .zip é lido só na memória; o tipo é reconhecido
    pelo conteúdo; limites de 20 MB por arquivo, 200 arquivos por .zip, 20 MB por arquivo interno
    (conferido antes de descompactar) e, novo, 50 MB descompactados por .zip;
  - arquivos agrupados por diagrama (seleção solta, pasta do .zip e .zip dentro de .zip, um
    nível); com mais de um diagrama, lista para escolher (ex.: "Baixar tudo" das Tarefas do
    Teams); antes era erro;
  - arquivos que acompanham o diagrama (.png, LEIA-ME, .docx) são ignorados e listados no resumo;
    antes, selecionar os 4 arquivos extraídos dava erro;
  - .sql e .json em ANSI (Windows-1252) mantêm os acentos; antes viravam "�";
  - mensagens novas: arquivo vazio, tamanho e limite, conteúdo descompactado grande demais,
    pacotes dentro de pacotes; .json ilegível junto de um .sql abre o SQL e avisa;
  - duplicata também pelo conteúdo, para arquivos sem identificador (como os do drawDB original)
    e para o diagrama original que ainda está no navegador; um diagrama alterado depois não conta
    como igual.
- Testes: 107 (13 novos para os casos acima). Conferido no build de homologação local.

**Segunda rodada (07/10/2026):**

- Pacote .zip descrito em lista (Schema SQL, Diagrama completo, Imagem do diagrama, Instruções);
  o arquivo de instruções passa a se chamar `README.txt`.
- Janela Exportar alinhada: título, "Nome do diagrama", seções e opções na mesma margem.
- Atalho **Ctrl+Alt+E** para Exportar. O Ctrl+Shift+E (padrão de Figma, GIMP e Inkscape) foi
  descartado porque abre a busca na barra lateral do Edge e as extensões do Opera; Ctrl+Alt+E
  não é atalho de nenhum desses navegadores e segue a família Ctrl+Alt do editor (C, D, G).
- Editar: sai "Limpar"; "Renomear" sem texto entre parênteses; "Organizar automaticamente" mostra
  o atalho O (quando os atalhos de uma tecla estão ligados).
- Ver: saem Tema, Aumentar zoom e Diminuir zoom, que estão na barra inferior.
- Em análise com o mantenedor: reorganização do restante do menu Ver, revisão de Configurações e
  Ajuda e a nova Linha do tempo (proposta de juntar ao Sprint 1E).

**Terceira rodada (07/10/2026), decisões do mantenedor:**

- **Ver** com 4 itens: "Mostrar no diagrama" (submenu: detalhes das colunas, comentários, tipos de
  dados, cardinalidade e rótulos dos relacionamentos, cada um com o estado ligado/desligado),
  Visualização DBML, Modo de apresentação e Redefinir visualização. Saem os que estão na barra
  inferior (barra de menu, barra lateral, problemas, tela cheia, grade e ímã) e as coordenadas de
  depuração; o Modo estrito vai para Configurações.
- **Configurações:** Salvar automaticamente, Modo estrito, Banco de dados padrão, Tipos
  personalizados, Idioma e "Dados do navegador" (exportar todos os diagramas; apagar todos, com
  confirmação explícita). "Mostrar linha do tempo" vira Editar → Histórico de alterações; sai
  "Limpar cache".
- **Ajuda:** Atalhos do teclado, Documentação do drawDB (em inglês), Novidades (lê o
  `CHANGELOG.md`, `src/catolica/changelog.js`), Relatar um problema (issue no GitHub com roteiro
  e dados do navegador já preenchidos; a página antiga dependia de servidor) e Sobre (versão,
  licença AGPL, código-fonte e créditos). Saem o Discord e o atalho Ctrl+H. Endereços do
  repositório em `src/catolica/links.js`.
- **Linha do tempo:** reescrita no Sprint 1E (abaixo).
- Os submenus do Semi UI respondem a `mousedown`, não a `click`: testes automatizados devem
  disparar o evento certo.

**Quarta rodada (07/10/2026):**

- **Atalhos:** Ctrl+E exporta (par com o Ctrl+I); a tecla **E** abre a edição do elemento
  selecionado (atalho rápido, com a mesma proteção dos outros e desfeito se for o começo de uma
  palavra); sai o item Editar do menu Editar; sai o Ctrl+Alt+E.
- **Janela de atalhos:** grupo "Atalhos rápidos"; chave com folga da barra de rolagem; atalhos
  alternativos (Refazer, zoom) um por linha, com o "ou" no fim da linha de cima, e as teclas de
  todas as linhas na mesma coluna.
- **Defeito encontrado e corrigido:** o botão de tema da barra inferior chamava
  `menu.view.theme`, que tinha saído do menu Ver. Os itens retirados dos menus agora continuam
  acessíveis pelo código, só fora da lista exibida (`keepHidden` em `menus.jsx`), o que protege
  também contra usos futuros do upstream.
- **Consistência:** as dicas dos botões da barra inferior só mostram a tecla (T, A, N, O, ?)
  com os atalhos rápidos ligados, como no menu; "Redefinir visualização" mostra "Enter" em vez
  de "Enter/Return".
- Em análise: padrão visual dos botões de liga/desliga da barra inferior (grade e ímã).

## Sprint 2: Home em português, sem seção de depoimentos

- Criar uma home própria (`src/pages/Home*.jsx`) em PT-BR e apontar a rota `/` para ela. O
  `LandingPage.jsx` do upstream fica intacto, o que evita conflitos ao sincronizar.
- Remover a seção "What the internet says about us" (tweets) e os elementos que promovem o
  drawDB oficial (contador de estrelas, Discord, X, patrocínio). Manter os créditos aos autores
  originais e o link para o código-fonte (AGPL).
- Português como idioma padrão no editor: `pt-BR` como fallback e detecção, respeitando a
  escolha manual do usuário em Configurações → Idioma.
- Navbar e rodapé em português.
- Seção "Novidades" na home, lida do `CHANGELOG.md` (resumo das últimas versões, com link para
  o histórico completo e para as releases do GitHub).

## Sprint 3: Acesso rápido na home

Um painel em destaque no topo da home, lendo o mesmo IndexedDB do editor:

- **Novo diagrama:** abre o editor em branco, já com o seletor de banco.
- **Continuar de onde parei:** os últimos diagramas salvos neste navegador, com nome, banco e
  "editado há X". Um clique abre o diagrama.
- **Abrir arquivo:** aceita `.json`, `.sql`, `.sql` + `.json` e `.zip`, com as mesmas regras de
  encaixe do Sprint 1C (depende dos Sprints 1 e 1C).
- **Modelos:** atalho para `/templates`.
- Estado vazio explicando onde os diagramas ficam salvos e por que exportar.

## Sprint 4: Compartilhar e recursos sem servidor

- Esconder o botão **Compartilhar** enquanto não houver uma alternativa útil (Sprint 7).
- Esconder o **histórico de versões**, que também depende de gists no servidor.
- **Relatar bug:** trocar o formulário (envia e-mail via backend inexistente) por um link para as
  Issues do repositório.
- Corrigir o favicon (caminho absoluto `/favicon.ico` dá 404 na subpasta) e as metatags que
  apontam para drawdb.app.

## Sprint 5: Persistência II, durabilidade e verificação

- Pedir armazenamento persistente (`navigator.storage.persist()`) para reduzir o risco de o
  navegador apagar os dados.
- Indicador de último backup e aviso ao fechar a aba (`beforeunload`) quando houver alterações
  não exportadas.
- Mensagens próprias para cota excedida e armazenamento bloqueado (modo privado), sugerindo
  exportar o trabalho.
- Roteiro de testes de persistência, executado e documentado: recarregar, fechar e reabrir,
  nova aba, duas abas, navegador anônimo, limpar dados, Chrome/Edge/Opera/Firefox e um PC do
  laboratório.

(O aviso de diagrama aberto em duas abas foi antecipado para o Sprint 1B.)

## Sprint 6: Persistência III, arquivo no computador como fonte

- **Salvar no computador / Abrir do computador.** No Chrome, Edge e Opera, File System Access
  API: o Ctrl+S grava no mesmo `.json` (formato JSON v1 do Sprint 1C). Firefox usa download como
  fallback.
- Conflito "arquivo alterado fora do editor": antes de gravar, comparar a data de modificação do
  arquivo com a da abertura e perguntar o que fazer.
- Lista de arquivos recentes (handles guardados no IndexedDB).
- O escopo depende do ambiente dos laboratórios (navegador e reset de perfil).

## Sprint 7: Compartilhar via URL (sem servidor)

- Diagrama comprimido na própria URL (ex.: `lz-string`). Quem abre vê em modo somente leitura
  e pode "Salvar uma cópia" no próprio navegador.
- Avisar quando o diagrama for grande demais para caber em um link.
- Reativar o botão Compartilhar com esse comportamento.

## Sprint 8: Revisão de layout, exibição e usabilidade

A definir depois das revisões em sala.

## Backlog do roteiro (depois dos sprints acima)

- Modelos e exercícios das disciplinas.
- Exportação de entrega (PDF/imagem com nome, RA e turma).
- Validações didáticas (tabela sem PK, relacionamento sem FK).
- Identidade visual institucional (depende de autorização).
- **Script seguro para produção** (opção no export SQL): envolver em `BEGIN`/`COMMIT` e tornar o
  script reexecutável. Hoje `CREATE TABLE IF NOT EXISTS` ignora tabelas existentes com outra
  estrutura, e rodar de novo duplica as FKs no PostgreSQL e falha em `CREATE TYPE`/`CREATE INDEX`.
  Candidato a contribuição ao upstream.

## Decisões registradas

- **06/10/2026, SQL com layout embutido em comentários: descartado.** Analisado em detalhe e
  substituído pelos três casos do Sprint 1C. Motivos: duas fontes de verdade no mesmo arquivo,
  necessidade de um leitor de SQL próprio e de heurísticas (reaplicar posições pelo nome da
  tabela), bloco ilegível para o professor e não ajuda quem quer apenas ver o desenho. O pacote
  ZIP atende à entrega em arquivo único sem tocar no SQL.
- **06/10/2026, RAR: não suportado.** Formato proprietário; usar ZIP.
- **06/10/2026, outras plataformas de diagrama:** não há como afirmar quais são usadas. Nenhum
  exportador específico (draw.io, pgModeler etc.) entra no plano até haver demanda concreta. Os
  formatos do Sprint 1C (SQL, JSON, PNG, ZIP) já são padrões abertos.

## Copiar e exportar o diagrama como imagem (06/10/2026)

**Primeira tentativa (commit `2cb8f87`), que não funcionou:** atualizar o html-to-image para
1.11.13 e filtrar as propriedades copiadas. Ficou rápido, mas as tabelas saíam sem estilo: a
1.11.13 copia o `<svg>` inteiro de uma vez e o HTML dentro dos `<foreignObject>` perde o CSS. A
validação "imagem idêntica pixel a pixel" estava errada: no painel de testes o `viewBox` do canvas
era 0×0 e as duas imagens comparadas estavam vazias. Lição: conferir a imagem gerada de verdade
(o servidor local de testes agora recebe o PNG por POST e salva em arquivo).

**Solução atual** (`src/catolica/canvasImage.js`, sem html-to-image, que voltou para a versão do
upstream):

- O `<svg>` do diagrama é clonado elemento por elemento; de cada elemento só são copiados os
  estilos que diferem do padrão do navegador (calculado num iframe sem o CSS da página) ou, nos
  herdados, do pai. Espessura de borda é sempre copiada junto com o estilo da borda (o CSS do site
  usa `solid` com espessura 0).
- **Recorte no conteúdo, em tamanho real (zoom 100%)**, independente do zoom e da posição da tela,
  com margem de 24 px. Ficam de fora a grade, a linha de criação de relacionamento, o retângulo de
  seleção e os botões com ícone que aparecem ao passar o mouse; os pontos azuis dos campos ficam.
- Ctrl+Alt+C: PNG na densidade da tela (como um print); PNG/JPEG exportados e PDF em 2×; SVG
  exportado é o próprio SVG recortado; PDF com página do tamanho do conteúdo. Fundo do tema.
  Teto de 8192 px por lado / 32 milhões de pixels. Diagrama vazio: aviso em vez de imagem.
- **Medido (modelo Blog, 5 tabelas e 6 relacionamentos, tema escuro):** 1339×720 px, ~120 KB,
  ~1,3 s, sem travamento perceptível. Imagem conferida visualmente nos temas claro e escuro e com
  área e nota; nomes cortados com "…" iguais aos da tela.
## Pendências registradas em 06/10/2026

- **Sprint 1E, Histórico de versões (aprovado):** botão "Histórico de versões" no lugar de
  "Compartilhar", painel lateral à direita com as abas **Alterações** (registro com data e hora,
  últimas 500) e **Versões** (automáticas ao abrir e a cada 10 min de edição; manuais com nome;
  visualizar, restaurar sem perder o atual, baixar, renomear, excluir). Guarda: 20 automáticas
  recentes + 1 por dia por 30 dias; manuais sem limite. Banco `drawDB-catolica`. Ordem: depois do
  1C.
  - **Nova Linha do tempo (decisão de 07/10/2026)**, na aba Alterações, aberta por Editar →
    Histórico de alterações. Problemas da atual: só lê a pilha de desfazer, mostra marcações
    técnicas ("[name]", "[collapse fields]"), registra ações que não alteram o diagrama (recolher
    campos), repete "Adicionar tabela" sem o nome, não tem horário, não é clicável e some com o
    que foi desfeito. Proposta, com base no painel Histórico do Photoshop (clicar num passo volta
    a ele) e no histórico de versões do Figma (pontos automáticos agrupados, versões com nome,
    restaurar guardando antes o estado atual): frases com o nome do objeto ("Tabela clientes
    criada"), ícone por tipo de ação, horário relativo, agrupamento de ações iguais seguidas,
    sem ações de visualização, passos desfeitos esmaecidos e clique para voltar até o ponto.
- **Histórico no ZIP (1C + 1E):** é viável. O pacote do 1C reserva a pasta `historico/`; o 1E
  passa a gravar `historico/alteracoes.json` (+ versão legível `alteracoes.txt`) e
  `historico/versoes/<data>_<nome>.json` (formato JSON v1). Opção na exportação "Incluir histórico"
  (decidir o padrão); ao importar um ZIP com histórico, as versões e o registro vêm junto, o que
  permite levar o histórico para outro computador.
- **Revisão geral de textos:** inventário em andamento (textos do fork em `src/catolica/i18n.js` e
  textos do upstream usados nos mesmos fluxos). Inconsistências já vistas: "Ajustar à grade"
  (menu Configurações, upstream) x "Alinhar objetos à grade" (barra); "Template salvo!" e
  "Ops! Algo deu errado." fora do padrão; mensagens de exclusão sem a dica de desfazer; "Salvo como
  cópia. Abrir:". Padrão proposto: sucesso = "<Objeto> <particípio>." + `undo_hint` quando houver
  desfazer; botões no infinitivo; títulos sem ponto; atalhos no formato "Ctrl+Z".

## Duplicidades e barra de menu (06/10/2026)

- Regra do mantenedor: remover só atalhos/comandos que fazem exatamente a mesma coisa; o mesmo
  comando em lugares diferentes (menu e barra) pode ficar, desde que chame a mesma função.
- **Removido:** Ctrl+Alt+W (fazia o mesmo que F; e AltGr+W digita "?" no ABNT2, disparando o
  ajuste sem querer).
- **Conferido que chamam a mesma função:** desfazer/refazer, salvar, zoom (×1,2 na barra e no
  menu), grade e alinhamento (menu Ver, menu da grade, ímã e atalhos), tema, organizar, ajustar à
  tela, copiar como imagem, lista de atalhos.
- **Nomes unificados** (sobrescrevendo textos do upstream em `src/catolica/i18n.js`): "Ajustar
  janela / Redefinir" virou "Ajustar diagrama à tela" (a opção só ajusta) e "Ajustar à grade"
  virou "Alinhar objetos à grade".
- Mantido de propósito: Ctrl+Y e Ctrl+Shift+Z para refazer (as duas convenções mais comuns).
- **Barra de menu sem volta:** ao ocultar em Ver → Barra de menu (e com a barra de ferramentas
  também oculta) não havia como reexibir. Agora um botão no canto do desenho traz a barra de volta
  enquanto ela estiver oculta (`src/catolica/HeaderRestoreButton.jsx`).
