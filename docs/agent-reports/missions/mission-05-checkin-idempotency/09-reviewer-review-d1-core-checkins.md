# Reviewer review: núcleo D1 local para check-ins e XP

**Date:** 2026-08-15  
**Mission:** `mission-05-checkin-idempotency`  
**Role:** Reviewer  
**Builder result reviewed:** `docs/agent-reports/missions/mission-05-checkin-idempotency/08-builder-result-d1-core-checkins.md`  
**Review type:** Read-only

## Veredito final

**Changes requested**

O núcleo D1 atende aos critérios centrais de unicidade, idempotência, soma de
XP, retroatividade, isolamento e falha fechada. A suíte focal D1 também passou
integralmente neste ambiente, tanto isolada quanto dentro de `npm test`.

Entretanto, há uma regressão reproduzível da Missão 4 no dashboard em modo D1:
falhas das consultas que continuam no Notion são capturadas pelo tratamento
genérico de indisponibilidade do D1. Com isso, o status HTTP conhecido da
paginação financeira deixa de ser preservado e a causa apresentada ao cliente
passa a apontar incorretamente para check-ins/XP. Esse achado bloqueia o critério
explícito de ausência de regressão das Missões 3 e 4.

## Escopo e evidências revisados

Foram lidos integralmente:

- `AGENTS.md` e `docs/agent-workflow.md`;
- todos os documentos de
  `docs/agent-reports/missions/mission-05-checkin-idempotency/`, com prioridade
  para as decisões 05 e 07, o plano 06 e o resultado 08;
- o template de revisão em `docs/agent-reports/templates/reviewer-review.md`;
- todo o diff rastreado contra o HEAD
  `f0986838e6c88612832f49dea484a5dd074cd2fb`;
- todos os arquivos não rastreados de implementação, teste, migração e
  documentação da Missão 5;
- os módulos preservados de Notion, autenticação e política de acesso;
- o SQL, snapshot e journal do Drizzle;
- os testes focais, o harness Wrangler e o Worker fixture.

Também foram conferidos o estado Git, arquivos staged, lockfiles, processos
Wrangler/workerd e raízes temporárias do harness antes e depois dos testes.
Nenhum dado real, D1 remoto ou Notion real foi acessado.

## Evidências observadas

### D1 limitado a check-ins e XP

- O seletor está isolado em `app/lib/checkin-identity.ts:5-7` e somente o valor
  normalizado `d1` ativa o novo ramo.
- `POST /api/notion/checkins` preserva o guard como primeira operação em
  `app/api/notion/checkins/route.ts:24-29`; o ramo D1 usa exclusivamente
  identidade autorizada, binding `DB`, ledger e serviço em
  `app/api/notion/checkins/route.ts:32-39`.
- O dashboard preserva o guard em
  `app/api/notion/dashboard/route.ts:13-18`. No modo D1, somente check-in e XP
  vêm do ledger; semana, finanças e exercícios permanecem no Notion em
  `app/api/notion/dashboard/route.ts:21-30`.
- Finanças, treinos, cargas e outros domínios não foram migrados para D1.
- `.openai/hosting.json` declara apenas o binding lógico local `DB`; não contém
  ID remoto.

### Ausência de projeção ou sincronização automática com o Notion

- Não existe `app/lib/notion-checkin-projection.ts`.
- A busca dos ramos D1 não encontrou `SOURCES.checkins`, `createPage`, update,
  claim, retry, projeção ou reconciliação de check-ins no Notion.
- `app/lib/notion.ts` não possui diff contra o HEAD e conserva SHA-256
  `5637FAC085FD3AA2F8BC85FEE9C140228B1F8D3F3688FDA09690542A48EDD34D`.
- As únicas referências ao Notion no schema são
  `legacy_notion_page_id` e `import_batch_id`, ambas de proveniência futura e
  impedidas por `CHECK` de aparecer em linhas `origin = 'live'`.

### Modo legado preservado

- `SHAFT_CHECKIN_STORE` ausente ou diferente de `d1` seleciona o ramo legado.
- O diff de `app/api/notion/checkins/route.ts` contém somente adições: o corpo
  legado foi movido para `postNotionCheckin` sem remoção ou alteração das
  regras e chamadas anteriores.
- O dashboard legado também foi preservado integralmente em
  `getNotionDashboard`; sua paginação financeira continua usando
  `queryAllPages`.
