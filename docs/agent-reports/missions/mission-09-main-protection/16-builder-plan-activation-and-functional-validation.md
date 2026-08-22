# Builder plan: ativação e validação funcional da proteção da main

**Data:** 2026-08-21

**Missão:** `mission-09-main-protection`

**Papel:** Builder

**Classificação:** Nível 3 - crítico

**Status:** aguardando análise e aprovação humana; nenhuma ação Git ou remota
autorizada

**Direção revisada:**
[`15-direction-correction-technical-acceptance.md`](15-direction-correction-technical-acceptance.md)

## Objetivo

Preparar a ativação recuperável do ruleset `Protect main`, ID `21151016`, e
uma validação funcional segura usando uma branch documental, um PR real e a CI
existente. O plano mantém como gates separados branch, checkpoint, push,
ativação, PR, observação da CI, revisão independente, aceitação humana e merge.

Esta etapa executou somente leituras locais, reconstrução do estado Git,
consultas remotas `GET` e pesquisa documental. Foram criados somente este plano
e a entrada mínima no README da missão.

## Fontes inspecionadas

Foram lidos integralmente:

- `AGENTS.md` e `docs/agent-workflow.md`;
- os documentos cronológicos 01 a 15 e o README da Missão 9;
- os documentos pendentes da Missão 8;
- `docs/agent-reports/README.md`;
- `docs/roadmap.md`;
- `.github/workflows/ci.yml`;
- o template de plano do Builder.

Também foram inspecionados o índice e as referências em `.git`, o tree remoto
do mesmo commit, o ruleset, as regras efetivas, branches, PRs, histórico,
workflow, check-runs e configurações relevantes do repositório.

## Estado Git atual completo

### Limitação da ferramenta e método de reconstrução

O executável `git` não está instalado ou disponível no `PATH` desta sessão.
Nenhum comando Git mutante foi tentado. O estado foi reconstruído em somente
leitura por três fontes independentes:

1. `.git/HEAD`, refs locais/remotas e índice Git v2;
2. tree remoto do commit `310170674d8de6eac8b2746536470c7e51944ffc`;
3. hashes Git blob do conteúdo local, com comparação adicional após
   normalização CRLF → LF.

O índice possui 160 entradas e é estruturalmente igual ao tree do `HEAD`:
**zero mudanças staged**. A comparação semântica encontrou exatamente três
arquivos rastreados modificados. Outros 35 arquivos têm apenas representação
CRLF no worktree e recompõem exatamente o blob do índice após normalização;
isso inclui `.github/workflows/ci.yml`, código, configurações e os documentos
01 a 14 da Missão 8. Eles não constituem mudança de conteúdo.

Como o binário Git está ausente, uma futura implementação deve começar
obrigatoriamente com `git status`, `git diff` e `git diff --cached`. Se o Git
real reportar qualquer caminho além do inventário abaixo, parar antes de criar
branch ou commit.

### Referências e operações em andamento

- branch atual: `main`;
- `HEAD`: `310170674d8de6eac8b2746536470c7e51944ffc`;
- `origin/main` local: mesmo SHA;
- divergência conhecida entre `HEAD` e `origin/main`: zero;
- staged: nenhum;
- merge, rebase, cherry-pick, revert ou bisect em andamento: nenhum;
- branches locais adicionais preservadas:
  `codex/mission-08-github-ci` e
  `codex/publish-approved-shaft-missions`;
- remoto `origin`: `https://github.com/Hykaji/shaft.git`;
- submódulos registrados: nenhum.

### Mudanças rastreadas materiais

#### Missão 8

1. `docs/agent-reports/missions/mission-08-github-ci/README.md`
   - status passa de tecnicamente aprovado/merge pendente para concluído,
     integrado e verificado;
   - acrescenta o documento 15;
   - substitui o próximo passo pendente pelo encerramento factual da missão.
2. `docs/roadmap.md`
   - altera somente o critério da suíte crítica automatizada de `[ ]` para
     `[x]`, consequência já aceita da Missão 8;
   - não declara a proteção da Missão 9 concluída.

#### Arquivo compartilhado entre Missões 8 e 9

