# Reviewer rereview: limites de erro do dashboard D1

**Date:** 2026-08-15  
**Mission:** `mission-05-checkin-idempotency`  
**Role:** Reviewer  
**Builder correction reviewed:** `docs/agent-reports/missions/mission-05-checkin-idempotency/10-builder-correction-dashboard-error-boundaries.md`  
**Previous review:** `docs/agent-reports/missions/mission-05-checkin-idempotency/09-reviewer-review-d1-core-checkins.md`  
**Review type:** Strictly read-only

## Veredito final

**Approved with non-blocking observations**

O bloqueador Medium registrado no relatório 09 foi corrigido. As fronteiras de
erro do dashboard em modo D1 agora distinguem falhas do núcleo de check-ins/XP
das falhas das consultas que permanecem no Notion. O status HTTP conhecido da
paginação financeira volta a ser preservado, sem mensagem remota, sentinela,
cursor ou saldo parcial na resposta.

Não foi encontrado novo achado bloqueante nem expansão material de escopo. A
Missão 5 ainda depende da aceitação humana final antes de qualquer commit,
push, migração, deploy ou publicação.

## Escopo e evidências revisados

Foram lidos integralmente:

- `AGENTS.md`;
- `docs/agent-workflow.md`;
- `09-reviewer-review-d1-core-checkins.md`;
- `10-builder-correction-dashboard-error-boundaries.md`.

A revisão inspecionou:

- o estado Git completo e a ausência de arquivos staged;
- `app/api/notion/dashboard/route.ts` com numeração de linhas;
- todo o teste `tests/notion-finance-pagination.test.mjs`, incluindo setup,
  restauração de ambiente, binding D1 falso e os dois novos casos compilados;
- o diff acumulado dos arquivos corrigidos contra o HEAD;
- hashes dos documentos e módulos protegidos;
- build, testes focais, regressões e suíte completa;
- processos Wrangler/workerd e raízes temporárias após as validações.

Nenhuma correção foi implementada, nenhum arquivo existente foi alterado e
nenhum dado real ou serviço remoto foi acessado durante esta revisão.

## Evidências observadas

### Fronteira de erro do núcleo D1

- `getD1Dashboard` resolve identidade, binding, ledger e leitura canônica em um
  primeiro bloco exclusivo em `app/api/notion/dashboard/route.ts:21-26`.
- O `catch` desse bloco em `app/api/notion/dashboard/route.ts:27-35` devolve
  somente HTTP `503` e a mensagem genérica
  `Check-ins e XP estão indisponíveis no momento.`.
- Nenhum detalhe interno do binding ou do ledger é interpolado na resposta.
- As consultas Notion aparecem somente depois do término bem-sucedido desse
  primeiro bloco, em `app/api/notion/dashboard/route.ts:37-42`.
- Consequentemente, uma falha D1 retorna antes de qualquer chamada de semana,
  finanças ou exercícios.

### Fronteira de erro das consultas Notion

- Semana, finanças e exercícios estão juntas no segundo `try` em
  `app/api/notion/dashboard/route.ts:37-75`.
- Qualquer erro dessa etapa é encaminhado a `apiError(error)` em
  `app/api/notion/dashboard/route.ts:76-78`.
- A consulta financeira continua usando
  `queryAllPages(SOURCES.finances, { page_size: 100 }, 100)`; não houve
  alteração em `app/lib/notion.ts`.
- Como o saldo é reduzido somente após a resolução completa do `Promise.all`,
  uma falha em página posterior não alcança a redução e não produz `balance`
  parcial.

### Status conhecido e sanitização em modo D1

- O teste compilado em
  `tests/notion-finance-pagination.test.mjs:363-398` ativa
  `SHAFT_CHECKIN_STORE=d1`, injeta binding D1 pronto e devolve 100 movimentos
  na primeira página financeira.
- A segunda página responde HTTP `418` com cursor e detalhe remoto sentinela.
- O Worker carregado de `dist/server/index.js` responde `418` somente com a
  mensagem genérica da paginação; cursor e sentinela não aparecem, e o corpo
  não contém `balance`.
- A reprodução independente desta revisão confirmou exatamente esse
  comportamento.

### Falha D1 isolada de falha Notion

- O teste compilado em
  `tests/notion-finance-pagination.test.mjs:400-426` injeta um batch D1 que
  lança detalhe interno sentinela e instala um `fetch` que falharia se qualquer
  consulta Notion começasse.
- A resposta observada é `503`, somente com a mensagem de indisponibilidade de
  check-ins/XP, sem sentinela e sem `balance`.
- O contador de consultas Notion permanece zero.

### Rota compilada e isolamento dos testes

- `loadWorker` importa `dist/server/index.js` em
  `tests/notion-finance-pagination.test.mjs:90-95`; os novos testes não chamam
  diretamente a função-fonte da rota.
- O hook em `tests/notion-finance-pagination.test.mjs:11-23` injeta somente o
  ambiente Cloudflare falso usado pelo Worker compilado.
- `beforeEach` remove o modo D1 e o binding falso; `afterEach` restaura
  `SHAFT_CHECKIN_STORE`, credenciais falsas, allowlists e `fetch`. Os casos
  legados continuam isolados do novo modo.

### Preservação do modo legado e do escopo

