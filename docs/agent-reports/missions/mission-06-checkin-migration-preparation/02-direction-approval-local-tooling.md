# Direção: aprovação do tooling local da Missão 6

**Data:** 15 de agosto de 2026
**Plano:** `01-builder-plan-checkin-migration-preparation.md`
**Decisão:** Implementação local autorizada com ajustes

## Escopo autorizado

A Direção autoriza somente a fase B do plano: parser estrito, auditoria,
manifesto, importação e reconciliação exercitados com fixtures sintéticas e D1
local real via Wrangler.

O tooling deve ser determinístico, falhar fechado, não depender de credenciais
reais e impedir seleção acidental de D1 remoto. O importador deve consumir
somente snapshot e manifesto aprovados, nunca consultar o Notion.

## Decisões desta etapa

1. `legacy_observed_count` representa a contagem canônica aprovada depois da
   deduplicação. A contagem bruta e todos os aliases permanecem no manifesto.
2. `Passeio com cachorro = false` pode produzir candidato de zero minuto.
   Para `true`, 10 ou 20 são apenas representantes do limiar de XP, nunca uma
   reconstrução factual dos minutos. A ferramenta deve registrar a inferência
   como lossy e bloquear casos ambíguos até decisão humana.
3. A ferramenta deve calcular e apresentar lado a lado o `XP do dia` legado e
   o XP recalculado. Divergência é bloqueante; nenhuma das duas políticas é
   declarada canônica antes da auditoria real e da decisão humana.
4. Mapeamento de owner real, destino de backup, retenção e janela de freeze
   continuam adiados. Fixtures usam somente identidades falsas locais.

## Ajuste de fase

O acesso real ao Notion não faz parte da implementação autorizada. Nesta fase,
implementar apenas o contrato de entrada por snapshot e fontes falsas
injetáveis. Um comando/conector capaz de consultar o Notion real será criado e
revisado somente após autorização específica da fase C.

O tooling local deve recusar:

- item com revisão ou bloqueador não resolvido;
- manifesto ou snapshot com hash divergente;
- owner fora do mapa local aprovado;
- tentativa de D1 remoto;
- retomada com batch ou manifesto diferente;
- linha existente incompatível;
- alteração no modo padrão do aplicativo.

## Arquivos permitidos

- `scripts/checkin-migration/audit-checkins.mjs`
- `scripts/checkin-migration/import-checkins-d1.mjs`
- `scripts/checkin-migration/reconcile-checkins-d1.mjs`
- módulos auxiliares sob `scripts/checkin-migration/lib/`
- `db/checkin-migration.ts`
- testes, helpers e fixtures locais sob `tests/`
- `package.json`, somente para comandos focais e inclusão na suíte
- relatórios desta missão

Não criar ainda o exportador real do Notion. Não alterar schema, migrações,
rotas, autenticação, bindings, `.openai/hosting.json`, `app/lib/notion.ts` ou o
modo padrão.

## Validação obrigatória

- testes puros de parsing, hashes, anomalias, duplicatas e decisões lossy;
- D1 local real para importação, replay, retomada, conflito, reconciliação e
  rollback transacional;
- prova de que unresolved items e target remoto são rejeitados;
- lint, build e regressões das Missões 3, 4 e 5;
- suíte completa sem skips dos testes D1 obrigatórios.

Após implementar, o Builder deve criar
`03-builder-result-local-migration-tooling.md` e aguardar revisão independente.

Nenhum commit, push, deploy, publicação, migração remota ou acesso a dados
reais está autorizado nesta etapa.
