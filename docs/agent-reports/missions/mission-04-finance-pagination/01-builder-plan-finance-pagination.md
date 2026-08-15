# Plano do Builder: paginação completa das movimentações financeiras

**Data:** 14 de agosto de 2026  
**Missão:** `mission-04-finance-pagination`  
**Papel:** Builder  
**Status:** Aguardando aprovação humana

## Objetivo

Fazer o dashboard calcular o saldo com todas as movimentações financeiras
retornáveis pela consulta da fonte de dados do Notion, percorrendo os cursores
de forma limitada e verificável, sem alterar o comportamento das consultas de
check-ins, semanas, exercícios, sessões ou cargas.

Esta entrega é somente o plano. Nenhuma implementação foi iniciada.

## Implementação atual e evidências

### Contrato local de `query`

- `app/lib/notion.ts:51-55` envia um `POST` para
  `/data_sources/{source}/query`, serializando diretamente o objeto `body`.
- O retorno está tipado somente como `{ results: NotionPage[]; has_more:
  boolean }`. O contrato não representa `next_cursor` e não existe helper que
  faça uma segunda requisição.
- `notionRequest` faz uma única nova tentativa para resposta `429`, limita a
  espera informada por `Retry-After` a três segundos e propaga outros erros por
  `NotionApiError`. Esta missão não deve redesenhar essa política de tentativas.

### Contrato oficial do Notion

Na documentação oficial vigente, compatível com o cabeçalho
`Notion-Version: 2026-03-11` já usado pelo Shaft:

- consultas a data sources são paginadas por cursor;
- `has_more` informa se existem mais resultados;
- `next_cursor` é `string | null` na resposta do endpoint e fornece o cursor da
  próxima página;
- `start_cursor` é o cursor opaco enviado no corpo do próximo `POST`;
- `page_size` aceita no máximo 100 e uma resposta pode trazer menos itens do
  que o tamanho solicitado;
- o cursor deve ser retransmitido literalmente, sem parsing ou suposições
  sobre seu formato;
- uma consulta a data source permite paginação de até 10.000 resultados.

Fontes oficiais consultadas em 14 de agosto de 2026:

