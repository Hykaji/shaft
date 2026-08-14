# Revisão final dos ajustes do fallback do Notion

**Data:** 12 de agosto de 2026  
**Resultado revisado:** `docs/agent-reports/resultado-ajustes-review-fallback-notion.md`  
**Revisão anterior:** `docs/agent-reports/review-correcao-fallback-notion.md`  
**Tipo de revisão:** somente leitura; nenhuma correção aplicada  
**Parecer final:** **requer novos ajustes**

## Resumo executivo

Os ajustes resolveram corretamente a concorrência entre respostas do dashboard. Cada chamada recebe um `requestId` crescente e o reducer aceita sucesso ou falha somente quando o identificador corresponde à tentativa mais recente. Os testes agora importam e exercitam o reducer e o validador realmente usados pela aplicação, em vez de se limitarem a procurar texto no arquivo-fonte.

O problema bloqueador da confirmação de treino, porém, não foi eliminado por completo. O validador exige uma linha com três strings e nome não vazio, mas aceita carga vazia, carga arbitrária e grupo vazio. Carga vazia ou não numérica é convertida em `0` pelo formulário e pode ser enviada ao endpoint. Assim, uma lista malformada ainda pode habilitar a confirmação e produzir escrita incorreta.

O retry preserva o mesmo elemento no fluxo isolado e bloqueia cliques adicionais depois que o estado `retrying` foi renderizado. Entretanto, isso não possui teste de interação ou foco; os testes atuais verificam apenas o estado puro que decide a visibilidade da ação. Há também um caso concorrente de baixa severidade em que outra atualização do dashboard pode substituir um retry em andamento e remover o botão focado.

Conforme solicitado, o conteúdo fixo de agosto foi ignorado como bloqueador técnico e permanece apenas como decisão de produto pendente.

## Problemas encontrados

### 1. [ALTO] O validador ainda aceita exercícios com carga malformada

**Evidência:** `app/lib/dashboard-state.ts:65-85`, `app/ShaftApp.tsx:148-156` e `app/ShaftApp.tsx:211-219`.

`getValidExercises` valida:

- que a lista seja um array não vazio;
- que cada item tenha exatamente três campos;
- que os campos sejam strings;
- que o nome não fique vazio após `trim`;
- que não haja nomes duplicados sem diferença de capitalização.

Contudo, `rawLoad` e `rawGroup` são apenas aparados. Não há verificação de conteúdo. Esta revisão executou diretamente o mesmo validador importado pela aplicação e confirmou que os três casos abaixo são aceitos:

```text
[["Supino", "", "Peito"]]       -> [["Supino", "", "Peito"]]
[["Supino", "banana", "Peito"]] -> [["Supino", "banana", "Peito"]]
[["Supino", "30 kg", ""]]       -> [["Supino", "30 kg", ""]]
```

Como o resultado tem tamanho maior que zero, `hasExercises` habilita **Confirmar treino e cargas**. Ao montar `TrainingSheet`, `parseFloat(load) || 0` transforma tanto `""` quanto `"banana"` em carga `0`. O envio pode então atualizar o registro correspondente com zero quilos.

O ajuste impede os casos mais grosseiros da revisão anterior, como `[[]]`, nome vazio, campo não textual e duplicata simples. Ainda assim, não cumpre integralmente o objetivo de impedir confirmação com dados malformados, pois uma carga inválida pode ser convertida silenciosamente em um valor gravável.

### 2. [MÉDIO] Os testes comportamentais não cobrem todo o bloqueador de validação nem o retry real

**Evidência:** `tests/rendered-html.test.mjs:80-156`.

Houve uma melhoria importante: os testes importam `dashboardReducer`, `getValidExercises` e `shouldShowRetryAction` do módulo usado pela aplicação. Portanto, eles exercitam lógica real compartilhada, não uma cópia nem apenas expressões regulares.

Eles cobrem adequadamente:

- transições básicas de `loading`, `available` e `unavailable`;
- retry com sucesso e com falha no reducer;
- falha antiga depois de sucesso recente;
- sucesso antigo depois de sucesso recente;
- sucesso antigo depois de falha recente;
- listas ausentes, vazias, com formato errado, nome vazio, campo não textual, campo extra e duplicata simples.

Eles não cobrem:

- carga vazia;
- carga textual arbitrária que vira zero no formulário;
- grupo vazio;
- integração entre o validador, `hasExercises`, abertura de `TrainingSheet` e payload enviado;
- preservação real de `document.activeElement` durante o retry;
- dois cliques reais ou programáticos no botão;
- a ligação completa entre `refresh`, incremento da sequência e dispatch do reducer.

Por isso, os testes novos resolvem a deficiência anterior apenas parcialmente. Eles são suficientes para provar o reducer isolado, mas não para provar o bloqueio de treino ou o comportamento de foco e interação.

### 3. [BAIXO] Outra atualização pode remover o botão focado durante um retry

