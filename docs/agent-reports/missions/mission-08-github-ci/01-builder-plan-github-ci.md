# Builder plan: GitHub CI

**Data:** 2026-08-20

**Missão:** `mission-08-github-ci`

**Classificação:** Nível 3 - crítico

**Papel:** Builder

**Estado:** Aguardando análise e aprovação humana

## 1. Objetivo e limite desta fase

O resultado futuro proposto é um único workflow de integração contínua que
execute instalação determinística, lint, build e todos os testes em pull
requests destinados à `main` e em pushes efetivamente integrados à `main`.

Esta fase produziu apenas investigação e plano. Não há autorização para criar
`.github/workflows/ci.yml`, alterar configurações remotas ou iniciar a
implementação após a entrega deste documento.

## 2. Fontes consultadas e proveniência

Foram lidos diretamente no checkout canônico sincronizado com a `main` remota:

- `AGENTS.md`;
- `docs/agent-workflow.md`;
- `docs/roadmap.md`;
- `README.md`;
- `docs/agent-reports/templates/builder-plan.md`;
- `docs/agent-reports/missions/mission-07-alpha-skeleton-consolidation/README.md`;
- `docs/agent-reports/missions/mission-07-alpha-skeleton-consolidation/05-direction-final-acceptance.md`;
- `package.json`, os lockfiles e os arquivos relevantes de testes e harnesses;
- os resultados e a revisão final aceitos da Missão 6.

A inspeção remota foi somente leitura, pela GitHub CLI/API, no repositório
`Hykaji/shaft`. A documentação oficial do GitHub foi consultada para segurança
de código não confiável, permissões, pinning, forks, concorrência, runners e
proteção de branch.

A primeira entrega deste plano ocorreu por engano em
`C:\Users\taran\AppData\Local\Temp\Rar$DRa27156.36118\Modo Eixo App`.
Essa extração temporária foi descartada como local de entrega e como fonte de
evidência técnica. O texto anterior foi usado somente como fonte provisória;
todas as afirmações abaixo foram revalidadas no checkout canônico e no GitHub
atual. Nenhuma nova alteração foi feita na extração temporária.

## 3. Evidências observadas

### 3.1 Checkout canônico e Git

Verificação realizada antes de qualquer escrita:

- diretório atual resolvido: `D:\Aplicativos\Modo Eixo App`;
- `git rev-parse --show-toplevel`: `D:\Aplicativos\Modo Eixo App`;
- branch: `main`;
- `HEAD`: `f43c3505ec01fcdaef0ac0509e138422813f93f9`;
- `refs/remotes/origin/main`: o mesmo SHA;
- `git ls-remote origin refs/heads/main`: o mesmo SHA;
- `f43c350` é ancestral de `HEAD` e não há commits posteriores locais;
- `git status --porcelain=v1 --branch`: `## main...origin/main`, sem entradas de
  arquivos; a árvore estava limpa;
- o executável `git` não estava no `PATH` desta sessão, então foi usado
  `C:\Users\taran\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe`;
- o repositório possui `.git` íntegro, Missão 7 aceita e os lockfiles npm e pnpm;
- `.github` está ausente no checkout canônico.

Existe `.env.local` ignorado pelo Git e seu conteúdo não foi lido. O único
arquivo `.env*` rastreado é `.env.example`. Nenhuma validação desta fase
carregou variáveis locais, iniciou Wrangler ou acessou Notion/D1 remoto. Não
foram observados processos `wrangler`/`workerd` nem raízes temporárias com os
prefixos dos harnesses ao fim da investigação.

### 3.2 Repositório e configurações remotas

Inspeção somente leitura realizada em 2026-08-20:

- repositório: `Hykaji/shaft`, público; branch padrão: `main`;
- SHA da `main`: `f43c3505ec01fcdaef0ac0509e138422813f93f9`;
- workflows registrados: zero; execuções de Actions: zero;
- `main`: `protected: false`; proteção clássica ausente (`Branch not
  protected`); rulesets e regras efetivas: zero;
