# Builder result: GitHub CI

**Data:** 2026-08-20

**Missão:** `mission-08-github-ci`

**Papel:** Builder

**Plano aprovado:** [`01-builder-plan-github-ci.md`](01-builder-plan-github-ci.md)

**Aprovação:** [`02-direction-implementation-approval.md`](02-direction-implementation-approval.md)

**Status:** Pronto para revisão independente, com limitação local registrada

## Resultado

O workflow local de integração contínua foi criado no escopo aprovado. Ele
publicará, após futuras autorizações Git e execução remota, o check
`CI / Lint, build and tests` para pull requests destinados à `main` e pushes na
`main`.

O YAML usa Node `22.13.0`, npm/`package-lock.json`, runner `ubuntu-24.04`,
permissão somente de leitura, Actions fixadas por SHA, checkout sem credenciais,
timeouts, concorrência e os valores de ambiente `CI` e
`WRANGLER_SEND_METRICS` como strings explícitas. Não há cache, artefatos,
secrets, environment, acesso a recurso remoto ou deploy.

A instalação, o build e os 57 testes passaram. O comando obrigatório
`npm run lint` não passou por percorrer um pacote gerado preexistente e ignorado
em `work/`; o código rastreado passou numa execução diagnóstica que acrescentou
somente `--ignore-pattern work`. O Builder não removeu o artefato nem alterou a
configuração, porque isso ultrapassaria o escopo autorizado.

## Arquivos alterados

- `.github/workflows/ci.yml` — novo workflow técnico da Missão 8.
- `docs/agent-reports/missions/mission-08-github-ci/README.md` — estado e índice
  cronológico atualizados para o handoff do Builder.
- `docs/agent-reports/missions/mission-08-github-ci/03-builder-result-github-ci.md`
  — este relatório de resultado.

O plano `01-builder-plan-github-ci.md` e a aprovação
`02-direction-implementation-approval.md` já existiam antes da implementação e
não foram alterados pelo Builder nesta etapa. Como toda a pasta da Missão 8
ainda está não rastreada em relação a `HEAD`, o `git status` também os lista;
isso não os torna mudanças produzidas pela implementação atual.

## Conformidade de escopo

- branch preservada: `main`;
- `HEAD` preservado: `f43c3505ec01fcdaef0ac0509e138422813f93f9`;
- nenhuma branch criada ou trocada;
- nenhum commit, push, PR, merge, deploy ou mudança remota;
- nenhum acesso a Notion, D1 remoto, secrets ou dados pessoais;
- `package.json`, `package-lock.json`, `pnpm-lock.yaml`,
  `pnpm-workspace.yaml`, código, testes, scripts e harnesses sem alteração
  rastreada;
- nenhuma dependência acrescentada ao projeto;
- nenhum cache ou artefato configurado no workflow;
- nenhuma ampliação silenciosa do escopo.

## Revalidação dos SHAs

Imediatamente antes da edição, `git ls-remote` confirmou diretamente nos
repositórios oficiais:

- `actions/checkout` tag `v7.0.1`:
  `3d3c42e5aac5ba805825da76410c181273ba90b1`;
- `actions/setup-node` tag `v7.0.0`:
  `820762786026740c76f36085b0efc47a31fe5020`.

Verificação concluída em `2026-08-20T18:59:37-03:00`. Os dois valores
coincidiram com o plano aprovado.

## Validação executada

### YAML

**Resultado:** aprovado por validação estrutural estrita.

- arquivo UTF-8 com 47 linhas;
- sem tabs, trailing whitespace ou indentação ímpar;
- gatilhos, permissões, nomes, SHAs, timeouts, concorrência, comandos e strings
  obrigatórios presentes;
- conteúdo proibido ausente: `pull_request_target`, `workflow_run`,
  `workflow_dispatch`, schedule, cache, secrets, environment, self-hosted,
  pnpm, build duplicado e deploy;
- `CI: "true"` e `WRANGLER_SEND_METRICS: "false"` confirmados literalmente.

Nenhum parser YAML ou `actionlint` estava instalado antes ou depois de
`npm ci`. Para não adicionar dependência ao projeto nem executar pacote externo
não aprovado, a validação foi estrutural. A primeira execução no GitHub ainda é
a prova obrigatória do parser e do schema específicos de Actions.

### Instalação determinística

Comando: `npm ci --no-audit --no-fund`

**Resultado:** aprovado; exit code 0; 469 pacotes instalados em cerca de 5
minutos.

Avisos não bloqueadores:

- `@esbuild-kit/esm-loader@2.6.5` e
  `@esbuild-kit/core-utils@3.3.2` estão depreciados;
- o mecanismo `allow-scripts` informou seis pacotes transitivos com scripts
  ainda não cobertos: quatro versões de `esbuild`, `sharp` e `workerd`.

Nenhum lockfile ou manifesto foi alterado. O Builder não executou
`npm approve-scripts`, pois isso não pertence ao escopo.

