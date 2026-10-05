# Micro sprints

Plano de evolução do fork, um sprint por vez. Cada sprint vira um PR pequeno, testado com o
build de produção (`BASE_PATH=/drawdbCatolicaSc/`). Atualize o status ao concluir.

Princípio: código institucional em arquivos próprios; o núcleo do upstream só é alterado quando
for inevitável (ver `CLAUDE.md`).

| # | Sprint | Status |
|---|---|---|
| 0 | Base do projeto | em andamento (branch e homologação prontas) |
| 1 | Persistência I: nenhuma perda silenciosa de dados | pendente |
| 2 | Home em português, sem seção de depoimentos | pendente |
| 3 | Acesso rápido na home | pendente |
| 4 | Compartilhar e recursos sem servidor | pendente |
| 5 | Persistência II: durabilidade e verificação | pendente |
| 6 | Persistência III: arquivo no computador como fonte | pendente |
| 7 | Compartilhar via URL (sem servidor) | pendente |
| 8 | Revisão de layout, exibição e usabilidade | a definir após revisões |

---

## Sprint 0: Base do projeto

- Atualizar `CLAUDE.md`: o commit do 404 já está no `origin/main`.
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
- **Abrir arquivo (.json):** importa como diagrama novo (depende do Sprint 1).
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
- Aviso quando o mesmo diagrama estiver aberto em duas abas (hoje a última gravação vence).
- Roteiro de testes de persistência, executado e documentado: recarregar, fechar e reabrir,
  nova aba, duas abas, navegador anônimo, limpar dados, Chrome/Edge/Firefox e um PC do
  laboratório.

## Sprint 6: Persistência III, arquivo no computador como fonte

- **Salvar no computador / Abrir do computador.** No Chrome e no Edge, File System Access API:
  o Ctrl+S grava no mesmo `.json`. Firefox e Safari usam download como fallback.
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
