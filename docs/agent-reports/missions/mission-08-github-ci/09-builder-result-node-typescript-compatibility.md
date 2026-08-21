# Builder result: compatibilidade entre Node e TypeScript

**Data:** 2026-08-20

**Missão:** `mission-08-github-ci`

**Papel:** Builder

**Plano aprovado:** [`06-builder-plan-node-typescript-compatibility.md`](06-builder-plan-node-typescript-compatibility.md)

**Aprovações:** [`07-direction-node-compatibility-approval.md`](07-direction-node-compatibility-approval.md) e [`08-direction-lockfile-amendment.md`](08-direction-lockfile-amendment.md)

**Status:** Pronto para revisão independente, com limitação local preexistente do lint registrada

## Resultado

A correção coordenada para Node `22.18.0` foi implementada no checkout
canônico. O contrato mínimo em `package.json`, o campo raiz correspondente do
`package-lock.json`, o requisito do README e o runtime fixado no workflow agora
estão alinhados.

Com Node exatamente `v22.18.0`, a instalação determinística passou sem alterar
o lockfile, o build passou e a suíte completa executou e aprovou os 57 casos. Os
dois testes focados passaram com 14 casos cada, e os três entrypoints de
migração carregaram o grafo `.mjs` -> `.ts` sem executar acesso remoto.

O comando obrigatório `npm run lint` repetiu a limitação local já registrada na
primeira implementação da CI: ele percorre bundles gerados antigos sob o
diretório ignorado `work/` e falha com 5.188 erros nesses artefatos. Uma
execução diagnóstica que acrescentou somente `--ignore-pattern work` passou sem
diagnósticos. Nenhum arquivo ou configuração foi alterado para mascarar essa
limitação; no checkout limpo da primeira CI remota, o mesmo comando obrigatório
já havia passado.

## Cronologia da implementação

1. Foram confirmados `D:\Aplicativos\Modo Eixo App`, a branch
   `codex/mission-08-github-ci` e o runtime portátil oficial.
2. O primeiro intento, anterior à emenda 08, usou npm `10.9.3` para sincronizar
   o lockfile. Como o npm removeu metadados `libc` de pacotes opcionais, o
   Builder interrompeu e reverteu integralmente as quatro mudanças técnicas.
3. A Direção autorizou a edição manual exclusiva de
   `packages[""].engines.node`.
4. Foram aplicadas as quatro mudanças técnicas pontuais abaixo.
5. Uma comparação estrutural do lockfile comprovou que somente o campo raiz
   autorizado mudou.
6. `npm ci` foi executado com Node `v22.18.0`; o SHA-256 do lockfile permaneceu
   idêntico antes e depois.
7. Foram executados lint, suíte completa, testes focados, probes de importação,
   validação YAML, invariantes de segurança e verificações finais de higiene e
   escopo.

## Arquivos alterados

- `package.json`
  - `engines.node`: `>=22.13.0` -> `>=22.18.0`.
- `package-lock.json`
  - somente `packages[""].engines.node`: `>=22.13.0` -> `>=22.18.0`.
- `README.md`
  - requisito atualizado para Node `>=22.18.0`;
  - explicação curta de que testes e tooling local carregam módulos TypeScript
    diretamente pelo runtime.
- `.github/workflows/ci.yml`
  - somente `node-version`: `"22.13.0"` -> `"22.18.0"`.
- `docs/agent-reports/missions/mission-08-github-ci/README.md`
  - estado, cronologia e próximo handoff atualizados.
- `docs/agent-reports/missions/mission-08-github-ci/09-builder-result-node-typescript-compatibility.md`
  - este relatório cronológico e suas evidências.

Os documentos 06, 07 e 08 também permanecem sem commit na mesma sequência da
missão, como plano, aprovação e emenda que fundamentam este resultado.

## Conformidade de escopo

- nenhum script, dependência, versão de pacote ou integridade mudou;
- `pnpm-lock.yaml` e `pnpm-workspace.yaml` permaneceram sem diff;
- código em `app/`, banco em `db/`, scripts, testes, harnesses, `tsconfig.json`
  e configuração do ESLint permaneceram sem diff;
- não foram adicionados `tsx`, flags de TypeScript ou tratamento exclusivo da
  CI;
