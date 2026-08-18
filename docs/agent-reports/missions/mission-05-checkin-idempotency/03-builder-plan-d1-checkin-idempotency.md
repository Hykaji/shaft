# Missão 05 — plano técnico ajustado para ledger D1

**Papel:** Builder  
**Data:** 15/08/2026  
**Estado:** plano corrigido e pronto para implementação local; implementação ainda não iniciada  
**Decisão de direção aplicada:** D1 canônico para check-ins e XP; Notion como
projeção eventualmente consistente e `XP total` como snapshot informativo

## 1. Resultado do ajuste

A implementação confiável cabe no scaffold atual sem nova dependência, sem
alterar o schema do Notion e sem serviço externo adicional. O D1 já está
previsto no projeto, o Drizzle e o Wrangler já estão instalados, o Worker já
declara `DB: D1Database`, e o build já copia `drizzle/` para
`dist/.openai/drizzle/`.

O desenho separa quatro trabalhos que não podem ser confundidos:

1. **Implementação local segura:** schema, adapter, serviço, projeção, binding
   lógico local, migração versionada e testes locais. É o único trabalho que
   poderá ser executado após aprovação deste plano.
2. **Auditoria e migração dos dados legados:** trabalho futuro, inicialmente
   somente leitura, com relatório e decisão humana antes de qualquer importação.
3. **Ativação do binding remoto:** criação/anexação de D1 e aplicação da
   migração em ambiente remoto, em missão própria e sem publicar a aplicação.
4. **Publicação:** corte controlado para D1 e publicação, também em missão
   própria, somente depois da importação verificada.

Nenhum item das fases 2 a 4 será executado na implementação local desta missão.

## 2. Evidência do comportamento e do scaffold atuais

### 2.1 Check-in e XP atuais

A rota `app/api/notion/checkins/route.ts`:

- preserva o guard server-side antes de consultar o Notion;
- consulta por `Data` e depois cria a página em operações separadas, mantendo a
  janela de concorrência já documentada no plano inicial;
- seleciona o XP anterior pela página com `created_time` mais recente;
- persiste `XP do dia`, `XP total` e `Nível` diretamente no Notion;
- devolve conflito para um registro já visível, mas não distingue replay
  idêntico de payload divergente;
- usa `createPage`, cujo transporte atual repete automaticamente uma resposta
  `429`. Essa repetição não é aceitável para o `POST /pages` at-most-once.

O dashboard também lê o último check-in por `created_time` e toma o `XP total`
dessa página como total canônico. Isso falha para check-ins retroativos e não
oferece serialização entre datas concorrentes.

### 2.2 Scaffold D1 verificado

- `db/schema.ts` está vazio de propósito.
- `db/index.ts` obtém `env.DB` de `cloudflare:workers` e falha quando o binding
  não existe.
- `.openai/hosting.json` contém atualmente `"d1": null`.
- `vite.config.ts` interpreta o valor de `d1` como nome do binding e, quando ele
  existe, cria a configuração D1 local com um `database_id` local fictício.
- `worker/index.ts` já tipa `DB: D1Database`.
- `drizzle.config.ts` aponta para `db/schema.ts`, saída `drizzle/` e dialeto
  SQLite.
- `drizzle/meta/_journal.json` está sem migrações.
- `package.json` enumera individualmente os três testes atuais no script
  `npm test`; portanto o novo teste não entraria na suíte sem alteração
  explícita desse arquivo.
- a versão instalada do `drizzle-kit` aceita `--name` e `--prefix`, sendo
  `index` o prefixo padrão.
- o Wrangler 4.92.0 instalado oferece `d1 execute --local --persist-to` e
  `wrangler dev --local --persist-to`, suficientes para preparar e servir um D1
  local isolado sem dependência adicional.
- `drizzle-orm`, `drizzle-kit`, `wrangler` e os tipos necessários já são
  dependências do projeto.
- o plugin de build já copia `.openai/hosting.json` e a árvore `drizzle/` para o
  artefato final.

Não é necessário alterar `worker/index.ts`, `vite.config.ts`,
`drizzle.config.ts`, `next.config.ts`, lockfiles ou dependências.

## 3. Contrato de identidade autorizada

A identidade canônica será uma chave opaca e estável, nunca o e-mail:

- requisição hospedada autorizada: `chatgpt:<oai-authenticated-user-id>`;
- desenvolvimento local permitido pelo guard existente:
  `local:shaft-owner`.

Uma função `resolveAuthorizedCheckinOwner(request)` será chamada **somente
depois** de `authorizeShaftApiRequest(request)` retornar sucesso. Ela reutilizará
o mesmo teste de loopback não produtivo da Missão 3 e lerá o ID da própria
requisição. Não haverá segundo caminho de autorização nem relaxamento de
allowlist.

Embora o produto seja pessoal nesta fase, todas as unicidades, somas e buscas
serão particionadas por `owner_key`. Assim, o schema não precisará ser refeito
para isolar identidades no futuro.

## 4. Schema completo do ledger

