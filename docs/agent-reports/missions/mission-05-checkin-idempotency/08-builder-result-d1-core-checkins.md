# Resultado do Builder: núcleo D1 local para check-ins e XP

**Data:** 15 de agosto de 2026  
**Missão:** `mission-05-checkin-idempotency`  
**Autoridade:** `05-direction-decision-d1-core.md`, `06-builder-plan-d1-core-checkins.md` e `07-direction-approval-d1-core-implementation.md`  
**Papel:** Builder  
**Status:** Pronto para nova revisão

## Resultado

A preparação local do núcleo D1 foi implementada. O modo ausente ou diferente
de `d1` mantém o fluxo legado do Notion; o modo `d1` usa o ledger D1 para
check-ins e XP, sem ler, criar, atualizar ou reconciliar páginas de check-in no
Notion. Semana, finanças e exercícios continuam nos fluxos atuais até suas
missões próprias.

O ledger usa uma restrição física única por `(owner_key, checkin_date)`, payload
normalizado em ordem fixa, fingerprint SHA-256 e `xp_day` imutável. O adapter
executa owner gate, insert condicional, leitura da linha e `SUM(xp_day)` em um
único `D1Database.batch()`. Uma disputa pela mesma data produz exatamente uma
criação; payload idêntico é replay `200` sem novo XP e payload diferente é
conflito `409` sem sobrescrita.

O dashboard D1 deriva o total somente com `SUM(xp_day)` e seleciona o último
check-in por `checkin_date DESC`. Datas simultâneas não atualizam contador
mutável e check-ins retroativos aumentam a soma sem tomar o lugar da data lógica
mais recente.

Binding ausente, schema ausente, owner inexistente/não pronto ou auditoria e
importação ainda não confirmadas falham fechados com `503`, mensagem genérica e
sem XP zero inventado. A migração deixa `checkin_owners` vazia: nenhum owner real
foi criado ou ativado.

## Schema e migração

Foram criadas as duas tabelas do plano:

- `checkin_owners`, com identidade, gate de estado, fingerprint/contagens da
  futura auditoria e timestamps;
- `checkin_ledger`, com payload canônico, `xp_day`, origem, auditoria física e
  somente `legacy_notion_page_id`/`import_batch_id` para proveniência futura.

Índices:

- `uq_checkin_ledger_owner_date` — unicidade canônica por owner/data;
- `uq_checkin_ledger_legacy_notion_page_id` — unicidade parcial da proveniência
  legada nullable.

Não existem campos, estados, filas, claims ou índices de projeção, retry ou
reconciliação automática no Notion.

A geração foi executada uma única vez, com o comando aprovado:

```powershell
.\node_modules\.bin\drizzle-kit.cmd generate --config=drizzle.config.ts --prefix=index --name=checkin_ledger
```

O Drizzle produziu exatamente, sem renomeação manual:

- `drizzle/0000_checkin_ledger.sql`;
- `drizzle/meta/0000_snapshot.json`;
- entrada `0000_checkin_ledger` em `drizzle/meta/_journal.json`.

O SQL e o journal foram inspecionados antes da aplicação local. A migração foi
aplicada somente a bancos efêmeros criados pelo harness. Nada foi aplicado a D1
remoto.

## Modos e identidade

- `SHAFT_CHECKIN_STORE` ausente ou `notion`: executa os ramos legados
  preservados, sem exigir D1.
- `SHAFT_CHECKIN_STORE=d1`: check-in e XP usam somente o binding `DB` e nunca
  fazem fallback para check-ins do Notion.
- hospedado: owner `chatgpt:<oai-authenticated-user-id>`, resolvido somente após
  o guard existente;
- desenvolvimento loopback não produtivo: `local:shaft-owner`, reutilizando a
  exceção já definida pela Missão 3.

O guard `authorizeShaftApiRequest` continua sendo a primeira operação das duas
rotas, antes da leitura do corpo, da identidade, do D1 e do Notion. O teste do
Worker compilado confirma `401` antes de I/O e `503` seguro para usuário
autorizado sem binding.

## Arquivos modificados