### Lint obrigatório

Comando: `npm run lint`

**Resultado:** falhou; exit code 1; duração 96,15 segundos; 5.188 erros e zero
warnings.

Todos os diagnósticos exibidos pertencem a bundles gerados sob
`work/shaft-package-95be33e7c0034edeb4acaed33be214ce/dist/`. A raiz:

- é ignorada pela regra `.gitignore:43:/work/`;
- contém zero arquivo rastreado;
- já existia com `LastWriteTime` de `2026-08-06T01:06:36-03:00`, anterior à
  Missão 8.

O script atual ignora apenas `dist` e `.next` pela posição do caminho; por isso
um `dist` aninhado sob `work/` foi analisado. O Builder não apagou a raiz e não
alterou `.gitignore`, ESLint ou `package.json`.

### Lint diagnóstico do código rastreado

Comando: `npm run lint -- --ignore-pattern work`

**Resultado:** aprovado; exit code 0; duração 6,18 segundos; sem diagnósticos.

Esta execução separa a saúde do código do artefato local, mas não substitui nem
oculta a falha do comando obrigatório. Num checkout GitHub limpo, `work/` não é
rastreado e não estará presente; essa expectativa ainda precisa ser comprovada
pela primeira run remota autorizada.

### Build e suíte completa

Comando: `npm test`

**Resultado:** aprovado; exit code 0; duração total 73,14 segundos.

- `vinext build`: aprovado;
- testes: 57;
- aprovados: 57;
- falhas: 0;
- cancelados: 0;
- ignorados: 0;
- pendentes/todo: 0;
- duração reportada pelo test runner: 23.920,1786 ms.

Foram aprovados, entre outros, os cenários D1 local com 2, 10 e 100 requisições
concorrentes, rollback, owner não pronto, schema ausente, tooling de migração,
paginação financeira de 10.000 registros, guardas das rotas e renderização.

### Cleanup e integridade do checkout

**Resultado:** aprovado.

- zero processo `wrangler` ou `workerd` ao final;
- zero raiz temporária `shaft-checkin-d1-*`,
  `shaft-checkin-migration-*` ou `shaft-migration-artifacts-*` no diretório
  temporário do sistema;
- zero alteração rastreada em arquivos protegidos pelo escopo;
- branch `main` e `HEAD` original preservados.

## Diff técnico completo

Conteúdo integral criado em `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

concurrency:
  group: ci-${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

env:
  CI: "true"
  WRANGLER_SEND_METRICS: "false"

jobs:
  quality:
    name: Lint, build and tests
    runs-on: ubuntu-24.04
    timeout-minutes: 25

    steps:
      - name: Checkout
        uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          persist-credentials: false

      - name: Set up Node.js
        uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
        with:
          node-version: "22.13.0"

      - name: Install dependencies
        run: npm ci --no-audit --no-fund
        timeout-minutes: 7

      - name: Lint
        run: npm run lint
        timeout-minutes: 5

      - name: Build and test
        run: npm test
        timeout-minutes: 15
```

O diff documental adicional é a atualização do estado e do item 3 no índice da
missão, além da criação deste relatório. Nenhum outro arquivo pertence ao diff
da implementação.

## Limitações e riscos remanescentes

### Potencialmente bloqueador para aceitação local

- `npm run lint` não ficou verde neste checkout por causa do artefato ignorado
  em `work/`. A Direção ou o Reviewer deve decidir se a evidência diagnóstica e
  a ausência desse diretório em checkout limpo bastam, ou se uma nova prova em
  ambiente limpo deve preceder o próximo gate. Corrigir configuração ou remover
  dados locais exige decisão fora deste escopo.

### Não bloqueadores ou futuros

- a validação YAML foi estrutural, não por parser específico de Actions;
- a máquina local usa Node `v24.19.0`; Node `22.13.0` será comprovado no runner;
- Linux, instalação fria no runner, duração, memória e estabilidade ainda não
  foram observados remotamente;
- workflow, runs e check ainda não existem no GitHub;
- proteção da `main` permanece inalterada e pertence a uma decisão posterior.

## Handoff ao Reviewer

O Reviewer independente deve começar em modo somente leitura e conferir:

1. o plano, a aprovação e o diff integral do workflow;
2. gatilhos e ausência de `pull_request_target`/privilégios;
3. permissões mínimas, strings de ambiente, pinning e credenciais do checkout;
4. timeouts, concorrência, nomes estáveis e ausência de cache/artefatos;
5. npm/`package-lock.json`, Node `22.13.0` e execução única do build;
6. a classificação da falha local do lint e a prova diagnóstica verde;
7. o resultado de 57/57 testes e o cleanup sem resíduos;
8. a conformidade de escopo e a inexistência de ações Git ou remotas.

O Builder não declara aceitação final. A Missão 8 permanece aguardando revisão
independente de Nível 3 e decisão posterior da Direção.