### 4.1 Tabela `checkin_owners`

Uma linha de ativação por identidade impede que um D1 vazio ou parcialmente
importado seja apresentado como XP zero.

| Coluna | Tipo e regra | Uso |
|---|---|---|
| `owner_key` | `TEXT PRIMARY KEY` | identidade opaca canônica |
| `ledger_state` | `TEXT NOT NULL`, `CHECK` em `awaiting_audit`, `importing`, `ready`, `blocked` | gate explícito de leitura e escrita canônicas |
| `legacy_audit_fingerprint` | `TEXT NULL` | SHA-256 do manifesto aprovado da auditoria |
| `legacy_observed_count` | `INTEGER NULL CHECK >= 0` | quantidade observada na auditoria |
| `legacy_imported_count` | `INTEGER NULL CHECK >= 0` | quantidade efetivamente importada |
| `audit_completed_at` | `TEXT NULL` | instante UTC da auditoria aprovada |
| `activated_at` | `TEXT NULL` | instante UTC da mudança para `ready` |
| `created_at` | `TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP` | auditoria local |
| `updated_at` | `TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP` | auditoria local |

A migração cria somente a tabela. Ela não cria automaticamente o owner e não o
marca como `ready`.

### 4.2 Tabela `checkin_ledger`

| Coluna | Tipo e regra | Uso |
|---|---|---|
| `ledger_id` | `TEXT PRIMARY KEY` | UUID gerado antes do batch |
| `owner_key` | `TEXT NOT NULL`, FK para `checkin_owners.owner_key` | partição da identidade |
| `checkin_date` | `TEXT NOT NULL` | data civil normalizada `YYYY-MM-DD` |
| `payload_version` | `INTEGER NOT NULL DEFAULT 1 CHECK >= 1` | versionamento da forma canônica |
| `payload_fingerprint` | `TEXT NOT NULL CHECK length = 64` | SHA-256 hexadecimal |
| `payload_json` | `TEXT NOT NULL` | JSON canônico usado na comparação e auditoria |
| `day_type` | `TEXT NOT NULL` | valor normalizado atual |
| `mood` | `TEXT NOT NULL` | valor normalizado atual |
| `energy` | `INTEGER NOT NULL CHECK BETWEEN 1 AND 10` | energia normalizada |
| `sleep_status` | `TEXT NOT NULL` | status normalizado atual |
| `training_status` | `TEXT NOT NULL` | status normalizado atual |
| `study_status` | `TEXT NOT NULL` | status normalizado atual |
| `audiobook_minutes` | `INTEGER NOT NULL CHECK BETWEEN 0 AND 600` | minutos normalizados |
| `dog_minutes` | `INTEGER NOT NULL CHECK BETWEEN 0 AND 300` | minutos normalizados |
| `music_minutes` | `INTEGER NOT NULL CHECK BETWEEN 0 AND 600` | minutos normalizados |
| `win` | `TEXT NOT NULL` | texto limpo, máximo atual |
| `difficulty` | `TEXT NOT NULL` | texto limpo, máximo atual |
| `next_step` | `TEXT NOT NULL` | texto limpo, máximo atual |
| `summary` | `TEXT NOT NULL` | resumo final, inclusive fallback atual |
| `xp_day` | `INTEGER NOT NULL CHECK >= 0` | concessão imutável daquele check-in |
| `origin` | `TEXT NOT NULL CHECK` em `live`, `legacy_import` | procedência |
| `notion_state` | `TEXT NOT NULL CHECK` nos estados da seção 9 | estado da projeção |
| `notion_post_claimed` | `INTEGER NOT NULL DEFAULT 0 CHECK IN (0,1)` | trava persistente de at-most-once |
| `notion_attempt_started_at` | `TEXT NULL` | instante UTC do claim |
| `notion_page_id` | `TEXT NULL` | página confirmada ou conciliada |
| `notion_snapshot_xp_total` | `INTEGER NULL CHECK >= 0` | snapshot enviado ao Notion, nunca canônico |
| `notion_http_status` | `INTEGER NULL CHECK BETWEEN 100 AND 599` | status seguro, quando conhecido |
| `notion_error_code` | `TEXT NULL` | código interno sanitizado, sem mensagem remota |
| `notion_last_checked_at` | `TEXT NULL` | última reconciliação somente leitura |
| `notion_synced_at` | `TEXT NULL` | confirmação da projeção |
| `created_at` | `TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP` | ordem física, não ordem lógica |
| `updated_at` | `TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP` | manutenção da projeção |

Os valores permitidos para status, humor e tipo de dia serão também `CHECK`s
equivalentes às allowlists atuais. A data terá `CHECK` estrutural de dez
caracteres, e a validação de calendário real ocorrerá antes do SQL.

Não existirá coluna `xp_total` canônica. Duplicá-la criaria exatamente o risco
de lost update que esta missão elimina.

### 4.3 Índices e unicidades

1. `uq_checkin_ledger_owner_date` — `UNIQUE(owner_key, checkin_date)`. É a
   barreira central contra duplicata e dupla concessão.
