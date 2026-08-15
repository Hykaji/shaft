# Revisão do Reviewer: paginação completa das movimentações financeiras

**Data:** 14 de agosto de 2026  
**Missão:** `mission-04-finance-pagination`  
**Papel:** Reviewer  
**Resultado do Builder revisado:** `docs/agent-reports/missions/mission-04-finance-pagination/02-builder-result-finance-pagination.md`  
**Tipo de revisão:** Inicialmente somente de leitura; nenhuma correção implementada

## Escopo e evidências revisados

- leitura integral de `AGENTS.md`, `docs/agent-workflow.md`, dos três documentos existentes da Missão 4, do índice da Missão 3, de `app/lib/notion.ts`, da rota do dashboard, do novo teste e de `package.json`;
- comparação de todas as mudanças locais rastreadas e não rastreadas contra `8e5f62a5dee48a438d7d791a75dfd80e50d52ce3`;
- inspeção completa do diff de implementação, dos documentos de planejamento da Missão 4 e, separadamente, de `docs/roadmap.md`;
- busca de todos os consumidores de `query` e `queryAllPages` em `app/` e `tests/`;
- verificação atual do contrato de paginação nas fontes oficiais do Notion, inclusive o limite de 10.000 resultados, `request_status` e a natureza opaca dos cursores;
- lint direcionado, lint amplo com exclusão explícita de `work`, build, suíte completa, `git diff --check` e ensaios adicionais sem rede real.

## Separação das mudanças locais

### Implementação da Missão 4

- `app/lib/notion.ts`;
- `app/api/notion/dashboard/route.ts`;
- `package.json`;
- `tests/notion-finance-pagination.test.mjs`.

### Planejamento e documentação da Missão 4

- `docs/agent-reports/missions/mission-04-finance-pagination/README.md`;
- `docs/agent-reports/missions/mission-04-finance-pagination/01-builder-plan-finance-pagination.md`;
- `docs/agent-reports/missions/mission-04-finance-pagination/02-builder-result-finance-pagination.md`;
- a entrada da Missão 4 em `docs/agent-reports/README.md`, cujo texto registra a fase de planejamento. Essa mudança integra o diff local contra o HEAD, mas não foi contada como implementação do Builder posterior à aprovação.

### Documento da direção humana

`docs/roadmap.md` está não rastreado em relação ao HEAD-base e pertence à direção humana. Não foi atribuído ao Builder nem tratado como parte da implementação. Seu SHA-256 atual é `82BD5BA48D9CD05CC18E9A5930BAE59284569A8C4FB920E76F86ED20A45BB4A4`, exatamente o valor registrado pelo Builder ao final da implementação. O arquivo permaneceu preservado durante esta revisão.

## Avaliação executiva

A estrutura principal está correta, mas a missão ainda não pode ser aprovada.

`query` continua representando uma página e chama `notionRequest` uma vez por invocação (`app/lib/notion.ts:59-64`). Isso significa uma solicitação lógica single-page; a nova paginação não foi incorporada silenciosamente. A tentativa adicional preexistente para `429` em `notionRequest` permanece inalterada.

`next_cursor` foi representado como `string | null`. O helper não modifica o corpo original, preserva `page_size`, filtro, ordenação, `result_type`, parâmetros adicionais e cursor inicial, e retransmite os cursores sem normalizá-los. `trim()` é usado somente para detectar vazio; o valor original é enviado literalmente. Cursor inicial vazio, `next_cursor` ausente ou vazio e cursor repetido falham antes de uma solicitação indevida.

O limite aceita somente inteiros entre 1 e 100. Quando a última página ainda informa `has_more: true`, o helper rejeita a operação inteira e não devolve o array acumulado. Uma falha HTTP posterior também impede resposta com `balance`.

Somente `SOURCES.finances` usa `queryAllPages`; check-ins, semana, exercícios, sessões e cargas continuam usando `query`. As regras do saldo foram preservadas literalmente: planejados não contam; `Entrada` e `Saldo inicial` somam; `Saída` e `Economia` subtraem; os outros tipos não alteram o total.

O guard da Missão 3 permanece em `app/api/notion/dashboard/route.ts:10-11`, antes do `Promise.all` e de todo acesso ao Notion. O teste compilado de pedido anônimo registrou zero chamadas a `fetch`.

Apesar desses acertos, o helper ignora o sinal oficial de resultado truncado no teto de 10.000 registros e a rota pode repassar mensagens de erro da paginação contendo o próprio cursor ou detalhes internos. Ambos os casos foram reproduzidos.

