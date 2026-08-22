# Direção: aceitação técnica da correção do campo

**Data:** 2026-08-21

**Missão:** `mission-09-main-protection`

**Classificação:** Nível 3 - crítico

**Decisão:** correção do campo aceita tecnicamente; ruleset permanece desativado

## Aceitação humana explícita

A Direção aceita tecnicamente a correção registrada em
[`13-builder-result-corrected-unattributed-approval-fix.md`](13-builder-result-corrected-unattributed-approval-fix.md)
e o veredito **Approved** do Reviewer em
[`14-reviewer-review-corrected-unattributed-approval-fix.md`](14-reviewer-review-corrected-unattributed-approval-fix.md).

Está aceito que:

- `require_extra_approval_for_unattributed_changes` está em `false`;
- a alteração foi aceita pelo GitHub com HTTP `200`;
- a comparação histórica e o readback integral não encontraram drift;
- o rollback não era necessário e não foi executado;
- o ruleset `Protect main`, ID `21151016`, permanece `disabled`;
- a `main` ainda não possui regras efetivas desta proteção.

## Alcance da decisão

Esta decisão aceita somente a correção do booleano e encerra o ciclo específico
de diagnóstico, correção e revisão desse campo. Ela não declara a proteção da
`main` funcionalmente concluída e não conclui a Missão 9.

## Gates preservados

Permanecem sem autorização:

- ativar o ruleset;
- executar validação funcional;
- criar branch ou commit;
- fazer push ou abrir PR;
- executar rerun, merge ou publicação;
- alterar novamente qualquer configuração remota.

O próximo trabalho permitido é somente o planejamento de ativação e validação,
preservando separadamente os gates de configuração remota e de operações Git.
