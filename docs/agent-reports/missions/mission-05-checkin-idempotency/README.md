# Missão 05: idempotência do check-in e consistência do XP

**Status:** Concluída e aceita no escopo local
**Builder:** Implementação e correção final concluídas
**Reviewer:** Approved with non-blocking observations
**Aceitação humana:** Registrada em 15 de agosto de 2026
**Publicação:** Não autorizada

## Objetivo

Impedir que reenvios ou gravações concorrentes do mesmo check-in criem
duplicatas ou concedam XP mais de uma vez, e manter o total de XP correto mesmo
com datas diferentes simultâneas e check-ins retroativos.

## Limites desta implementação

Foi implementada somente a preparação local do núcleo D1 de check-ins e XP. O
modo `notion` continua padrão; nenhum owner real foi criado, nenhum dado legado
foi importado e nenhum recurso remoto, migração remota ou publicação foi
executado. Schema e dados do Notion, autenticação, roadmap, lockfiles e missões
anteriores permaneceram preservados.

## Registro cronológico

1. [`01-builder-plan-checkin-idempotency.md`](01-builder-plan-checkin-idempotency.md)
   - comportamento atual, cenários reproduzíveis, limites do Notion, garantia
     possível, alternativas, recomendação arquitetural, testes e decisão
     solicitada.
2. [`02-direction-decision-d1.md`](02-direction-decision-d1.md)
   - aprovação humana do ledger D1 canônico, limites da projeção no Notion e
     restrições para planejamento, migração e publicação.
3. [`03-builder-plan-d1-checkin-idempotency.md`](03-builder-plan-d1-checkin-idempotency.md)
   - schema e transações do ledger, identidade, fingerprint, at-most-once no
     Notion, testes, rollback e separação entre implementação local, legado,
     binding remoto e publicação.
4. [`04-direction-approval-local-implementation.md`](04-direction-approval-local-implementation.md)
   - aprovação da implementação local, exigência da prova D1 real e limites
     preservados para dados, migração remota e publicação.
5. [`05-direction-decision-d1-core.md`](05-direction-decision-d1-core.md)
   - substitui a projeção automática no Notion por D1 no caminho crítico e
     migração gradual dos dados centrais.
6. [`06-builder-plan-d1-core-checkins.md`](06-builder-plan-d1-core-checkins.md)
   - plano simplificado para check-ins/XP somente no D1 após o corte, Notion
     legado somente leitura, teste D1 local obrigatório e fases de migração.
7. [`07-direction-approval-d1-core-implementation.md`](07-direction-approval-d1-core-implementation.md)
   - aprovação da implementação local do núcleo D1, preservando dados reais,
     recursos remotos e publicação para missões futuras.
8. [`08-builder-result-d1-core-checkins.md`](08-builder-result-d1-core-checkins.md)
   - implementação local do ledger, modos `notion`/`d1`, migração gerada,
     harness Wrangler/D1 real, validações e handoff ao Reviewer.
9. [`09-reviewer-review-d1-core-checkins.md`](09-reviewer-review-d1-core-checkins.md)
   - revisão independente, validação integral do núcleo D1 e identificação de
     uma regressão bloqueante no tratamento de erros do dashboard.
10. [`10-builder-correction-dashboard-error-boundaries.md`](10-builder-correction-dashboard-error-boundaries.md)
    - separação das fronteiras de erro do D1 e do Notion e testes compilados
      para status conhecido, sanitização e ausência de saldo parcial.
11. [`11-reviewer-rereview-dashboard-error-boundaries.md`](11-reviewer-rereview-dashboard-error-boundaries.md)
    - reavaliação final, bloqueador resolvido, 43 testes aprovados e veredito
      `Approved with non-blocking observations`.
12. [`12-direction-final-acceptance.md`](12-direction-final-acceptance.md)
    - aceitação humana final do escopo local e autorização do checkpoint Git,
      sem autorizar binding remoto, importação, corte ou publicação.

## Decisão atual

O núcleo D1 local para check-ins e XP foi implementado, corrigido, revisado e
aceito. O modo `notion` continua padrão e nenhuma projeção automática foi
adicionada. Dados reais, auditoria/importação legada, binding remoto, corte,
migração remota e publicação continuam pendentes de missões e autorizações
futuras.
