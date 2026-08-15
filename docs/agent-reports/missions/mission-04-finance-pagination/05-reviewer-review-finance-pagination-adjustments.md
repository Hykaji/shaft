# Nova revisão do Reviewer: ajustes da paginação financeira

**Data:** 15 de agosto de 2026  
**Missão:** `mission-04-finance-pagination`  
**Papel:** Reviewer  
**Resultado do Builder revisado:** `04-builder-result-finance-pagination-adjustments.md`  
**Tipo de revisão:** Estritamente read-only; nenhuma correção implementada

## Escopo da revisão

Esta revisão independente leu integralmente `AGENTS.md`,
`docs/agent-workflow.md`, todos os documentos cronológicos da Missão 4 e os
arquivos de código e teste envolvidos. O estado completo do repositório foi
comparado com o HEAD `8e5f62a5dee48a438d7d791a75dfd80e50d52ce3`.

Foram revisados prioritariamente:

- o tratamento de `request_status.type: "incomplete"`, inclusive no teto de
  10.000 resultados com `has_more: false`;
- a impossibilidade de devolver saldo parcial em qualquer falha da paginação;
- a sanitização de erros em páginas posteriores;
- a não exposição de cursor, shard, timestamp, sessão, razão de incompletude
  ou mensagens internas;
- a preservação somente de status HTTP conhecido;
- a separação entre `query` single-page e `queryAllPages` opt-in;
- o guard server-side da Missão 3;
- o diff completo, os arquivos fora do escopo e `docs/roadmap.md`;
- lint, build e testes relevantes.