2. `uq_checkin_ledger_notion_page_id` — índice único parcial sobre
   `notion_page_id WHERE notion_page_id IS NOT NULL`. Impede que duas entradas
   adotem a mesma página durante reconciliação.
3. `idx_checkin_ledger_notion_work` — índice parcial sobre
   `(notion_state, updated_at)` para estados diferentes de `synced`. Sustenta a
   fila de inspeção/reconciliação.

O índice único `(owner_key, checkin_date)` também atende `SUM(xp_day)` por owner
e a busca do último check-in por data em ordem reversa. Não será criado índice
redundante sem evidência de plano de consulta.

## 5. Normalização e fingerprint determinístico

A normalização será extraída da rota para uma função pura e será aplicada uma
única vez antes de acessar D1 ou Notion. Ela preservará integralmente:

- allowlists e defaults atuais de status, humor e tipo do dia;
- fuso `America/Sao_Paulo` para a data default;
- limites atuais de energia e minutos;
- `trim`, limites de texto, resumo fallback e regras atuais de XP;
- XP nunca negativo e 200 XP por nível.

O objeto canônico versão 1 terá chaves declaradas em ordem fixa:

`payloadVersion`, `date`, `dayType`, `mood`, `energy`, `sleep`, `training`,
`study`, `audiobookMinutes`, `dogMinutes`, `musicMinutes`, `win`, `difficulty`,
`nextStep`, `summary`.

Regras adicionais:

- nenhum `undefined`, `NaN`, `Infinity` ou campo desconhecido entra no objeto;
- números são inteiros já limitados;
- strings são as strings normalizadas finais;
- `JSON.stringify` é aplicado ao objeto construído nessa ordem fixa;
- o fingerprint é SHA-256 via Web Crypto, em hexadecimal minúsculo com 64
  caracteres;
- a data participa do fingerprint; o `owner_key` fica fora do conteúdo e na
  chave única, evitando expor identidade no payload armazenado.

Não será adicionada biblioteca de canonical JSON ou hashing.

## 6. Replay, conflito e contrato HTTP

Para a mesma combinação `(owner_key, checkin_date)`:

- **primeira gravação:** insere o ledger, concede `xp_day` uma única vez e
  responde `200` com `replayed: false`;
- **mesmo fingerprint:** responde `200` com o registro e o total atuais,
  `replayed: true`, `leveledUp: false`; não insere, não concede XP e não cria
  nova página no Notion;
- **fingerprint diferente:** responde `409` com mensagem genérica de conflito;
  não altera o registro canônico nem a projeção;
- **D1 ausente, schema ausente ou owner não pronto em modo D1:** responde `503`
  com mensagem segura; não chama o Notion;
- **falha inesperada do D1:** responde `503`, sem payload interno, sem fallback
  de escrita e sem chamada ao Notion.

O retorno de sucesso mantém `xpDay`, `xpTotal`, `level` e `leveledUp`, acrescenta
`replayed` e um estado público reduzido de projeção, por exemplo
`projection: "synced" | "pending"`. Estados internos e detalhes remotos não
serão expostos.

A interface deverá mostrar “Check-in já salvo · XP mantido” no replay, nunca
“+N XP”. Uma projeção pendente não transforma o salvamento canônico em falha,
mas a mensagem não poderá afirmar que o Notion foi confirmado.

## 7. Operação atômica que impede dupla concessão

O adapter D1 executará um único `DB.batch()` com statements preparados e
parâmetros vinculados:

```sql
SELECT ledger_state
FROM checkin_owners
WHERE owner_key = ?;

INSERT INTO checkin_ledger (...)
SELECT ...
WHERE EXISTS (
  SELECT 1 FROM checkin_owners
  WHERE owner_key = ? AND ledger_state = 'ready'
)
ON CONFLICT(owner_key, checkin_date) DO NOTHING
RETURNING ledger_id;

SELECT ledger_id, payload_fingerprint, xp_day, notion_state, ...
FROM checkin_ledger
WHERE owner_key = ? AND checkin_date = ?;

SELECT COALESCE(SUM(xp_day), 0) AS xp_total
FROM checkin_ledger
WHERE owner_key = ?;
```

No D1, os statements de `batch()` são executados sequencialmente dentro de uma
transação: uma falha aborta e reverte o lote. A unicidade é decidida pelo banco,
e não por um `SELECT` anterior na aplicação.

A interpretação ocorre somente depois do commit:

- sem owner `ready`: indisponível, sem insert;
- `RETURNING` presente: criação nova;
- `RETURNING` vazio e fingerprint igual: replay;
- `RETURNING` vazio e fingerprint diferente: conflito.

O `xp_total` vem do `SUM` no mesmo lote da decisão. Para uma criação nova,
`previousTotal = xpTotal - xpDay`; o nível anterior e o atual são derivados
desses valores. Para replay, `leveledUp` é sempre falso.

## 8. Concorrência entre datas, ordem lógica e retroatividade

