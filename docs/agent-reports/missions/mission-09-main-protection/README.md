# Missão 09: proteção da main

**Nível:** 3 - crítico

**Status:** checkpoint local autorizado; ruleset ainda `disabled`; aguarda
execução do Builder limitada aos Gates 1 a 3

**Implementação remota:** `Protect main` ID `21151016` criado como `disabled`;
ativação não autorizada

## Objetivo

Investigar e propor uma proteção mínima, recuperável e verificável para a
`main`, fazendo com que novas integrações passem por PR e pela CI criada na
Missão 8 sem impor burocracia desnecessária ao projeto pessoal.

## Registro cronológico

1. [`01-direction-brief-main-protection.md`](01-direction-brief-main-protection.md)
   - objetivo, baseline remoto e restrições da Direção;
   - decisões que o Builder deve investigar;
   - critérios para segurança, recuperação e futura aprovação.
2. [`02-builder-plan-main-protection.md`](02-builder-plan-main-protection.md)
   - evidências locais e remotas atuais, incluindo a identidade técnica do
     check;
   - comparação entre ruleset e proteção clássica e configuração mínima
     recomendada;
   - riscos, custos, rollback, validação e pedido de aprovação da Direção.
3. [`03-direction-disabled-ruleset-approval.md`](03-direction-disabled-ruleset-approval.md)
   - aprovação humana explícita do plano;
   - autorização limitada à criação de `Protect main` como `Disabled`;
   - validação obrigatória, condição de visibilidade e limites preservados.
4. [`04-builder-result-disabled-ruleset.md`](04-builder-result-disabled-ruleset.md)
   - criação do ruleset `21151016` em estado `disabled` e JSON integral lido de
     volta;
   - comparação campo por campo e confirmação de zero regras efetivas;
   - defaults adicionais retornados pelo GitHub, limitações e parada antes da
     ativação.
5. [`05-direction-blocker-unattributed-approval.md`](05-direction-blocker-unattributed-approval.md)
   - registro do default adicional de aprovação retornado pelo GitHub;
   - bloqueio da ativação até uma correção mínima planejada e validada;
   - preservação de todos os gates e limites remotos.
6. [`06-builder-plan-unattributed-approval.md`](06-builder-plan-unattributed-approval.md)
   - investigação oficial e comunitária do campo adicional;
   - comparação entre `PUT` mínimo e payload configurável completo;
   - proposta exata, readback estrutural, rollback e pedido de aprovação.
7. [`07-direction-unattributed-approval-fix-approval.md`](07-direction-unattributed-approval-fix-approval.md)
   - aprovação humana da chamada mínima para definir o campo como `false`;
   - autorização condicionada de um único rollback por drift comprovado;
   - ativação e demais mudanças remotas mantidas sem autorização.
8. [`08-builder-result-unattributed-approval-fix.md`](08-builder-result-unattributed-approval-fix.md)
   - pré-condições aprovadas e única tentativa de `PUT` mínimo;
   - rejeição `Invalid request` seguida de readback integral sem mudanças;
   - rollback não necessário e preservação de todos os limites remotos.
9. [`09-reviewer-review-unattributed-approval-fix.md`](09-reviewer-review-unattributed-approval-fix.md)
   - revisão independente da conformidade, preservação e parada segura;
   - limitações causadas pela ausência do status HTTP e corpo detalhado;
   - objetivo funcional pendente e ativação mantida sem autorização.
10. [`10-direction-diagnostic-investigation-approval.md`](10-direction-diagnostic-investigation-approval.md)
    - aceitação da revisão da condução segura, sem concluir a correção;
    - autorização de investigação diagnóstica estritamente sem escrita remota;
    - nova tentativa e ativação preservadas como gates separados.
11. [`11-builder-plan-invalid-request-diagnosis.md`](11-builder-plan-invalid-request-diagnosis.md)
    - recuperação sanitizada da tentativa e diagnóstico da serialização de
      `rules` como objeto em vez de array;
    - distinção entre defeito local do payload e rejeição HTTP pelo GitHub;
    - alternativas futuras, captura completa da resposta, readback e rollback
      planejados sem autorizar nova escrita.
12. [`12-direction-corrected-put-approval.md`](12-direction-corrected-put-approval.md)
    - aprovação humana de uma única tentativa com `rules` validado como array;
    - captura sanitizada da resposta e rollback condicionado a drift após
      sucesso;
    - ativação e demais mudanças remotas mantidas sem autorização.
13. [`13-builder-result-corrected-unattributed-approval-fix.md`](13-builder-result-corrected-unattributed-approval-fix.md)
    - único `PUT` corrigido aceito com HTTP `200` e campo definido como `false`;
    - readback integral sem drift, `disabled` e estado externo preservado;
    - rollback não necessário e handoff para revisão independente.
14. [`14-reviewer-review-corrected-unattributed-approval-fix.md`](14-reviewer-review-corrected-unattributed-approval-fix.md)
    - revisão independente da correção, versões históricas e estado externo;
    - validação dos hashes e da captura sanitizada de HTTP `200`;
    - correção verificada, com ruleset ainda `disabled` e sem autorizar ativação.
15. [`15-direction-correction-technical-acceptance.md`](15-direction-correction-technical-acceptance.md)
    - aceitação humana da correção e do parecer independente `Approved`;
    - encerramento do ciclo específico do campo, sem concluir a proteção;
    - ativação e operações Git preservadas como gates separados.
16. [`16-builder-plan-activation-and-functional-validation.md`](16-builder-plan-activation-and-functional-validation.md)
    - inventário completo do worktree e separação entre Missões 8 e 9;
    - ordem segura de branch, checkpoint, push, ativação, PR, CI e merge;
    - validação funcional não destrutiva, rollback e risco de repo privado.
17. [`17-direction-activation-and-functional-validation-approval.md`](17-direction-activation-and-functional-validation-approval.md)
    - aprovação do inventário final, branch local exata e checkpoint commit;
    - lista fechada de 22 caminhos, incluindo a anotação do Shaft Desktop;
    - push, ativação, PR, rerun, merge e publicação mantidos bloqueados.

## Limites

Foi criado somente o ruleset `Protect main` ID `21151016`, preservado como
`disabled`. Como está desabilitado, ele não produz regras efetivas sobre a
`main`. Não houve mudança de código, workflow, Actions Settings, proteção
clássica, métodos de merge, dados, Notion, D1, deploy, branch, commit, push, PR
ou publicação.

O campo `require_extra_approval_for_unattributed_changes` está em `false`, sem
drift, e sua correção foi aceita tecnicamente pela Direção. O ruleset permanece
`disabled`, sem regras efetivas sobre a `main`. Somente o inventário final, a
branch local `codex/mission-09-main-protection-validation` e um checkpoint
commit local nos 22 caminhos aprovados estão autorizados. Push, ativação, PR,
rerun, merge, publicação e novas alterações remotas não estão autorizados.
