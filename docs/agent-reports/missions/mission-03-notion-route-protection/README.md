# Missão 03: proteção server-side das rotas do Notion

**Status:** Aceita; commit local autorizado  
**Builder:** Implementação e validação concluídas  
**Reviewer:** Aprovado com observações não bloqueadoras  
**Aceitação humana:** Aprovada em 14 de agosto de 2026  
**Publicação:** Não autorizada

## Objetivo

Impedir que visitantes anônimos ou usuários autenticados não autorizados leiam
ou modifiquem os dados pessoais do Notion por meio das rotas internas do Shaft,
sem substituir a autenticação administrada pelo OpenAI Sites.

## Limites da missão

A missão trata apenas da autorização server-side das quatro rotas ativas do
Notion e de seus testes e documentação. Não altera o schema do Notion, banco de
dados, interface, regras de XP, paginação financeira, publicação ou política
externa de acesso do Sites.

## Registro cronológico

1. [`01-builder-plan-notion-route-protection.md`](01-builder-plan-notion-route-protection.md)
   - investigação e plano do Builder, aprovado pela direção humana.
2. [`02-builder-result-notion-route-protection.md`](02-builder-result-notion-route-protection.md)
   - implementação, validação e handoff do Builder.
3. [`03-reviewer-review-notion-route-protection.md`](03-reviewer-review-notion-route-protection.md)
   - revisão independente e parecer com observações não bloqueadoras.
4. [`decision.md`](decision.md) - aceitação humana final e autorização para o
   commit local.

A missão foi aceita e o commit local foi autorizado. Push, merge remoto,
configuração hospedada e publicação permanecem não autorizados.
