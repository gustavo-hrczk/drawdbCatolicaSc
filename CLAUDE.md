# Contexto do projeto: drawDB Católica SC

Este arquivo é lido automaticamente pelo Claude Code. Ele resume as decisões e o estado do
projeto até 02/10/2026. Mantenha-o atualizado quando algo relevante mudar.

## O que é

Fork do [drawDB](https://github.com/drawdb-io/drawdb), editor de diagramas ER de código aberto,
hospedado gratuitamente no GitHub Pages para uso em sala no Centro Universitário Católica de
Santa Catarina (Jaraguá do Sul). Mantenedor: Gustavo (gustavo-hrczk).

- Repositório: https://github.com/gustavo-hrczk/drawdbCatolicaSc
- Site: https://gustavo-hrczk.github.io/drawdbCatolicaSc/
- Link curto usado com a turma: https://sl1nk.com/drawDBcatolica (aponta para o site acima;
  se o repositório for renomeado, o destino do link curto precisa ser atualizado)

### Por que existe

A turma usava o drawDB hospedado e esbarrou num período de teste de 7 dias (provavelmente do
drawDB Pro). O editor de código aberto não tem esse limite: a cobrança só ocorre quando o
servidor de nuvem do drawDB responde HTTP 402, e este fork não usa esse servidor. A solução
foi auto-hospedar o editor.

### Objetivo de médio prazo

Evoluir o fork para uma versão institucional da Católica SC. O próximo passo é o mantenedor
testar o uso em sala e levantar problemas e melhorias, que devem virar issues e ser priorizadas.

## Regras que não podem ser quebradas

- **Licença AGPL-3.0.** Manter `LICENSE`, os créditos aos autores originais e o código-fonte
  público, incluindo todas as modificações. Se um dia houver servidor próprio, a AGPL também
  exige oferecer o código a quem usa o sistema pela rede.
- **Marca.** Não apresentar o projeto como o drawDB oficial. O nome e o logo da Católica SC só
  podem ser usados com autorização da instituição (ainda não obtida).
- **Divergir o mínimo do upstream.** Código institucional deve ficar em arquivos próprios
  (tema, templates, extensões via `ExtensionsContext`/`<Slot>`), alterando o núcleo só quando
  for inevitável. Correções úteis para todos devem ser contribuídas ao projeto original.
  Remote sugerido: `git remote add upstream https://github.com/drawdb-io/drawdb.git`.

## Alterações feitas em relação ao upstream

Dois commits sobre `e4e696f` (último commit do upstream no momento do fork):

1. **Adapta para publicação no GitHub Pages (uso em sala)**
   - `vite.config.js`: `base: process.env.BASE_PATH || '/'` (com `/* eslint-env node */` no
     topo, senão o lint falha com `'process' is not defined`).
   - `src/App.jsx`: `<BrowserRouter basename={import.meta.env.BASE_URL}>`.
   - `index.html`: `config.js` carregado via `%BASE_URL%config.js`.
   - `src/main.jsx`: removido o `@vercel/analytics` (o pacote continua no `package.json`).
   - `.github/workflows/deploy-pages.yml`: build com `BASE_PATH=/<nome-do-repo>/`, copia
     `index.html` para `404.html` (fallback de SPA) e publica no Pages.
   - `LEIA-ME.md`: documentação em português para a turma.
2. **Corrige 404 ao abrir novo diagrama/modelo em nova aba**
   - `src/utils/appUrl.js`: `appUrl(path)` prefixa o caminho base.
   - Aplicado em `window.open`/`href` absolutos de `ControlPanel.jsx` (Novo, Relatar bug, link
     de cópia salva), `Modal.jsx` e `Templates.jsx` (abrir modelo) e `Share.jsx` (link de
     compartilhamento).
   - **Status:** aplicado e enviado ao GitHub (`cc8a7fd`, presente em `origin/main`).

### Convenção importante

