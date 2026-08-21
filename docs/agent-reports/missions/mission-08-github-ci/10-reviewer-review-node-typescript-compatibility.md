# Reviewer review: compatibilidade entre Node e TypeScript

**Data:** 2026-08-20

**Missão:** `mission-08-github-ci`

**Papel:** Reviewer independente

**Resultado do Builder revisado:**
[`09-builder-result-node-typescript-compatibility.md`](09-builder-result-node-typescript-compatibility.md)

**Tipo de revisão:** Somente leitura para arquivos técnicos, exceto pela
criação deste relatório e pela entrada cronológica mínima no índice da missão

## Escopo e evidências revisados

Foram enumerados e lidos integralmente os dez arquivos que existiam na pasta da
missão antes desta revisão:

1. [`README.md`](README.md);
2. [`01-builder-plan-github-ci.md`](01-builder-plan-github-ci.md);
3. [`02-direction-implementation-approval.md`](02-direction-implementation-approval.md);
4. [`03-builder-result-github-ci.md`](03-builder-result-github-ci.md);
5. [`04-reviewer-review-github-ci.md`](04-reviewer-review-github-ci.md);
6. [`05-direction-local-acceptance.md`](05-direction-local-acceptance.md);
7. [`06-builder-plan-node-typescript-compatibility.md`](06-builder-plan-node-typescript-compatibility.md);
8. [`07-direction-node-compatibility-approval.md`](07-direction-node-compatibility-approval.md);
9. [`08-direction-lockfile-amendment.md`](08-direction-lockfile-amendment.md);
10. [`09-builder-result-node-typescript-compatibility.md`](09-builder-result-node-typescript-compatibility.md).

Também foram lidos integralmente `AGENTS.md`, `docs/agent-workflow.md`, o
template `docs/agent-reports/templates/reviewer-review.md`, `package.json`, o
`README.md` da raiz e `.github/workflows/ci.yml`. O `package-lock.json` inteiro
foi carregado como JSON válido e comparado recursivamente com
`HEAD:package-lock.json`, sem normalizar ou regravar o arquivo.

A revisão usou apenas comandos não mutantes: `git status`, `branch`, `rev-parse`,
`log`, `diff`, `show`, `ls-files`, `check-ignore` e `ls-remote`; parsing local de
JSON e YAML; hashes; inspeção de processos e diretórios temporários; e consultas
remotas somente leitura pela GitHub CLI/API. Não foram executados `npm ci`,
lint, build, testes, imports de módulos, checkout, commit, push, rerun, merge ou
mudança de configuração.

O baseline técnico observado é o commit `44b9e521b3cedf60dc2933db5313c2b5286deaf5`,
que é simultaneamente `HEAD`, o upstream local e a ponta remota de
`codex/mission-08-github-ci`. A correção Node/TypeScript está no worktree, ainda
sem commit, como descrito no resultado 09.

## Avaliação executiva

A implementação respeita o plano 06, a aprovação 07 e a emenda 08. As quatro
mudanças técnicas são exatamente as autorizadas: o contrato Node do manifesto
e da raiz do lockfile, o requisito e a justificativa curta no README e a versão
Node do workflow. Scripts, dependências, versões, integridades, lockfile pnpm,
código, testes e harnesses permaneceram intactos.

O workflow continua limitado a código não confiável de PR em runner hospedado
e efêmero, com token somente leitura, sem credenciais persistidas, secrets,
cache, artefatos, environment ou deploy. As evidências do Builder para Node
`v22.18.0`, instalação, build, 57/57 testes, testes focados e imports são
coerentes com o diff e suficientes para esta etapa local, mas não foram
reexecutadas pelo Reviewer porque esses comandos podem escrever no workspace.

## Achados

### [Observation] O diff técnico corresponde integralmente ao escopo autorizado

- **Evidência:** `git diff HEAD` mostra uma linha alterada em `package.json`,
  uma em `package-lock.json`, uma em `.github/workflows/ci.yml` e a atualização
  de duas linhas para uma explicação curta no README. `package.json:6`,
  `package-lock.json:40`, `README.md:47-48` e `.github/workflows/ci.yml:35`
  estão alinhados em `22.18.0`. Os documentos 06, 07, 08 e 09 permanecem locais
  na ordem cronológica esperada.
