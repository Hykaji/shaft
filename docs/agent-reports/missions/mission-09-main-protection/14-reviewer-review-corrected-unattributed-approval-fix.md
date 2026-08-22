# Reviewer review: correção da aprovação não atribuída

**Data:** 2026-08-21

**Missão:** `mission-09-main-protection`

**Classificação:** Nível 3 - crítico

**Papel:** Reviewer independente

**Resultado do Builder revisado:**
[`13-builder-result-corrected-unattributed-approval-fix.md`](13-builder-result-corrected-unattributed-approval-fix.md)

**Plano aprovado:**
[`11-builder-plan-invalid-request-diagnosis.md`](11-builder-plan-invalid-request-diagnosis.md)

**Autorização revisada:**
[`12-direction-corrected-put-approval.md`](12-direction-corrected-put-approval.md)

**Tipo de revisão:** estritamente somente leitura do estado local e remoto;
somente este parecer e a atualização mínima do índice da missão foram
autorizados como escrita documental local

## Veredito

**Approved**

## Escopo e evidências revisados

Foram lidos integralmente:

- `AGENTS.md`;
- `docs/agent-workflow.md`;
- `docs/agent-reports/templates/reviewer-review.md`;
- todos os documentos cronológicos 01 a 13 desta missão;
- o README atual desta missão.

A revisão confrontou especialmente o diagnóstico e plano 11, a autorização 12
e o resultado 13. O estado do GitHub foi consultado exclusivamente com método
`GET`: ruleset atual, lista de rulesets, regras efetivas da `main`, branch,
proteção clássica, histórico, versões `47244358` e `47225866`, repositório,
identidade e permissão, workflow, Actions Settings, permissões do token,
check-runs e runs recentes.

Também foram verificados localmente o transcript sanitizado da operação, os
blocos JSON do relatório 13, seus comprimentos e hashes, e o estado do
worktree. Nenhuma validação funcional foi executada.

Não houve nesta revisão chamada remota `PUT`, `PATCH`, `POST` ou `DELETE`, nem
retry, rollback, ativação, correção, branch, commit, push, PR, rerun, merge ou
publicação.

## Avaliação executiva

A correção cumpriu o plano e a autorização. O payload mínimo foi construído
com `enforcement: disabled` e `rules` como array de quatro elementos; os bytes
finais foram validados antes da única escrita autorizada; o GitHub respondeu
HTTP `200`; e o readback mostrou somente a mudança do booleano de `true` para
`false`, além dos metadados esperados da nova versão.

O objetivo desta correção foi alcançado sem drift:
`require_extra_approval_for_unattributed_changes` está em `false`. O ruleset
continua **Disabled**, produz zero regras efetivas e ainda não protege a
`main`. Este parecer não autoriza ativação, commit, push, PR, merge ou
publicação.

## Estado remoto confirmado independentemente

Consultas realizadas em 2026-08-21, somente com `GET`:

| Evidência | Estado observado |
| --- | --- |
| Ruleset | `Protect main`, ID `21151016`, target `branch` |
| Enforcement | `disabled` |
| Campo corrigido | `require_extra_approval_for_unattributed_changes: false` |
| Quantidade de regras | exatamente `4` |
| Tipos das regras | `deletion`, `pull_request`, `required_status_checks`, `non_fast_forward` |
| Quantidade de rulesets | exatamente `1`, mesmo ID |
| Regras efetivas sobre `main` | zero (`[]`) |
| SHA da `main` | `310170674d8de6eac8b2746536470c7e51944ffc` |
| Proteção da `main` | `protected: false`; proteção clássica ausente, `HTTP 404 Branch not protected` |
| Histórico | exatamente `2` versões: `47244358` e `47225866` |
| Versão atual | `47244358`, `disabled`, campo em `false` |
| Versão anterior | `47225866`, `disabled`, campo em `true` |

### Regras e parâmetros preservados

A leitura integral atual confirmou:

- bypass vazio;
- include somente `~DEFAULT_BRANCH` e exclude vazio;
- `required_approving_review_count: 0`;
- `dismiss_stale_reviews_on_push: false`;
- `required_reviewers: []`;
- `require_code_owner_review: false`;
- `require_last_push_approval: false`;
- `required_review_thread_resolution: false`;
- allowed merge methods `merge`, `squash` e `rebase`;
- required check `Lint, build and tests`, integração `15368`;
- `strict_required_status_checks_policy: false`;
- `do_not_enforce_on_create: false`;
- regras `deletion` e `non_fast_forward` presentes uma vez cada;
- ID, nome, target, source, node ID, `created_at`, condições, links e
  `current_user_can_bypass` preservados.

O `updated_at` atual é `2026-08-21T14:35:21.921-03:00`, coerente com a
atualização aceita.