3. `docs/agent-reports/README.md`
   - adiciona a entrada concluída da Missão 8;
   - adiciona uma entrada ainda antiga da Missão 9, dizendo que a investigação
     inicial está pendente.

Antes de um futuro checkpoint, a entrada da Missão 9 nesse índice compartilhado
deve receber uma correção local mínima e factual: correção do campo aceita,
ruleset ainda `disabled` e ativação/validação pendentes. Não deve afirmar
proteção ativa ou missão concluída.

### Arquivos não rastreados antes deste plano

#### Missão 8

1. `docs/agent-reports/missions/mission-08-github-ci/15-direction-merge-completion.md`

#### Missão 9

1. `docs/agent-reports/missions/mission-09-main-protection/01-direction-brief-main-protection.md`
2. `docs/agent-reports/missions/mission-09-main-protection/02-builder-plan-main-protection.md`
3. `docs/agent-reports/missions/mission-09-main-protection/03-direction-disabled-ruleset-approval.md`
4. `docs/agent-reports/missions/mission-09-main-protection/04-builder-result-disabled-ruleset.md`
5. `docs/agent-reports/missions/mission-09-main-protection/05-direction-blocker-unattributed-approval.md`
6. `docs/agent-reports/missions/mission-09-main-protection/06-builder-plan-unattributed-approval.md`
7. `docs/agent-reports/missions/mission-09-main-protection/07-direction-unattributed-approval-fix-approval.md`
8. `docs/agent-reports/missions/mission-09-main-protection/08-builder-result-unattributed-approval-fix.md`
9. `docs/agent-reports/missions/mission-09-main-protection/09-reviewer-review-unattributed-approval-fix.md`
10. `docs/agent-reports/missions/mission-09-main-protection/10-direction-diagnostic-investigation-approval.md`
11. `docs/agent-reports/missions/mission-09-main-protection/11-builder-plan-invalid-request-diagnosis.md`
12. `docs/agent-reports/missions/mission-09-main-protection/12-direction-corrected-put-approval.md`
13. `docs/agent-reports/missions/mission-09-main-protection/13-builder-result-corrected-unattributed-approval-fix.md`
14. `docs/agent-reports/missions/mission-09-main-protection/14-reviewer-review-corrected-unattributed-approval-fix.md`
15. `docs/agent-reports/missions/mission-09-main-protection/15-direction-correction-technical-acceptance.md`
16. `docs/agent-reports/missions/mission-09-main-protection/README.md`

Este plano acrescenta como décimo sétimo caminho da Missão 9:
`16-builder-plan-activation-and-functional-validation.md`. Depois desta entrega,
o total não rastreado esperado é 18 arquivos: um da Missão 8 e 17 da Missão 9.

### Alterações não relacionadas

Nenhuma alteração material não relacionada foi encontrada. Código, workflow,
testes, dependências, lockfile e configurações têm conteúdo igual ao índice.
Em particular, `.github/workflows/ci.yml` está semanticamente limpo e não deve
ser staged, reformatado ou regravado.

## Documentos pendentes da Missão 8

Os itens pendentes são exclusivamente documentais e já descrevem fatos
aceitos:

- `15-direction-merge-completion.md`: PR 2 integrado pelo merge commit
  `310170674d8de6eac8b2746536470c7e51944ffc`, run de push `32488539006`,
  Node `22.18.0` e 57/57 testes;
- README da Missão 8: status final, item 15 e encaminhamento da proteção para a
  Missão 9;
- índice geral: entrada da Missão 8 concluída;
- roadmap: suíte crítica automatizada marcada como comprovada.

Esses documentos oferecem um diff real, seguro e não deliberadamente quebrado
para o PR de validação da Missão 9. Eles não reabrem a Missão 8 nem alteram o
workflow.

## Estado remoto atual

Consulta `GET` em 2026-08-21:

- repositório `Hykaji/shaft`, público, branch padrão `main`, conta com admin;
- `main`: `310170674d8de6eac8b2746536470c7e51944ffc`;
- PRs abertos: zero;
- branches remotas: `main`, `codex/mission-08-github-ci` e
  `codex/publish-approved-shaft-missions`;