Duas datas diferentes não disputam a mesma chave única. Ainda assim, seus
batches de escrita são serializados pelo D1 e cada resposta observa um estado
confirmado do ledger. Como não existe contador mutável:

- nenhuma requisição lê `xp_total`, soma localmente e sobrescreve outra;
- o estado final é sempre `SUM(xp_day)` de todas as linhas daquele owner;
- a ordem de chegada só pode mudar qual resposta observa primeiro o total
  intermediário; nunca perde XP persistido.

O dashboard obterá:

- total: `COALESCE(SUM(xp_day), 0)` por `owner_key`;
- último check-in lógico: `ORDER BY checkin_date DESC LIMIT 1`;
- nível: `floor(xp_total / 200) + 1`.

`created_at` serve apenas para auditoria física. `created_time` do Notion deixa
de participar da ordem canônica. Um check-in retroativo adiciona seu `xp_day` à
soma, mas não substitui o check-in de maior data mostrado no dashboard. Se read
replication vier a ser ativado, as leituras canônicas após escrita usarão sessão
`first-primary`/consistência sequencial; não será aceita leitura possivelmente
atrasada para confirmar uma gravação.

## 9. Máquina de estados da projeção no Notion

### 9.1 Estados persistidos

- `pending`: nenhuma tentativa de `POST /pages` foi iniciada;
  `notion_post_claimed = 0`.
- `in_flight`: a única tentativa foi reivindicada atomicamente e pode estar em
  trânsito; `notion_post_claimed = 1`.
- `synced`: uma resposta 2xx forneceu `notion_page_id`, ou uma reconciliação
  encontrou exatamente a página correspondente.
- `ambiguous`: timeout, erro de rede, resposta 5xx, corpo 2xx inválido ou
  processo interrompido depois do claim; a página pode ou não existir.
- `rejected`: resposta remota definitiva, inclusive 4xx/429, sem repetição
  automática. Mantém somente status e código sanitizado.
- `manual_review`: reconciliação encontrou múltiplos candidatos, conteúdo
  divergente ou outra situação que exige decisão humana.

`origin = legacy_import` pode entrar como `synced`, com a página legada
adotada e sem claim de POST.

### 9.2 Claim at-most-once

Antes de criar a projeção, o processo fará:

```sql
UPDATE checkin_ledger
SET notion_state = 'in_flight',
    notion_post_claimed = 1,
    notion_attempt_started_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE ledger_id = ?
  AND notion_state = 'pending'
  AND notion_post_claimed = 0
RETURNING ledger_id;
```

Somente quem recebe o `RETURNING` pode executar `POST /pages`. Replay ou worker
concorrente que não recebe a linha não chama o Notion.

O caminho de criação terá transporte próprio sem o retry automático de `429`
existente em `notionRequest`. O retry permanece intocado para consultas
single-page, paginação financeira e operações fora desta projeção.

Se o processo cair em `in_flight`, qualquer inspeção posterior o promove para
`ambiguous`; jamais o retorna a `pending`. Os estados `in_flight`, `synced`,
`ambiguous`, `rejected` e `manual_review` não autorizam segundo POST.

### 9.3 Reconciliação sem segundo POST

A reconciliação futura será somente leitura no Notion, filtrada por `Data` e
comparada com todos os campos disponíveis no schema atual:

- um candidato exato: adota o `page_id` e muda para `synced`;
- nenhum candidato: permanece `ambiguous`; não cria página;
- múltiplos candidatos ou divergência: muda para `manual_review`;
- nenhuma página é alterada ou excluída automaticamente.

Sem coluna de idempotency key no Notion, não é possível provar por consulta que
um resultado zero após falha ambígua autoriza nova criação. A garantia aprovada
é, portanto, at-most-once: pode faltar uma projeção, mas não haverá segundo POST
automático.

## 10. Dashboard e ausência de D1

O corte será explícito por `SHAFT_CHECKIN_STORE`:

- ausente ou `notion`: modo legado; a rota e o dashboard preservam o fluxo
  atual do Notion. É o default durante implementação, auditoria e importação;
- `d1`: modo canônico novo; check-in e XP vêm exclusivamente do D1, enquanto
  semana, finanças e exercícios continuam nos fluxos atuais do Notion.

Em modo `d1`:

- binding ausente, migração ausente, owner ausente/não `ready` ou falha D1
  produzem `503`; o dashboard não inventa XP zero e a escrita não cai para o
  Notion;
- não existe fallback silencioso para o Notion, pois isso ressuscitaria a fonte
  antiga e poderia divergir do ledger;
- a falha de check-in/XP não pode produzir saldo financeiro parcial nem alterar
  as garantias de paginação da Missão 4.

O modo só será mudado para `d1` no corte futuro, depois da importação validada e
da linha de owner marcada `ready`. Esse gate evita zerar XP ou quebrar o app
durante a preparação.

## 11. Estratégia de implantação em fases

### Fase A — implementação local segura (escopo desta missão após aprovação)