## Comparação independente das versões históricas

As versões `47244358` e `47225866` foram lidas diretamente e achatadas por
caminho para uma comparação estrutural local. Foram encontradas exatamente
três diferenças:

1. `$.state.rules[1].parameters.require_extra_approval_for_unattributed_changes`:
   `true` → `false`, única mudança configurável autorizada;
2. `$.updated_at` da versão:
   `2026-08-21T11:42:18.708-03:00` →
   `2026-08-21T14:35:22.027-03:00`;
3. `$.version_id`: `47225866` → `47244358`.

Não houve diferença em enforcement, quantidade, tipos ou demais parâmetros das
regras, condições, bypass, identidade do ruleset ou ator. A diferença entre as
versões está, portanto, limitada ao booleano autorizado e aos metadados
esperados da nova versão.

## Preservação das superfícies externas

As consultas independentes confirmaram:

- identidade autenticada `Hykaji`, ID `173323031`, com permissão `admin`;
- repositório `Hykaji/shaft` ainda público e branch padrão `main`;
- workflow `CI`, ID `338958578`, caminho `.github/workflows/ci.yml`, ativo;
- check `Lint, build and tests`, ID `96790524554`, concluído com `success` pela
  App `github-actions`, ID `15368`;
- Actions habilitadas com `allowed_actions: all` e
  `sha_pinning_required: false`;
- token com `default_workflow_permissions: read` e
  `can_approve_pull_request_reviews: false`;
- merge commit, squash e rebase habilitados;
- auto-merge e exclusão automática de branch desabilitados;
- runs recentes iguais à baseline, sem rerun adicional.

Não foi observada alteração remota fora do booleano aprovado e dos metadados da
versão correspondente.

## Auditoria das evidências de transporte e sanitização

O relatório 13 e o transcript local da operação fornecem evidência suficiente,
coerente e sanitizada:

- payload compacto: `653` bytes;
- SHA-256 do payload:
  `1eb0ec906bd6fcba78ded6ba52ec0032812173bd745aa7b6909f3e3800110153`;
- exit code do `gh`: `0`;
- status preservado: HTTP `200`;
- stderr completo: vazio;
- corpo completo: `1174` bytes;
- SHA-256 do corpo:
  `3f8e72e31e3fd05a64431e119be70238210218dfac6825a4556e13732ce26297`;
- headers registrados limitados a content type, data, versão selecionada da
  API, request ID e rate limits;
- ausência de `Authorization`, bearer token, token clássico, cookie ou
  `Set-Cookie` no bloco de evidência inspecionado.

O Reviewer recompactou independentemente os blocos JSON do relatório. O
payload recompôs exatamente `653` bytes e o hash informado. O corpo recompôs
exatamente `1174` bytes e o hash informado. Um novo `GET` do ruleset atual
também retornou exatamente `1174` bytes com o mesmo SHA-256 do corpo registrado.

O transcript preserva explicitamente `put_exit_code: 0`,
`put_status_http: 200`, `put_stderr_complete: ""`, o corpo completo, os dois
hashes e o request ID. As evidências permitem relacionar payload, resposta,
readback e nova versão histórica sem expor credenciais.

## Achados

Nenhum achado crítico, alto, médio, baixo ou observação não bloqueante foi
identificado na correção revisada.

## Avaliação da decisão de rollback

A decisão de não executar rollback foi correta. A autorização 12 permitia
rollback somente depois de sucesso com drift comprovado. O `PUT` teve sucesso,
mas a comparação integral mostrou exclusivamente o booleano autorizado e os
metadados esperados; não havia estado incorreto a restaurar. Executar rollback
nessa condição teria desfeito a correção válida e violado o gate.

## Avaliação da validação

O Reviewer reproduziu por leitura:

1. identidade, estado e conteúdo integral do ruleset;
2. quatro regras e preservação de todos os demais parâmetros;
3. um único ruleset e zero regras efetivas sobre `main`;
4. SHA e estado de proteção da `main`;
5. ambas as versões históricas e sua diferença estrutural exata;
6. workflow, check, Actions Settings, token, métodos de merge e demais
   superfícies previstas;
7. comprimentos e hashes do payload e do corpo;
8. suficiência e sanitização do HTTP `200`, headers, stderr e corpo;
9. ausência de motivo para rollback.

Não foram executados testes funcionais por PR, ativação ou qualquer operação de
escrita. Essas etapas pertencem a gates futuros e continuam fora do escopo.

## Handoff final

A Direção pode analisar este parecer e decidir o próximo gate. A correção do
booleano está verificada, mas o ruleset permanece **Disabled** e a Missão 9 não
deve ser considerada concluída como proteção efetiva da `main`. Este parecer
não autoriza ativação, commit, push, PR, merge ou publicação.