- [Paginação na introdução da API do Notion](https://developers.notion.com/reference/intro#pagination)
- [Query a data source](https://developers.notion.com/reference/query-a-data-source)
- [Versionamento e cursores opacos](https://developers.notion.com/reference/versioning)
- [Limites de requisição](https://developers.notion.com/reference/request-limits)

### Consumidores atuais e risco de regressão

A busca por `query(` encontrou somente estes consumidores ativos:

- `app/api/notion/dashboard/route.ts`:
  - último check-in, com `page_size: 1` e ordenação por criação;
  - semana ativa, com `page_size: 1` e filtro de status;
  - finanças, com `page_size: 100`, sem filtro ou ordenação;
  - exercícios ativos, com `page_size: 100`, filtro e ordenação por `Ordem`;
- `app/api/notion/checkins/route.ts`:
  - existência do check-in na data e último total de XP, ambos com
    `page_size: 1`;
- `app/api/notion/training/route.ts`:
  - sessão planejada mais recente, com `page_size: 1`;
  - até 100 registros de carga relacionados à sessão.

Mudar `query` para paginar automaticamente alteraria todos esses contratos de
uma vez. Isso poderia ampliar leituras, custo, latência e comportamento de
treinos ou exercícios sem que essas áreas fossem investigadas. Portanto, essa
opção não é recomendada.

### Cálculo atual do saldo

Em `app/api/notion/dashboard/route.ts:25-32`, o saldo reduz somente
`finances.results`, que hoje contém no máximo a primeira página:

- ignora páginas com `Planejado` marcado;
- soma `Entrada` e `Saldo inicial`;
- subtrai `Saída` e `Economia`;
- ignora outros tipos, inclusive `Transferência`;
- propriedades numéricas ausentes ou nulas chegam como zero por meio de
  `getNumber`.

A ordem dos registros não altera essa soma. O plano preserva exatamente essas
regras e não adiciona filtro ou ordenação à consulta financeira.

### Guard de autorização da Missão 3

`app/api/notion/dashboard/route.ts:9-13` recebe o `Request`, aguarda
`authorizeShaftApiRequest(request)` e retorna qualquer erro de acesso antes de
entrar no bloco que consulta o Notion. A suíte
`tests/shaft-access-policy.test.mjs` também confirma que pedidos anônimos são
recusados antes do processamento das quatro rotas.

A paginação deve permanecer depois desse guard. Nenhum caminho de cursor pode
ser iniciado para uma requisição negada.

## Solução recomendada

### Escolha: helper genérico, uso explícito somente em finanças

Recomenda-se separar claramente duas operações:

1. `query` continua significando **uma página** e mantém todos os consumidores
   atuais com o mesmo comportamento. Seu tipo passa apenas a representar
   `next_cursor` corretamente; isso não dispara novas requisições.
2. Um novo helper, com nome explícito como `queryAllPages`, concentra o
   protocolo de cursor e é chamado somente pela consulta de finanças no
   dashboard.

O mecanismo de paginação é genérico porque `has_more`, `next_cursor` e
`start_cursor` pertencem ao contrato comum do Notion. O uso é específico para
finanças porque somente esse caso foi autorizado para investigação. Isso evita
duplicar um loop delicado dentro da rota sem ampliar silenciosamente outras
consultas.

### Comportamento proposto do helper

- Receber `source`, o `body` original e um limite explícito de páginas.
- Não modificar o objeto recebido.
- Criar um novo corpo a cada requisição, preservando `page_size`, `filter`,
  `sorts`, `result_type` e qualquer outro parâmetro original.
- Na primeira chamada, preservar inclusive um `start_cursor` fornecido pelo
  chamador, se existir.
- Nas chamadas seguintes, alterar somente `start_cursor`, usando o
  `next_cursor` anterior de forma opaca.
- Acumular os resultados somente enquanto o protocolo for válido.
- Encerrar quando `has_more` for `false`.
- Exigir um `next_cursor` não vazio quando `has_more` for `true`.
- Manter um conjunto dos cursores já solicitados e falhar se o Notion devolver
  um cursor repetido.
- Exigir `maxPages` explicitamente. A chamada financeira usará 100 páginas,
  cada uma com `page_size: 100`, alinhando o limite operacional a até 10.000
  resultados, que é também o limite documentado do endpoint.
- Se a centésima página ainda indicar `has_more`, falhar de modo seguro em vez
  de devolver silenciosamente dados incompletos.

Cursor ausente, repetido ou limite excedido deve gerar um erro seguro de
integração, sem expor o cursor ao cliente.

### Falha em página posterior

Se qualquer página posterior falhar, o helper deve rejeitar a operação inteira.
Ele não deve devolver os resultados acumulados nem permitir que a rota calcule
um saldo parcial.

Como a consulta financeira continuará dentro do `Promise.all` do dashboard, o
erro seguirá para o `catch` e para `apiError`, preservando o estado de
indisponibilidade já existente no frontend. A prioridade é não apresentar um
saldo incorreto como sincronizado.

## Arquivos exatos de uma implementação futura

Somente após aprovação humana:

### Modificar

- `app/lib/notion.ts`
  - representar `next_cursor: string | null` no contrato da resposta de
    `query`;
  - adicionar o helper opt-in de paginação completa, com cópia do corpo,
    detecção de cursor ausente ou repetido e limite explícito de páginas.
- `app/api/notion/dashboard/route.ts`
  - trocar somente a consulta de `SOURCES.finances` pelo helper completo;
  - manter check-ins, semanas e exercícios usando `query` de uma página;
  - preservar posição e comportamento do guard da Missão 3 e as regras atuais
    do cálculo de saldo.
- `package.json`
  - incluir o novo arquivo de testes no comando explícito `test`, sem alterar
    dependências ou os demais scripts.
- `docs/agent-reports/missions/mission-04-finance-pagination/README.md`
  - registrar cronologicamente o resultado e o estado da missão.

### Criar

- `tests/notion-finance-pagination.test.mjs`
  - testes sem acesso ao Notion real, usando respostas simuladas de `fetch`.
- `docs/agent-reports/missions/mission-04-finance-pagination/02-builder-result-finance-pagination.md`
  - resultado, validações e handoff ao Reviewer.

### Mover ou excluir

- Nenhum arquivo.

Qualquer necessidade de tocar outro arquivo interrompe essa parte da
implementação e exige nova decisão humana.

## Exclusões explícitas

- não alterar `app/chatgpt-auth.ts`, `app/lib/shaft-access-policy.ts`, listas de
  proprietários, cabeçalhos de identidade ou qualquer regra de autenticação e
  autorização;
- não alterar XP, nível, check-ins, idempotência ou datas;
- não alterar exercícios, sessões, cargas, formulário ou salvamento de
  treinos;
- não paginar automaticamente exercícios, cargas, check-ins, semanas, sessões
  ou qualquer outra rota;
- não mudar as regras de soma e subtração do saldo;
- não adicionar filtros, ordenações ou deduplicação de páginas financeiras;
- não alterar IDs, propriedades, relações, dados ou schema do Notion;
- não acessar o Notion real durante os testes;
- não adicionar dependências, mudar lockfiles, ambiente, `.env.local`, banco,
  D1, R2, interface, CSS, PWA ou configuração do Sites;
- não tratar nesta missão uma revisão ampla de retries para `429`, `529` ou
  outros erros do Notion;
- não executar commit, push, merge, publicação ou configuração hospedada.

Autenticação, XP, check-ins, treinos, schema do Notion, publicação e todas as
outras áreas não listadas nos arquivos de implementação permanecem fora do
escopo.

## Riscos e casos de borda

- **Cursor repetido:** sem detecção, o loop poderia repetir indefinidamente e
  somar registros mais de uma vez. O helper deve falhar antes de solicitar
  novamente um cursor já visto.
- **`has_more` sem cursor:** é uma resposta incoerente para continuar. Deve
  falhar sem saldo parcial.
- **Limite de páginas:** impede paginação infinita mesmo diante de respostas
  malformadas ou instáveis. Atingir o limite com mais dados pendentes é erro,
  não sucesso parcial.
- **Falha depois da primeira página:** nenhum valor acumulado deve ser
  apresentado ao usuário.
- **Menos itens que `page_size`:** isso não encerra a paginação por si só; a
  decisão deve depender de `has_more`.
- **Corpo de consulta mutado:** poderia vazar `start_cursor` para outra
  operação ou perder filtros e ordenações. O helper deve usar cópias e os
  testes devem provar que o objeto original permanece intacto.
- **Latência e rate limit:** mais de 100 movimentações exigirão chamadas
  sequenciais adicionais. O Notion documenta limites de requisição e o cliente
  local já possui tratamento limitado de `429`; uma falha final continuará
  tornando o dashboard indisponível, em vez de incorreto.
- **Alterações concorrentes no Notion:** registros criados ou editados durante
  a travessia podem afetar qualquer paginação remota. Não será introduzido um
  snapshot, ordenação nova ou deduplicação silenciosa nesta missão.
- **10.000 resultados:** o próprio endpoint documenta esse teto. A missão não
  promete calcular além do que a API permite consultar; se a API sinalizar
  continuação além do limite local, o resultado será indisponível e não
  parcial.
- **Uso futuro indevido:** o helper será exportado, mas nenhum consumidor além
  de finanças será migrado nesta missão. Novos usos exigem investigação própria
  de semântica, custo e limites.

## Testes e validações previstos

### Testes automatizados sem Notion real

O novo arquivo `tests/notion-finance-pagination.test.mjs` substituirá
temporariamente `globalThis.fetch`, configurará apenas variáveis falsas e
restaurará todo estado global em `finally` ou hooks equivalentes.

Casos previstos:

1. Resposta de uma única página com `has_more: false` não faz chamada extra.
2. Duas páginas com **mais de 100 movimentações** — por exemplo, 100 entradas
   de R$ 1 na primeira e 25 saídas de R$ 1 na segunda — produzem saldo de
   R$ 75, provando que a segunda página participa do dashboard.
3. `page_size`, filtros, ordenações e parâmetros adicionais permanecem iguais
   em todas as chamadas; somente `start_cursor` muda, e o corpo original não é
   mutado.
4. Uma página com menos de 100 itens e `has_more: true` ainda solicita a página
   seguinte.
5. `has_more: true` com `next_cursor` nulo ou vazio falha sem resposta de saldo.
6. Cursor repetido falha e não dispara uma nova chamada com o mesmo cursor.
7. Limite explícito de páginas atingido enquanto `has_more` continua verdadeiro
   falha sem retornar resultados parciais.
8. Erro HTTP em uma página posterior propaga a falha; a resposta do dashboard
   não contém `balance` calculado apenas com a primeira página.
9. Pedido não autorizado ao dashboard continua sendo negado antes de qualquer
   `fetch` do Notion.
10. As regras existentes de saldo permanecem iguais: planejados são ignorados,
    entradas e saldo inicial somam, saídas e economia subtraem e tipos não
    reconhecidos não alteram o total.

Os mocks distinguirão as fontes pelo caminho
`/data_sources/{id}/query` e os cursores pelo corpo JSON. Nenhum token real,
chamada de rede ou dado do workspace será usado.

### Validação da implementação

Após eventual aprovação e implementação:

1. lint direcionado de `app/lib/notion.ts`, da rota do dashboard e do novo
   teste;
2. suíte completa por meio de `npm test`, que também executa o build;
3. confirmação de que todos os testes existentes da proteção de acesso
   continuam aprovados;
4. busca final dos consumidores de `query` e `queryAllPages` para confirmar que
   somente finanças adotou paginação completa;
5. revisão do diff e dos arquivos não rastreados para confirmar escopo e
   ausência de segredos;
6. nenhuma chamada manual ao Notion real e nenhuma publicação.

## Aprovação solicitada

Solicita-se aprovação humana explícita para implementar **somente** as
alterações futuras listadas em:

- `app/lib/notion.ts`;
- `app/api/notion/dashboard/route.ts`;
- `tests/notion-finance-pagination.test.mjs`;
- `package.json`;
- os documentos cronológicos desta Missão 4.

A aprovação deste plano não autoriza mudanças em autenticação, XP, check-ins,
treinos, schema ou dados do Notion, interface, banco, configuração, Git ou
publicação. O Builder não deve iniciar a implementação até que essa aprovação
seja registrada pela direção humana.