1. Implementar schema, normalização, portas/adapters e serviço.
2. Alterar `.openai/hosting.json` de `"d1": null` para `"d1": "DB"`.
   Esse campo é o nome lógico verificado no scaffold; habilita `env.DB` na
   instância local do plugin. Não contém ID de banco remoto.
3. Gerar e inspecionar a migração local versionada.
4. Manter `SHAFT_CHECKIN_STORE=notion` por default.
5. Testar obrigatoriamente com adapter falso **e** com instância D1 local
   isolada servida pelo Wrangler instalado. Proibir rede real do Notion nos
   testes. Falha ao iniciar o D1 local falha a suíte; não existe skip.
6. Não criar owner `ready`, não importar legado e não publicar.

### Fase B — auditoria e migração legada (missão futura)

1. Congelar um manifesto somente leitura de todos os check-ins do Notion,
   seguindo paginação completa e falhando em resposta incompleta.
2. Relatar duplicatas de data, campos inválidos, datas fora de ordem,
   divergência entre `XP do dia`, `XP total` e a soma recalculada, além de
   páginas sem data.
3. Não corrigir nem excluir nada automaticamente.
4. Solicitar decisão humana para cada ambiguidade.
5. Importar somente o conjunto aprovado, com `origin = legacy_import`,
   `notion_page_id` existente e estado `synced`.
6. Comparar contagens, fingerprints e soma de XP; somente então marcar o owner
   como `ready` na mesma transação de finalização.

### Fase C — ativação remota do binding (missão futura)

1. Criar/anexar o D1 remoto pelo fluxo oficial de Sites.
2. Aplicar a migração remota explicitamente e verificar schema/índices.
3. Executar a auditoria/importação aprovadas contra o banco remoto.
4. Manter a aplicação publicada ainda em modo `notion`.

O formato remoto não será presumido nem escrito agora. O arquivo local continuará
declarando somente o binding lógico `DB`; provisionamento, IDs e associação são
responsabilidade do fluxo remoto futuro.

### Fase D — corte e publicação (missão futura)

1. Colocar somente a escrita de check-in em manutenção breve.
2. Repetir auditoria delta e importar qualquer item aprovado surgido desde o
   manifesto anterior.
3. Verificar contagem, soma e último check-in por data.
4. Marcar owner `ready`, configurar `SHAFT_CHECKIN_STORE=d1` e publicar.
5. Fazer smoke tests autenticados de replay, dashboard e projeção.
6. Encerrar manutenção apenas após evidência objetiva.

## 12. Auditoria e importação futuras

Os artefatos futuros terão caminhos fixos, mas não serão criados nesta etapa:

- `scripts/audit-legacy-checkins.mjs` — somente leitura, produz manifesto;
- `scripts/import-legacy-checkins.mjs` — consome exclusivamente manifesto
  aprovado e exige confirmação explícita de ambiente;
- `docs/agent-reports/missions/mission-05-checkin-idempotency/legacy-audit/README.md`;
- `docs/agent-reports/missions/mission-05-checkin-idempotency/legacy-audit/checkins-manifest.json`;
- `docs/agent-reports/missions/mission-05-checkin-idempotency/legacy-audit/checkins-findings.md`;
- `docs/agent-reports/missions/mission-05-checkin-idempotency/legacy-audit/import-verification.md`.

O manifesto deverá registrar origem, page ID, payload normalizado, fingerprint,
XP observado, XP recalculado e classificação; nunca token ou detalhe secreto.
Importação com duplicata de `(owner, date)`, conflito de fingerprint ou
contagem divergente aborta inteira. Não haverá `UPDATE`/`DELETE` no Notion.

## 13. Rollback

### 13.1 Rollback da implementação local

Antes de qualquer implantação remota, rollback significa reverter somente os
arquivos da Missão 5 e descartar, de forma explícita e manual, a instância D1
local isolada se desejado. Como o default continua `notion`, o aplicativo
permanece no comportamento anterior. Nenhum dado remoto é afetado.

Não será criado comando automático de limpeza e nenhum diretório local será
apagado pelo Builder.

### 13.2 Rollback futuro de implantação

Depois do corte, simplesmente publicar o código antigo pode perder a visibilidade
de check-ins que existam apenas no D1. O runbook futuro deve:

1. bloquear novas escritas;
2. preservar o banco e as migrações — nunca fazer drop automático;
3. identificar todos os eventos desde o corte;
4. reconciliar/projetar cada evento conforme a política at-most-once;
5. só então voltar o modo para `notion` e publicar a versão anterior;
6. manter export e evidências para possível retorno ao D1.

Se houver estado `ambiguous`, o rollback exige decisão humana; não autoriza
segundo POST nem exclusão de página.

## 14. Arquivos exatos da implementação local proposta

### Modificados

- `.openai/hosting.json` — trocar somente `d1: null` por o binding lógico `DB`;
- `db/schema.ts` — tabelas, checks e índices;
- `db/index.ts` — acesso tipado ao binding e classificação segura de
  indisponibilidade/schema ausente;