- branch proposta neste plano ainda não existe;
- exatamente um ruleset: `Protect main`, ID `21151016`;
- target `branch`, include somente `~DEFAULT_BRANCH`, bypass vazio;
- `enforcement: disabled` e zero regras efetivas sobre `main`;
- `current_user_can_bypass: never`;
- quatro regras configuradas: `deletion`, `pull_request`,
  `required_status_checks` e `non_fast_forward`;
- `required_approving_review_count: 0`, `required_reviewers: []` e
  `require_extra_approval_for_unattributed_changes: false`;
- métodos da regra: `merge`, `squash` e `rebase`;
- required check `Lint, build and tests`, integração GitHub Actions ID `15368`;
- strict desabilitado;
- histórico: versões `47244358` e `47225866`;
- proteção clássica ausente e `main.protected: false`;
- workflow `CI`, ID `338958578`, ativo;
- merge commit, squash e rebase habilitados no repositório;
- auto-merge e exclusão automática de branch desabilitados.

## Risco de retorno à visibilidade privada

A documentação oficial informa que rulesets estão disponíveis em repositórios
públicos no GitHub Free, mas em repositórios privados somente com GitHub Pro,
Team ou Enterprise Cloud. O endpoint autenticado não revelou um plano que
permita afirmar suporte privado.

Fonte oficial:
[About rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets).

Portanto:

- revalidar `visibility: public` antes da criação da branch, antes do push,
  imediatamente antes da ativação, antes de abrir o PR e antes do merge;
- se o repositório estiver privado antes da ativação, parar sem push adicional,
  `PUT` ou PR e retornar à Direção para validar plano e custos de Actions;
- se ficar privado depois da ativação, executar o rollback aprovado para
  `disabled`, confirmar zero regras efetivas e parar;
- não assumir que a existência do ruleset garante enforcement em um plano que
  não suporte rulesets privados;
- não tornar o repositório público nem alterar o plano da conta como correção
  automática.

## Ordem recomendada e gates separados

| Gate | Ação | Condição para avançar |
| --- | --- | --- |
| 0 | Direção aprova este plano e cria o registro de autorização | autorização explícita para cada fronteira material |
| 1 | Disponibilizar Git e repetir inventário somente leitura | status coincide exatamente; nenhuma mudança alheia |
| 2 | Criar branch local | `main`, `HEAD` e `origin/main` no SHA esperado; repo público |
| 3 | Alinhar minimamente o índice geral e criar checkpoint commit | somente os caminhos aprovados estão staged; validação local passa |
| 4 | Push da branch, sem force | branch remota nova aponta exatamente para o checkpoint |
| 5 | Revalidar GitHub e ativar somente o enforcement | snapshot integral igual, campo corrigido ainda `false` |
| 6 | Readback e regras efetivas | única mudança é `disabled` → `active`; quatro regras efetivas corretas |
| 7 | Abrir PR real em draft | base `main`, head exata, diff somente documental |
| 8 | Observar CI automática | check correto da App `15368`; sem rerun e sem commit quebrado |
| 9 | Tornar o PR ready e validar mergeabilidade | CI verde, zero reviews e GitHub indica merge possível |
| 10 | Builder entrega resultado | evidências completas, sem declarar aceitação final |
| 11 | Reviewer independente revisa em somente leitura | veredito `Approved` ou `Approved with non-blocking observations` |
| 12 | Direção dá aceitação humana e autorização específica de merge | head, CI, ruleset e relatório aceitos |
| 13 | Merge por merge commit | comando único autorizado, sem exclusão da branch |
| 14 | Observar CI de push e fazer fechamento documental | push CI verde; ruleset continua ativo e campo `false` |

Essa ordem prepara e publica a branch enquanto o ruleset ainda está
desabilitado. A ativação ocorre antes do PR para que o próprio PR nasça sob as
regras que deve validar. O modo draft impede merge acidental durante a coleta
inicial, sem impedir a execução do workflow `pull_request`.

Nenhum gate autoriza implicitamente o seguinte. Em especial:

- branch local não autoriza commit;
- commit não autoriza push;
- push não autoriza ativação;
- ativação não autoriza PR;
- CI verde não autoriza ready, review, merge ou publicação;
- Reviewer aprovado não autoriza merge;
- aceitação humana técnica não autoriza merge sem comando explícito.

## Gate 1: pré-requisito Git e inventário real

Comandos futuros de leitura:

```powershell
$gitExe = (Get-Command git.exe -ErrorAction Stop).Source
& $gitExe status --porcelain=v2 --branch --untracked-files=all
& $gitExe diff --name-status
& $gitExe diff --numstat
& $gitExe diff --cached --name-status
& $gitExe rev-parse HEAD
& $gitExe rev-parse --abbrev-ref HEAD
& $gitExe rev-parse --abbrev-ref --symbolic-full-name '@{upstream}'
& $gitExe rev-list --left-right --count 'HEAD...@{upstream}'
```

Parar se:

- o Git continuar indisponível;
- houver staged existente;
- o branch não for `main`;
- `HEAD`, `origin/main` ou GitHub `main` divergirem;
- aparecer qualquer caminho fora do inventário deste documento e do futuro
  registro de aprovação.

## Gate 2: criação da branch local

Nome reservado proposto:

`codex/mission-09-main-protection-validation`

Confirmar por leitura que não existe local nem remotamente. Depois de aprovação
específica:

```powershell
$branchName = 'codex/mission-09-main-protection-validation'
$localBranches = @(& $gitExe for-each-ref --format='%(refname:short)' refs/heads/)
$remoteBranches = @(gh api --method GET `
  'repos/Hykaji/shaft/branches?per_page=100' --paginate --jq '.[].name')
if ($localBranches -contains $branchName) { throw 'Local branch already exists' }
if ($remoteBranches -contains $branchName) { throw 'Remote branch already exists' }
& $gitExe switch -c codex/mission-09-main-protection-validation
```

Os dois primeiros comandos devem indicar ausência; qualquer existência exige
parada, não reutilização nem sobrescrita. Não usar `checkout -B`, force ou
reset.

## Gate 3: checkpoint documental

Antes de staging:

- a Direção deve registrar a aprovação como
  `17-direction-activation-and-functional-validation-approval.md`;
- alinhar somente a linha da Missão 9 em `docs/agent-reports/README.md` ao
  estado pré-ativação atual;
- executar validação Markdown/links/JSON dos relatórios;
- executar `npm ci --no-audit --no-fund`, `npm run lint` e `npm test` no Node
  `22.18.0`, sem editar lockfile ou código;
- se a limitação local histórica do lint em artefatos ignorados reaparecer,
  distinguir isso do checkout limpo e não alterar `work/` ou o workflow sem
  novo plano.

Staging futuro com caminhos exatos:

```powershell
& $gitExe add -- `
  docs/agent-reports/README.md `
  docs/agent-reports/missions/mission-08-github-ci/README.md `
  docs/agent-reports/missions/mission-08-github-ci/15-direction-merge-completion.md `
  docs/roadmap.md `
  docs/agent-reports/missions/mission-09-main-protection/README.md `
  docs/agent-reports/missions/mission-09-main-protection/01-direction-brief-main-protection.md `
  docs/agent-reports/missions/mission-09-main-protection/02-builder-plan-main-protection.md `
  docs/agent-reports/missions/mission-09-main-protection/03-direction-disabled-ruleset-approval.md `
  docs/agent-reports/missions/mission-09-main-protection/04-builder-result-disabled-ruleset.md `
  docs/agent-reports/missions/mission-09-main-protection/05-direction-blocker-unattributed-approval.md `
  docs/agent-reports/missions/mission-09-main-protection/06-builder-plan-unattributed-approval.md `
  docs/agent-reports/missions/mission-09-main-protection/07-direction-unattributed-approval-fix-approval.md `
  docs/agent-reports/missions/mission-09-main-protection/08-builder-result-unattributed-approval-fix.md `
  docs/agent-reports/missions/mission-09-main-protection/09-reviewer-review-unattributed-approval-fix.md `
  docs/agent-reports/missions/mission-09-main-protection/10-direction-diagnostic-investigation-approval.md `
  docs/agent-reports/missions/mission-09-main-protection/11-builder-plan-invalid-request-diagnosis.md `
  docs/agent-reports/missions/mission-09-main-protection/12-direction-corrected-put-approval.md `
  docs/agent-reports/missions/mission-09-main-protection/13-builder-result-corrected-unattributed-approval-fix.md `
  docs/agent-reports/missions/mission-09-main-protection/14-reviewer-review-corrected-unattributed-approval-fix.md `
  docs/agent-reports/missions/mission-09-main-protection/15-direction-correction-technical-acceptance.md `
  docs/agent-reports/missions/mission-09-main-protection/16-builder-plan-activation-and-functional-validation.md `
  docs/agent-reports/missions/mission-09-main-protection/17-direction-activation-and-functional-validation-approval.md