O site roda em subpasta (`/drawdbCatolicaSc/`). Navegação via `navigate()` e `<Link>` do React
Router já respeita o `basename`. **Qualquer URL interna montada à mão** (`window.open`, `href`,
`window.location`) precisa passar por `appUrl()`, senão gera 404 em produção. Ao sincronizar
com o upstream, procure novos casos com:

```bash
grep -rnE "window\.open\(\"/|href: \`/|origin \+ \"/" src
```

## Como rodar e testar

```bash
npm install
npm run dev                                        # desenvolvimento (base /)
npm run lint                                       # precisa passar: o CI roda lint
BASE_PATH=/drawdbCatolicaSc/ npm run build         # simula o build de produção
BASE_PATH=/drawdbCatolicaSc/ npx vite preview      # abrir http://localhost:4173/drawdbCatolicaSc/
```

Sempre teste fluxos que abrem nova aba usando o build com `BASE_PATH`, porque `npm run dev`
roda na raiz e esconde erros de caminho base.

No **Git Bash**, prefixe com `MSYS_NO_PATHCONV=1`, senão `/drawdbCatolicaSc/` vira
`C:/Program Files/Git/drawdbCatolicaSc/` e o build sai com caminhos quebrados. No `cmd`, use
`set BASE_PATH=/drawdbCatolicaSc/` antes do `npm run build`.

## Homologação (ambiente de testes)

- Os sprints são desenvolvidos na branch **`homolog`**. A `main` recebe a `homolog` por PR quando
  o mantenedor decide publicar uma versão (ponto estável e validado), seguindo
  [`docs/versionamento.md`](docs/versionamento.md).
- Todo push na `homolog` dispara **Deploy homologação** (`.github/workflows/deploy-homolog.yml`),
  que publica a `main` em `/drawdbCatolicaSc/` e a `homolog` em `/drawdbCatolicaSc/teste/`.
- A homologação usa o banco local `drawDB-teste` (`VITE_DB_NAME`) e mostra o selo
  "Ambiente de testes" (`VITE_APP_ENV=homolog`, `src/catolica/HomologBadge.jsx`). O
  `localStorage` (configurações, tipos personalizados) continua compartilhado com a produção.
- Os links profundos dos dois ambientes passam por `.github/pages/404.html`, que carrega o
  `index.html` certo mantendo a URL.
- Um push na `main` publica só a produção e remove `/teste/`. Para restaurar, rode
  Deploy homologação manualmente (Actions → Run workflow).
- Requisito no GitHub: Settings → Environments → `github-pages` → Deployment branches deve
  incluir `homolog`.
- Código institucional novo fica em `src/catolica/`. Componentes do fork entram nos `<Slot>` do
  upstream via `src/catolica/extensions.jsx` (o `ExtensionsContext.Provider` está no
  `src/main.jsx`). Nunca definir ali chaves de nuvem (`cloudSave`, `cloudLoad`...), que mudam o
  comportamento de salvamento. Textos próprios ficam em `src/catolica/i18n.js`.
- Persistência (Sprint 1B): o save local em `Workspace.jsx` confere a revisão (`lastModified`)
  dentro de uma transação, roda um save por vez e grava o histórico de desfazer no banco
  `drawDB-catolica`. Ao mexer no save, preserve essas garantias (ver `docs/sprints.md`).

## Versionamento (público)

- [`CHANGELOG.md`](CHANGELOG.md) é a fonte única das versões. **Toda mudança visível ao usuário
  entra na seção `[Não lançado]` no mesmo commit**, em texto curto e sem termos técnicos; mudanças
  só internas não entram. A futura tela inicial vai ler esse arquivo, então mantenha o formato
  descrito no comentário do topo.
- Versões seguem SemVer, com tag `vX.Y.Z` na `main` e GitHub Release. A primeira será a 1.0.0.
  O `version` do `package.json` fica o do upstream. Passo a passo em
  [`docs/versionamento.md`](docs/versionamento.md).

## Deploy

