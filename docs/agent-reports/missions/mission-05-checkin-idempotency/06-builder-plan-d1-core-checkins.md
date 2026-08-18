# Missão 05 — plano técnico simplificado para check-ins e XP no D1

**Papel:** Builder  
**Data:** 15 de agosto de 2026  
**Estado:** pronto para aprovação da implementação local; nenhuma implementação iniciada  
**Decisão vigente:** `05-direction-decision-d1-core.md`

## 1. Autoridade e objetivo

Este documento substitui, para fins de implementação, o plano
`03-builder-plan-d1-checkin-idempotency.md` e as partes de
`02-direction-decision-d1.md` e
`04-direction-approval-local-implementation.md` dedicadas à projeção automática
no Notion. Esses documentos permanecem intactos como histórico.

O objetivo agora é menor e mais forte:

- D1 será a fonte canônica de check-ins e XP depois do corte;
- durante preparação, auditoria e importação, o modo padrão continuará sendo o
  fluxo atual do Notion;
- em modo D1, check-ins e XP serão lidos e escritos somente no D1;
- não haverá criação, atualização, projeção, retry, claim ou reconciliação
  automática de check-ins no Notion;
- finanças, treinos e demais domínios ficam para missões independentes;
- backup real será baseado em exportação ou snapshot verificável do D1, nunca
  na existência de uma cópia no Notion.

A simplificação não revelou nova necessidade arquitetural para a implementação
local. A retenção e o destino do backup remoto deverão ser decididos na missão
de ativação/corte, como detalhe operacional da decisão 05; isso não bloqueia o
núcleo local.

## 2. Comportamento por modo

O seletor será `SHAFT_CHECKIN_STORE`:

### `notion` — padrão durante a transição

Valor ausente ou `notion` preserva exatamente o comportamento atual:

- `POST /api/notion/checkins` continua consultando a data, lendo o último
  `created_time`, calculando XP e criando a página atual no Notion;
- o dashboard continua lendo último check-in e `XP total` do Notion;
- respostas, status, normalização, cálculo, mensagens e ordem de chamadas do
  ramo legado não mudam;
- D1 não é requisito para esse ramo.

Enquanto esse modo estiver ativo, o Notion ainda é a fonte operacional vigente,
portanto conserva também a escrita atual. A condição de “legado somente
leitura” começa no corte para `d1`; durante a preparação, ela já se aplica às
ferramentas de auditoria e importação, que apenas leem o Notion. Essa fronteira
é necessária para cumprir simultaneamente a transição sem indisponibilidade e a
preservação exata do modo `notion`.

O código poderá extrair o fluxo legado para uma função interna apenas se os
testes demonstrarem equivalência observável. Não será feita correção oportunista
do comportamento legado nesta missão.

### `d1` — depois da importação e do corte

No modo `d1`:

- a rota de check-in normaliza a entrada, resolve a identidade autorizada e usa
  somente o ledger D1;
- o dashboard obtém check-in e XP somente do D1;
- nenhuma consulta é feita à fonte de check-ins do Notion;
- nenhuma criação ou atualização de página de check-in é feita no Notion;
- semana, finanças e exercícios continuam em seus fluxos Notion atuais até as
  respectivas missões futuras;
- `app/lib/notion.ts`, `query`, `queryAllPages`, paginação financeira e os
  demais escritores do Notion permanecem inalterados.

O nome histórico das rotas sob `/api/notion/` será preservado nesta missão para
evitar mudança de interface. Ele não altera a fonte canônica escolhida pelo
modo.

### Falha fechada

Em modo `d1`, qualquer uma destas condições retorna erro seguro `503`:

- binding `DB` ausente;
- schema/migração ausente ou incompatível;
- owner inexistente ou com estado diferente de `ready`;
- importação não concluída;
- erro de leitura ou escrita no D1.

Não haverá fallback para o Notion, resposta com XP zero inventado nem escrita
parcial. O dashboard inteiro fica indisponível em vez de misturar check-in/XP
incertos com os demais domínios. O guard server-side continua sendo executado
antes de D1, Notion ou leitura do corpo.

