# Versão auto-hospedada do drawDB (uso em sala)

Este repositório é um **fork** do [drawDB](https://github.com/drawdb-io/drawdb), editor de diagramas
entidade-relacionamento de código aberto, publicado gratuitamente no GitHub Pages para uso
didático. Todo o crédito do editor é dos autores originais. A licença continua sendo a
**AGPL-3.0** (ver `LICENSE`), e o código-fonte completo, incluindo as modificações abaixo,
está neste repositório.

## O que foi alterado em relação ao original

- `vite.config.js`: caminho base configurável pela variável `BASE_PATH`, para rodar em subpasta.
- `src/App.jsx`: o roteador usa esse caminho base (`basename`).
- `index.html`: `config.js` carregado relativo ao caminho base.
- `src/main.jsx`: removido o Vercel Analytics (não se aplica fora da Vercel).
- `.github/workflows/deploy-pages.yml`: build e publicação automáticos no GitHub Pages.

As novidades e correções desta versão, além das listadas acima, estão em
[`CHANGELOG.md`](CHANGELOG.md).

Nada do editor foi removido. Os recursos pagos do drawDB Pro (nuvem, colaboração em tempo real,
IA) dependem de servidores próprios do drawDB e não fazem parte do código aberto.

## Avisos para a turma

- Os diagramas ficam salvos **no navegador** (IndexedDB). Limpar dados do navegador ou trocar
  de computador apaga ou "esconde" os diagramas.
- **Ao fim de cada aula, exporte o diagrama** (Arquivo → Exportar → Pacote .zip) e guarde o
  arquivo. Para reabrir em outro computador: Arquivo → Importar (Ctrl+I).
- Para entregar trabalhos, use Arquivo → Exportar: o pacote .zip leva o SQL, o diagrama completo
  e uma imagem. Também dá para exportar só o SQL ou uma imagem (PNG, JPEG, SVG ou PDF).

## Publicar (uma vez)

1. Envie este código para um repositório no GitHub (branch `main`).
2. Em **Settings → Pages**, em *Source*, escolha **GitHub Actions**.
3. Aguarde a aba **Actions** concluir. O endereço será
   `https://<seu-usuario>.github.io/<nome-do-repositorio>/`.

## Rodar localmente

```bash
npm install
npm run dev
```
