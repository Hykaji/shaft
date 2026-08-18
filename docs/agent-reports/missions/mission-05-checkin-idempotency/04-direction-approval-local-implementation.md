# Aprovação da direção: implementação local do ledger D1

**Data:** 15 de agosto de 2026  
**Missão:** `mission-05-checkin-idempotency`  
**Plano aprovado:** `03-builder-plan-d1-checkin-idempotency.md`  
**Decisão:** Implementação local autorizada  
**Migração remota, dados reais e publicação:** Não autorizados

## Registro

A direção revisou o plano técnico corrigido e confirmou que ele permanece
dentro da arquitetura aprovada em `02-direction-decision-d1.md`.

Foram confirmados no escopo o ajuste de `package.json`, a atualização de
`drizzle/meta/_journal.json` e a prova obrigatória do adapter contra uma
instância D1 local real. O Wrangler 4.92.0 instalado expõe `d1 execute` com
`--local`, `--persist-to`, `--file`, `--command` e `--yes`.

Durante a verificação, o Wrangler tentou gravar seu log global fora do
workspace e recebeu `EPERM`. O harness deve direcionar configuração, logs e
persistência para diretórios temporários próprios e validados, sem reutilizar
`HOME`, `CODEX_HOME` ou dados do usuário. Essa adequação é parte da execução
local e não altera a arquitetura aprovada.

## Limites preservados

- o modo padrão permanece `notion`;
- nenhum owner real será ativado;
- nenhum dado legado será importado;
- nenhum banco remoto será criado ou migrado;
- nenhum schema ou dado do Notion será alterado;
- não haverá push ou publicação;
- qualquer necessidade fora do plano deve retornar à direção.

Como este documento ocupa a posição cronológica `04`, o relatório futuro do
Builder deve usar `05-builder-result-d1-checkin-idempotency.md`. Essa mudança de
nome é apenas organizacional e substitui o nome previsto no plano.
