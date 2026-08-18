# Missão 06: preparação da migração dos check-ins legados

**Status:** Fase local concluída e aceita
**Fonte real:** Não autorizada
**D1 remoto:** Não autorizado
**Corte/publicação:** Não autorizados

## Objetivo

Preparar uma migração auditável, idempotente e reversível dos check-ins e do XP
legados no Notion para o núcleo D1 aceito na Missão 5.

## Registro cronológico

1. [`01-builder-plan-checkin-migration-preparation.md`](01-builder-plan-checkin-migration-preparation.md)
   - mapeamento esperado, anomalias, snapshot, manifesto, importação,
     reconciliação, backup, rollback e fases de autorização.
2. [`02-direction-approval-local-tooling.md`](02-direction-approval-local-tooling.md)
   - aprovação somente do tooling local com fixtures, decisões históricas
     mantidas em aberto e proibição de acesso a dados ou recursos reais.
3. [`03-builder-result-local-migration-tooling.md`](03-builder-result-local-migration-tooling.md)
   - implementação e validação do tooling local aprovado.
4. [`04-reviewer-review-local-migration-tooling.md`](04-reviewer-review-local-migration-tooling.md)
   - veredito `Changes requested` com dois bloqueadores `High` sobre integridade
     do manifesto e redirects do POST local.
5. [`05-builder-correction-artifact-integrity-and-redirects.md`](05-builder-correction-artifact-integrity-and-redirects.md)
   - correção limitada aos dois bloqueadores, com rederivação integral, hash de
     aprovação independente e recusa de redirects; pronta para nova revisão.
6. [`06-reviewer-rereview-artifact-integrity-and-redirects.md`](06-reviewer-rereview-artifact-integrity-and-redirects.md)
   - veredito `Approved with non-blocking observations`; 319 adulterações e 20
     combinações de redirect recusadas antes de qualquer destino protegido.
7. [`07-direction-final-acceptance.md`](07-direction-final-acceptance.md)
   - aceitação humana final somente da fase local e autorização do checkpoint;
     dados reais, D1 remoto, corte e deploy permanecem proibidos.

## Limite atual

Esta missão está na fase local. Nenhum dado pessoal real será consultado,
exportado ou importado. O modo padrão continua `notion`, e qualquer auditoria
real, criação de recurso, importação, prontidão ou corte exigirá decisão
posterior registrada nesta pasta.