- Os 27 testes independentes do processo D1 passaram, incluindo renderização,
  guard da Missão 3 e toda a regressão da Missão 4 no modo padrão.

### Schema, unicidade e migração

- `db/schema.ts:37-136` define apenas `checkin_owners` e `checkin_ledger`, sem
  campos ou estados de sincronização automática.
- O índice único `uq_checkin_ledger_owner_date` está em
  `db/schema.ts:71` e em `drizzle/0000_checkin_ledger.sql:53` sobre
  `(owner_key, checkin_date)`.
- O schema inclui FK de owner, allowlists, limites numéricos, JSON válido,
  fingerprint de 64 caracteres, XP não negativo e coerência de proveniência.
- A migração contém somente criação das duas tabelas e dos dois índices; não há
  `DROP`, `DELETE`, `UPDATE`, seed ou owner marcado `ready`.
- `drizzle-kit check --config=drizzle.config.ts` respondeu
  `Everything's fine`, exit code `0`.
- O snapshot contém exatamente `checkin_ledger` e `checkin_owners`; o journal
  contém somente `0000_checkin_ledger`.

### Fingerprint, replay, conflito e XP

- `app/lib/checkin-payload.ts:73-110` produz payload normalizado de versão 1 em
  ordem fixa; campos desconhecidos não entram no objeto canônico.
- `app/lib/checkin-payload.ts:130-137` usa `JSON.stringify` do objeto canônico e
  SHA-256 via Web Crypto em hexadecimal minúsculo de 64 caracteres.
- `db/checkins.ts:184-218` executa gate do owner, insert com
  `ON CONFLICT(owner_key, checkin_date) DO NOTHING`, leitura da linha e
  `SUM(xp_day)` em um único `D1Database.batch()`.
- A documentação oficial atual do Cloudflare D1 confirma que os statements de
  `batch()` executam sequencialmente e que uma falha aborta ou reverte toda a
  sequência.
- Fingerprint idêntico produz replay; fingerprint diferente produz conflito
  sem sobrescrita em `db/checkins.ts:207-218` e
  `app/lib/checkin-service.ts:72-85`.
- O total é sempre derivado de `SUM(xp_day)` por owner em
  `db/checkins.ts:119-123`, sem contador mutável.
- O último check-in lógico usa `ORDER BY checkin_date DESC` em
  `db/checkins.ts:104-117`; `created_at` não participa da ordem canônica.
- Os testes D1 reais confirmaram uma única linha e uma única concessão sob 2,
  10 e 100 pedidos idênticos concorrentes, conflito com preservação da linha,
  owners isolados, datas paralelas, retroatividade, unicidade física e rollback
  do batch.

### Autenticação, isolamento e falha fechada

- O guard da Missão 3 continua antes da leitura do corpo, identidade, D1 e
  Notion nas duas rotas.
- A chave hospedada é `chatgpt:<user-id>` e o loopback não produtivo reutiliza
  `local:shaft-owner`; e-mail não é chave canônica.
- Todas as escritas, somas e leituras do ledger filtram por `owner_key`.
- Binding ausente, schema ausente, owner inexistente ou não pronto e falhas D1
  resultam em `503` genérico, sem `xpTotal` inventado e sem fallback de
  check-ins para o Notion.
- `app/chatgpt-auth.ts` e `app/lib/shaft-access-policy.ts` não possuem diff
  contra o HEAD.

### Diff e escopo

- Os arquivos de implementação e teste correspondem ao conjunto autorizado
  no plano 06 e ao handoff 08.
- Não há dependência nova nem diff em `package-lock.json` ou `pnpm-lock.yaml`.
- `app/lib/notion.ts`, `drizzle.config.ts`, `vite.config.ts`,
  `worker/index.ts`, autenticação e allowlists estão preservados.
- `docs/roadmap.md` aparece no diff atual com a direção arquitetural do D1. O
  resultado 08 o identifica como mudança preexistente da direção humana; seu
  conteúdo é coerente com `05-direction-decision-d1-core.md` e não foi alterado
  nesta revisão.
- Nenhum arquivo está staged. Não houve commit, push, deploy, publicação,
  migração remota ou acesso a dados reais.
- `git diff --check HEAD` terminou com exit code `0`; os avisos observados são
  apenas de futura conversão local de LF para CRLF.

## Testes executados

### Suíte focal D1

Comando exato:

