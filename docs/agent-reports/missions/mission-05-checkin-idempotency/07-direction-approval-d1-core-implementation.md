# Aprovação da direção: implementação local do núcleo D1

**Data:** 15 de agosto de 2026  
**Missão:** `mission-05-checkin-idempotency`  
**Plano aprovado:** `06-builder-plan-d1-core-checkins.md`  
**Decisão:** Implementação local autorizada  
**Dados reais, recursos remotos e publicação:** Não autorizados

## Registro

A direção confirmou que o novo plano aplica integralmente
`05-direction-decision-d1-core.md`: check-ins e XP tornam-se o primeiro domínio
preparado para D1, sem projeção, escrita ou reconciliação automática no Notion.

O escopo local preserva o modo `notion` como padrão durante a transição,
implementa o modo `d1` com falha fechada e exige prova contra D1 local real.
Auditoria legada, importação, ativação remota, backup de corte e publicação
permanecem missões futuras independentes.

A verificação da versão instalada confirmou que o Wrangler 4.92.0 aceita
`WRANGLER_LOG_PATH` como diretório de logs e oferece os comandos locais
previstos. Configuração, logs e persistência dos testes devem permanecer dentro
da raiz temporária validada do harness.

Como este documento ocupa a posição cronológica `07`, o relatório futuro do
Builder deve usar `08-builder-result-d1-core-checkins.md`. Essa alteração é
somente organizacional e substitui o nome previsto no plano.