- **Impacto:** o contrato mínimo do projeto e o runtime reproduzível da CI não
  divergem mais; não foi introduzida solução exclusiva do workflow.
- **Ação exigida:** nenhuma. O achado é não bloqueador e confirma aderência ao
  plano e às duas decisões humanas.

### [Observation] O lockfile difere somente no campo raiz autorizado

- **Evidência:** a comparação recursiva entre o JSON integral do worktree e
  `HEAD:package-lock.json` encontrou exatamente uma diferença:
  `packages[""].engines.node`, de `>=22.13.0` para `>=22.18.0`. O diff textual é
  igualmente de uma linha. O arquivo continua sendo lockfile v3, com 651
  entradas em `packages`, 644 campos `integrity` e SHA-256
  `f0d01750cca81f02829ccb3f16392541004464d39f93513231c3aef9447241b4`, igual
  ao valor registrado pelo Builder depois de `npm ci`.
- **Impacto:** não houve churn de metadados, versões ou integridades; a edição
  pontual autorizada pela emenda 08 foi observada exatamente.
- **Ação exigida:** nenhuma.

### [Observation] Scripts, dependências, código e lockfile pnpm foram preservados

- **Evidência:** a comparação estrutural de `package.json` contra `HEAD` aponta
  somente `engines.node`; os blocos `scripts`, `dependencies` e
  `devDependencies` são idênticos. `git diff --name-status HEAD` lista somente
  os quatro arquivos técnicos autorizados e o índice da missão. Não existe diff
  em `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `app/`, `db/`, `scripts/`,
  `tests/`, harnesses, `tsconfig.json` ou configuração do ESLint. `git diff
  --check` terminou sem erro, além dos avisos informativos de normalização
  LF/CRLF no Windows.
- **Impacto:** a correção não altera comportamento de aplicação, dependências,
  testes ou tooling além do requisito mínimo de runtime.
- **Ação exigida:** nenhuma.

### [Observation] Todas as invariantes de segurança do workflow foram preservadas

- **Evidência:** o YAML foi carregado com sucesso pelo `js-yaml` já instalado.
  O diff do workflow contém somente `node-version`. Permanecem apenas os eventos
  `pull_request` e `push` para `main`; `permissions: contents: read`; runner
  `ubuntu-24.04`; concorrência por workflow e PR/ref com cancelamento; timeouts
  25/7/5/15; strings `CI: "true"` e `WRANGLER_SEND_METRICS: "false"`; checkout
  com `persist-credentials: false`; e os comandos `npm ci --no-audit --no-fund`,
  `npm run lint` e `npm test`. Não há `pull_request_target`, `workflow_run`,
  cache, upload de artefatos, secrets, environment, runner próprio ou deploy.
  Consultas `git ls-remote` aos repositórios oficiais confirmaram novamente
  `actions/checkout@v7.0.1` no SHA
  `3d3c42e5aac5ba805825da76410c181273ba90b1` e
  `actions/setup-node@v7.0.0` no SHA
  `820762786026740c76f36085b0efc47a31fe5020`.
- **Impacto:** elevar o runtime não ampliou permissões, superfície remota nem a
  capacidade de um PR executar código privilegiado.
- **Ação exigida:** nenhuma.

### [Observation] As validações de Node 22.18.0 são evidência do Builder, não reprodução do Reviewer

- **Evidência:** o resultado 09 registra Node `v22.18.0`, npm `10.9.3`, `npm ci`
  com 471 pacotes e lockfile byte a byte estável, build aprovado, 57/57 testes,
  dois testes focados com 14/14 cada e imports aprovados dos três entrypoints de
  migração sem efeitos remotos. O SHA-256 atual do lockfile coincide com o hash
  anterior e posterior ao `npm ci` registrado no handoff. A inspeção atual
  encontrou zero processo `wrangler`/`workerd` e zero raiz temporária com os
  prefixos `shaft-checkin-d1-*`, `shaft-checkin-migration-*` e
  `shaft-migration-artifacts-*`.
- **Impacto:** repetir instalação, build, testes ou imports poderia alterar
  `node_modules`, outputs, caches ou diretórios temporários, contrariando a
  restrição expressa desta revisão. Assim, os códigos de saída e contagens
  permanecem evidência documental do Builder; a comparação estática não revelou
  contradição, e a higiene atual reforça, mas não reproduz, o cleanup imediato.
- **Ação exigida:** nenhuma para este veredito local. A primeira execução do
  workflow já corrigido no GitHub continua sendo um gate posterior e separado.

### [Observation] A falha local do lint continua ambiental e não bloqueia a correção

- **Evidência:** `.gitignore:43` ignora `/work/`; `git check-ignore` confirma a
  regra sobre `work/shaft-package-95be33e7c0034edeb4acaed33be214ce/dist`, e
  `git ls-files -- work` retorna zero arquivo. O pacote local existe desde
  `2026-08-06T01:06:36-03:00`, antes da Missão 8. Os resultados 03 e 09
  registram a mesma falha de 5.188 erros exclusivamente nesse bundle e lint
  diagnóstico verde com `--ignore-pattern work`. Independentemente, a API do
  GitHub mostra que a etapa `Lint` da run original `32424408307` passou no
  checkout remoto limpo; o log confirma `npm run lint` antes do build e da
  falha TypeScript no Node 22.13.0.
- **Impacto:** a falha do checkout local contaminado não indica regressão da
  correção Node/TypeScript nem falha esperada na CI limpa. O Reviewer não
  repetiu nenhum dos dois lints porque a instrução atual proíbe comandos que
  possam escrever ou produzir estado no workspace.
- **Ação exigida:** nenhuma nesta missão. A evidência combinada é suficiente
  para tratar o lint local como observação não bloqueadora.

### [Observation] Nenhuma entrega Git ou ação remota adicional foi observada

- **Evidência:** a branch local é `codex/mission-08-github-ci`; `HEAD`, upstream
  e `git ls-remote origin refs/heads/codex/mission-08-github-ci` permanecem em
  `44b9e521b3cedf60dc2933db5313c2b5286deaf5`. O PR 2 está aberto, possui somente
  esse commit, não tem merge commit nem `mergedAt`, e sua ponta remota é o mesmo
  SHA. A listagem de runs do workflow na branch contém somente a run
  `32424408307`, tentativa 1, concluída em falha; não há rerun. A `main`
  permanece em `f43c3505ec01fcdaef0ac0509e138422813f93f9`, não protegida, sem
  rulesets; as permissões atuais de Actions continuam `allowed_actions: all`,
  `sha_pinning_required: false`, token padrão de leitura e Actions sem permissão
  para aprovar PRs.
- **Impacto:** não há evidência de commit adicional, push da correção, rerun,
  merge ou configuração remota atual divergente do estado documentado antes da
  implementação. Consultas de estado atual não constituem um log histórico de
  toda eventual edição e reversão administrativa, mas não há sinal de tal ação
  nem mudança efetiva.
- **Ação exigida:** nenhuma. Commit, push, rerun, merge e proteção da `main`
  permanecem gates humanos separados.

Não foram identificados achados Critical, High, Medium ou Low, nem violação de
escopo.

## Avaliação da validação

O Reviewer reproduziu integralmente as comparações de diff e lockfile, o parsing
do YAML, as invariantes de segurança, o pinning remoto das Actions, a ausência
de diff nos caminhos protegidos, a condição ignorada de `work/`, o estado atual
do checkout, da branch, do PR, da run e das configurações remotas consultadas.

Não foram repetidos Node `v22.18.0`, `npm ci`, build, suíte completa, testes
focados, imports ou lint, porque qualquer um deles poderia escrever no
workspace. Essa limitação impede uma segunda execução independente dos
resultados dinâmicos, mas seu impacto é não bloqueador: o handoff fornece
comandos, versões, contagens e hashes específicos; as evidências estáticas e
remotas são consistentes; e não foi encontrada alteração fora do escopo que
pudesse invalidá-los. A execução do workflow corrigido no GitHub ainda deve ser
autorizada e revisada em gate separado.

## Handoff final

A correção local pode seguir para decisão humana. Este parecer não autoriza
commit, push, alteração do PR, rerun, merge, proteção da `main`, publicação ou
qualquer configuração remota.

## Verdict

Approved with non-blocking observations