- gatilhos, permissões, SHAs, concorrência, timeouts, comandos, runner e strings
  de ambiente do workflow foram preservados;
- não houve acesso a Notion, D1 remoto, dados pessoais, secrets ou deploy;
- não houve commit, push, rerun, novo PR, merge ou alteração remota;
- o runtime portátil foi reutilizado e preservado no caminho autorizado, sem
  instalação global e sem remoção.

## Diff técnico exato

```diff
diff --git a/.github/workflows/ci.yml b/.github/workflows/ci.yml
@@
-          node-version: "22.13.0"
+          node-version: "22.18.0"

diff --git a/README.md b/README.md
@@
-- Node.js `>=22.13.0`;
+- Node.js `>=22.18.0`; essa versão mínima é necessária porque testes e tooling
+  local carregam módulos TypeScript diretamente pelo runtime;

diff --git a/package-lock.json b/package-lock.json
@@
-        "node": ">=22.13.0"
+        "node": ">=22.18.0"

diff --git a/package.json b/package.json
@@
-    "node": ">=22.13.0"
+    "node": ">=22.18.0"
```

Não há outra alteração técnica. O restante do diff pertence exclusivamente à
documentação cronológica da Missão 8.

## Validações executadas

### Runtime

Runtime reutilizado:

`C:\Users\taran\AppData\Local\Temp\shaft-node-22.18-validation-2d0549bfff0042c8ab3642c914fca3a0\node-v22.18.0-win-x64`

- `node --version`: `v22.18.0`;
- npm incluído no runtime: `10.9.3`;
- SHA-256 do ZIP oficial, verificado na preparação anterior:
  `c95d8a7e1c99e669cc08c9f1176e068c1f50847c37908fcb8c35b62482366511`.

### Lockfile antes da instalação

Comparação estrutural contra `HEAD:package-lock.json`:

- valor anterior: `>=22.13.0`;
- valor novo: `>=22.18.0`;
- todos os outros campos JSON: idênticos.

SHA-256 do lockfile depois da edição pontual:

`f0d01750cca81f02829ccb3f16392541004464d39f93513231c3aef9447241b4`

### Instalação determinística

Comando: `npm ci --no-audit --no-fund`

**Resultado:** aprovado; exit code 0; 471 pacotes instalados em aproximadamente
4 minutos. Foram emitidos somente os dois avisos de depreciação transitiva já
conhecidos para `@esbuild-kit/esm-loader` e `@esbuild-kit/core-utils`.

O SHA-256 do `package-lock.json` depois do comando permaneceu
`f0d01750cca81f02829ccb3f16392541004464d39f93513231c3aef9447241b4`.
Portanto, `npm ci` não alterou nenhum byte do lockfile.

### Lint obrigatório

Comando: `npm run lint`

**Resultado:** falhou; exit code 1; 5.188 erros e zero warnings.

Todos os diagnósticos pertencem aos bundles antigos sob
`work/shaft-package-95be33e7c0034edeb4acaed33be214ce/dist/`. Essa raiz:

- é ignorada por `.gitignore:43:/work/`;
- foi criada em 2026-08-06, antes da Missão 8;
- já havia produzido o mesmo resultado, com a mesma contagem, em
  [`03-builder-result-github-ci.md`](03-builder-result-github-ci.md);
- não existe no checkout limpo usado pela CI, onde o lint da primeira execução
  remota passou.

### Lint diagnóstico do código do checkout

Comando: `npm run lint -- --ignore-pattern work`

**Resultado:** aprovado; exit code 0; sem diagnósticos.

Essa prova não substitui nem oculta a falha do comando obrigatório. Ela apenas
isola a correção atual dos artefatos locais preexistentes, sem mudar scripts ou
configuração.

### Build e suíte completa

Comando: `npm test`

**Resultado:** aprovado; exit code 0.

- as cinco fases do `vinext build` passaram;
- os cinco arquivos oficiais foram carregados no Node `v22.18.0` sem
  `ERR_UNKNOWN_FILE_EXTENSION`;
- `tests 57`;
- `pass 57`;
- `fail 0`;
- `cancelled 0`;
- `skipped 0`;
- `todo 0`;
- duração TAP: `33882.5699 ms`.

### Testes focados

`npm run test:checkin-idempotency`:

