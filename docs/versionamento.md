# Versionamento e publicação

## Onde fica a versão

- **[`CHANGELOG.md`](../CHANGELOG.md)** é a fonte única: lista as versões publicadas e, no topo, a
  seção **[Não lançado]** com o que já está na homologação. A futura tela inicial vai ler este
  arquivo para mostrar as novidades (por isso o formato descrito nele deve ser mantido).
- **Tags do Git** (`v1.0.0`, `v1.1.0`...) marcam na `main` o código de cada versão publicada.
- **GitHub Releases** (aba *Releases* do repositório) publicam cada versão com o texto do
  changelog, de forma pública.
- O campo `version` do `package.json` continua o do drawDB original (`0.0.0`), para não gerar
  conflito ao sincronizar com o upstream.

## Numeração (versionamento semântico)

`MAIOR.MENOR.CORREÇÃO`, por exemplo `1.2.3`:

- **MAIOR**: mudança que exige ação de quem usa ou quebra compatibilidade, por exemplo um formato
  de arquivo que versões anteriores não abrem, ou a troca de endereço do site (os diagramas ficam
  presos ao endereço antigo).
- **MENOR**: novos recursos que não quebram nada (um sprint concluído costuma ser uma versão
  menor).
- **CORREÇÃO**: só correções de defeitos.

A primeira versão publicada desta edição será a **1.0.0**. O que está hoje no ar (o drawDB
original com os ajustes para o GitHub Pages) fica registrado como ponto de partida.

## Regras do dia a dia

- Toda mudança que quem usa o editor percebe entra na seção **[Não lançado]** do changelog no
  mesmo commit da mudança.
- Texto curto, do ponto de vista do usuário, sem termos técnicos. Detalhes técnicos ficam no
  [`docs/sprints.md`](sprints.md) e nas mensagens de commit.
- Mudanças só internas (testes, documentação, infraestrutura) não entram no changelog.

## Como publicar uma versão

1. Conferir que tudo da seção **[Não lançado]** foi validado na homologação
   (`/drawdbCatolicaSc/teste/`), nos navegadores usados em sala.
2. Definir o número (regras acima) e trocar `## [Não lançado]` por `## [x.y.z] - AAAA-MM-DD`;
   criar uma nova seção `## [Não lançado]` vazia acima dela.
3. Abrir o PR da `homolog` para a `main` com o texto da versão no corpo e fazer o merge.
4. Criar a tag e a release na `main`:
   `git tag -a vx.y.z -m "Versão x.y.z"` e `git push origin vx.y.z`; depois, em *Releases → Draft
   a new release*, escolher a tag e colar o texto da versão do changelog.
5. O deploy da produção roda sozinho com o push na `main`. Ele remove o ambiente de testes
   (`/teste/`); para restaurá-lo, rodar **Deploy homologação** em *Actions → Run workflow*.
6. Recarregar o site com Ctrl+F5 e conferir.