- `app/api/notion/checkins/route.ts` — guard preservado, modo explícito e serviço
  idempotente;
- `app/api/notion/dashboard/route.ts` — check-in/XP pelo adapter apenas em modo
  D1; demais fontes preservadas;
- `app/lib/notion.ts` — criação at-most-once sem retry automático, sem alterar
  `query` ou `queryAllPages`;
- `app/ShaftApp.tsx` — mensagem correta para replay e projeção pendente, sem
  redesenho;
- `package.json` — incluir `tests/checkin-idempotency.test.mjs` obrigatoriamente
  em `npm test` e adicionar o comando reproduzível
  `test:checkin-idempotency`;
- `drizzle/meta/_journal.json` — receber a entrada `0000` produzida e mantida
  pelo Drizzle Kit;
- `tests/shaft-access-policy.test.mjs` — ampliar o guard compilado para provar
  que D1 e Notion não são chamados sem autorização;
- `docs/agent-reports/missions/mission-05-checkin-idempotency/README.md` — índice
  e estado após resultado futuro.

### Criados

- `app/lib/checkin-payload.ts` — normalização, fingerprint e cálculo puro de XP;
- `app/lib/checkin-identity.ts` — owner key após autorização;
- `app/lib/checkin-service.ts` — orquestração por portas injetáveis;
- `app/lib/notion-checkin-projection.ts` — máquina at-most-once e payload da
  projeção;
- `db/checkins.ts` — adapter D1, batches e consultas canônicas;
- `tests/checkin-idempotency.test.mjs` — matriz nova;
- `tests/fixtures/checkin-d1-worker.ts` — Worker exclusivo de teste que injeta
  `env.DB` no adapter de produção e expõe somente operações do harness local;
- `tests/fixtures/wrangler.checkin-d1.jsonc` — configuração local isolada com
  binding `DB`, sem recurso remoto;
- `drizzle/0000_checkin_ledger.sql` — migração SQL determinística;
- `drizzle/meta/0000_snapshot.json` — snapshot Drizzle correspondente;
- `docs/agent-reports/missions/mission-05-checkin-idempotency/04-builder-result-d1-checkin-idempotency.md` — resultado futuro.

Não se prevê alteração de lockfile, `drizzle.config.ts`, `vite.config.ts`,
`worker/index.ts`, autenticação, schema do Notion, Missões 3 e 4 ou roadmap.

## 15. Artefatos determinísticos de migração

Após aprovação do plano, a geração local usará explicitamente:

```text
drizzle-kit generate --config=drizzle.config.ts --prefix=index --name=checkin_ledger
```

Com o journal vazio atual, os únicos artefatos aceitos serão:

- `drizzle/0000_checkin_ledger.sql`;
- `drizzle/meta/0000_snapshot.json`;
- **modificação de `drizzle/meta/_journal.json`** com a entrada `0000`.

Se a versão instalada produzir nome, prefixo ou conjunto diferente, a geração
será interrompida e o plano revisto; não haverá renome manual que desalinhe o
journal. O SQL gerado será inspecionado para confirmar checks, FKs, índices
parciais e ausência de comandos destrutivos antes de qualquer teste.

## 16. Substituição do D1 em testes

`app/lib/checkin-service.ts` dependerá de uma interface `CheckinLedgerPort`, não
de `env.DB` diretamente. A produção injetará o adapter D1 de `db/checkins.ts`.

Os testes terão duas camadas obrigatórias:

1. **Adapter falso determinístico:** mapa particionado por owner/data, operação
   de reserva serializada e máquina de projeção. Testa o serviço, fingerprints,
   respostas e interleavings sem rede e sem banco remoto.
2. **D1 local isolado real:** executa o adapter de produção contra o runtime D1
   local do Wrangler 4.92.0 e prova unicidade, `batch()`, rollback e concorrência
   no banco. Essa camada integra `npm test`, não admite skip e não é substituída
   por fake ou inspeção do SQL.

O adapter de projeção em testes contará chamadas e nunca fará HTTP real. Um
`fetch` sentinela falhará o teste se qualquer chamada escapar para o Notion.

### 16.1 Harness real e comando reproduzível

`tests/fixtures/wrangler.checkin-d1.jsonc` declarará:

- `main: "checkin-d1-worker.ts"`;
- `compatibility_date` fixa;
- `d1_databases` com `binding: "DB"`, nome exclusivo de teste e UUID local
  fictício no formato já usado pelo scaffold;
- nenhum binding, ID ou acesso remoto.

`tests/fixtures/checkin-d1-worker.ts` importará
`createD1CheckinLedger` de `db/checkins.ts` e receberá `env.DB`. Assim, o teste
exercita o adapter de produção, não uma cópia de seu SQL.

O próprio `tests/checkin-idempotency.test.mjs` criará com `mkdtemp` um diretório
fora do repositório, escolherá uma porta loopback livre e executará, com paths
absolutos e argumentos separados:

