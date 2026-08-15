# Plano do Builder: idempotência do check-in e consistência do XP

**Data:** 15 de agosto de 2026
**Missão:** `mission-05-checkin-idempotency`
**Papel:** Builder
**Status:** Aguardando decisão humana de arquitetura

## Objetivo

Garantir que uma intenção de check-in para uma data produza no máximo um
registro canônico e uma concessão de XP, mesmo diante de clique duplo, retry,
resposta perdida, concorrência entre requisições, datas diferentes simultâneas
e inserções retroativas.

Esta entrega registra somente a investigação e o plano. Nenhum código, teste,
schema, dado, binding ou configuração foi alterado.

## Fontes de verdade consultadas

Foram lidos integralmente:

- `AGENTS.md` e `docs/agent-workflow.md`;
- `docs/roadmap.md`;
- os índices e decisões finais das Missões 3 e 4;
- `app/api/notion/checkins/route.ts`;
- `app/api/notion/dashboard/route.ts`;
- `app/lib/notion.ts`;
- `app/ShaftApp.tsx`, para o fluxo de reenvio no cliente;
- os três arquivos de teste atuais e `package.json`;
- o scaffold de D1 em `db/`, `drizzle.config.ts`, `worker/index.ts`,
  `.openai/hosting.json` e `vite.config.ts`.

As limitações remotas foram verificadas nas fontes oficiais vigentes em 15 de
agosto de 2026:

- [Create a page](https://developers.notion.com/reference/post-page);
- [Query a data source](https://developers.notion.com/reference/query-a-data-source);
- [Data source properties](https://developers.notion.com/reference/property-object);
- [Sort data source entries](https://developers.notion.com/reference/sort-data-source-entries);
- [Request limits](https://developers.notion.com/reference/request-limits);
- [Status codes](https://developers.notion.com/reference/status-codes);
- [Cloudflare D1 Database API](https://developers.cloudflare.com/d1/worker-api/d1-database/);
- [Cloudflare D1 indexes](https://developers.cloudflare.com/d1/best-practices/use-indexes/).

## Comportamento atual com evidências

### Guard da Missão 3

`POST /api/notion/checkins` recebe o `Request`, aguarda
`authorizeShaftApiRequest` e retorna o erro de acesso antes de ler o corpo ou
consultar o Notion (`app/api/notion/checkins/route.ts:20-22`). O dashboard faz o
mesmo antes de suas consultas (`app/api/notion/dashboard/route.ts:9-11`).

Esse posicionamento deve ser preservado. Os testes atuais cobrem a recusa de
pedidos anônimos nas quatro rotas, inclusive check-ins, antes do processamento.

### Proteção existente por data

A rota normaliza a data e executa uma consulta com filtro `Data equals date` e
`page_size: 1` (`app/api/notion/checkins/route.ts:37-40`). Se a consulta encontra
uma página, responde `409` (`app/api/notion/checkins/route.ts:41-43`).

Essa proteção funciona para um reenvio estritamente sequencial quando a primeira
criação já terminou e a consulta seguinte consegue enxergá-la. Ela não torna a
operação atômica.

### Janela de concorrência

Depois da consulta de existência, a rota ainda:

1. consulta separadamente o último check-in;
2. calcula `previousTotal`, `xpDay` e `xpTotal`;
3. envia um `POST /v1/pages` por `createPage`.

Não existe lock, compare-and-set, transação ou restrição única envolvendo a
consulta e a criação (`app/api/notion/checkins/route.ts:37-87`). Duas requisições
podem observar ausência e criar duas páginas.

### Seleção e armazenamento do XP

A base do acumulado é uma única página ordenada por timestamp
`created_time desc`, não pela propriedade lógica `Data`
(`app/api/notion/checkins/route.ts:45-49`). O total novo é
`previousTotal + xpDay` e é gravado de forma desnormalizada na nova página
(`app/api/notion/checkins/route.ts:58-83`).

O dashboard repete a escolha por `created_time desc` e usa o `XP total` da
página retornada (`app/api/notion/dashboard/route.ts:15,21-23`). Portanto, a
página criada por último é tratada como o check-in mais recente mesmo quando sua
`Data` é anterior.

### Redução de clique duplo no cliente

O formulário define `saving` antes de aguardar o `POST` e desabilita o botão
enquanto a promessa está pendente (`app/ShaftApp.tsx:180-194`). Isso reduz
cliques duplos na mesma instância visível do formulário, mas não protege retry
do navegador, outra aba, repetição externa, duas instâncias do servidor ou
resposta perdida. O request também não leva uma chave de idempotência.

### Cobertura atual

Não existe teste do caminho autorizado de `POST /api/notion/checkins`. A suíte
atual cobre o guard, dashboard, paginação financeira e helpers de treino, mas
não cobre duplicidade, retry, cálculo concorrente de XP, retroatividade ou
ordenação lógica dos check-ins.

## Cenários de falha reproduzíveis

### 1. Duas requisições para a mesma data

Intercalação suficiente para reproduzir:

```text
R1 consulta Data=D -> 0 resultados
R2 consulta Data=D -> 0 resultados
R1 lê XP total=T
R2 lê XP total=T
R1 cria D com XP do dia=X e XP total=T+X
R2 cria D com XP do dia=X e XP total=T+X
```

As duas respostas podem ser `200`. O Notion fica com duas páginas para a mesma
data. O total desnormalizado de cada uma pode parecer igual, mas o evento de XP
foi duplicado e qualquer agregação futura por `XP do dia` o contará duas vezes.

### 2. Retry depois de resposta ambígua

O `POST /v1/pages` pode chegar ao Notion e criar a página, enquanto a conexão
com o Shaft termina antes de a resposta ser recebida. O servidor não guarda
estado da intenção. Um retry depende apenas de uma nova consulta por data:

- se a página já for visível, o cliente recebe `409`, não a resposta original;
- se duas tentativas estiverem sobrepostas, ambas podem criar;
- não há como distinguir com certeza "criou e perdi a resposta" de "não criou".

A documentação oficial do Notion recomenda não repetir `POST` em erros de
servidor sem proteção de idempotência própria. O contrato documentado de
`Create a page` não oferece chave de idempotência configurável.

### 3. Duas datas diferentes simultâneas

Ensaio local controlado contra o worker compilado, com token falso e
`globalThis.fetch` inteiramente simulado, fez duas datas observarem o mesmo
estado vazio. As duas respostas foram `200`; cada página recebeu `XP do dia: 10`
e `XP total: 10`. O total correto depois dos dois eventos seria `20`.

Isso é um lost update: unicidade por data, mesmo se existisse, não serializaria
a leitura e o incremento do acumulado global.

### 4. Check-in retroativo

Ensaio local controlado partiu de `2026-08-15` com `XP total: 10` e inseriu
depois `2026-08-14` com `XP do dia: 10`. A rota respondeu `200` e gravou no dia
14 `XP total: 20`. Ordenada pela propriedade `Data`, a sequência passou a ser:

```text
2026-08-14 -> XP total 20
2026-08-15 -> XP total 10
```

O acumulado diminui ao avançar no tempo. Como o dashboard ordena por
`created_time`, ele também pode exibir o dia 14 como o "último check-in" apenas
porque foi inserido depois.

### 5. Falha durante correção de totais posteriores

Uma tentativa de corrigir retroatividade atualizando todas as páginas futuras
continuaria não transacional no Notion. Se a terceira de cinco atualizações
falhar, a sequência permanecerá parcialmente reescrita. Outra requisição pode
intercalar-se com essas atualizações.

## Limitações reais do Notion

### Evidência documentada

- `Query a data source` oferece filtros e ordenação, mas é uma operação
  separada de `Create a page`.
- `Create a page` documenta `parent`, `properties`, conteúdo, template e
  posição; não documenta `Idempotency-Key`, chave de cliente, precondição ou
  criação condicional.
- `created_time` é gerado pelo Notion e representa criação física da página,
  não a data lógica do check-in.
- O tipo `unique_id` é um contador único gerado automaticamente e somente de
  leitura. Ele não transforma a propriedade `Data` em restrição única nem
  aceita uma chave determinística do cliente.
- O status `409 conflict_error` é um erro genérico de colisão do serviço; o
  contrato não o apresenta como mecanismo para impor unicidade de propriedades.

### Inferência declarada

Como o contrato oficial não oferece transação que englobe query e create,
precondição, chave de idempotência ou unicidade configurável para `Data`, não
é possível implementar no Notion um `INSERT ... ON CONFLICT` equivalente.

Uma fila ou lock em memória no módulo do Worker cobre somente requisições que
caem no mesmo isolate enquanto ele permanece vivo. Não cobre múltiplos isolates,
reinício, escala horizontal ou falha entre o envio do `POST` e a resposta.

## Garantia possível usando somente o sistema atual

Sem banco próprio, mudança de schema ou coordenador externo, a garantia máxima
é **best-effort**:

- bloquear reenvio sequencial quando a primeira página já é visível;
- reduzir clique duplo na interface;
- adicionar lock por data ou fila global dentro de um único isolate;
- consultar novamente antes ou depois da criação e detectar algumas
  duplicatas;
- calcular o dashboard por `Data` ou pela soma de `XP do dia` para reduzir o
  dano de entradas fora de ordem.

Essas medidas diminuem probabilidade, mas não garantem "uma data, um registro,
um XP". Também não tornam atômica uma reescrita de `XP total` em várias páginas.
Portanto, não é recomendado apresentar uma implementação somente em Notion
como solução confiável da missão.

## Solução recomendada

### Escolha: ledger transacional do Shaft; Notion como projeção

Recomenda-se ativar o D1 já scaffoldado no projeto e torná-lo a fonte canônica
para identidade do check-in e XP:

1. Uma tabela de check-ins usa `date` como chave única global desta aplicação
   pessoal, ou uma chave composta `owner_id + date` se a direção quiser suportar
   mais de um proprietário no mesmo conjunto de dados.
2. A transação insere a intenção uma vez, guarda fingerprint do payload,
   `xp_day` e estado de sincronização. Repetição idêntica devolve o resultado
   canônico; payload diferente para a mesma chave retorna `409`.
3. O total do Shaft é derivado da soma dos eventos canônicos de `xp_day`, não do
   último valor desnormalizado criado fisicamente. Datas diferentes concorrentes
   e inserções retroativas passam a produzir o mesmo total final.
4. O dashboard seleciona o check-in mais recente por `Data` e lê XP do ledger.
   Finanças, exercícios e as regras aprovadas das Missões 3 e 4 permanecem como
   estão.
5. O Notion recebe uma projeção do registro canônico. Antes do `POST`, o ledger
   grava durablemente que a tentativa de criação começou. Depois do sucesso,
   guarda o `page_id`.
6. Uma resposta ambígua do Notion não dispara outro `POST /pages` automaticamente.
   O registro fica `sync_pending` para reconciliação. Essa escolha privilegia
   não duplicar; pode atrasar ou exigir reparação da projeção.

D1 suporta restrição única SQLite e batches transacionais; se uma instrução do
batch falha, o conjunto é revertido. Isso fornece a primitiva que falta ao
Notion para reservar uma data e o evento de XP uma única vez.

### Consistência de `XP total` no Notion

Há uma decisão de produto necessária:

- **Recomendado:** declarar `XP do dia` como evento espelhado no Notion e o
  total do D1 como canônico. `XP total` no Notion deixa de ser fonte de verdade;
  pode ser mantido como snapshot informativo e reconciliável.
- **Se toda linha do Notion precisar manter acumulado histórico perfeito:** uma
  inserção retroativa exige atualizar todas as linhas futuras. O Notion não
  oferece transação multi-page; pode existir inconsistência transitória e uma
  rotina de reconciliação será obrigatória. A garantia estrita deve permanecer no
  D1, não na projeção.

### Schema do Notion

Uma mudança no schema do Notion não é indispensável para a unicidade canônica
no D1 se a projeção usar `Data` e nunca repetir automaticamente uma criação
ambígua.

Adicionar uma propriedade imutável como `Shaft check-in ID` melhoraria
reconciliação e proveniência, mas ainda não seria uma restrição única imposta
pelo Notion. Essa alteração de schema exige aprovação humana separada.

## Alternativas descartadas

### Apenas repetir a consulta antes de criar

Continua sendo check-then-act e conserva a mesma janela de corrida.

### Lock em memória por data

Ajuda somente dentro de um isolate. Não oferece garantia distribuída nem
recupera estado depois de restart.

### Fila global em memória

Evita lost update apenas no mesmo processo e reduz paralelismo sem resolver
múltiplas instâncias ou resposta ambígua.

### Usar `created_time` como ordem lógica

Confunde momento de inserção com data do evento e falha para retroativos.

### Somar `XP do dia` diretamente no Notion

Melhora o total exibido, mas duplica XP quando há páginas repetidas e continua
sem unicidade atômica. Também precisa paginação completa e tratamento de
resultado incompleto.

### Reconsultar e apagar a duplicata

É correção posterior, não prevenção. Duas requisições podem escolher
canônicos diferentes; uma falha pode deixar o estado parcial. Exclusão
automática de dados também exigiria autorização destrutiva.

### Usar a propriedade `unique_id` do Notion

O valor é automático e somente de leitura. Não permite reservar a data nem
reutilizar uma chave do cliente.

### Reescrever todos os `XP total` posteriores

Sem transação multi-page, uma falha ou concorrência deixa parte da sequência
atualizada e parte antiga.

## Arquivos exatos de uma implementação futura recomendada

O conjunto abaixo é **condicional à aprovação da arquitetura D1**. Não está
autorizado nesta etapa.

### Modificar

- `.openai/hosting.json`
  - ativar explicitamente o binding D1 `DB`.
- `db/schema.ts`
  - definir o ledger canônico de check-ins, chave única, fingerprint, XP e
    estado de sincronização com Notion.
- `db/index.ts`
  - expor acesso testável ao binding sem enfraquecer a falha fechada quando o
    D1 não estiver configurado.
- `app/api/notion/checkins/route.ts`
  - preservar o guard; reservar idempotentemente a data no ledger; separar
    resultado canônico da projeção no Notion; tratar replay e conflito.
- `app/api/notion/dashboard/route.ts`
  - preservar guard e paginação financeira; obter check-in e XP canônicos por
    data lógica no ledger.
- `package.json`
  - incluir a nova suíte no comando completo, sem novas dependências se o
    scaffold atual for suficiente.
- `docs/agent-reports/missions/mission-05-checkin-idempotency/README.md`
  - registrar cronologicamente implementação, revisão e decisões.

### Criar

- `db/checkins.ts`
  - operações transacionais do ledger e tipos de persistência.
- `app/lib/checkin-xp.ts`
  - normalização, fingerprint e regra pura de XP, separadas de I/O.
- `tests/checkin-idempotency.test.mjs`
  - testes do ledger, rota compilada, concorrência, replay, retroatividade,
    falha ambígua e guard.
- `docs/agent-reports/missions/mission-05-checkin-idempotency/02-builder-result-checkin-idempotency.md`
  - resultado e handoff do Builder.
- uma migração SQL e snapshot gerados pelo Drizzle sob `drizzle/` e
  `drizzle/meta/`.

O nome exato dos dois artefatos gerados pelo Drizzle depende do gerador e deve
ser registrado no plano ajustado antes da implementação. Nenhuma migração deve
ser criada ou aplicada antes da decisão humana.

### Preservar sem alterar

- `app/lib/notion.ts`, salvo se a arquitetura aprovada exigir um helper de
  reconciliação especificamente revisado;
- `app/ShaftApp.tsx`, porque a data canônica já pode servir de chave de
  idempotência para a regra atual de um check-in por dia;
- `app/chatgpt-auth.ts` e `app/lib/shaft-access-policy.ts`;
- arquivos e decisões das Missões 3 e 4;
- `docs/roadmap.md`;
- finanças, treinos, interface, PWA, R2 e Sites.

## Testes propostos

Todos os testes devem usar D1 local isolado ou um adapter falso e mock completo
do Notion. Nenhuma chamada ao Notion real ou D1 remoto é permitida.

1. Pedido anônimo continua recebendo `401` antes de qualquer acesso a D1 ou
   Notion.
2. Duas requisições simultâneas para a mesma data e payload criam uma linha
   canônica, concedem XP uma vez e iniciam no máximo um `POST /pages`.
3. Replay sequencial do mesmo payload devolve o mesmo resultado canônico sem
   nova concessão ou criação.
4. Mesmo dia com payload diferente retorna `409` e não altera o registro.
5. Clique/retry depois de resposta ambígua não repete `POST /pages`; retorna
   estado seguro de sincronização pendente.
6. Duas datas diferentes simultâneas persistem ambos os eventos e o total final
   é a soma, independentemente da ordem de conclusão.
7. Inserção retroativa preserva o total canônico e o dashboard continua
   apontando para a maior `Data`.
8. Mudança de ordem física ou `created_time` não muda o total nem o check-in
   lógico mais recente.
9. Falha do D1 antes do commit não chama o Notion nem concede XP.
10. Falha do Notion depois do commit não desfaz nem duplica o evento canônico;
    a projeção fica explicitamente pendente.
11. Reexecução de reconciliação é idempotente e nunca escolhe silenciosamente
    entre múltiplas páginas existentes para a mesma data.
12. O dashboard conserva paginação somente nas finanças e todas as regras de
    saldo da Missão 4.
13. A suíte preexistente das Missões 3 e 4 continua integralmente aprovada.

Validação prevista:

- lint direcionado dos arquivos tocados;
- lint amplo com exclusão de `work`;
- migração em D1 local vazio e em fixture representando dados legados;
- build;
- teste focal repetido com alta concorrência;
- suíte completa;
- `git diff --check`, diff completo e auditoria de arquivos não rastreados;
- confirmação de zero chamadas reais e zero segredo nos artefatos.

## Riscos e limitações que permaneceriam

- Não existe transação distribuída entre D1 e Notion. A consistência forte
  vale para o ledger do Shaft; o Notion é uma projeção que pode ficar pendente.
- Priorizar at-most-once na criação do Notion pode exigir reconciliação manual
  quando não for possível saber se um `POST` ambíguo chegou ao serviço.
- Dados legados precisam ser auditados antes da migração. Duplicatas existentes
  não podem ser removidas ou fundidas automaticamente sem decisão humana.
- Se `XP total` continuar gravado em todas as páginas do Notion, retroativos
  podem deixá-lo temporariamente desatualizado até reconciliação.
- Ativar D1 introduz custo operacional, migração, backup, recuperação e nova
  fonte de verdade que precisam ser documentados e aceitos.
- Mais de um proprietário exige decisão sobre isolamento e possível propriedade
  de autor no schema do Notion.

## Critérios de aceitação

Uma implementação só deve ser aprovada se:

1. a fonte canônica e a semântica de replay estiverem decididas explicitamente;
2. a mesma chave lógica não puder conceder XP duas vezes sob concorrência real;
3. datas diferentes simultâneas não produzirem lost update;
4. retroativos não reduzirem o acumulado ao avançar na data;
5. resposta ambígua do Notion não causar criação repetida automática;
6. conflito de payload para a mesma data for visível e não sobrescrever dados;
7. o dashboard usar a maior `Data`, não o último `created_time`, para o
   check-in lógico;
8. estado canônico confirmado e projeção pendente forem diferenciados para não
   declarar sincronização inexistente;
9. o guard da Missão 3 permanecer antes de D1 e Notion;
10. a paginação e sanitização da Missão 4 permanecerem intactas;
11. migração, testes, lint, build e suíte completa passarem sem rede real;
12. nenhuma publicação ocorrer sem nova autorização.

## Decisões necessárias da direção humana

Antes de qualquer implementação, a direção deve decidir:

1. autorizar ou não D1 como fonte canônica de check-ins e XP;
2. aceitar o Notion como projeção eventualmente consistente;
3. definir se `XP total` no Notion continua apenas como snapshot ou se exige
   reconciliação histórica de todas as linhas;
4. escolher at-most-once com possível estado pendente para falhas ambíguas, em
   vez de retries que possam duplicar;
5. decidir se uma propriedade `Shaft check-in ID` será adicionada ao schema;
6. aprovar estratégia de migração e tratamento de duplicatas legadas;
7. confirmar se a aplicação permanece de proprietário único ou precisa isolar
   check-ins por identidade autorizada.

Se a direção recusar banco, schema e integração de coordenação, o escopo deve
ser reclassificado explicitamente como mitigação best-effort. Ele não deve usar
a palavra "garantia" para concorrência distribuída ou falha ambígua.

## Solicitação de decisão

O Builder recomenda **não iniciar uma correção somente na rota atual**.
Solicita-se uma decisão humana sobre a arquitetura D1 e as sete questões acima.
Depois dessa decisão, o plano deve ser ajustado com o escopo final, os nomes
exatos da migração e a aprovação explícita antes de implementar.