## 3. Identidade sem enfraquecer o guard

A chave de owner será:

- hospedado: `chatgpt:<oai-authenticated-user-id>`;
- loopback não produtivo já aceito pela Missão 3: `local:shaft-owner`.

O e-mail não será chave canônica. A função
`resolveAuthorizedCheckinOwner(request)` será chamada somente depois de
`authorizeShaftApiRequest(request)` retornar sucesso e reutilizará o mesmo
critério de loopback existente. Ela não autoriza ninguém, não cria novo bypass
e não altera allowlists.

Todas as chaves, somas e buscas serão particionadas por `owner_key`, mantendo o
produto pessoal agora sem impedir isolamento futuro.

## 4. Schema D1 simplificado

O schema terá duas tabelas. Não haverá tabela, coluna, estado ou índice de
projeção automática.

### 4.1 `checkin_owners`

| Coluna | Tipo e regra | Finalidade |
|---|---|---|
| `owner_key` | `TEXT PRIMARY KEY` | identidade opaca |
| `ledger_state` | `TEXT NOT NULL CHECK` em `awaiting_audit`, `importing`, `ready`, `blocked` | gate explícito do corte |
| `legacy_audit_fingerprint` | `TEXT NULL CHECK length = 64` | SHA-256 do manifesto aprovado |
| `legacy_observed_count` | `INTEGER NULL CHECK >= 0` | total observado no legado |
| `legacy_imported_count` | `INTEGER NULL CHECK >= 0` | total importado |
| `audit_completed_at` | `TEXT NULL` | instante UTC da auditoria aprovada |
| `activated_at` | `TEXT NULL` | instante UTC da ativação |
| `created_at` | `TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP` | auditoria física |
| `updated_at` | `TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP` | auditoria física |

A migração cria a tabela vazia. Nenhum owner real ou local será criado ou
marcado `ready` pela migração. O seed local existe somente no banco temporário
dos testes.

### 4.2 `checkin_ledger`

| Coluna | Tipo e regra | Finalidade |
|---|---|---|
| `ledger_id` | `TEXT PRIMARY KEY` | UUID estável gerado antes do batch |
| `owner_key` | `TEXT NOT NULL`, FK para `checkin_owners.owner_key` | isolamento |
| `checkin_date` | `TEXT NOT NULL` | data lógica `YYYY-MM-DD` |
| `payload_version` | `INTEGER NOT NULL DEFAULT 1 CHECK >= 1` | versão canônica |
| `payload_fingerprint` | `TEXT NOT NULL CHECK length = 64` | SHA-256 determinístico |
| `payload_json` | `TEXT NOT NULL` | payload normalizado e canônico |
| `day_type` | `TEXT NOT NULL` com allowlist atual | dado do check-in |
| `mood` | `TEXT NOT NULL` com allowlist atual | dado do check-in |
| `energy` | `INTEGER NOT NULL CHECK BETWEEN 1 AND 10` | dado normalizado |
| `sleep_status` | `TEXT NOT NULL` com allowlist atual | dado do check-in |
| `training_status` | `TEXT NOT NULL` com allowlist atual | dado do check-in |
| `study_status` | `TEXT NOT NULL` com allowlist atual | dado do check-in |
| `audiobook_minutes` | `INTEGER NOT NULL CHECK BETWEEN 0 AND 600` | dado normalizado |
| `dog_minutes` | `INTEGER NOT NULL CHECK BETWEEN 0 AND 300` | dado normalizado |
| `music_minutes` | `INTEGER NOT NULL CHECK BETWEEN 0 AND 600` | dado normalizado |
| `win` | `TEXT NOT NULL` | texto já limitado |
| `difficulty` | `TEXT NOT NULL` | texto já limitado |
| `next_step` | `TEXT NOT NULL` | texto já limitado |
| `summary` | `TEXT NOT NULL` | resumo final, inclusive fallback atual |
| `xp_day` | `INTEGER NOT NULL CHECK >= 0` | evento imutável de XP |
| `origin` | `TEXT NOT NULL CHECK` em `live`, `legacy_import` | procedência |
| `legacy_notion_page_id` | `TEXT NULL` | proveniência legada, sem sincronização |
| `import_batch_id` | `TEXT NULL` | manifesto/lote aprovado da importação |
| `created_at` | `TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP` | ordem física de inserção e auditoria |