**Evidência:** `app/lib/dashboard-state.ts:35-43`, `app/lib/dashboard-state.ts:88-90`, `app/ShaftApp.tsx:48-57` e `app/ShaftApp.tsx:104-108`.

No caminho normal e isolado, o ajuste funciona:

1. o clique inicia uma tentativa de tipo `retry`;
2. o reducer mantém `retrying: true` durante `loading`;
3. `shouldShowRetryAction` conserva o botão no DOM;
4. o mesmo elemento muda para `Tentando novamente…`;
5. o handler ignora novos cliques depois que `retrying` foi renderizado;
6. uma nova falha restaura o texto sem substituir o elemento.

Porém, qualquer tentativa mais nova de tipo `refresh` define `retrying: false`. Isso pode acontecer quando uma gravação de check-in ou finanças iniciada anteriormente termina e chama `refresh("refresh")` enquanto o retry está em voo. Nesse caso, a tentativa nova passa a ser a correta para fins de concorrência, mas `shouldShowRetryAction` fica falso durante `loading`, o botão é removido e o foco pode ser perdido.

Esse caso não invalida a proteção de dados por `requestId`, mas significa que a preservação de foco não é absoluta quando existem origens concorrentes de atualização.

## Verificações solicitadas

### Validação de exercícios

**Não aprovada.** O mesmo validador é usado na lista e no formulário, e a lista inteira é rejeitada quando uma linha falha nas regras implementadas. A regra, contudo, ainda aceita carga vazia ou arbitrária, que vira zero e pode ser gravada. Esse é o bloqueador do parecer final.

### Proteção por `requestId`

**Aprovada.** `requestSequence.current` fornece identificadores estritamente crescentes para todas as origens de `refresh`. O reducer registra o maior identificador iniciado e ignora qualquer sucesso ou falha cujo ID não seja exatamente o atual. Respostas antigas não conseguem apagar, restaurar ou sobrescrever o resultado de uma tentativa mais recente.

O teste de concorrência usa o mesmo reducer e cobre as combinações bloqueadoras da revisão anterior. Não foi encontrada falha lógica nessa proteção.

### Qualidade e cobertura dos testes

**Parcialmente aprovada.** Os testes passaram a exercitar lógica real compartilhada e cobrem corretamente a ordenação de respostas. Não cobrem os dados de exercício ainda aceitos indevidamente nem a interação real do retry.

### Retry, foco e cliques duplicados

**Aprovado no fluxo isolado, com ressalvas.** Manter um botão focável com `aria-disabled="true"` durante a espera evita a remoção imediata que causava a regressão anterior. O guard do handler evita uma nova chamada depois que `retrying` está refletido na renderização. O elemento some normalmente no sucesso, quando a ação deixa de ser necessária.

Não há teste de foco ou de clique duplicado no componente, e uma atualização concorrente de outro tipo pode remover o botão. A proteção também depende do estado renderizado, e não de uma trava imperativa anterior ao próximo evento. Não foi demonstrado um clique duplicado no uso normal, mas a garantia não está automatizada.

### Novas regressões

Não foi encontrada regressão no fluxo de dashboard, no caminho normal de check-in/finanças ou na ordenação das respostas. A extração para `dashboard-state.ts` é pequena, coerente e não cria nova camada de backend.

A única regressão/caso novo identificado é a preservação incompleta do foco quando um `refresh` de outra origem substitui um retry em andamento. A aceitação de carga vazia/arbitrária é uma lacuna do ajuste, não uma regressão em relação ao comportamento anterior.

## Validações executadas nesta revisão

- leitura integral do relatório de ajustes e comparação com a revisão anterior;
- inspeção de `app/ShaftApp.tsx`, `app/lib/dashboard-state.ts`, `app/globals.css`, testes e rota de treino;
- execução direta de `node --test tests/rendered-html.test.mjs`: **5 testes aprovados de 5**;
- ESLint direcionado a `app/ShaftApp.tsx`, `app/lib/dashboard-state.ts` e `tests/rendered-html.test.mjs`: **aprovado sem erros**;
- execução direta do validador com cargas e grupo malformados, reproduzindo o problema descrito acima.

O build não foi repetido nesta revisão somente leitura, porque sua execução reescreve artefatos locais. O relatório do Builder registra build e comando completo de testes aprovados; a presente revisão verificou diretamente os testes sem reconstruir `dist`.

## Decisão de produto de agosto

O conteúdo fixo de agosto não foi considerado bloqueador técnico nesta revisão, conforme orientação explícita. A decisão pendente continua registrada, sem afetar o parecer sobre os ajustes técnicos avaliados aqui.

## Parecer final

**Requer novos ajustes.**

A proteção de concorrência está correta e a arquitetura dos testes melhorou. O retry também resolve a perda de foco no caminho isolado. Ainda assim, o bloqueador principal não foi fechado: dados de carga malformados continuam habilitando o treino e podem ser convertidos silenciosamente em carga zero. Os testes atuais não incluem esse caso nem verificam o comportamento real de foco e cliques.