& $gitExe diff --cached --check
& $gitExe diff --cached --name-status
& $gitExe diff --cached --stat
```

Exigir exatamente esses 22 caminhos e nenhum outro. Não usar `git add .`,
`git add -A`, glob, diretório inteiro ou staging interativo que possa capturar
mudança alheia.

Somente após aprovação específica do checkpoint:

```powershell
& $gitExe commit -m "docs: checkpoint missions 8 and 9 governance"
```

Depois, confirmar árvore limpa, commit pai igual ao antigo `main` e diff do
commit limitado aos 22 caminhos.

## Gate 4: push seguro da branch

Antes do push, revalidar repositório público, branch remota ausente, `main`
inalterada e ruleset ainda `disabled`. Com aprovação específica:

```powershell
& $gitExe push --set-upstream origin codex/mission-09-main-protection-validation
```

Não usar `--force`, `--force-with-lease`, refspec para `main` ou exclusão. Ler a
branch remota de volta e exigir que seu SHA seja o checkpoint exato. O push não
deve disparar o workflow atual, que observa `push` somente em `main`.

## Gate 5: ativação mínima

### Pré-condições imediatas

Repetir em uma única janela curta:

- identidade `Hykaji` e admin;
- repositório ainda público e default branch `main`;
- `main` ainda no SHA baseline e sem PR concorrente;
- ruleset único, mesmo ID/nome/target/condições/bypass/quatro regras;
- `enforcement: disabled`;
- campo corrigido ainda `false`;
- zero regras efetivas e proteção clássica ausente;
- check, integração `15368`, workflow, Actions e merge methods preservados;
- branch de validação remota no checkpoint exato;
- snapshot integral e versão histórica atual preservados para rollback.

Qualquer divergência encerra o gate sem `PUT`.

### Payload mínimo

```json
{"enforcement":"active"}
```

Este payload contém somente `enforcement`. Não reenviar `rules`, nome, target,
condições ou bypass. Versão e endpoint:

```text
PUT /repos/Hykaji/shaft/rulesets/21151016
X-GitHub-Api-Version: 2022-11-28
```

Antes da rede, converter a string em UTF-8 sem BOM, reabrir os bytes e exigir:

- JSON válido;
- única chave `enforcement`;
- valor literal `active`;
- comprimento e SHA-256 registrados;
- nenhuma credencial no payload.

Usar o mesmo padrão de captura já validado no relatório 13: processo `gh api`
com `--include` e `--input -`, stdin em bytes, stdout/stderr separados, sem
`--verbose` ou `GH_DEBUG=api`. Capturar exit code, status, headers da allowlist,
corpo completo e hashes. Exemplo de forma do comando, não autorizado agora:

```powershell
$activationJson = '{"enforcement":"active"}'
$activationBytes = (New-Object System.Text.UTF8Encoding($false, $true)).GetBytes($activationJson)
# Validar $activationBytes e fornecê-los ao stdin do processo controlado:
gh api --method PUT --include `
  -H "X-GitHub-Api-Version: 2022-11-28" `
  repos/Hykaji/shaft/rulesets/21151016 --input -