- Actions habilitadas, com `allowed_actions: all`;
- exigência remota de SHA pinning desabilitada;
- permissão padrão do `GITHUB_TOKEN`: leitura;
- permissão para Actions aprovarem pull requests: desabilitada;
- aprovação de workflows de forks: `first_time_contributors`.

A política atual de forks não elimina a necessidade de revisão manual: um PR
externo pode alterar o workflow, scripts e dependências. A documentação oficial
recomenda inspecionar essas mudanças antes de aprovar a execução e informa que
runs aguardando aprovação por mais de 30 dias são removidas ([aprovação de runs
de forks](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/approve-runs-from-forks)).

### 3.3 Runtime, gerenciador e comandos reais

- `package.json`, `package-lock.json` e `README.md` exigem Node.js
  `>=22.13.0`.
- `@types/node` permanece na linha 22 (`22.19.19`). O plano fixa Node
  `22.13.0` para reproduzir o mínimo declarado, em vez de acompanhar uma major
  variável.
- A máquina da investigação usa Node `v24.19.0`; isso não muda o runtime
  canônico proposto e não constitui prova de Node 22.
- `package-lock.json` é lockfile npm v3 e sua raiz corresponde às dependências
  e versões exatas de `package.json`.
- `pnpm-lock.yaml` é lockfile v9 e existe `pnpm-workspace.yaml`, com store local
  e allowlist de builds.
- Os dois lockfiles e o workspace pnpm foram adicionados no mesmo commit
  histórico (`2927d33`). Não há campo `packageManager` em `package.json`, então
  a coexistência é uma ambiguidade real do repositório.
- README, quick start, comandos principais e o script `test` usam npm. A CI
  proposta deve usar `npm ci` e `package-lock.json`; os arquivos pnpm não serão
  removidos ou alterados nesta missão.
- `npm run lint` executa `eslint . --ignore-pattern dist --ignore-pattern
  .next`.
- `npm run build` executa `vinext build`.
- `npm test` executa primeiro o build e depois
  `node --test --test-concurrency=1` sobre os cinco arquivos oficiais.

### 3.4 Wrangler, D1 local e carga dos testes

- Os testes de idempotência e migração iniciam Workers pelo Wrangler `4.92.0`.
- Os harnesses chamam `node_modules/wrangler/bin/wrangler.js`; não fazem
  download dinâmico por `npx`.
- O D1 é exclusivamente local: comandos com `--local`, UUIDs fictícios,
  listeners em `127.0.0.1` e portas efêmeras.
- Configuração, logs, XDG e persistência ficam sob raízes temporárias com
  prefixos validados. Métricas são desativadas com
  `WRANGLER_SEND_METRICS=false`.
- Cada Worker dispõe de até 20 segundos para ficar saudável. O encerramento
  aguarda até 10 segundos e acrescenta 1,5 segundo antes do cleanup.
- O cleanup valida a raiz temporária e rejeita links ou reparse points antes da
  remoção recursiva. Falha de encerramento ou cleanup falha a suíte.
- `--test-concurrency=1` impede que os arquivos com Workers iniciem runtimes D1
  simultaneamente. O teste de idempotência envia rajadas de 2, 10 e 100
  requisições concorrentes contra um único Worker; não cria 100 processos.
- O teste financeiro simula até 100 páginas e 10.000 registros em memória. O
  Notion é mockado e o token do teste é sintético.
- A evidência aceita da Missão 6 registrou build e 57 testes aprovados, sem
  falha, cancelamento, skip ou pendência, e nenhum processo ou diretório
  temporário residual. A revisão independente registrou uma limitação ambiental
  anterior do sandbox ao iniciar Wrangler; ela não foi classificada como
  regressão do produto.

Não foi necessário executar `npm ci`, lint, build ou testes para esta correção
documental. A futura implementação deverá produzir evidência nova, inclusive no
Linux e em Node `22.13.0`.