- `.openai/hosting.json` — binding lógico local `d1: "DB"`;
- `db/schema.ts` — tabelas, checks e índices;
- `db/index.ts` — acesso assíncrono e seguro ao binding D1;
- `app/api/notion/checkins/route.ts` — seleção de modo e escrita D1;
- `app/api/notion/dashboard/route.ts` — leitura D1 de check-in/XP;
- `app/ShaftApp.tsx` — mensagem de replay sem nova concessão;
- `package.json` — `test:checkin-idempotency` e inclusão obrigatória no
  `npm test`;
- `drizzle/meta/_journal.json` — entrada gerada da migração;
- `tests/shaft-access-policy.test.mjs` — guard compilado, binding ausente e zero
  rede remota;
- `docs/agent-reports/missions/mission-05-checkin-idempotency/README.md` — estado
  e registro cronológico.

## Arquivos criados

- `app/lib/checkin-payload.ts`;
- `app/lib/checkin-identity.ts`;
- `app/lib/checkin-service.ts`;
- `db/checkins.ts`;
- `tests/checkin-idempotency.test.mjs`;
- `tests/helpers/wrangler-d1-harness.mjs`;
- `tests/fixtures/checkin-d1-worker.ts`;
- `drizzle/0000_checkin_ledger.sql`;
- `drizzle/meta/0000_snapshot.json`;
- este relatório.

`app/lib/notion-checkin-projection.ts` não foi criado. `app/lib/notion.ts`,
autenticação, allowlists, roadmap, lockfiles, schema/dados do Notion e documentos
01 a 07 não foram alterados por esta implementação.

## Prova D1 local real

`tests/helpers/wrangler-d1-harness.mjs` usa o Wrangler 4.92.0 já instalado e o
adapter de produção `createD1CheckinLedger`. Cada execução:

1. cria uma raiz exclusiva com `mkdtemp` sob `os.tmpdir()`;
2. grava configuração em `<temp>/config`, logs em `<temp>/logs`, persistência em
   `<temp>/state` e configuração de usuário em `<temp>/xdg`;
3. define `WRANGLER_LOG_PATH` para o diretório temporário de logs, desativa
   métricas e usa `--local`, config e `--persist-to` explícitos;
4. aplica a migração e cria owners apenas no banco efêmero de teste;
5. inicia o fixture em `127.0.0.1`, que injeta `env.DB` no adapter de produção;
6. encerra e aguarda o Wrangler/workerd;
7. valida que a raiz permanece sob o diretório temporário, confirma o prefixo e
   a ausência de links/reparse points e executa uma única remoção sem força.

A data de compatibilidade temporária é `2026-05-22`, a data máxima suportada
pelo binário local do workerd instalado. Nenhum config ou estado Wrangler fica
no repositório ou no perfil global. A inspeção final encontrou zero raiz
`shaft-checkin-d1-*` e zero processo Wrangler/workerd remanescente.

As chamadas HTTP do teste são validadas como `http://127.0.0.1`. O Wrangler roda
com `--local`, métricas desativadas e UUID de banco fictício. O teste compilado
substitui `globalThis.fetch` por uma sentinela e confirma zero chamadas. Não
houve acesso ao Notion real, D1 remoto ou outro serviço.

## Testes e validações

### Lint direcionado

```powershell
& 'C:\Program Files\nodejs\npm.cmd' exec -- eslint app/lib/checkin-payload.ts app/lib/checkin-identity.ts app/lib/checkin-service.ts db/schema.ts db/index.ts db/checkins.ts app/api/notion/checkins/route.ts app/api/notion/dashboard/route.ts app/ShaftApp.tsx tests/checkin-idempotency.test.mjs tests/helpers/wrangler-d1-harness.mjs tests/fixtures/checkin-d1-worker.ts tests/shaft-access-policy.test.mjs
```

Resultado final: exit code `0`, sem erros ou avisos.

### Lint amplo

```powershell
& 'C:\Program Files\nodejs\npm.cmd' run lint -- --ignore-pattern work
```

Resultado: exit code `0`, com `work` excluído explicitamente.

### Suíte focal D1

```powershell
& 'C:\Program Files\nodejs\npm.cmd' run test:checkin-idempotency
```

Resultado final: `14` testes aprovados, zero falhas e zero skip. Foram
exercitados:

- normalização, fingerprint e adapter falso;
- zero referência ao check-in do Notion nos ramos D1;
- concorrência real de 2, 10 e 100 requests idênticos;
- replay, conflito e preservação da linha original;
- owners e datas simultâneas sem lost update;
- check-in retroativo e ordem lógica;
- unicidade física direta;
- rollback real de `D1Database.batch()`;
- owner não pronto e schema ausente com `503` sem total falso;
- `EXPLAIN QUERY PLAN` usando o índice e `PRAGMA optimize`.

### Build

```powershell
& 'C:\Program Files\nodejs\npm.cmd' run build
```

Resultado: exit code `0`; as quatro rotas do aplicativo foram geradas.

### Regressões das Missões 3 e 4

```powershell
& 'C:\Program Files\nodejs\node.exe' --test tests/notion-finance-pagination.test.mjs tests/shaft-access-policy.test.mjs
```

Resultado: `21` testes aprovados. Permanecem cobertos guard antes de I/O,
`query` single-page, paginação financeira, resposta incompleta de 10.000
registros, sanitização de sentinelas e ausência de saldo parcial.

### Suíte completa

```powershell
& 'C:\Program Files\nodejs\npm.cmd' test
```

Resultado final: build aprovado e `41` testes aprovados, incluindo
obrigatoriamente `tests/checkin-idempotency.test.mjs`, sem falha, cancelamento,
skip ou pendência.

## Ocorrências durante a validação

A primeira tentativa focal não iniciou o Worker porque a data temporária
`2026-08-15` excedia o máximo `2026-05-22` do runtime instalado. A configuração
efêmera foi corrigida para a data informada pelo próprio workerd, sem dependência
ou mudança arquitetural.

Na primeira suíte completa paralela, o import estático de `cloudflare:workers`
alcançou testes Node do ramo Notion e o workerd demorou a liberar dois arquivos
SQLite temporários. O binding passou a ser importado somente quando o ramo D1 é
executado, e o harness passou a aguardar a finalização normal do runtime antes
da única remoção. As duas raízes órfãs dessa tentativa foram removidas somente
após inspeção explícita de caminho, tipo, quantidade, processos e reparse
points. Todas as validações finais passaram e não restou processo ou raiz.

## Inspeção de Git e escopo

O Git não está no `PATH`; foi usado somente para inspeção o executável nativo do
runtime do Codex. Foram executados `git status --short`, `git diff --stat`,
`git diff --name-only`, inventário de não rastreados, diff direcionado e
`git diff --check`.

`docs/roadmap.md` já aparece modificado pela direção humana e foi preservado.
A pasta documental da Missão 5 já está não rastreada como um conjunto; esta
etapa tocou nela somente o README e o novo resultado 08. Nenhum arquivo foi
staged. Não houve commit, push, merge, migração remota, importação ou publicação.

Não foram adicionadas dependências, e nenhum lockfile foi alterado. O diff não
inclui `app/lib/notion.ts`, autenticação, allowlists, configurações fora do
binding lógico aprovado, schema/dados do Notion ou domínios não autorizados.

## Limitações e próximos gates

- O modo padrão permanece `notion`; portanto as limitações legadas continuam
  até o corte aprovado.
- Nenhum owner real está `ready`; ativar `d1` antes de auditoria/importação
  falhará corretamente com `503`.
- Auditoria, importação legada, binding remoto, backup/snapshot, corte e
  publicação continuam fora desta implementação.
- Finanças, treinos e outros domínios continuam no Notion até missões próprias.
- O Notion não receberá projeção automática de novos check-ins após o corte.

## Handoff ao Reviewer

Revisar prioritariamente:

1. schema, migração, checks e ausência de estados de projeção;
2. atomicidade do batch e a restrição única sob 2/10/100 requests;
3. replay, conflito e soma canônica de XP;
4. gate de owner/importação e falha fechada sem XP zero;
5. ordem por `checkin_date` e retroatividade;
6. guard antes de corpo/D1/Notion;
7. separação exata entre os ramos `notion` e `d1`;
8. isolamento e cleanup do Wrangler local;
9. regressões completas das Missões 3 e 4;
10. diff, arquivos não rastreados e preservação das mudanças humanas.

**Estado: Pronto para nova revisão.** Dados reais, recursos remotos, corte e
publicação continuam não autorizados.