```

Fazer exatamente uma chamada de ativação. Resposta não `2xx` exige readback e
parada, sem retry. Se permanecer `disabled`, não executar rollback.

## Gate 6: readback, comparação e rollback

Após qualquer resposta, fazer `GET` integral do ruleset, lista, histórico,
versão atual, regras efetivas, branch, proteção clássica, repo, workflow,
Actions e merge settings.

Sucesso admissível:

- única diferença configurável: `enforcement`, `disabled` → `active`;
- `updated_at` e nova version ID são as únicas diferenças de metadata;
- campo corrigido permanece `false` na resposta, no readback e na versão;
- quatro regras efetivas aparecem para `main`;
- `main.protected: true`;
- SHA da `main` não muda;
- ausência de proteção clássica ou segundo ruleset;
- estado externo integral preservado.

Comandos futuros de leitura:

```powershell
gh api -H "X-GitHub-Api-Version: 2022-11-28" repos/Hykaji/shaft/rulesets/21151016
gh api -H "X-GitHub-Api-Version: 2022-11-28" repos/Hykaji/shaft/rulesets
gh api -H "X-GitHub-Api-Version: 2022-11-28" repos/Hykaji/shaft/rules/branches/main
gh api -H "X-GitHub-Api-Version: 2022-11-28" repos/Hykaji/shaft/rulesets/21151016/history
gh api -H "X-GitHub-Api-Version: 2022-11-28" repos/Hykaji/shaft/branches/main
gh api -H "X-GitHub-Api-Version: 2022-11-28" repos/Hykaji/shaft
```

### Rollback imediato

O futuro pedido de ativação deve autorizar explicitamente uma única chamada de
rollback com o payload mínimo:

```json
{"enforcement":"disabled"}
```

Executar o rollback uma única vez se houver:

- sucesso da ativação com qualquer drift;
- campo corrigido diferente de `false`;
- regras efetivas ausentes, extras ou divergentes;
- bypass inesperado, segundo ruleset ou proteção clássica;
- `main.protected` incoerente;
- mudança de visibilidade para privada;
- required check ausente, com contexto/App incorretos ou incompatível com a CI;
- exigência inesperada de aprovação humana;
- PR correto ainda bloqueado depois de CI verde;
- alteração de merge methods ou qualquer bloqueio operacional não previsto.

O rollback usa o mesmo endpoint/versão/captura, muda somente enforcement para
`disabled`, faz readback integral, exige campo ainda `false` e zero regras
efetivas, e para. Se falhar, não repetir, não excluir nem recriar o ruleset.

## Gate 7: PR real, inicialmente draft

Somente após ativação e readback aprovados, confirmar que o diff da branch é
exclusivamente documental. Com autorização específica:

```powershell
gh pr create --repo Hykaji/shaft `
  --base main `
  --head codex/mission-09-main-protection-validation `
  --draft `
  --title "docs: checkpoint missions 8 and 9 governance" `
  --body "Publishes the accepted Mission 8 closure and the Mission 9 governance history. This PR is also the authorized, non-destructive validation vehicle for the active main ruleset."
```

Não usar `pull_request_target`, não editar o workflow e não criar commit
deliberadamente quebrado. O PR deve ter base `main`, head exata e um único
checkpoint conhecido.

## Gate 8: CI e evidência do required check

O evento `pull_request` do workflow atual dispara automaticamente para base
`main`. Não executar rerun. Observar a execução original:

```powershell
gh pr checks <PR_NUMBER> --repo Hykaji/shaft --watch --interval 10
gh pr view <PR_NUMBER> --repo Hykaji/shaft `
  --json number,url,isDraft,headRefName,headRefOid,baseRefName,mergeable,mergeStateStatus,reviewDecision,reviews,statusCheckRollup