## 4. Hipóteses a comprovar na implementação

- `ubuntu-24.04` comportará Vinext, Wrangler e D1 local sem diferenças
  relevantes em relação às validações anteriores no Windows.
- Node `22.13.0` resolverá e executará todas as dependências travadas sem
  depender de comportamento presente apenas no Node 24.
- Um job de 25 minutos, com até 15 minutos para `npm test`, será suficiente em
  runner frio.
- O runner padrão terá memória suficiente sem `NODE_OPTIONS` ou aumento de
  heap. Ainda não existe medição remota porque há zero execução.
- O encerramento normal dos harnesses será confiável no Linux. Se um timeout
  abrupto impedir hooks `after`, a VM efêmera será a última contenção.

O primeiro PR deverá medir duração e estabilidade. Mudança de runtime, timeout,
heap ou paralelismo exige novo registro e revisão; não será ajuste silencioso.

## 5. Riscos e preservação

### 5.1 Código não confiável e forks

Um PR externo pode alterar `package.json`, lockfiles, scripts, testes e o
workflow. `npm ci` também pode executar lifecycle scripts. O desenho deve:

- usar `pull_request`, nunca `pull_request_target`;
- não usar `workflow_run` privilegiado;
- não fornecer secrets, variáveis pessoais, PAT, Cloudflare, Notion ou D1;
- declarar `permissions: contents: read`;
- usar checkout sem credenciais persistidas e runner GitHub-hosted efêmero;
- não interpolar título, branch, autor ou outro campo do PR em shell;
- exigir revisão manual de `.github/workflows/`, `package.json` e lockfiles
  antes de aprovar runs de forks.

O GitHub documenta que workflows de forks podem receber token somente leitura
e nenhum secret, e alerta sobre o contexto privilegiado de
`pull_request_target` ([configurações de Actions](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository)).
A política futura de exigir aprovação de todos os contribuidores externos é
mudança remota separada.

### 5.2 Supply chain das Actions

O workflow deve se limitar a duas Actions oficiais, fixadas por SHA completo e
com comentário da versão auditada:

- `actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1`
  (`v7.0.1`, verificado em 2026-08-20);
- `actions/setup-node@820762786026740c76f36085b0efc47a31fe5020`
  (`v7.0.0`, verificado em 2026-08-20).