## Achados

### [Alto] `request_status: incomplete` é aceito como resultado completo no teto de 10.000 registros

- **Bloqueia a missão:** Sim.
- **Evidência no código:** `NotionQueryResponse` representa apenas `results`, `has_more` e `next_cursor` (`app/lib/notion.ts:15-19`). Depois de acumular os resultados, `queryAllPages` retorna imediatamente quando `has_more` é falso (`app/lib/notion.ts:87-90`), sem inspecionar `request_status`.
- **Contrato oficial atual:** a documentação de [Query a data source](https://developers.notion.com/reference/query-a-data-source) informa que a paginação para no resultado 10.000 e sinaliza truncamento por `request_status.type: "incomplete"` com `incomplete_reason: "query_result_limit_reached"`. A política de [versionamento](https://developers.notion.com/reference/versioning) esclarece que novos campos de resposta são mudanças aditivas aplicadas a todas as versões; fixar `Notion-Version: 2026-03-11` não elimina esse sinal.
- **Reprodução:** um mock de 100 páginas com 100 itens retornou `has_more: false` e `request_status: { type: "incomplete", incomplete_reason: "query_result_limit_reached" }` na última página. O helper fez 100 chamadas e devolveu silenciosamente um array de 10.000 itens: `acceptedIncompleteResult: true`.
- **Impacto:** se a fonte financeira ultrapassar 10.000 movimentações, o dashboard pode exibir como sincronizado um saldo calculado apenas sobre os primeiros 10.000 registros. Isso viola o critério central de nunca aceitar resultado parcial e pode produzir saldo incorreto.
- **Ação necessária:** representar e verificar o estado de conclusão da consulta, rejeitando de modo seguro qualquer `request_status` incompleto antes de devolver os resultados. Adicionar teste que reproduza o teto com `has_more: false`, confirme resposta de erro genérica e confirme ausência de `balance`.

### [Médio] Falha HTTP posterior pode expor cursor opaco e detalhes internos

- **Bloqueia a missão:** Sim.
- **Evidência no código:** `notionRequest` transforma `detail.message` do Notion diretamente em `NotionApiError` (`app/lib/notion.ts:52-54`). `queryAllPages` não sanitiza a exceção da chamada posterior (`app/lib/notion.ts:87`), e `apiError` devolve `error.message` ao cliente (`app/lib/notion.ts:146-150`). O teste atual codifica esse repasse ao esperar literalmente a mensagem simulada da segunda página (`tests/notion-finance-pagination.test.mjs:255-281`).
- **Contrato oficial atual:** a documentação de [versionamento do Notion](https://developers.notion.com/reference/versioning) informa que cursores são opacos e podem conter metadados de sessão ou timestamps; mensagens humanas de erro também podem mudar.
- **Reprodução compilada:** a primeira página devolveu o cursor sentinela `opaque-review-cursor-DO-NOT-EXPOSE`; a segunda devolveu status `400` com mensagem contendo esse cursor e `internal shard finance-7`. O dashboard compilado respondeu com ambos: `cursorExposed: true` e `internalDetailExposed: true`.
- **Impacto:** embora o guard limite a resposta ao proprietário autorizado, a API viola o requisito explícito de não expor cursores ou detalhes internos em erros de paginação. O novo caminho de páginas posteriores amplia o repasse preexistente de erros para valores opacos gerados durante a travessia.
- **Ação necessária:** converter falhas da operação paginada em erro seguro e genérico, sem incorporar a mensagem remota, o cursor ou outros detalhes. Ajustar o teste compilado para usar uma mensagem remota com sentinelas e afirmar que nenhuma delas aparece na resposta.

### [Observação] O índice global registra ainda a fase de planejamento

- **Bloqueia a missão:** Não.
- **Evidência:** `docs/agent-reports/README.md:23-24` diz que o plano da Missão 4 está concluído e aguarda aprovação para implementação, enquanto o índice local e o resultado registram implementação concluída.
- **Impacto:** é apenas estado documental desatualizado. A mudança do índice pertence à fase de planejamento e não foi atribuída à implementação revisada.
- **Ação recomendada:** atualizar o índice somente em etapa autorizada posterior. Não alterar `docs/roadmap.md`, que pertence à direção humana.

## Cobertura, mocks e concorrência

- O teste de dashboard realmente usa `dist/server/index.js` (`tests/notion-finance-pagination.test.mjs:68-72`), gerado antes pela entrada `npm run build` de `package.json`.
- O caso de volume cria 100 entradas e 25 saídas, totalizando 125 movimentações, e confirma saldo de R$ 75 (`tests/notion-finance-pagination.test.mjs:197-228`).
- Todos os testes que chamam `query`, `queryAllPages` ou o worker substituem `globalThis.fetch` antes da chamada. O binding `ASSETS.fetch` também é local. Nenhuma chamada chegou ao Notion real.
- `beforeEach` configura somente valores falsos. `afterEach` restaura `globalThis.fetch`, `NOTION_API_KEY`, `SHAFT_ALLOWED_USER_IDS` e `SHAFT_ALLOWED_USER_EMAILS`, inclusive distinguindo corretamente valor ausente de string definida (`tests/notion-finance-pagination.test.mjs:10-31`).
- Não há `concurrency: true`. No Node 24.19.0 usado nesta revisão, o [modelo oficial do test runner](https://nodejs.org/docs/latest-v24.x/api/test.html) usa isolamento por processo entre arquivos por padrão, e os testes deste arquivo executam sem concorrência interna explícita. Assim, as mutações globais não interferem com as outras suítes no comando atual.
- A cobertura existente não contempla `request_status: incomplete` e, no erro HTTP posterior, verifica o comportamento inseguro em vez de garantir sanitização. Esses pontos fazem parte dos achados bloqueadores acima.

## Conformidade com o escopo

- Check-ins, XP, treinos, exercícios, sessões, cargas, autenticação e allowlists não foram alterados.
- O guard da Missão 3 não foi modificado nem reposicionado.
- Não houve alteração de schema, IDs, propriedades ou dados do Notion.
- `package-lock.json` e `pnpm-lock.yaml` não possuem diff contra o HEAD; as seções de dependências de `package.json` não mudaram.
- Banco, D1, R2, ambiente, `.env.local`, interface, CSS, PWA e configuração do Sites não foram alterados.
- Nenhum arquivo está staged. Não houve commit, push, merge ou publicação durante a revisão.
- `docs/roadmap.md` foi somente lido e preservado como documento da direção humana.

## Avaliação das validações

### Reproduzidas com sucesso

1. Lint direcionado de `app/lib/notion.ts`, da rota do dashboard e do novo teste: exit code `0`, sem avisos.
2. Lint amplo com `--ignore-pattern dist --ignore-pattern .next --ignore-pattern work`: exit code `0`, sem avisos.
3. `npm run build`: aprovado; as quatro rotas do Notion apareceram no artefato.
4. `npm test`: aprovado; 24 testes passaram, zero falhas.
5. Busca de consumidores: somente a consulta financeira do dashboard usa `queryAllPages`; todos os demais consumidores continuam com `query`.
6. `git diff --check 8e5f62a`: aprovado.
7. Inspeção completa do diff, dos arquivos não rastreados e do índice: concluída.
8. Matriz adicional: limites `0`, negativo, fracionário, `NaN`, `Infinity` e `101` foram recusados antes de `fetch`; cursores iniciais vazio e composto somente por espaços foram recusados; corpo e cursores opacos com espaços e pontuação foram preservados literalmente.
9. Falha posterior compilada: confirmou ausência de saldo parcial, mas reproduziu exposição da mensagem remota, do cursor e de detalhe interno.
10. Teto oficial simulado: 100 páginas e 10.000 itens com `request_status: incomplete` foram aceitos indevidamente como resultado completo.

### Limitações

- Nenhuma chamada foi feita ao Notion real, por exigência de escopo. O contrato remoto foi verificado na documentação oficial atual e reproduzido com mocks controlados.
- Não houve publicação ou teste end-to-end no ambiente hospedado, pois isso não está autorizado.

## Handoff final

O trabalho retorna ao Builder com dois itens bloqueadores:

1. rejeitar explicitamente resultados marcados como incompletos pelo Notion, inclusive quando `has_more` for falso no teto de 10.000;
2. impedir que qualquer falha da operação paginada devolva cursores ou detalhes internos, com teste compilado de não exposição.

Depois dos ajustes, o Builder deve executar novamente lint, build, suíte completa, revisar o diff e produzir novo resultado cronológico para uma nova revisão. Nenhuma ação de Git ou publicação está autorizada.

## Parecer

Requer ajustes
