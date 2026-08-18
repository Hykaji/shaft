# Decisão da direção: D1 como núcleo e Notion fora do caminho crítico

**Data:** 15 de agosto de 2026  
**Missão:** `mission-05-checkin-idempotency`  
**Decisão:** Arquitetura simplificada aprovada  
**Documentos substituídos:** a projeção automática prevista em
`02-direction-decision-d1.md`, `03-builder-plan-d1-checkin-idempotency.md` e
`04-direction-approval-local-implementation.md`  
**Implementação:** Novo plano do Builder pendente  
**Dados reais, migração remota e publicação:** Não autorizados

## Contexto

A direção reavaliou a complexidade de manter D1 e Notion sincronizados durante
o caminho normal de escrita. Embora o plano anterior definisse apenas o D1
como fonte canônica, a projeção automática introduziria estados de claim,
ambiguidade e reconciliação desproporcionais ao aplicativo pessoal.

## Direção aprovada

1. O D1 será adotado gradualmente como fonte canônica dos dados centrais do
   Shaft.
2. A Missão 5 continuará limitada a check-ins e XP.
3. Depois do corte futuro, novos check-ins serão gravados somente no D1.
4. O Notion não participará do caminho crítico de escrita ou leitura canônica
   de check-ins e XP.
5. Não haverá projeção automática de check-ins para o Notion nesta missão.
6. O Notion permanecerá temporariamente como fonte legada somente leitura até
   a auditoria, importação e ativação verificadas do D1.
7. Exportações, relatórios ou arquivos humanos no Notion poderão ser avaliados
   futuramente como operações assíncronas e opcionais. Falhar nessas operações
   nunca poderá invalidar um dado confirmado no D1.
8. Finanças e treinos serão avaliados para migração em missões próprias, sem
   migração total em uma única etapa.
9. Backup real deverá usar exportação ou snapshot verificável do D1; o Notion
   não será tratado como único mecanismo de backup.

## Consequências para o plano anterior

Devem ser removidos do novo plano:

- estados `pending`, `in_flight`, `ambiguous`, `rejected` e `manual_review` da
  projeção automática;
- claim persistente para `POST /pages`;
- criação do módulo `app/lib/notion-checkin-projection.ts`;
- alterações em `app/lib/notion.ts` destinadas apenas ao transporte
  at-most-once da projeção;
- testes de criação e reconciliação automática no Notion.

Continuam necessários:

- ledger D1 com unicidade por identidade e data;
- normalização e fingerprint determinísticos;
- replay idêntico, conflito explícito e soma canônica de XP;
- ordenação lógica por data e suporte a retroativos;
- gate de owner auditado/importado antes do modo D1;
- modo legado `notion` durante preparação e migração;
- prova obrigatória com D1 local real;
- separação entre implementação local, auditoria/importação, binding remoto e
  publicação.

Os documentos anteriores permanecem preservados como histórico da decisão. O
Builder deve produzir um novo plano que os substitua para fins de
implementação.