Os SHAs foram conferidos por `git ls-remote` diretamente nos repositórios
oficiais e devem ser conferidos novamente imediatamente antes da implementação.
SHA completo é a única referência imutável para Actions segundo a
[referência de uso seguro](https://docs.github.com/en/actions/reference/security/secure-use).
Tags flutuantes não são aceitas. Exigir SHA nas configurações remotas continua
fora desta implementação.

### 5.3 Memória, timeout, concorrência e processos

- Build e testes não serão paralelos no mesmo job.
- `npm test` preservará `--test-concurrency=1`; a CI não substituirá o comando.
- Não haverá matriz de Node ou sistema operacional nesta primeira versão.
- Job: 25 minutos; instalação: 7; lint: 5; suíte: 15.
- `cancel-in-progress: true` substituirá somente uma run obsoleta do mesmo PR ou
  ref, conforme a [semântica de concorrência](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax).
- Não haverá `pkill`, cleanup recursivo amplo ou varredura destrutiva. Os
  harnesses já fazem cleanup validado.
- Memória será observada antes de considerar `NODE_OPTIONS`.

### 5.4 Cache e artefatos

Cache não é necessário na primeira versão: melhora velocidade, não correção, e
amplia a superfície de supply chain. O plano não habilita cache em
`setup-node`, não usa `actions/cache` e não faz upload de artefatos.

Após medições, um ajuste revisado poderá avaliar apenas o cache de downloads do
npm, nunca `node_modules`, com chave derivada de `package-lock.json` e análise
de forks. O limite padrão documentado é 10 GB por repositório
([cache de dependências](https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching)).

### 5.5 Check obrigatório e bloqueio indevido

Criar o workflow e exigir seu check na `main` são mudanças diferentes. O
workflow inicial não terá filtros de paths, pois um workflow ignorado pode
deixar um requisito pendente.

Nomes reservados:

- workflow: `CI`;
- job: `Lint, build and tests`;
- check esperado: `CI / Lint, build and tests`.

O nome deve ser único: nomes ambíguos entre workflows podem bloquear merge
([branches protegidas](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)).
O check só poderá ser exigido depois de runs recentes verdes e de aprovação
humana específica; o GitHub exige sucesso recente no repositório, dentro da
janela documentada de sete dias ([troubleshooting de checks obrigatórios](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks)).

## 6. Implementação futura proposta

### 6.1 Escopo exato

Criar somente `.github/workflows/ci.yml`. Não alterar `package.json`,
`package-lock.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, testes ou
harnesses para acomodar a CI.

### 6.2 Desenho exato do workflow

- `name: CI`.
- Gatilhos: `pull_request` e `push`, ambos com `branches: [main]`.
- Não usar `pull_request_target`, `workflow_run`, `schedule`,
  `workflow_dispatch`, tags ou paths.
- Concorrência no workflow com grupo único por workflow e PR/ref, por exemplo
  `ci-${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}`,
  e `cancel-in-progress: true`.
- `permissions: contents: read` no nível do workflow.
- Um job de ID `quality`, nome `Lint, build and tests`.
- `runs-on: ubuntu-24.04`, sem matriz, container ou self-hosted runner.
- `timeout-minutes: 25` no job.
- Ambiente não sensível: `CI: true` e `WRANGLER_SEND_METRICS: "false"`.

Etapas, em ordem:

1. `actions/checkout` pelo SHA completo, com `persist-credentials: false`.
2. `actions/setup-node` pelo SHA completo, `node-version: 22.13.0`, sem cache.
3. `npm ci --no-audit --no-fund`, timeout de 7 minutos.
4. `npm run lint`, timeout de 5 minutos.
5. `npm test`, timeout de 15 minutos.

Não executar `npm run build` separadamente: `npm test` já começa pelo build e
mantém seu log e código de saída visíveis e bloqueadores.

O runner padrão `ubuntu-24.04` é uma VM nova hospedada pelo GitHub e seu uso é
gratuito enquanto o Shaft permanecer público
([runners hospedados](https://docs.github.com/en/actions/reference/runners/github-hosted-runners)).
Runners maiores permanecem fora do plano e podem ser cobrados.

## 7. Validação futura

### 7.1 Antes de editar

- usar checkout Git canônico, íntegro, limpo e sincronizado com a `main`;
- revalidar HEAD, configurações remotas e SHAs das Actions;
- não carregar `.env.local`, credenciais ou variáveis do produto;
- confirmar que o diff inicial está vazio.

### 7.2 Validação local da implementação

1. Confirmar que somente o workflow e relatórios autorizados pertencem à missão.
2. Validar a sintaxe YAML sem instalar dependência no projeto.
3. Executar `npm ci --no-audit --no-fund` a partir do lockfile npm.
4. Executar `npm run lint`.
5. Executar `npm test` e confirmar que `vinext build` passou.
6. Exigir zero falha, cancelamento, skip ou pendência.
7. Confirmar ausência de `wrangler`/`workerd` e de raízes temporárias dos
   harnesses.
8. Revisar o diff novamente para detectar alterações produzidas pelos comandos.

Se Linux não estiver disponível localmente, registrar a limitação e tratar a
primeira run do GitHub como prova obrigatória de Linux.

### 7.3 Primeira execução controlada no GitHub

Após autorização de implementação, revisão do diff e autorizações Git
separadas:

1. criar branch dedicada a partir da `main` atualizada;
2. abrir PR controlado, sem tornar o novo check obrigatório;
3. revisar YAML renderizado e SHAs antes da run;
4. observar instalação fria, lint, build, testes, duração e Wrangler;
5. inspecionar logs por dados pessoais, tokens e acesso remoto indevido;
6. repetir uma vez para procurar flakiness;
7. obter revisão independente de Nível 3 sobre diff, logs e handoff;
8. só após aprovação e autorização de merge, observar a run de `push` na
   `main`.

O workflow permanecerá informativo, não obrigatório, nesse período.

## 8. Critérios objetivos de aceitação futura

- Somente `.github/workflows/ci.yml` é criado no escopo técnico; nenhum código,
  dependência ou lockfile muda.
- Gatilhos limitados a `pull_request` e `push` para `main`, sem
  `pull_request_target`.
- `permissions: contents: read`, sem escrita, secrets, environments, recurso
  remoto do produto, deploy, cache ou artefatos.
- Actions oficiais fixadas pelos SHAs revisados; checkout sem credenciais.
- Node `22.13.0`; instalação por `npm ci` e `package-lock.json`.
- Check exatamente `CI / Lint, build and tests`.
- PR controlado e uma repetição passam lint, build e todos os testes sem flake.
- Não há dado pessoal nos logs nem processo reutilizável entre runs.
- Reviewer independente aprova e a Direção dá aceitação final.
- A proteção da `main` permanece inalterada até decisão posterior explícita.

## 9. Rollback e recuperação de bloqueio

Enquanto o check não for obrigatório, a contenção é desabilitar o workflow na
interface; a correção ou reversão de `.github/workflows/ci.yml` exige PR e
autorizações Git separadas.

Se uma fase posterior já tiver tornado o check obrigatório e ele bloquear PRs
incorretamente:

1. confirmar que a falha pertence à automação, não ao código;
2. por decisão administrativa explícita, retirar temporariamente somente
   `CI / Lint, build and tests` dos requisitos ou usar bypass aprovado;
3. reverter ou corrigir o workflow por PR revisado;
4. obter runs verdes recentes;
5. reativar o requisito em mudança separada e auditável.

Desabilitar um workflow já obrigatório pode deixar seu check pendente para
sempre; por isso implementação e proteção da `main` são fases separadas.

## 10. Exclusões explícitas desta fase

- não criar `.github/workflows/ci.yml`;
- não alterar código, testes, scripts, schema, migrações ou documentação fora
  dos dois arquivos desta Missão 8;
- não instalar ou atualizar dependências e não alterar lockfiles;
- não escolher pnpm nem remover seus arquivos;
- não acessar Notion, dados pessoais, D1 remoto ou segredos;
- não criar credenciais, environments, cache, artifacts ou runner;
- não fazer deploy, publicação ou migração;
- não alterar Actions Settings, rulesets ou proteção da `main`;
- não criar ou trocar branch, commit, push, PR ou merge;
- não adicionar matriz, outros sistemas, múltiplos Nodes, coverage, CodeQL,
  Dependabot, release, deploy ou auto-merge;
- não iniciar implementação automaticamente após a análise.

## 11. Decisões que dependem da Direção

1. Aprovar ou ajustar npm/`package-lock.json` e Node `22.13.0`.
2. Aprovar ou ajustar job único e nome `CI / Lint, build and tests`.
3. Aprovar gatilhos, timeouts, concorrência, ausência inicial de cache e SHAs.
4. Autorizar separadamente a futura criação de `.github/workflows/ci.yml`;
   aprovação deste plano não autoriza Git.
5. Autorizar separadamente branch, commit, push e PR.
6. Após runs verdes e revisão independente, decidir separadamente merge e,
   depois, proteção da `main`.
7. Decidir futuramente se o GitHub deve restringir Actions, exigir SHA e exigir
   aprovação de todos os contribuidores externos.

## 12. Pedido de aprovação

Solicita-se somente a análise humana deste plano. Qualquer aprovação deve
registrar o escopo técnico autorizado e manter separadas implementação, ações
Git, primeira execução, merge e proteção da `main`.

**O Builder para aqui. Nenhuma parte da automação foi implementada.**