```text
node_modules/.bin/wrangler d1 execute DB
  --config tests/fixtures/wrangler.checkin-d1.jsonc
  --local
  --persist-to <diretório-temporário>
  --file drizzle/0000_checkin_ledger.sql
  --yes

node_modules/.bin/wrangler d1 execute DB
  --config tests/fixtures/wrangler.checkin-d1.jsonc
  --local
  --persist-to <diretório-temporário>
  --command <seed-do-owner-local-ready>
  --yes

node_modules/.bin/wrangler dev
  --config tests/fixtures/wrangler.checkin-d1.jsonc
  --local
  --ip 127.0.0.1
  --port <porta-livre>
  --persist-to <diretório-temporário>
  --log-level error
  --show-interactive-dev-session=false
```

No Windows o harness resolve `wrangler.cmd`; nos demais sistemas resolve
`wrangler`. Ele aguardará uma rota de health check com prazo curto, executará as
requisições paralelas por HTTP e, em `after`, encerrará o processo antes de
remover somente o diretório temporário que ele próprio criou. Processo que não
encerra, runtime ausente, timeout ou arquivo de migração ausente falha o teste.

O comando humano reproduzível será:

```text
npm run test:checkin-idempotency
```

O script correspondente será
`node --test tests/checkin-idempotency.test.mjs`. O script `npm test` atual será
ampliado para incluir o mesmo arquivo na lista depois dos três testes existentes.
Logo, o comando dedicado facilita diagnóstico, mas a prova D1 continua
obrigatória na suíte completa.

### 16.2 Provas executadas no D1 local

Contra a mesma instância temporária, o harness deverá confirmar:

1. 2, 10 e 100 requisições idênticas concorrentes resultam em uma única linha
   e uma única concessão de XP;
2. payload divergente na mesma identidade/data preserva a primeira linha;
3. datas diferentes concorrentes persistem todas e `SUM(xp_day)` é exato;
4. o índice único rejeita inserção duplicada direta;
5. um `DB.batch()` de controle em que o segundo statement viola uma constraint
   reverte também o primeiro statement, comprovado por leitura posterior;
6. o batch real do adapter retorna criação, replay e conflito corretamente;
7. a projeção fake recebe no máximo um claim apesar da concorrência.

A prova 5 valida a semântica transacional do runtime local; as provas 1, 2, 3 e
6 validam o adapter de produção usando essa semântica. Nenhuma delas chama o
Notion.

## 17. Matriz de testes proposta

| Área | Cenário | Evidência exigida |
|---|---|---|
| normalização | defaults, limites, textos, data e resumo atuais | payload canônico estável |
| fingerprint | mesma semântica em reenvios | SHA-256 idêntico |
| fingerprint | qualquer campo normalizado diferente | SHA-256 diferente |
| replay sequencial | dois payloads idênticos, mesma data | uma linha, XP uma vez, segundo `replayed` |
| replay concorrente | 2, 10 e 100 requisições idênticas | uma linha, um claim de projeção, um XP |
| conflito | mesma identidade/data, payload diferente | `409`, original intacto, zero POST adicional |
| isolamento | mesma data, owners diferentes | duas linhas isoladas e somas independentes |
| datas concorrentes | datas A e B simultâneas | duas linhas, soma exata, sem lost update |
| retroatividade | inserir data antiga depois da nova | soma aumenta; último lógico continua a maior data |
| nível | cruzamento de 200 XP | nível derivado e apenas criação relata subida |
| D1 ausente | modo D1 sem binding | `503`, nenhum Notion, nenhum XP inventado |
| schema ausente | binding sem migração | `503` sanitizado, nenhum Notion |
| owner não pronto | `awaiting_audit`/`importing`/`blocked` | `503`, nenhuma escrita |
| rollback do batch | statement forçado a falhar | nenhuma linha/XP parcial |
| projeção feliz | claim seguido de 2xx | um POST, `synced`, page ID único |
| falha definitiva | 400, 401, 403 ou 429 | `rejected`, um POST, nenhum retry |
| falha ambígua | timeout, rede, 5xx, 2xx inválido | `ambiguous`, um POST no máximo |
| crash | ledger deixado `in_flight` | promoção a `ambiguous`, zero novo POST |
| replay ambíguo | reenvio após ambiguidade | sucesso canônico/replay, zero novo POST |
| reconciliação | zero, um e múltiplos candidatos | `ambiguous`, `synced`, `manual_review`; nunca POST |
| dashboard legado | modo default `notion` | comportamento pré-corte preservado |
| dashboard D1 | owner pronto | soma D1 e último por data; finanças/regras intactas |
| dashboard D1 falho | banco indisponível | indisponível, nunca XP zero falso |
| guard Missão 3 | anônimo, não-owner, config ausente, loopback | mesmos status; D1 e Notion com zero chamadas |
| Missão 4 | >100, 10.000 incompletos, cursor/falha sentinela | suíte existente integral sem regressão |
| query Notion | `query` comum | continua single-page |
| rede | suíte completa | nenhuma chamada ao Notion real |

