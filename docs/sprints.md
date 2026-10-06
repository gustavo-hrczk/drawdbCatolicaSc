# Micro sprints

Plano de evolução do fork, um sprint por vez. Os sprints são desenvolvidos na branch `homolog`
e validados no ambiente de testes (`/drawdbCatolicaSc/teste/`). O PR para a `main` é único e só
é aberto quando todos os sprints estiverem concluídos. Atualize o status ao concluir.

Princípio: código institucional em arquivos próprios; o núcleo do upstream só é alterado quando
for inevitável (ver `CLAUDE.md`).

| # | Sprint | Status |
|---|---|---|
| 0 | Base do projeto | em parte: branch e homologação prontas |
| 1 | Persistência I: nenhuma perda silenciosa de dados | concluído na `homolog` |
| 1B | Persistência da edição: auto-save, Ctrl+C/V, Ctrl+Z/Y, conflito entre abas | concluído na `homolog` (falta teste manual nos 4 navegadores) |
| 1C | Exportação e importação: os três casos de entrega | pendente (próximo) |
| 1D | Atalhos do teclado: novos atalhos, proteção contra acionamento acidental e janela de atalhos | fase A concluída na `homolog`; fase B (personalização) pendente |
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
- **Validação manual (07/10/2026):** os quatro testes manuais foram aprovados pelo mantenedor.
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

Pedido do mantenedor em 07/10/2026, feito antes do 1C. A prioridade é evitar atalhos acionados
sem querer.

**Fase A (concluída, 07/10/2026):**

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

## Sprint 2: Home em português, sem seção de depoimentos

- Criar uma home própria (`src/pages/Home*.jsx`) em PT-BR e apontar a rota `/` para ela. O
  `LandingPage.jsx` do upstream fica intacto, o que evita conflitos ao sincronizar.
- Remover a seção "What the internet says about us" (tweets) e os elementos que promovem o
  drawDB oficial (contador de estrelas, Discord, X, patrocínio). Manter os créditos aos autores
  originais e o link para o código-fonte (AGPL).
- Português como idioma padrão no editor: `pt-BR` como fallback e detecção, respeitando a
  escolha manual do usuário em Configurações → Idioma.
- Navbar e rodapé em português.

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