O contrato remoto foi conferido nas fontes oficiais atuais do Notion:
[Query a data source](https://developers.notion.com/reference/query-a-data-source),
[Versioning](https://developers.notion.com/reference/versioning) e
[Changelog](https://developers.notion.com/page/changelog).

## Evidências observadas

### Resultado incompleto e ausência de saldo parcial

- `NotionQueryResponse` representa `request_status.type` e
  `incomplete_reason` em `app/lib/notion.ts:15-23`.
- `queryAllPages` verifica explicitamente `type === "incomplete"` em
  `app/lib/notion.ts:99-101`, antes de acumular os resultados da página em
  `app/lib/notion.ts:103` e antes de qualquer retorno em
  `app/lib/notion.ts:105`.
- Assim, inclusive na centésima página com 10.000 itens, `has_more: false` não
  transforma uma resposta explicitamente incompleta em sucesso.
- O teste direto em `tests/notion-finance-pagination.test.mjs:199-214` confirma
  a rejeição genérica sem expor `incomplete_reason`.
- O teste compilado em `tests/notion-finance-pagination.test.mjs:315-345`
  executa exatamente 100 chamadas financeiras, entrega 10.000 registros e
  marca a última resposta com `has_more: false` e
  `request_status.type: "incomplete"`. A rota responde `502`, sem `balance` e
  sem a razão de incompletude.
- Como `queryAllPages` somente retorna o array após uma página final válida e o
  dashboard calcula o saldo apenas depois da resolução do `Promise.all`, uma
  consulta incompleta ou uma falha posterior não disponibiliza o acumulado
  parcial para a redução do saldo.

### Sanitização e preservação de status

- Toda exceção originada pela chamada `query` dentro da operação paginada é
  capturada em `app/lib/notion.ts:91-97`.
- A mensagem original é descartada integralmente e substituída por
  `PAGINATION_ERROR`. Somente o status de uma instância conhecida de
  `NotionApiError` é preservado; exceções sem esse tipo conhecido recebem
  `502`.
- Cursor ausente, vazio ou repetido, limite excedido e resultado incompleto
  também usam a mesma mensagem genérica, sem interpolar valores remotos.
- O teste compilado em `tests/notion-finance-pagination.test.mjs:274-313`
  injeta cursor, shard, timestamp e sessão na falha HTTP da segunda página. A
  resposta preserva o status remoto conhecido `503`, devolve somente a
  mensagem genérica, não contém nenhuma sentinela e não possui `balance`.
- Um ensaio adicional, executado sem criar arquivos, confirmou separadamente:
  uma exceção comum na segunda página vira `502`; uma resposta HTTP conhecida
  `418` preserva `418`; em ambos os casos a mensagem remota com as sentinelas é
  eliminada.

### Separação de contratos e guard da Missão 3

- `query` continua fazendo uma única chamada a `notionRequest` em
  `app/lib/notion.ts:63-68`; não contém loop nem recursão de paginação.
- A busca completa em `app/` e `tests/` encontrou um único consumidor de
  aplicação de `queryAllPages`: `SOURCES.finances` em
  `app/api/notion/dashboard/route.ts:17`.
- Check-ins, semana, exercícios, sessões e cargas continuam usando `query`.
- O guard `authorizeShaftApiRequest` permanece em
  `app/api/notion/dashboard/route.ts:9-11`, antes do `Promise.all` e de qualquer
  acesso ao Notion.
- O teste compilado em `tests/notion-finance-pagination.test.mjs:347-364`
  confirmou `401` e zero chamadas a `fetch` para pedido anônimo.

### Diff completo e preservação de escopo

- O diff rastreado contra o HEAD contém somente
  `app/api/notion/dashboard/route.ts`, `app/lib/notion.ts`,
  `docs/agent-reports/README.md` e `package.json`.
- Os arquivos não rastreados são a pasta documental da Missão 4,
  `tests/notion-finance-pagination.test.mjs` e `docs/roadmap.md`.
- O diff de implementação permanece limitado ao helper/contrato do Notion, ao
  uso financeiro no dashboard e ao comando de teste. Não há mudança em
  dependências ou lockfiles.
- Nenhum arquivo está staged.
- `docs/roadmap.md` permanece com SHA-256
  `82BD5BA48D9CD05CC18E9A5930BAE59284569A8C4FB920E76F86ED20A45BB4A4`,
  idêntico ao valor registrado antes destes ajustes.
- A rota do dashboard, `app/chatgpt-auth.ts`,
  `app/lib/shaft-access-policy.ts` e o relatório anterior também preservam os
  hashes registrados pelo Builder.
- `git diff --check HEAD` terminou com exit code `0`. Os únicos avisos do Git
  tratam da futura conversão local de LF para CRLF.

### Validações reproduzidas

1. Lint direcionado de `app/lib/notion.ts`, da rota do dashboard e do teste de
   paginação: aprovado, sem erros ou avisos.
2. Teste focal `tests/notion-finance-pagination.test.mjs`: 14 testes aprovados,
   zero falhas.
3. Lint amplo com exclusões explícitas de `dist`, `.next` e `work`: aprovado,
   sem erros ou avisos.
4. `npm test`: build completo aprovado, com as quatro rotas do Notion no
   artefato; 26 testes aprovados, zero falhas, cancelamentos, ignorados ou
   pendências.
5. Ensaios adicionais de status conhecido e exceção sem status: aprovados.
6. Nenhuma chamada foi feita ao Notion real; todos os testes usaram mocks
   locais e token falso.

## Achados bloqueadores

Nenhum.

Os dois bloqueadores da revisão anterior foram corrigidos e cobertos por testes
diretos e compilados: resultado explicitamente incompleto não é aceito, e
mensagens/detalhes remotos de falhas paginadas não chegam ao cliente.

## Achados não bloqueadores

### [Observação] Índices documentais ainda registram a fase de planejamento

`docs/agent-reports/README.md` e `docs/roadmap.md` ainda descrevem a Missão 4
como em planejamento ou aguardando aprovação para implementação. Esse estado
já existia antes da etapa de ajustes, não afeta o comportamento revisado e
`docs/roadmap.md` pertence à direção humana. Sua preservação foi exigida nesta
revisão. Uma atualização documental futura depende de autorização própria e da
aceitação humana final.

## Riscos residuais

- Acima do teto remoto de 10.000 resultados, o dashboard fica indisponível em
  vez de mostrar saldo parcial. Esse é o comportamento seguro esperado; uma
  estratégia para volumes superiores exigirá outra missão.
- A travessia não possui snapshot remoto. Alterações concorrentes no Notion
  podem afetar o conjunto paginado, limitação já documentada e fora do escopo.
- Mais páginas aumentam latência e exposição a rate limit. A política
  preexistente de uma nova tentativa para `429` não foi ampliada nesta missão.
- Não houve validação contra o Notion real nem publicação, conforme as
  restrições da revisão. O contrato atual foi verificado na documentação
  oficial e reproduzido com mocks controlados.

Nenhum desses riscos bloqueia os critérios aprovados da Missão 4.

## Parecer final

**Aprovado**

Os ajustes atendem aos bloqueadores anteriores sem ampliar a paginação para
outras consultas e preservam o guard server-side da Missão 3, o escopo e os
arquivos protegidos.

A aprovação do Reviewer não conclui nem autoriza por si só a missão. A Missão 4
ainda depende da aceitação humana final antes de qualquer stage, commit, push,
merge ou publicação.