```powershell
& 'C:\Program Files\nodejs\npm.cmd' run test:checkin-idempotency
```

Resultado desta revisão: exit code `0`; 14 testes aprovados, zero falhas,
cancelamentos, skips ou pendências; duração total aproximada de 11,8 segundos.
O health check respondeu e o D1 local subiu normalmente.

### Lint direcionado

Foi executado ESLint sobre todos os módulos, rotas, testes e fixtures tocados
pela Missão 5. Resultado: exit code `0`, sem erros ou avisos.

### Lint amplo

Comando:

```powershell
& 'C:\Program Files\nodejs\npm.cmd' run lint -- --ignore-pattern work
```

Resultado: exit code `0`, sem erros ou avisos.

### Build e regressões independentes

`npm run build` terminou com exit code `0` e gerou as quatro rotas do
aplicativo. Em seguida:

```powershell
& 'C:\Program Files\nodejs\node.exe' --test tests/rendered-html.test.mjs tests/shaft-access-policy.test.mjs tests/notion-finance-pagination.test.mjs
```

Resultado: 27 testes aprovados, zero falhas. As regressões compiladas das
Missões 3 e 4 passaram no modo padrão `notion`.

### Suíte completa

Comando:

```powershell
& 'C:\Program Files\nodejs\npm.cmd' test
```

Resultado: build aprovado; 41 testes aprovados, incluindo novamente os 14
testes D1, com zero falhas, cancelamentos, skips ou pendências; duração dos
testes de aproximadamente 7,4 segundos.

### Ensaio independente da regressão da Missão 4

Foi carregado o Worker compilado em modo `SHAFT_CHECKIN_STORE=d1`, com binding
D1 falso pronto e sem escrita, e mocks locais para as fontes Notion. A fonte
financeira respondeu HTTP `418` com uma mensagem sentinela.

Resultado observado:

```json
{
  "status": 503,
  "body": { "error": "Check-ins e XP estão indisponíveis no momento." },
  "sentinelExposed": false
}
```

A mensagem remota continuou sanitizada, mas o status HTTP conhecido `418` não
foi preservado.

### Higiene do harness

Após a suíte focal e a suíte completa, não restou processo Wrangler/workerd nem
diretório `shaft-checkin-d1-*` sob a pasta temporária.

## Achados bloqueantes

### [Medium] Dashboard D1 converte falha conhecida da paginação financeira em indisponibilidade de check-ins/XP

- **Bloqueia a missão:** Sim.
- **Evidência:** o ramo D1 reúne leitura do ledger e as consultas Notion de
  semana, finanças e exercícios no mesmo `try` em
  `app/api/notion/dashboard/route.ts:21-63`. O `catch` em
  `app/api/notion/dashboard/route.ts:64-71` ignora o erro e sempre devolve
  `503` com a mensagem de indisponibilidade de check-ins/XP.
- **Reprodução:** uma resposta HTTP conhecida `418` da segunda parte financeira
  foi corretamente sanitizada por `queryAllPages`, mas o dashboard D1 devolveu
  `503`, conforme o ensaio registrado acima.
- **Impacto:** o cliente perde o status HTTP conhecido aprovado na Missão 4 e
  recebe uma causa incorreta. O mesmo tratamento pode mascarar falhas de semana
  ou exercícios como defeito no D1, dificultando diagnóstico e alterando o
  contrato somente quando o corte futuro para D1 ocorrer.
- **Por que bloqueia:** o plano 06 exige que paginação e sanitização da Missão 4
  permaneçam integrais. Os testes atuais da Missão 4 exercitam apenas o modo
  padrão e não alcançam esse novo catch.
- **Ação necessária:** separar falhas do núcleo D1 das falhas das consultas
  Notion que permanecem no dashboard, preservando para estas o tratamento já
  aprovado. Adicionar teste compilado em modo D1 que cubra erro financeiro com
  status conhecido, sanitização e ausência de saldo parcial.

## Observações não bloqueantes

### [Observation] Divergência de memória é ambiental, com risco de portabilidade do harness

- **Evidência da direção:** duas execuções anteriores encerraram
  Wrangler/Node por falta de memória antes do health check; todos os 14 casos
  falharam pelo `before hook`, não pelas regras individuais.
