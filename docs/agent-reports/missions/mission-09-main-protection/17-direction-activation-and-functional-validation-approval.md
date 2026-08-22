# Direção: aprovação do inventário, branch e checkpoint local

**Data:** 2026-08-21

**Missão:** `mission-09-main-protection`

**Papel:** Direção humana

**Classificação:** Nível 3 - crítico

**Decisão:** plano 16 aprovado somente para os Gates 1 a 3

**Plano aprovado:**
[`16-builder-plan-activation-and-functional-validation.md`](16-builder-plan-activation-and-functional-validation.md)

## Decisão

A Direção aprova o plano 16 e autoriza exclusivamente:

1. o inventário Git final, em somente leitura;
2. a criação da branch local exata
   `codex/mission-09-main-protection-validation`;
3. um checkpoint commit local, depois das validações previstas, limitado aos
   caminhos listados neste documento.

A atualização já autorizada do `docs/roadmap.md` sobre o futuro Shaft Desktop,
incluindo a estratégia de template, núcleo compartilhado e comparação futura
entre Electron Forge e Tauri, faz parte do conteúdo conhecido deste
checkpoint. Ela não inicia a implementação do aplicativo desktop nem aprova
uma escolha tecnológica.

## Pré-condições obrigatórias

Antes de criar a branch, o Builder deve confirmar com o Git real:

- branch atual `main`;
- `HEAD` e `origin/main` em
  `310170674d8de6eac8b2746536470c7e51944ffc`, sem divergência;
- índice sem mudanças staged;
- nenhuma operação Git em andamento;
- worktree limitado exatamente aos caminhos conhecidos deste checkpoint;
- branch proposta ausente localmente e no remoto.

Qualquer diferença interrompe a execução antes da criação da branch ou do
commit e deve ser devolvida à Direção. Consultas remotas em somente leitura são
permitidas apenas para confirmar as pré-condições; nenhuma escrita remota está
autorizada.

## Escopo exato do checkpoint

Somente estes 22 caminhos podem ser incluídos:

1. `docs/agent-reports/README.md`
2. `docs/agent-reports/missions/mission-08-github-ci/README.md`
3. `docs/agent-reports/missions/mission-08-github-ci/15-direction-merge-completion.md`
4. `docs/roadmap.md`
5. `docs/agent-reports/missions/mission-09-main-protection/README.md`
6. `docs/agent-reports/missions/mission-09-main-protection/01-direction-brief-main-protection.md`
7. `docs/agent-reports/missions/mission-09-main-protection/02-builder-plan-main-protection.md`
8. `docs/agent-reports/missions/mission-09-main-protection/03-direction-disabled-ruleset-approval.md`
9. `docs/agent-reports/missions/mission-09-main-protection/04-builder-result-disabled-ruleset.md`
10. `docs/agent-reports/missions/mission-09-main-protection/05-direction-blocker-unattributed-approval.md`
11. `docs/agent-reports/missions/mission-09-main-protection/06-builder-plan-unattributed-approval.md`
12. `docs/agent-reports/missions/mission-09-main-protection/07-direction-unattributed-approval-fix-approval.md`
13. `docs/agent-reports/missions/mission-09-main-protection/08-builder-result-unattributed-approval-fix.md`
14. `docs/agent-reports/missions/mission-09-main-protection/09-reviewer-review-unattributed-approval-fix.md`
15. `docs/agent-reports/missions/mission-09-main-protection/10-direction-diagnostic-investigation-approval.md`
16. `docs/agent-reports/missions/mission-09-main-protection/11-builder-plan-invalid-request-diagnosis.md`
17. `docs/agent-reports/missions/mission-09-main-protection/12-direction-corrected-put-approval.md`
18. `docs/agent-reports/missions/mission-09-main-protection/13-builder-result-corrected-unattributed-approval-fix.md`
19. `docs/agent-reports/missions/mission-09-main-protection/14-reviewer-review-corrected-unattributed-approval-fix.md`
20. `docs/agent-reports/missions/mission-09-main-protection/15-direction-correction-technical-acceptance.md`
21. `docs/agent-reports/missions/mission-09-main-protection/16-builder-plan-activation-and-functional-validation.md`
22. `docs/agent-reports/missions/mission-09-main-protection/17-direction-activation-and-functional-validation-approval.md`

O staging deve nomear esses caminhos explicitamente. É proibido usar staging
amplo, inclusive `git add .`, `git add -A` ou equivalentes. Antes do commit, o
Builder deve confirmar os 22 caminhos staged, revisar o diff staged e executar
`git diff --cached --check`.

Se as validações do plano passarem, fica autorizado um único commit local com
a mensagem:

`docs: checkpoint missions 8 and 9 governance`

Depois do commit, o Builder deve verificar branch, SHA, parent, lista exata de
caminhos e worktree limpo. O resultado deve ser devolvido à Direção sem criar
um relatório adicional fora deste checkpoint.

## Limites preservados

Esta decisão não autoriza:

- push ou criação de branch remota;
- ativação ou nova alteração do ruleset;
- abertura ou alteração de PR;
- rerun de CI;
- merge;
- publicação;
- alteração de código, workflow, dependências, autenticação, banco, deploy ou
  dados.

O ruleset `Protect main`, ID `21151016`, deve permanecer `disabled`. O sucesso
do checkpoint local não implica autorização para nenhum gate posterior do
plano 16.