Não haverá `xp_total`, contador mutável ou `updated_at` no ledger. Um check-in
canônico não será sobrescrito: replay lê a linha; conflito a preserva.

### 4.3 Proveniência opcional do Notion

Recomenda-se manter **um único** identificador nullable,
`legacy_notion_page_id`, porque ele permite:

- provar qual página originou cada linha importada;
- detectar importação repetida da mesma página;
- auditar ou reverter uma importação sem depender de título/data ambíguos.

Ele não será usado por rotas normais, dashboard, sincronização, criação,
atualização ou reconciliação. As regras serão:

- `origin = live`: `legacy_notion_page_id` e `import_batch_id` devem ser nulos;
- `origin = legacy_import`: ambos devem ser não nulos;
- índice único parcial em `legacy_notion_page_id WHERE ... IS NOT NULL`.

Isso preserva proveniência sem reintroduzir acoplamento operacional ao Notion.

### 4.4 Índices

1. `uq_checkin_ledger_owner_date` —
   `UNIQUE(owner_key, checkin_date)`, barreira física de idempotência.
2. `uq_checkin_ledger_legacy_notion_page_id` — índice único parcial para a
   proveniência importada.

O primeiro índice também atende `SUM(xp_day)` pelo prefixo `owner_key` e a
busca reversa por data. Não haverá índices de estado de sincronização.
`EXPLAIN QUERY PLAN` e `PRAGMA optimize` serão executados apenas no D1 local de
teste depois da migração.

## 5. Normalização e fingerprint

A função pura preservará as regras atuais:

- data default em `America/Sao_Paulo`;
- allowlists e defaults de tipo de dia, humor, sono, treino e estudo;
- limites atuais de energia e minutos;
- `trim`, limite atual dos textos e resumo fallback;
- cálculo atual de `xp_day`, sempre não negativo;
- 200 XP por nível.

O objeto versão 1 terá ordem fixa:

`payloadVersion`, `date`, `dayType`, `mood`, `energy`, `sleep`, `training`,
`study`, `audiobookMinutes`, `dogMinutes`, `musicMinutes`, `win`, `difficulty`,
`nextStep`, `summary`.

Campos desconhecidos, `undefined`, `NaN` e `Infinity` não entram. O JSON
canônico será `JSON.stringify` desse objeto construído em ordem fixa. O
fingerprint será SHA-256 via Web Crypto, hexadecimal minúsculo de 64 caracteres.
Nenhuma dependência será adicionada.

## 6. Reserva atômica, replay e conflito

O adapter D1 executará um único `DB.batch()` de statements preparados:

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

SELECT ledger_id, payload_fingerprint, xp_day, checkin_date, ...
FROM checkin_ledger
WHERE owner_key = ? AND checkin_date = ?;

