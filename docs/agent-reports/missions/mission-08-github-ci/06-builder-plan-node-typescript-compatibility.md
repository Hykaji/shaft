# Missão 08: plano de compatibilidade entre Node e TypeScript

**Data:** 2026-08-20

**Papel:** Builder

**Nível:** 3 - crítico, mantido da Missão 8

**Estado:** investigação concluída; correção não implementada; aguarda decisão
da Direção

**Revisa:** primeira execução remota do workflow aprovado em
[`03-builder-result-github-ci.md`](03-builder-result-github-ci.md), aceita
localmente em
[`05-direction-local-acceptance.md`](05-direction-local-acceptance.md)

## Limites desta etapa

Esta etapa foi exclusivamente de investigação e planejamento. Foram lidos no
checkout canônico o `AGENTS.md`, o workflow dos agentes, toda a pasta da Missão
8, os manifests npm, os cinco testes oficiais, os módulos TypeScript alcançados
por eles, os scripts de migração relacionados e `.github/workflows/ci.yml`.
Também foi lido integralmente o log da execução remota
[`32424408307`](https://github.com/Hykaji/shaft/actions/runs/32424408307).

Nenhum workflow, código, manifesto, lockfile, teste, harness, configuração
remota, dado ou segredo foi alterado. Não houve commit, push, novo PR, rerun,
merge ou mudança de branch.

## Evidência observada

### Checkout canônico

- diretório de trabalho: `D:\Aplicativos\Modo Eixo App`;
- raiz retornada por `git rev-parse --show-toplevel`:
  `D:/Aplicativos/Modo Eixo App`;
- branch: `codex/mission-08-github-ci`;
- commit: `44b9e521b3cedf60dc2933db5313c2b5286deaf5`;
- upstream: `origin/codex/mission-08-github-ci`;
- árvore limpa antes desta documentação.

Como `git` não estava no `PATH`, as verificações usaram o executável alternativo
prescrito em
`C:\Users\taran\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe`.

### Execução remota

O PR
[`#2`](https://github.com/Hykaji/shaft/pull/2) executou o workflow no merge
temporário do head acima com a `main`. No runner `ubuntu-24.04`, com Node
`v22.13.0` e npm `10.9.2`:

1. checkout, setup, `npm ci --no-audit --no-fund` e `npm run lint` passaram;
2. as cinco fases do `vinext build`, iniciadas por `npm test`, passaram;
3. os cinco arquivos de teste falharam na carga dos módulos, antes da execução
   dos 57 casos;
4. o resumo TAP foi `tests 5`, `pass 0`, `fail 5`;
5. cada processo informou Node `v22.13.0` e
   `TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".ts"`.

Os primeiros módulos recusados foram:

- `app/lib/dashboard-state.ts` por `tests/rendered-html.test.mjs`;
- `app/lib/shaft-access-policy.ts` por
  `tests/shaft-access-policy.test.mjs`;
- `app/lib/notion.ts` por `tests/notion-finance-pagination.test.mjs`;
- `app/lib/checkin-payload.ts` por
  `tests/checkin-idempotency.test.mjs`;
- `app/lib/checkin-payload.ts`, via o tooling de migração, por
  `tests/checkin-migration.test.mjs`.

O sucesso local anterior ocorreu em Node `v24.19.0`, que aceita por padrão os
arquivos TypeScript com sintaxe apagável encontrados neste grafo. Portanto,
aquele resultado não comprovava o mínimo `>=22.13.0` declarado no projeto.

## Causa raiz

Há duas incompatibilidades no contrato de runtime, não apenas uma:

1. O `package.json` e o README declaram Node `>=22.13.0`, e o workflow testou
   exatamente `22.13.0`, mas os scripts usam `node` diretamente para importar
   arquivos `.ts`. Nessa versão, o stripping nativo de tipos existe, porém só é
   ativado com `--experimental-strip-types`. Sem a flag, o loader ESM retorna
   `ERR_UNKNOWN_FILE_EXTENSION`.
2. `tests/shaft-access-policy.test.mjs` e
   `tests/notion-finance-pagination.test.mjs` importam `registerHooks` de
   `node:module`. Essa API síncrona foi adicionada somente no Node `22.15.0`.
   Assim, adicionar a flag de TypeScript no Node `22.13.0` removeria o primeiro
   erro, mas ainda não tornaria a suíte compatível com o mínimo declarado.

O Node `22.18.0` habilitou o stripping de tipos por padrão. A documentação
oficial esclarece que esse suporte é leve: não lê `tsconfig.json`, não faz type
checking e aceita somente sintaxe que não exige geração de JavaScript. A
inspeção dos módulos `.ts` carregados pelos testes e pelos scripts de migração
não encontrou `enum`, namespace com runtime, parameter properties ou import
aliases; os imports de runtime são relativos e incluem a extensão `.ts`.

Fontes oficiais:

- [Node 22.13.0: `--experimental-strip-types`](https://nodejs.org/download/release/v22.13.0/docs/api/cli.html#--experimental-strip-types);
- [Node 22.18.0: suporte nativo a TypeScript](https://nodejs.org/download/release/v22.18.0/docs/api/typescript.html);
- [Node: histórico de `module.registerHooks`](https://nodejs.org/api/module.html#moduleregisterhooksoptions).

## Alcance nos scripts de migração

O problema não pertence apenas ao test runner. Os três comandos abaixo iniciam
com `node` e alcançam TypeScript em runtime:

- `checkin-migration:audit` importa
  `scripts/checkin-migration/lib/legacy-checkin.mjs`, que importa
  `app/lib/checkin-payload.ts`;
- `checkin-migration:import` e `checkin-migration:reconcile` importam
  `scripts/checkin-migration/lib/manifest.mjs`, que alcança o mesmo módulo por
  `legacy-checkin.mjs`;
- os workers locais usados pelo harness também são `.ts` e importam módulos
  `.ts`, embora sua execução seja mediada por Wrangler/Workerd.

Logo, uma variável ou flag aplicada somente ao job da CI deixaria `npm test` e
os comandos de migração incoerentes para usuários na versão mínima declarada.

## Opções avaliadas

### 1. Manter Node 22.13.0 e declarar suporte explícito

Seria necessário adicionar `--experimental-strip-types` a `npm test`, aos dois
scripts focados e aos três comandos de migração, ou estabelecer um equivalente
portável para todos eles. Configurar apenas `NODE_OPTIONS` no workflow é
rejeitado porque corrige exclusivamente a CI.

Contrapontos:

- a flag resolve `.ts`, mas Node 22.13.0 não oferece `module.registerHooks`;
- preservar 22.13.0 exigiria também reescrever os dois harnesses para a API
  assíncrona `module.register`, com novos hooks e novos riscos de isolamento,
  ou remover a técnica atual de substituição de módulos;
- amplia a alteração para scripts e testes e mantém uma capacidade experimental
  opt-in como parte permanente do contrato;
- não é a correção mínima para a implementação existente.

Uma variante menos ampla seria elevar o mínimo a `22.15.0` e ainda adicionar a
flag a todos os entrypoints. Ela funcionaria em princípio, mas altera mais
scripts do que elevar diretamente para a versão em que o stripping já é
padrão.

### 2. Elevar coerentemente a versão mínima do Node

Elevar o contrato inteiro para Node `>=22.18.0` e fixar a CI em `22.18.0` reúne
as duas capacidades já pressupostas pelo repositório:

- `module.registerHooks`, presente desde 22.15.0;
- stripping nativo de tipos habilitado por padrão desde 22.18.0.

Contrapontos:

- usuários em 22.13–22.17 precisarão atualizar o runtime;
- o stripping nativo continua sem type checking e sem interpretar
  `tsconfig.json`;
- futura introdução de sintaxe TypeScript não apagável nos módulos executados
  diretamente exigirá executor explícito ou transformação;
- a compatibilidade ainda precisa ser comprovada executando toda a suíte e os
  carregamentos dos comandos de migração em Node 22.18.0, e não inferida do
  sucesso em Node 24.

### 3. Adotar executor TypeScript explícito

`tsx` é a alternativa mais alinhada ao test runner atual: sua documentação
permite trocar `node --test` por `tsx --test`, e o Node o apresenta como exemplo
de suporte completo. Para ser um contrato confiável, ele teria de entrar como
`devDependency` direta com versão exata, e os scripts de teste e migração
teriam de invocá-lo explicitamente.

Há cópias transitivas hoje, mas elas não constituem contrato: o
`package-lock.json` resolve `tsx@4.22.1` via `drizzle-kit`, enquanto o
`pnpm-lock.yaml` contém `tsx@4.23.6`. Confiar no binário transitivo permitiria
que outra dependência o removesse ou atualizasse sem intenção do Shaft.

Contrapontos:

- `tsx` ainda usa o Node por baixo; sozinho não disponibiliza
  `module.registerHooks` no Node 22.13.0. Seria necessário elevar o mínimo ao
  menos a 22.15.0 ou reescrever os harnesses;
- adiciona uma dependência executável e sua cadeia de transformação/esbuild,
  aumentando superfície de supply chain, revisão e lockfile;
- exige mudar todos os entrypoints relevantes para evitar divergência entre
  CI, `npm test`, testes focados e migração;
- oferece suporte mais amplo do que o grafo atual requer.

Fonte do executor: [documentação oficial do `tsx` para o test runner](https://tsx.is/node-enhancement#test-runner).

## Recomendação mínima

Recomendo a **opção 2: elevar de modo único e coerente o mínimo e a CI para Node
22.18.0**, sem adicionar dependência e sem mudar os scripts.

É a menor alteração que satisfaz simultaneamente o loader TypeScript e
`module.registerHooks`, mantém `npm test` idêntico entre usuários e CI, cobre os
entrypoints de migração que usam `node` e evita introduzir um executor
transitivo como dependência direta. O valor deve ser exato no workflow e um
limite mínimo nos manifests/documentação: `node-version: "22.18.0"` na CI e
`>=22.18.0` no contrato do projeto.

Não recomendo elevar diretamente para Node 24 apenas porque a máquina local o
usou: isso aumentaria o salto de major sem necessidade demonstrada. Também não
recomendo usar a versão móvel `22.x`, pois reduziria a reprodutibilidade do
check obrigatório.

## Arquivos exatos da implementação recomendada

Uma implementação futura, após aprovação, deve alterar somente:

1. `package.json`
   - mudar `engines.node` de `>=22.13.0` para `>=22.18.0`;
   - preservar sem alterações os scripts `test`, `test:checkin-*` e
     `checkin-migration:*`.
2. `package-lock.json`
   - sincronizar somente o `engines.node` do pacote raiz por npm;
   - rejeitar atualização oportunista de versões ou integridades.
3. `README.md`
   - atualizar o requisito para Node `>=22.18.0` e explicar em uma frase que os
     testes/tooling executam módulos TypeScript nativamente.
4. `.github/workflows/ci.yml`
   - mudar apenas `node-version` de `"22.13.0"` para `"22.18.0"`;
   - preservar SHAs das Actions, permissões, timeouts, concorrência, comandos,
     strings de ambiente e política de forks.
5. documentação cronológica da Missão 8
   - relatório do Builder e atualização do índice após a implementação;
   - revisão independente e decisão humana em documentos posteriores.

`pnpm-lock.yaml` não registra o campo `engines` do pacote raiz e não deve mudar
na opção recomendada; deve-se confirmar explicitamente que permaneceu sem diff.
Também não há motivo para alterar `tsconfig.json`, código, testes ou harnesses.

Se a Direção preferir `tsx`, o escopo muda: `package.json`,
`package-lock.json`, `pnpm-lock.yaml`, todos os scripts Node de teste e migração
e possivelmente os harnesses por causa de `registerHooks` teriam de ser
incluídos em um novo plano aprovado.

## Plano de implementação e validação

Após aprovação explícita da Direção:

1. confirmar checkout canônico, branch esperada, upstream e árvore limpa;
2. revalidar a documentação oficial e a disponibilidade exata do Node 22.18.0;
3. aplicar apenas as quatro mudanças técnicas listadas acima;
4. regenerar `package-lock.json` com npm, sem atualizar dependências, e revisar
   o diff estrutural e de integridade;
5. em Node **exatamente `v22.18.0`**, executar e registrar:
   - `node --version` e `npm --version`;
   - `npm ci --no-audit --no-fund`;
   - `npm run lint`;
   - `npm test`, exigindo build aprovado e os 57 casos executados/aprovados;
   - `npm run test:checkin-idempotency`;
   - `npm run test:checkin-migration`;
   - uma importação sem efeitos remotos dos três entrypoints de migração para
     comprovar que todos carregam o grafo `.mjs` -> `.ts` no runtime mínimo;
6. validar o YAML e confirmar que o workflow ainda possui permissões mínimas,
   Actions fixadas por SHA, timeouts, concorrência e segurança de forks;
7. confirmar ausência de processos Wrangler/Workerd, diretórios temporários e
   alterações fora do escopo;
8. escrever o resultado cronológico e entregar para Reviewer independente;
9. somente após os gates Git/remotos específicos, executar novamente o check
   no PR e comparar o log com os critérios deste plano.

Os comandos de migração não devem acessar Notion ou D1 remoto durante a
validação. O teste existente e o probe de importação devem usar apenas código e
fixtures locais.

## Riscos e mitigação

- **Contrato ainda incorreto:** mitigar testando no 22.18.0 exato, não apenas no
  Node 24 local.
- **Sintaxe TypeScript futura não apagável:** manter imports explícitos e
  detectar regressão pela suíte no runtime mínimo; avaliar `tsx` em missão
  separada se o requisito surgir.
- **Lockfile com churn indevido:** revisar que apenas o requisito do pacote raiz
  mudou e executar `npm ci` a partir dele.
- **Divergência entre ferramentas:** preservar os scripts comuns e executar
  probes dos três entrypoints de migração.
- **Regressão de segurança da CI:** não tocar permissões, eventos, concorrência,
  timeouts ou SHAs fora da única linha de runtime.
- **Suposição baseada no Node 24:** considerar o run atual somente evidência da
  falha; a aceitação depende de evidência nova no 22.18.0 e depois no GitHub.

## Rollback

Antes de qualquer commit autorizado, o rollback é reverter somente as quatro
mudanças técnicas da implementação proposta e seus documentos cronológicos.
Depois de eventual checkpoint, um rollback deve restaurar de forma coordenada
`engines.node`, o campo raiz do `package-lock.json`, o requisito do README e o
`node-version` do workflow. Não se deve rebaixar apenas a CI, pois isso recriaria
a divergência que causou a falha.

Se o Node 22.18.0 revelar nova incompatibilidade, não se deve mascará-la com
flags exclusivas do workflow. A implementação volta à Direção para escolher
entre uma versão mínima posterior comprovada e um executor direto com escopo de
dependências e scripts explicitamente aprovado.

## Risco e aprovação necessária

A correção de compatibilidade, isoladamente, seria reversível e não toca dados.
Entretanto, ela altera o contrato mínimo do projeto, o lockfile npm e o workflow
de uma Missão 8 já classificada como **Nível 3 - crítico**, ligada à integração
com GitHub e futura proteção da `main`. A classificação da missão deve ser
mantida.

É necessária **nova aprovação explícita da Direção** porque a autorização
anterior fixava Node `22.13.0` e vedava mudanças em `package.json`, lockfiles e
testes. Após implementação, continuam obrigatórias revisão independente,
aceitação humana, autorização separada para commit/push e autorização separada
para rerun, merge ou configuração de proteção da `main`.

## Decisão solicitada à Direção

Aprovar ou rejeitar a alteração coordenada para Node `22.18.0` nos quatro
arquivos técnicos listados, preservando scripts, dependências e todo o restante
do workflow. Nenhuma correção deve ser implementada antes dessa decisão.