gh api repos/Hykaji/shaft/commits/<PR_HEAD_SHA>/check-runs
gh run view <RUN_ID> --repo Hykaji/shaft --log
```

Exigir:

- run originada pelo PR e pelo head SHA exato;
- job/check `Lint, build and tests`;
- App `github-actions`, ID `15368`;
- Node `22.18.0` nos logs;
- instalação, lint, build e 57/57 testes verdes;
- nenhuma falha, cancelamento, skip ou rerun.

Se o estado queued/in-progress terminar rápido demais para ser capturado, não
atrasar nem quebrar a CI artificialmente. A exigência do check fica comprovada
pela regra efetiva e pelo status rollup do PR.

## Gate 9: zero aprovações e mergeabilidade

Depois da CI verde, tornar o PR ready é outra escrita e requer aprovação
própria:

```powershell
gh pr ready <PR_NUMBER> --repo Hykaji/shaft
```

Sem criar review ou aprovação, repetir apenas consultas até o GitHub calcular
mergeabilidade. Exigir:

- `isDraft: false`;
- total de reviews e approvals igual a zero;
- `reviewDecision` ausente/não requerida;
- check rollup `SUCCESS`;
- `mergeable: MERGEABLE` e `mergeStateStatus: CLEAN` depois do check verde;
- head SHA e base inalterados.

Se `mergeable` estiver temporariamente `UNKNOWN`, aguardar e consultar de novo;
isso é leitura, não rerun. Se ficar bloqueado por aprovação ou regra inesperada,
executar rollback para `disabled` e parar sem merge.

## Evidência exata de cada requisito

| Requisito | Evidência segura suficiente | Teste proibido/desnecessário |
| --- | --- | --- |
| PR obrigatório | ruleset `active`; regra efetiva `pull_request`; PR real como único caminho de integração | push direto para `main` |
| Check obrigatório | regra efetiva com contexto `Lint, build and tests` e App `15368`; status rollup e check-run do head | commit quebrado ou rerun |
| Zero aprovações | contador `0`, reviewers vazio, flags de review e campo corrigido `false`; zero reviews; PR ready e mergeável após CI | autoaprovação ou review artificial |
| Ausência de bypass | `bypass_actors: []`, `current_user_can_bypass: never` e regras efetivas visíveis para `main` | tentativa de bypass administrativo |
| Bloqueio de exclusão | regra efetiva `deletion` | excluir a `main` |
| Bloqueio de non-fast-forward | regra efetiva `non_fast_forward` | force-push ou reescrita de `main` |
| Métodos preservados | repo permite merge/squash/rebase e regra de PR lista os três | executar três merges de teste |

A API oficial informa que o endpoint de regras da branch retorna todas as
regras ativas aplicáveis e omite rulesets `disabled` ou `evaluate`:
[REST API endpoints for rules](https://docs.github.com/en/rest/repos/rules#get-rules-for-a-branch).
Essa é a evidência não destrutiva adequada para deletion e non-fast-forward.

## Proibição de teste por push direto

Não executar em nenhuma hipótese:

```text
git push origin HEAD:main
git push --force origin ...:main
git push origin --delete main
```

Um teste direto só é seguro quando o bloqueio já funciona; se estiver
configurado incorretamente, o próprio teste modifica ou remove a branch que
pretende proteger. A validação combina API efetiva, PR real e CI sem arriscar a
`main`.

## Reviewer, aceitação e merge

Depois da validação funcional, o Builder deve criar o resultado cronológico e
parar. Um Reviewer independente inicia em somente leitura e confirma ruleset,
PR, CI, logs, mergeabilidade, Git e ausência de bypass/drift.

Somente depois de parecer aprovado, a Direção pode dar aceitação humana e uma
autorização de merge separada. Imediatamente antes do merge, revalidar:

- repo ainda público;
- ruleset ainda `active`, campo `false` e quatro regras efetivas;
- PR ready, mesma head, base sem avanço inesperado e zero reviews;
- check correto verde no head atual;
- nenhum novo commit, bypass, ruleset ou proteção clássica.

Se a base avançar, parar; atualizar/rebasear seria outro commit, push e CI e
exige novo gate. Com autorização explícita de merge:

```powershell
gh pr merge <PR_NUMBER> --repo Hykaji/shaft --merge
```

Não usar `--admin`, auto-merge, squash, rebase ou `--delete-branch`. Observar a
run automática de `push` em `main`; não executar rerun. Confirmar merge commit,
SHA final, CI verde, ruleset ainda ativo, campo `false` e regras efetivas.

## Relatórios e roadmap por fase

Nomes cronológicos sugeridos, respeitando os papéis:

1. antes de qualquer ação: Direção cria
   `17-direction-activation-and-functional-validation-approval.md`;
2. somente depois da ativação, readback, PR e CI funcional: Builder cria
   `18-builder-result-activation-and-functional-validation.md`;
3. somente depois do resultado: Reviewer independente cria
   `19-reviewer-review-activation-and-functional-validation.md`;
4. somente depois do parecer aprovado: Direção cria
   `20-direction-activation-functional-acceptance.md` e, se decidir, autoriza
   o merge separadamente;
5. somente depois do merge e da CI de push: Direção registra
   `21-direction-merge-completion.md`.

O README da Missão 9 pode receber apenas atualizações cronológicas mínimas a
cada documento, sem antecipar o estágio seguinte.

Somente depois de ativação, validação funcional, revisão independente e
aceitação humana podem ser atualizados:

- a entrada da Missão 9 em `docs/agent-reports/README.md` para declarar
  proteção efetiva;
- `docs/roadmap.md` para esclarecer que a suíte já marcada como automatizada
  também está exigida por PR/ruleset;
- o status final do README da Missão 9.

O checkbox atual do roadmap já representa a CI concluída na Missão 8 e não
deve ser revertido nem duplicado. As atualizações finais, o relatório de merge
e sua publicação permanecem pendentes em worktree até um checkpoint/PR futuro
explicitamente autorizado; não são incluídos automaticamente pelo merge do PR
de validação.

## Riscos e requisitos de preservação

- **Git indisponível:** impede executar e auditar branch/commit/push. Mitigação:
  disponibilizar Git e repetir status/diffs antes de autorização.
- **Worktree misto:** documentação de duas missões e índice compartilhado.
  Mitigação: staging por 22 caminhos explícitos e diff staged obrigatório.
- **Índice geral desatualizado:** entrada da Missão 9 é anterior ao estado
  remoto atual. Mitigação: alinhamento factual mínimo antes do checkpoint.
- **Campo não documentado:** pode regredir na ativação. Mitigação: validar
  `false` antes, na resposta, no readback, na versão e antes do merge.
- **Ruleset em repo privado:** suporte depende do plano. Mitigação: gate de
  visibilidade repetido e rollback se mudar depois da ativação.
- **Required check incorreto:** bloquearia merge. Mitigação: contexto e App ID,
  PR draft, CI real e rollback imediato.
- **Política loose:** a base não precisa ser atualizada. Mitigação: parar se
  `main` avançar nesta validação controlada; não atualizar automaticamente.
- **Conta admin única:** sem redundância administrativa. Mitigação: snapshot,
  rollback mínimo e nenhum bypass permanente.
- **Relatórios posteriores fora do PR:** fechamento pode ficar local pendente.
  Mitigação: registrar claramente e exigir publicação separada, sem alterar o
  head já aceito silenciosamente.

## Exclusões explícitas desta etapa

- não criar/trocar branch;
- não fazer staging, commit ou push;
- não abrir, editar, marcar ready ou fazer merge de PR;
- não ativar, editar, recriar ou excluir ruleset;
- não executar rollback;
- não executar CI, rerun ou publicação;
- não testar push direto, force-push ou exclusão da `main`;
- não alterar workflow, código, testes, dependências, lockfile ou roadmap;
- não alterar visibilidade, plano, Actions Settings, token ou merge methods;
- não criar os documentos futuros 17 a 21.

## Pedido de aprovação

Solicita-se somente a análise deste plano. Uma futura decisão deve autorizar de
forma explícita e separada, no mínimo:

1. criação da branch local;
2. alinhamento documental e checkpoint commit nos caminhos listados;
3. push sem force;
4. uma ativação mínima e um rollback contingencial mínimo;
5. abertura do PR draft;
6. tornar o PR ready depois da CI;
7. revisão independente;
8. aceitação humana;
9. merge por comando próprio.

Nenhuma dessas ações está autorizada por este documento. O Builder para com o
ruleset `disabled`, sem branch, commit, push ou PR novo.
