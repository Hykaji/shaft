# Missão 09: proteção da main

**Nível:** 3 - crítico

**Status:** objetivo técnico concluído; PR nº 3 integrado e CI pós-merge
aprovada; documentação local de fechamento aguarda publicação separada

**Implementação remota:** `Protect main` ID `21151016` ativo; PR nº 3 integrado
no merge commit `3fb9752`; CI de push verde

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
18. [`18-builder-result-activation-and-functional-validation.md`](18-builder-result-activation-and-functional-validation.md)
    - checkpoint, push seguro, ativação mínima e readback sem drift;
    - PR nº 3, CI original verde, zero aprovações e mergeabilidade confirmada;
    - handoff do Builder para revisão independente, sem declarar aceitação.
19. [`19-reviewer-review-activation-and-functional-validation.md`](19-reviewer-review-activation-and-functional-validation.md)
    - revisão independente de Git, ruleset, PR, CI e autorizações por gate;
    - confirmação de zero drift, rollback, rerun, review, aprovação ou merge;
    - veredito `Approved`, sem declarar aceitação humana ou missão concluída.
20. [`20-direction-activation-functional-acceptance.md`](20-direction-activation-functional-acceptance.md)
    - aceitação humana do veredito independente `Approved`;
    - aprovação técnica da implementação e da validação funcional;
    - merge, commit, push, exclusão de branch e publicação preservados como
      gates separados.
21. [`21-direction-merge-completion.md`](21-direction-merge-completion.md)
    - merge autorizado do PR nº 3 por merge commit, sem bypass ou exclusão da
      branch;
    - CI automática de push aprovada no Node 22.18.0 com 57/57 testes;
    - conclusão do objetivo técnico e preservação da publicação documental
      como gate separado.

## Limites

O ruleset `Protect main` ID `21151016` está `active`, com o campo
`require_extra_approval_for_unattributed_changes` em `false`, bypass vazio e
quatro regras efetivas sobre a `main`. A branch de validação permanece no
checkpoint `ed38dc5e54173a6a2aaa1b7cac88238c055d7ce6`; o PR nº 3 está aberto,
ready, verde, sem reviews ou aprovações e com mergeabilidade limpa. A `main`
permanece protegida no SHA `310170674d8de6eac8b2746536470c7e51944ffc`.

O documento 17 autorizou somente os Gates 1 a 3. Push, ativação, criação do PR,
observação da CI e mudança para ready foram autorizados depois, pela Direção,
em gates separados. A implementação e a validação funcional receberam o
veredito independente `Approved` e foram aceitas tecnicamente pela Direção. O
PR nº 3 foi integrado no merge commit
`3fb975207558a96a73cff393424708cfe3e9b846`, e a CI automática de push foi
aprovada na primeira tentativa com 57/57 testes. O objetivo técnico da missão
está concluído.

Staging ou commit desta documentação, push documental, novo PR, exclusão da
branch e publicação do fechamento não estão autorizados. Nenhuma ação posterior
deve ser inferida deste README ou dos relatórios da missão.