- Settings → Pages → Source: **GitHub Actions** (já configurado).
- Todo push na `main` dispara o workflow **Deploy GitHub Pages**. O workflow **Build** é o CI
  original do upstream (lint e build em Node 20 e 22) e não publica nada.
- Não usar os botões "Configure" da tela de Pages (Jekyll/Static HTML). Eles criam um workflow
  que publica o código sem compilar, e o site fica em branco. Isso já aconteceu uma vez.
- Depois do deploy, recarregar com Ctrl+F5 para evitar a versão em cache.

## Ambiente do mantenedor

- Windows. Pasta local: `C:\Users\gusta\OneDrive\Desktop\DrawDB\drawdbCatolicaSc`.
- Usa `cmd` e Git. Até agora as mudanças chegaram como arquivos `.patch` (`git am`) e foram
  enviadas com `git push origin main`.
- A pasta fica no OneDrive. Se houver lentidão ou conflito com `node_modules`, mover o projeto
  para fora do OneDrive.

## Arquitetura (resumo para orientação)

- React 18 + Vite, UI com Semi UI (`@douyinfe/semi-ui`), Tailwind. Cerca de 52 mil linhas.
- Persistência local no navegador (IndexedDB via Dexie, `src/data/db.js`). Não há conta nem
  nuvem: limpar dados do navegador apaga os diagramas.
- i18n com i18next. `src/i18n/locales/pt-br.js` está completo (366 chaves, mesmas do `en.js`).
- Modelos prontos em `src/templates/` (template1 a template6).
- Pontos de extensão: `src/context/ExtensionsContext.jsx` (`useExtensions`, `<Slot name>`),
  usados pelo drawDB para encaixar recursos Pro sem tocar no núcleo.
- Configuração em tempo de execução: `public/config.js` define `window.__DRAWDB_CONFIG__`.
  Backends em `src/config/index.js` (`VITE_BACKEND_URL`, padrão `http://localhost:5000`).

## Limitações conhecidas

- **Compartilhar** (gist/link) depende do servidor `drawdb-server`, que não está configurado.
  Nesta versão, o recurso falha. Opções: esconder o botão ou implementar compartilhamento sem
  servidor (diagrama comprimido na URL).
- Recursos do drawDB Pro (nuvem, colaboração, IA, sync com GitHub) não existem no código aberto.
- Respostas 402 do backend levam a `/checkout`, rota que não existe neste fork. Sem backend,
  isso não deve ocorrer, mas vale tratar se um backend for adicionado.

## Roteiro proposto (a validar com os testes em sala)

**Fase 1, sem servidor (continua grátis no GitHub Pages)**
- Português como idioma padrão.
- Lembrete de backup (exportar JSON) ao sair ou após um período de edição.
- Modelos e exercícios das disciplinas.
- Exportação de entrega (PDF/imagem com nome, RA e turma no cabeçalho).
- Validações didáticas (tabela sem PK, relacionamento sem FK etc.).
- Tratar o botão Compartilhar (esconder ou compartilhar via URL).
- Identidade visual institucional (depende de autorização).

**Fase 2, com servidor (só com apoio formal da instituição: custo, backup e LGPD)**
- Login institucional, diagramas na nuvem, entrega e correção pelo professor, colaboração.

## Governança (pendências)

- Conversar com professor/coordenação sobre nome, marca e responsáveis.
- Mover o repositório para uma organização no GitHub com mais de um administrador, para não
  depender de uma conta pessoal.
- Avaliar enquadramento como projeto de extensão ou de disciplina.

## Plano de execução

O roteiro acima foi detalhado em micro sprints em [`docs/sprints.md`](docs/sprints.md), feitos
um de cada vez. Consulte e atualize o status lá. A primeira lista de pedidos do mantenedor
(home em PT-BR, remover depoimentos, acesso rápido na home, botão Compartilhar, persistência)
já está distribuída nos sprints. Layout, exibição e usabilidade geral ficam para depois das
revisões em sala (Sprint 8).