- **Evidência desta revisão:** com aproximadamente 5,3 GB de memória física
  livre no início, o mesmo comando passou 14/14 isoladamente. `npm test` passou
  novamente os 14 casos dentro da suíte de 41 testes. Não houve OOM, timeout,
  processo ou raiz temporária remanescente.
- **Classificação:** não há evidência de defeito funcional do ledger. A falha
  anterior é específica do ambiente, mas revela sensibilidade de
  portabilidade/consumo de recursos do harness.
- **Fator observado:** o runtime principal permanece ativo do `before` ao
  `after` em `tests/checkin-idempotency.test.mjs:189-197`; o teste de schema
  ausente inicia um segundo Wrangler/workerd simultâneo em
  `tests/checkin-idempotency.test.mjs:335-346`. Esse pico pode explicar a
  diferença em ambientes com menos memória disponível.
- **Impacto:** CI ou máquinas restritas podem falhar antes de testar as regras,
  embora ambientes com memória suficiente executem corretamente a prova D1.
- **Recomendação futura:** medir e documentar o pico de memória ou serializar a
  prova de schema ausente em etapa que não sobreponha dois runtimes, sem reduzir
  a obrigatoriedade do D1 real.

### [Low] O teste D1 real não atravessa o ramo de sucesso da rota compilada de produção

- **Evidência:** o D1 real usa o adapter de produção por meio de
  `tests/fixtures/checkin-d1-worker.ts`. A rota compilada é exercitada para
  guard e binding ausente, enquanto a ausência de chamadas de check-in ao
  Notion no ramo D1 é verificada por inspeção textual em
  `tests/checkin-idempotency.test.mjs:166-187`.
- **Impacto:** integração entre identidade da requisição, binding real e
  serialização HTTP de sucesso da rota de produção fica coberta por composição,
  não por um único teste ponta a ponta local.
- **Bloqueia a missão:** Não por si só; build, revisão do código, fixture com o
  adapter real e testes compilados de guard fornecem evidência complementar.
  O teste requerido no achado bloqueante deve aproveitar para cobrir o ramo
  compilado em modo D1.

## Riscos residuais

- O modo padrão continua `notion`, com as limitações legadas conhecidas até a
  auditoria, importação e corte futuros.
- Nenhum owner real está `ready`; ativar D1 antes dos gates de auditoria e
  importação produzirá `503`, como projetado.
- Backup, retenção, restauração, binding remoto, migração de dados e corte ainda
  exigem missões próprias e aceitação humana.
- O schema garante o formato estrutural da data; a validação de calendário real
  depende da normalização do serviço e deverá ser reaplicada pela futura
  importação legada.
- O seletor trata qualquer valor diferente de `d1` como legado. Um erro de
  configuração futuro pode reativar o Notion; o runbook de corte deve validar o
  valor efetivo e o comportamento observado antes de liberar escritas.
- Após o corte não haverá cópia automática de novos check-ins no Notion, por
  decisão humana explícita.

## Divergências em relação ao relatório do Builder

1. **Suíte focal D1:** o resultado do Builder foi reproduzido nesta revisão:
   14/14 passaram. Isso diverge das duas tentativas da Direção, que falharam por
   OOM antes do health check. A evidência atual aponta para limitação ambiental
   com risco de portabilidade do harness, não falha das regras de negócio.
2. **Suíte completa:** o resultado do Builder também foi reproduzido: build e
   41/41 testes passaram.
3. **Regressão da Missão 4:** o relatório 08 afirma regressão integralmente
   preservada. Essa afirmação é verdadeira para o modo padrão coberto pelos
   testes existentes, mas não para o novo ramo D1 do dashboard, que converte
   status conhecidos de falhas financeiras em `503`.
4. **Escopo:** o inventário do Builder corresponde aos arquivos observados. O
   diff adicional de `docs/roadmap.md` foi registrado pelo próprio Builder como
   mudança preexistente da direção humana e foi tratado separadamente nesta
   revisão.

## Handoff final

O núcleo transacional D1 não apresentou defeito nos cenários executados, e a
falha de memória relatada pela Direção não foi reproduzida neste ambiente.

O veredito permanece **Changes requested** exclusivamente pelo bloqueador de
regressão do tratamento de erros da Missão 4 no dashboard D1. Nenhuma correção
foi implementada nesta revisão. O trabalho não está autorizado para commit,
push, migração remota, deploy ou publicação; qualquer correção futura deve
retornar ao ciclo Builder → Reviewer → aceitação humana.