- `getNotionDashboard` permanece separado em
  `app/api/notion/dashboard/route.ts:81-125` e conserva o comportamento
  anterior, inclusive `queryAllPages` somente para finanças e `apiError` no
  catch.
- `app/lib/notion.ts` permanece com SHA-256
  `5637FAC085FD3AA2F8BC85FEE9C140228B1F8D3F3688FDA09690542A48EDD34D`,
  igual ao registrado no relatório 09.
- O próprio relatório 09 permanece com SHA-256
  `B98872D44FC554989121D7BF2B664332E037935D92105959749FD102B3AE2949`.
- A correção observada está limitada à fronteira da rota, aos dois novos casos
  no teste financeiro e ao relatório 10. Schema, migração, binding,
  autenticação, política de acesso, rota de escrita, arquitetura D1 e demais
  domínios não foram ampliados pela correção.
- Nenhum arquivo está staged. Não houve commit, push, deploy, publicação ou
  migração.

## Testes executados

### Lint direcionado

```powershell
& 'C:\Program Files\nodejs\npm.cmd' exec -- eslint app/api/notion/dashboard/route.ts tests/notion-finance-pagination.test.mjs
```

Resultado: exit code `0`, sem erros ou avisos.

### Build

```powershell
& 'C:\Program Files\nodejs\npm.cmd' run build
```

Resultado: exit code `0`; as quatro rotas foram geradas, inclusive o dashboard
compilado usado pelos testes.

### Testes de paginação financeira

```powershell
& 'C:\Program Files\nodejs\node.exe' --test tests/notion-finance-pagination.test.mjs
```

Resultado: 16 testes aprovados, zero falhas, cancelamentos, skips ou
pendências. Os dois novos casos D1 passaram.

### Testes focais D1

```powershell
& 'C:\Program Files\nodejs\npm.cmd' run test:checkin-idempotency
```

Resultado: 14 testes aprovados, zero falhas, cancelamentos, skips ou
pendências. Concorrência, unicidade, replay, conflito, retroatividade e rollback
real permaneceram aprovados.

### Regressões das Missões 3 e 4

```powershell
& 'C:\Program Files\nodejs\node.exe' --test tests/notion-finance-pagination.test.mjs tests/shaft-access-policy.test.mjs
```

Resultado: 23 testes aprovados, zero falhas. Guard, falha fechada, paginação,
resultado incompleto, sanitização e os novos limites D1 permaneceram cobertos.

### Suíte completa

```powershell
& 'C:\Program Files\nodejs\npm.cmd' test
```

Resultado: build aprovado e 43 testes aprovados, com zero falhas,
cancelamentos, skips ou pendências.

### Verificações finais

- `git diff --check HEAD`: exit code `0`;
- nenhum processo Wrangler/workerd remanescente;
- nenhuma raiz temporária `shaft-checkin-d1-*` remanescente;
- nenhum arquivo staged;
- nenhuma chamada real ao Notion ou D1 remoto.

## Situação do bloqueador anterior

### Resolvido: status e causa de erro da paginação financeira no dashboard D1

O achado Medium do relatório 09 não é mais reproduzível.

Antes da correção, o mesmo ensaio financeiro retornava `503` e a mensagem de
indisponibilidade de check-ins/XP. Agora ele retorna o status conhecido `418`
com a mensagem genérica e sanitizada da paginação do Notion, sem sentinelas e
sem saldo parcial.

A falha do núcleo D1 permanece em uma fronteira própria, responde `503` e não
inicia consultas Notion. A separação atende integralmente à ação necessária
registrada no relatório 09.

## Novos achados

Nenhum novo achado bloqueante ou não bloqueante foi identificado na correção.

## Observações não bloqueantes preservadas

- A sensibilidade de memória do harness D1 em ambientes restritos continua
  sendo um risco de portabilidade já registrado no relatório 09. Nesta revisão,
  a suíte focal e a suíte completa passaram novamente sem OOM e sem resíduos.
- O teste D1 real continua usando o adapter de produção por meio do Worker
  fixture. A correção acrescentou cobertura da rota compilada de produção para
  as duas fronteiras de erro, reduzindo a lacuna anterior, embora o caminho de
  sucesso completo com binding D1 real continue coberto por composição.

Essas observações não bloqueiam a correção nem alteram o veredito.

## Riscos residuais

- O modo padrão continua `notion` até auditoria, importação e corte futuros;
  suas limitações legadas permanecem fora desta correção.
- Nenhum owner real está `ready`; ativação prematura do modo D1 deve continuar
  falhando com `503`.
- Backup, retenção, restauração, binding remoto, importação, corte e publicação
  exigem missões e aceitações próprias.
- Consultas diretas de semana e exercícios preservam o tratamento histórico de
  `apiError`; esta correção não redesenha o contrato geral de mensagens do
  cliente Notion.
- O seletor ainda trata valores diferentes de `d1` como legado; o futuro
  runbook de corte deve validar a configuração efetiva antes de liberar
  escritas.

## Handoff final

O bloqueador anterior foi resolvido sem regressão observada e sem expansão de
escopo. O veredito desta reavaliação é
**Approved with non-blocking observations**.

Esta aprovação do Reviewer não conclui a missão nem autoriza Git, migração ou
publicação. A Missão 5 ainda depende da aceitação humana final.