- exit code 0;
- 14/14 aprovados;
- zero falhas, skips ou pendências;
- duração TAP: `8294.6611 ms`.

`npm run test:checkin-migration`:

- exit code 0;
- 14/14 aprovados;
- zero falhas, skips ou pendências;
- duração TAP: `4914.3876 ms`.

### Entry points de migração

Um processo Node `v22.18.0` importou, sem argumentos e sem executar os blocos
CLI principais:

- `scripts/checkin-migration/audit-checkins.mjs`;
- `scripts/checkin-migration/import-checkins-d1.mjs`;
- `scripts/checkin-migration/reconcile-checkins-d1.mjs`.

**Resultado:** os três imports foram aprovados. Não houve acesso a Notion, D1
remoto ou outro destino de rede.

### YAML e segurança do workflow

O arquivo foi analisado com `js-yaml` já presente na instalação e passou nas
asserções de estrutura e segurança:

- nome estável `CI`;
- somente `pull_request` e `push` para `main`;
- ausência de `pull_request_target`;
- `permissions: contents: read` e nenhuma permissão adicional;
- `CI: "true"` e `WRANGLER_SEND_METRICS: "false"` preservados como strings;
- concorrência e cancelamento preservados;
- runner `ubuntu-24.04`;
- timeout do job em 25 minutos e timeouts de 7, 5 e 15 minutos nos comandos;
- checkout sem credenciais persistidas;
- Node fixado em `"22.18.0"`;
- comandos de instalação, lint e teste inalterados;
- ausência de cache, artifact upload, environment, secrets e deploy;
- as duas Actions continuam fixadas por SHA completo.

Os SHAs foram revalidados por leitura remota das tags oficiais:

- `actions/checkout@v7.0.1` ->
  `3d3c42e5aac5ba805825da76410c181273ba90b1`;
- `actions/setup-node@v7.0.0` ->
  `820762786026740c76f36085b0efc47a31fe5020`.

### Higiene e escopo finais

- processos `wrangler`/`workerd` por nome: zero;
- processos Node relacionados a Wrangler, Workerd ou aos harnesses: zero;
- raízes `shaft-checkin-d1-*`: zero;
- raízes `shaft-checkin-migration-*`: zero;
- raízes `shaft-migration-artifacts-*`: zero;
- runtime portátil autorizado: preservado;
- `git diff --check`: aprovado, somente com avisos informativos de normalização
  LF/CRLF do Git no Windows;
- alterações rastreadas fora dos quatro arquivos técnicos e do índice da
  missão: zero;
- alterações em caminhos protegidos: zero.

## Limitações e riscos remanescentes

### Limitação local preexistente

`npm run lint` continua falhando neste checkout específico por analisar o
conteúdo antigo e ignorado de `work/`. A correção desta configuração, a remoção
desse conteúdo ou uma validação em outro checkout local limpo não fazia parte
da emenda autorizada. A evidência remota existente mostra o comando passando em
checkout limpo, e o lint diagnóstico atual passou no código do checkout.

### Evidência remota ainda pendente

Os resultados locais comprovam o contrato no Node `v22.18.0`, mas o workflow
alterado ainda não foi executado no GitHub. Rerun, push ou qualquer alteração do
PR permanece um gate humano separado.

### Suporte TypeScript nativo

O stripping do Node não faz type checking nem lê `tsconfig.json`. A suíte prova
o grafo atual; futura sintaxe TypeScript que exija transformação deve voltar à
Direção, sem solução exclusiva da CI.

## Handoff para o Reviewer

O Reviewer independente deve começar em modo somente leitura e verificar:

1. o plano 06, a aprovação 07 e a emenda 08;
2. que o lockfile difere somente em `packages[""].engines.node`;
3. que scripts, dependências, integridades, `pnpm-lock` e código não mudaram;
4. que o workflow difere somente no runtime e preserva todas as invariantes;
5. as evidências de Node `v22.18.0`, instalação, 57/57 testes, focados e imports;
6. a classificação transparente da falha local do lint e do diagnóstico verde;
7. processos, resíduos, diff e ausência de ações remotas;
8. se a implementação está apta a receber nova decisão da Direção sobre um
   futuro checkpoint e execução controlada no PR.

Este relatório não representa aprovação final, autorização para ação Git nem
autorização para repetir a CI.