SELECT COALESCE(SUM(xp_day), 0) AS xp_total
FROM checkin_ledger
WHERE owner_key = ?;
```

A decisão é feita pela restrição única dentro do banco, nunca por check-then-act
na aplicação:

- owner não `ready`: `503`, sem insert;
- `RETURNING` presente: criação, `replayed: false`;
- sem `RETURNING` e fingerprint igual: replay `200`, `replayed: true`, sem XP
  novo e `leveledUp: false`;
- sem `RETURNING` e fingerprint diferente: conflito `409`, linha original
  intacta.

O retorno de sucesso mantém `xpDay`, `xpTotal`, `level` e `leveledUp`, acrescenta
somente `replayed`. Não haverá estado público ou interno de projeção.

A interface mostrará “Check-in já salvo · XP mantido” em replay, nunca uma nova
concessão. Em modo D1, sucesso significa commit no D1 e nada sobre o Notion.

## 7. XP, datas concorrentes e retroatividade

O total canônico será sempre:

```sql
SELECT COALESCE(SUM(xp_day), 0)
FROM checkin_ledger
WHERE owner_key = ?;
```

Não existe leitura-modificação-escrita de contador. Batches concorrentes para
datas diferentes podem observar totais intermediários em ordens diferentes,
mas o estado final contém todas as linhas e a soma exata, sem lost update.

O último check-in lógico será:

```sql
SELECT ...
FROM checkin_ledger
WHERE owner_key = ?
ORDER BY checkin_date DESC
LIMIT 1;
```

`created_at` não define ordem lógica. Um check-in retroativo aumenta o `SUM`,
mas não substitui o check-in com maior data no dashboard. Nível é sempre
`floor(xp_total / 200) + 1`.

## 8. Fases independentes

### A. Implementação local segura — escopo após aprovação deste plano

1. Implementar schema, normalização, identidade, serviço e adapter D1.
2. Alterar o binding lógico local em `.openai/hosting.json` para `DB`.
3. Gerar e inspecionar a migração versionada, sem aplicação remota.
4. Manter `SHAFT_CHECKIN_STORE=notion` por padrão.
5. Executar testes com fake e obrigatoriamente com D1 local real.
6. Não ativar owner real, não importar legado e não publicar.

### B. Auditoria legada somente leitura — missão futura

1. Ler todos os check-ins do Notion com paginação completa e falha segura para
   resultado incompleto.
2. Gerar manifesto com page ID, payload normalizado, fingerprint, XP observado,
   XP recalculado e classificação.
3. Relatar duplicatas, datas inválidas, divergências de XP e páginas ambíguas.
4. Não corrigir, fundir, excluir ou criar páginas.
5. Submeter ambiguidades à direção humana.

### C. Ativação do binding remoto — missão futura

1. Criar/anexar D1 remoto pelo fluxo autorizado de Sites.
2. Aplicar e verificar schema/índices sem mudar o modo publicado.
3. Manter a aplicação em `notion` e não publicar corte.
4. Se a plataforma não permitir separar provisionamento e publicação, parar e
   retornar a decisão humana; não improvisar deploy intermediário.

### D. Importação — missão futura

1. Consumir somente manifesto aprovado.
2. Importar em transação com `origin = legacy_import`, page ID e batch ID.
3. Abortar diante de duplicata, fingerprint conflitante ou contagem divergente.
4. Comparar contagens, soma de XP e maior data.
5. Manter owner fora de `ready` até a verificação final.
6. Não escrever ou corrigir o Notion.

### E. Preparação do corte — missão futura

1. Abrir janela curta de manutenção apenas para novos check-ins.
2. Auditar/importar o delta aprovado.
3. Produzir export ou snapshot verificável do D1, checksum e teste de leitura.
4. Registrar destino, retenção e procedimento de restauração aprovados pela
   direção; o Notion não conta como backup.
5. Marcar o owner `ready` somente depois de contagem, soma e backup aprovados.
6. Preparar `SHAFT_CHECKIN_STORE=d1`, sem publicar ainda.

### F. Publicação e corte efetivo — missão futura

1. Publicar a versão aprovada em modo D1.
2. Confirmar guard, criação, replay, conflito, dashboard e zero acesso ao
   check-in do Notion.
3. Encerrar a manutenção apenas depois dos smoke tests.
4. Manter finanças e treinos nos caminhos atuais até missões próprias.

## 9. Prova obrigatória com D1 local real

Fake e inspeção de SQL continuam úteis, mas não substituem o runtime D1 local do
Wrangler 4.92.0 já instalado. A prova integra `npm test` e não admite skip.

### 9.1 Isolamento total do Wrangler

`tests/helpers/wrangler-d1-harness.mjs` criará com `mkdtemp` uma raiz validada
sob `os.tmpdir()`, nunca sob `HOME`, `CODEX_HOME` ou diretórios do usuário. Dentro
dela criará:

```text
<temp>/config/wrangler.checkin-d1.jsonc
<temp>/logs/
<temp>/state/
<temp>/xdg/
```

O processo filho receberá somente em seu ambiente:

- `WRANGLER_LOG_PATH=<temp>/logs`;
- `XDG_CONFIG_HOME=<temp>/xdg`;
- demais variáveis necessárias herdadas sem redefinir `HOME` ou `CODEX_HOME`.

Todos os comandos usarão:

- `--config <temp>/config/wrangler.checkin-d1.jsonc`;
- `--persist-to <temp>/state`;
- `--local` explícito;
- stdout/stderr capturados pelo teste.

A configuração temporária apontará `main` para o caminho absoluto validado de
`tests/fixtures/checkin-d1-worker.ts` e declarará somente o binding local `DB`
com nome de teste e UUID local fictício. Nenhum config Wrangler será salvo no
repositório ou em diretório global.

Depois dos testes, o harness encerrará e aguardará o processo. Só então removerá
a raiz temporária previamente resolvida, após confirmar que permanece sob
`os.tmpdir()` e não contém links/reparse points inesperados. Falha de encerramento
ou arquivo bloqueado falha o teste; não haverá remoção forçada ou ampliada.

### 9.2 Comandos executados pelo harness futuro

Com o executável local resolvido como `wrangler.cmd` no Windows e `wrangler` nos
demais sistemas:

```text
node_modules/.bin/wrangler d1 execute DB
  --config <temp>/config/wrangler.checkin-d1.jsonc
  --local
  --persist-to <temp>/state
  --file drizzle/0000_checkin_ledger.sql
  --yes

