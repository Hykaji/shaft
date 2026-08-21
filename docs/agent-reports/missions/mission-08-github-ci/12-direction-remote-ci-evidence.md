# Evidência da Direção: execução remota da CI

**Data:** 2026-08-21

**Missão:** `mission-08-github-ci`

**Classificação:** Nível 3 - crítico

**Estado:** Duas tentativas remotas aprovadas; aguarda revisão independente

## Escopo observado

A Direção publicou no PR 2 o commit local previamente autorizado
`811a3420d599625c6dc747b29a2ef573a53b5cc8` e acompanhou a execução controlada
do workflow `CI`. Não houve merge, alteração de proteção da `main`, mudança de
configuração do GitHub ou novo código durante a observação.

## Execução observada

- PR: `https://github.com/Hykaji/shaft/pull/2`;
- run: `https://github.com/Hykaji/shaft/actions/runs/32481470989`;
- evento: `pull_request`;
- workflow: `CI`;
- check: `Lint, build and tests`;
- commit: `811a3420d599625c6dc747b29a2ef573a53b5cc8`;
- runtime configurado e adquirido: Node `22.18.0` em Linux x64.

## Tentativa 1

- conclusão: `success`;
- job: `96768578486`;
- duração do job: 38 segundos;
- checkout, setup do Node, instalação, lint, build/test e etapas finais:
  aprovados;
- build: aprovado;
- testes: 57;
- aprovados: 57;
- falhas, cancelados, ignorados e pendentes: zero.

## Tentativa 2

A repetição foi autorizada explicitamente para verificar estabilidade e usou o
mesmo run, workflow e commit.

- tentativa: 2;
- conclusão: `success`;
- job: `96769042890`;
- duração do job: 41 segundos;
- checkout, setup do Node, instalação, lint, build/test e etapas finais:
  aprovados;
- build: aprovado;
- testes: 57;
- aprovados: 57;
- falhas, cancelados, ignorados e pendentes: zero.

## Estabilidade e logs

As duas tentativas tiveram o mesmo resultado funcional e duração próxima, sem
falha intermitente observada. A inspeção direcionada dos logs não encontrou
erros, tokens, valores de secrets, credenciais do Shaft ou evidência de acesso
a Notion, Cloudflare ou D1 remoto. A linha padrão `Secret source: Actions` do
setup do runner não representa uso ou exposição de segredo do projeto.

## Limites

Esta evidência não autoriza merge, proteção da `main`, publicação ou alteração
remota adicional. O relatório e o índice permanecem somente locais até um
futuro checkpoint autorizado. Um Reviewer independente deve conferir o estado
do PR, as duas tentativas e seus logs antes da decisão final da Direção.