As provas concorrentes serão executadas tanto contra o fake serializado quanto
contra o D1 local do Wrangler. O fake e a inspeção da migração continuam úteis,
mas não substituem a prova física obrigatória.

## 18. Validação futura da implementação

Após implementação aprovada, executar:

1. lint direcionado nos arquivos alterados;
2. lint amplo com exclusão de `work`;
3. geração já concluída e inspeção do SQL, sem segunda geração;
4. `npm run test:checkin-idempotency`, incluindo fake e D1 local isolado real;
5. build;
6. `npm test`, que deve executar novamente o arquivo da Missão 5 junto da suíte
   completa;
7. cenários concorrentes, replay, conflito, retroatividade e falhas;
8. regressões compiladas dos guards e da paginação financeira;
9. prova de zero chamadas ao Notion real;
10. inventário e diff completos, confirmando somente o escopo aprovado.

Nenhuma validação local autoriza migração remota ou publicação.

## 19. Dependências e limitações residuais

### Dependências

- D1/SQLite fornecido pelo scaffold;
- Wrangler 4.92.0 já instalado, com D1 local e persistência isolável;
- `drizzle-orm` e `drizzle-kit` já instalados;
- Web Crypto já disponível no runtime;
- identidade autenticada e guard da Missão 3;
- token e schema atuais do Notion apenas para projeção.

Não é necessária nova dependência.

### Limitações que permanecem

- at-most-once pode deixar uma projeção ausente após falha ambígua;
- sem idempotency key/unique constraint no Notion, reconciliação com zero
  candidatos não prova que é seguro repetir a criação;
- `XP total` e `Nível` de páginas Notion podem ficar fora de ordem ou defasados,
  pois são snapshots informativos;
- o D1 canônico depende de backup/export e operação futura adequados;
- múltiplos owners ficam isolados no schema, mas produto e allowlist continuam
  pessoais até missão futura;
- a ativação exige janela curta de corte para fechar o delta do legado.

Essas limitações são compatíveis com a decisão humana. Melhorá-las exigiria
nova decisão, especialmente alteração do schema do Notion, serviço de fila ou
outra fonte externa.

## 20. Critérios objetivos de aceitação

A implementação local só poderá ser considerada pronta para Reviewer se:

1. a migração criar exatamente as tabelas, checks, FKs e índices descritos;
2. `(owner_key, checkin_date)` impedir fisicamente duplicatas concorrentes;
3. replay idêntico retornar sucesso sem nova linha, XP ou POST;
4. payload diferente retornar `409` sem mutação;
5. datas simultâneas e retroativas produzirem `SUM(xp_day)` exato;
6. dashboard ordenar por `checkin_date`, nunca `created_time`;
7. modo default pré-corte continuar no Notion;
8. modo D1 falhar fechado sem binding/schema/owner pronto, sem mostrar zero;
9. cada linha live executar no máximo um `POST /pages`, inclusive após 429,
   timeout, 5xx, crash e replay;
10. reconciliação não executar criação, alteração ou exclusão no Notion;
11. guard e status da Missão 3 permanecerem integrais;
12. paginação e sanitização da Missão 4 permanecerem integrais;
13. nenhuma chamada real ao Notion, migração remota ou publicação ocorrer;
14. lint, build e suíte completa passarem;
15. `npm test` incluir e executar `tests/checkin-idempotency.test.mjs`;
16. a prova D1 local real demonstrar unicidade, batch, rollback e concorrência
    sem skip e sem acesso remoto;
17. diff final conter somente os arquivos previamente aprovados.

## 21. Referências técnicas verificadas

- [Cloudflare D1 — Worker Binding API](https://developers.cloudflare.com/d1/worker-api/d1-database/):
  semântica transacional e sequencial de `batch()`.
- [Cloudflare D1 — Use indexes](https://developers.cloudflare.com/d1/best-practices/use-indexes/):
  índices únicos e multicoluna.
- [Cloudflare D1 — Read replication](https://developers.cloudflare.com/d1/best-practices/read-replication/):
  sessões, `first-primary` e consistência sequencial.
- [Drizzle Kit — generate](https://orm.drizzle.team/docs/drizzle-kit-generate):
  geração nomeada de migrações. O formato exato adotado neste plano também foi
  confirmado no `--help` da versão instalada, sem gerar arquivos.

## 22. Decisão de escopo

Este plano não exige nada além da arquitetura D1 já aprovada. Em particular:

- nenhuma nova dependência;
- nenhuma alteração de schema ou dados do Notion;
- nenhum serviço externo;
- nenhuma exclusão de dados;
- nenhuma criação ou migração remota;
- nenhuma publicação.

Se qualquer uma dessas necessidades surgir durante a implementação, o Builder
deve parar e devolver a decisão à direção humana antes de alterar o escopo.

**Estado final deste documento:** pronto para implementação local segura. O
Wrangler 4.92.0 instalado fornece a prova D1 local obrigatória; não há bloqueador
de runtime. Auditoria/importação legada, binding remoto e publicação continuam
separados e não autorizados.