node_modules/.bin/wrangler d1 execute DB
  --config <temp>/config/wrangler.checkin-d1.jsonc
  --local
  --persist-to <temp>/state
  --command <seed-local-do-owner-ready>
  --yes

node_modules/.bin/wrangler dev
  --config <temp>/config/wrangler.checkin-d1.jsonc
  --local
  --ip 127.0.0.1
  --port <porta-loopback-livre>
  --persist-to <temp>/state
  --log-level error
  --show-interactive-dev-session=false
```

O Worker fixture injetará `env.DB` em `createD1CheckinLedger` do adapter de
produção. O teste aguardará health check com timeout, fará chamadas HTTP
paralelas e falhará se runtime, migração, health check ou encerramento falhar.

Comando dedicado reproduzível:

```text
npm run test:checkin-idempotency
```

O script será `node --test tests/checkin-idempotency.test.mjs`. O mesmo arquivo
será acrescentado explicitamente ao script `npm test`, depois dos três testes
atuais. Assim, a prova real é obrigatória na suíte completa.

## 10. Matriz de testes revisada

| Área | Cenário | Resultado obrigatório |
|---|---|---|
| normalização | defaults, limites, textos e fallback atuais | payload canônico estável |
| fingerprint | replay semanticamente idêntico | hash idêntico |
| fingerprint | campo normalizado diferente | hash diferente |
| concorrência mesma data | 2, 10 e 100 pedidos idênticos | uma linha e um XP |
| replay sequencial | payload idêntico | `200`, `replayed`, sem XP novo |
| conflito | mesma identidade/data, payload diferente | `409`, original intacto |
| owners | mesma data, owners distintos | isolamento e somas independentes |
| datas concorrentes | datas diferentes simultâneas | todas persistidas, soma exata |
| retroativo | data antiga inserida depois | soma correta, maior data no dashboard |
| unicidade física | insert duplicado direto | constraint rejeita |
| rollback real | segundo statement do batch viola constraint | primeiro também revertido |
| batch do adapter | criação, replay e conflito | interpretação correta do commit |
| D1 ausente | modo D1 sem binding | `503`, sem XP zero e sem Notion check-ins |
| schema ausente | binding vazio | `503` sanitizado |
| owner não pronto | estados não `ready` | `503`, nenhuma linha |
| modo legado | `SHAFT_CHECKIN_STORE=notion` | comportamento atual integral |
| modo D1 | check-in e dashboard | zero leitura/escrita na fonte Notion de check-ins |
| guard Missão 3 | anônimo, não-owner, sem allowlist e loopback | mesmos status; zero I/O antes do guard |
| Missão 4 | paginação, incompleto e sentinelas | suíte atual integral |
| regressão Notion | `query` comum | continua single-page |
| rede | suíte completa | nenhum Notion real ou D1 remoto |

Foram removidos todos os testes de `POST /pages`, retry 429 para projeção,
claim, falha ambígua, estados de sincronização e reconciliação automática. Não
haverá fake de projeção.

## 11. Arquivos exatos da implementação local futura

### Modificar

- `.openai/hosting.json` — binding lógico local `d1: "DB"`;
- `db/schema.ts` — duas tabelas e índices simplificados;
- `db/index.ts` — acesso testável ao binding e erro seguro;
- `app/api/notion/checkins/route.ts` — branch legado intacto e branch D1;
- `app/api/notion/dashboard/route.ts` — D1 somente para check-in/XP no modo D1;
- `app/ShaftApp.tsx` — mensagem de replay, sem estado de sincronização;
- `package.json` — script dedicado e inclusão obrigatória no `npm test`;
- `drizzle/meta/_journal.json` — entrada `0000` gerada pelo Drizzle;
- `tests/shaft-access-policy.test.mjs` — guard compilado também contra acesso D1;
- `docs/agent-reports/missions/mission-05-checkin-idempotency/README.md` — estado
  e novo resultado futuro.

### Criar

- `app/lib/checkin-payload.ts` — normalização, fingerprint e XP puros;
- `app/lib/checkin-identity.ts` — owner key pós-guard;
- `app/lib/checkin-service.ts` — replay/conflito por porta injetável;
- `db/checkins.ts` — adapter e queries D1;
- `tests/checkin-idempotency.test.mjs` — testes fake, rota e D1 real;
- `tests/helpers/wrangler-d1-harness.mjs` — runtime temporário isolado;
- `tests/fixtures/checkin-d1-worker.ts` — Worker que usa o adapter de produção;
- `drizzle/0000_checkin_ledger.sql` — migração nomeada;
- `drizzle/meta/0000_snapshot.json` — snapshot do Drizzle;
- `docs/agent-reports/missions/mission-05-checkin-idempotency/07-builder-result-d1-core-checkins.md`
  — handoff futuro do Builder.

### Preservar sem alterar

- `app/lib/notion.ts` — não há mais transporte at-most-once ou projeção;
- `app/chatgpt-auth.ts` e `app/lib/shaft-access-policy.ts`;
- `drizzle.config.ts`, `vite.config.ts`, `worker/index.ts`, lockfiles e
  dependências;
- finanças, treinos, cargas e outras rotas;
- schema e dados do Notion;
- documentos 01 a 05, roadmap e missões anteriores.

`app/lib/notion-checkin-projection.ts` está expressamente fora do escopo e não
será criado. Nenhum substituto de sincronização será introduzido.

## 12. Migração determinística

Depois de nova autorização para implementar, a geração será executada uma vez:

```text
drizzle-kit generate --config=drizzle.config.ts --prefix=index --name=checkin_ledger
```

Com o journal atualmente vazio, são esperados:

- `drizzle/0000_checkin_ledger.sql`;
- `drizzle/meta/0000_snapshot.json`;
- modificação de `drizzle/meta/_journal.json` com a entrada `0000`.

Se o gerador produzir nomes diferentes, o Builder para e registra a diferença;
não renomeia manualmente nem desalinha o journal. O SQL deve ser inspecionado
antes de uso local. Nada será aplicado remotamente nesta missão.

## 13. Rollback

### Local, antes do corte

Como o modo padrão permanece `notion`, rollback local consiste em reverter
somente os arquivos da Missão 5. O D1 de teste existe apenas em raiz temporária
própria e é descartado pelo harness com as validações da seção 9. Nenhum banco,
owner ou dado real existe para converter.

### Futuro, depois do corte

Depois do corte, registros novos podem existir somente no D1. Portanto:

1. interromper novas escritas;
2. produzir e verificar novo export/snapshot antes de qualquer rollback;
3. preservar banco e migrações — nunca executar drop automático;
4. preferir rollback para a última versão **compatível com o D1**, mantendo-o
   canônico;
5. verificar contagem, soma e maior data antes de reabrir escritas;
6. não voltar silenciosamente para `SHAFT_CHECKIN_STORE=notion`.

Retornar o Notion a fonte canônica exigiria uma missão separada de migração
reversa, autorização explícita de escrita no Notion, auditoria e validação. Não
é um fallback operacional desta missão.

## 14. Validação futura

Após a implementação autorizada:

1. lint direcionado;
2. lint amplo com exclusão de `work`;
3. inspeção da migração e journal;
4. `npm run test:checkin-idempotency`;
5. build;
6. `npm test`, contendo obrigatoriamente o novo arquivo;
7. repetição focal da concorrência real no D1 local;
8. regressões compiladas das Missões 3 e 4;
9. prova de zero rede real e zero acesso ao check-in do Notion em modo D1;
10. diff completo, arquivos não rastreados e escopo.

Nenhuma validação local autoriza recurso remoto ou publicação.

## 15. Riscos e limitações residuais

- Até o corte, o modo Notion conserva as limitações conhecidas do legado; elas
  não são apresentadas como garantia D1.
- Uma divergência descoberta na auditoria bloqueia a importação daquela data
  até decisão humana.
- D1 passa a exigir backup, retenção e restauração reais antes do corte remoto.
- O destino do backup ainda será uma decisão operacional futura; não se presume
  R2, serviço externo ou armazenamento local permanente.
- Finanças e treinos continuam dependentes do Notion até suas próprias missões.
- Após o corte não haverá cópia automática de novos check-ins no Notion, por
  decisão explícita.

Nenhum desses pontos exige ampliar a implementação local aprovada.

## 16. Critérios objetivos de aceitação

A implementação local só estará pronta para Reviewer quando:

1. o schema não contiver estados ou campos de projeção automática;
2. apenas o identificador legado opcional e o batch de importação referenciarem
   o Notion, exclusivamente para proveniência;
3. a unicidade `(owner_key, checkin_date)` resistir à concorrência D1 real;
4. replay idêntico não inserir nem conceder XP novamente;
5. payload diferente retornar `409` sem sobrescrita;
6. `SUM(xp_day)` produzir o total sob datas simultâneas e retroativas;
7. o último check-in usar `checkin_date DESC`, nunca `created_time`;
8. o guard da Missão 3 executar antes de qualquer I/O;
9. modo `notion` preservar exatamente o comportamento atual;
10. modo `d1` não consultar nem escrever check-ins no Notion;
11. D1/schema/importação/owner indisponível falhar `503` sem XP zero falso;
12. fake e D1 local real passarem, incluindo unicidade, batch, rollback e
    concorrência sem skip;
13. logs, config e persistência do Wrangler ficarem somente na raiz temporária
    validada;
14. `npm test` executar o novo teste obrigatoriamente;
15. `app/lib/notion.ts` permanecer sem alteração e
    `app/lib/notion-checkin-projection.ts` não existir;
16. testes de projeção, ambiguidade e reconciliação não existirem;
17. regressões das Missões 3 e 4, lint e build passarem;
18. nenhuma chamada real ao Notion, D1 remoto ou outro serviço ocorrer;
19. nenhuma dependência, lockfile, schema/dado do Notion ou domínio externo ao
    check-in/XP for alterado;
20. nenhuma migração remota, recurso remoto, commit, push ou publicação ocorrer.

## 17. Limites finais

Este plano confirma:

- nenhuma nova dependência;
- nenhuma alteração do schema ou dos dados do Notion;
- nenhuma projeção ou reconciliação automática;
- nenhuma alteração de finanças, treinos ou outros domínios;
- nenhum dado real, binding remoto, migração remota ou publicação;
- nenhum uso do Notion como backup canônico.

Se a implementação revelar necessidade de serviço externo, escrita automática
no Notion, novo mecanismo de autenticação, nova dependência ou mudança fora do
D1/check-ins/XP, o Builder deve parar e devolver a decisão à direção humana.

**Conclusão:** o plano está pronto para aprovação da implementação local. A
remoção da projeção automática reduz schema, código e testes sem criar novo
bloqueador arquitetural.
