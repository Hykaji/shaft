# Resultado dos ajustes da revisão do fallback do Notion

**Data:** 12 de agosto de 2026  
**Revisão de origem:** `docs/agent-reports/missions/mission-01-notion-fallback/review-correcao-fallback-notion.md`  
**Status:** ajustes concluídos e validados localmente  
**Publicação:** não realizada

## Escopo executado

Foram corrigidos somente os quatro pontos diretamente pertencentes à etapa do fallback:

1. validação da lista de exercícios antes de liberar confirmação;
2. proteção contra respostas concorrentes fora de ordem;
3. testes comportamentais das transições e casos de borda;
4. preservação do foco do botão de nova tentativa.

Autenticação, backend do Notion, banco, estrutura do Notion, publicação e demais áreas não foram alterados.

## Arquivos alterados

### `app/ShaftApp.tsx`

- passou a usar um reducer compartilhado para o estado do dashboard;
- cada chamada de `refresh` recebe um identificador crescente;
- sucesso e falha carregam o identificador da tentativa correspondente;
- exercícios usados na tela e no formulário passam pelo mesmo validador;
- o formulário de treino só é montado quando existe pelo menos um exercício validado;
- o botão `Tentar novamente` permanece no DOM durante o retry;
- durante a tentativa, o texto muda para `Tentando novamente…` e a ação recebe `aria-disabled="true"`;
- cliques adicionais durante o retry são ignorados, sem remover o elemento focado.

### `app/lib/dashboard-state.ts`

Novo módulo pequeno e independente contendo:

- tipos do dashboard e de sincronização;
- estado inicial;
- reducer das transições;
- regra de aceitação exclusiva da tentativa mais recente;
- validador de exercícios;
- regra de visibilidade persistente da ação de retry.

O módulo não cria uma nova camada de backend nem altera a arquitetura de dados. Ele apenas extrai lógica de estado que já pertencia ao componente para permitir uso idêntico na interface e nos testes.

### `app/globals.css`

- acrescentado estado visual de espera para o botão mantido em foco durante o retry.

### `tests/rendered-html.test.mjs`

- removido o teste principal baseado apenas em busca textual;
- mantidos os testes existentes de identidade e renderização;
- adicionados testes comportamentais do reducer e do validador usados pela aplicação.

## Validação de exercícios

A confirmação só é liberada quando toda a lista é utilizável.

Uma lista válida deve:

- ser um array não vazio;
- conter somente linhas que também sejam arrays;
- conter exatamente três campos em cada linha;
- usar somente strings nos três campos;
- possuir nome não vazio depois de remover espaços externos;
- não repetir nomes, ignorando capitalização e espaços externos.

Nome, carga e grupo têm espaços externos removidos antes do uso.

Se qualquer linha for malformada, a lista inteira é rejeitada. Isso evita confirmar uma sessão a partir de uma lista parcialmente confiável.

Casos rejeitados pelos testes:

- `null`;
- texto ou objeto no lugar de array;
- lista vazia;
- item nulo;
- `[[]]`;
- nome vazio;
- quantidade incorreta de campos;
- campo não textual;
- campo extra;
- nomes duplicados com diferenças apenas de capitalização ou espaços.

## Concorrência de refresh

Cada tentativa recebe um `requestId` crescente. O reducer registra o maior identificador iniciado.

Uma resposta só pode atualizar o dashboard quando seu identificador for exatamente o da tentativa mais recente. Assim:

- falha antiga não apaga um sucesso recente;
- sucesso antigo não substitui dados recentes;
- sucesso antigo não reabre o dashboard depois de uma falha mais recente;
- carregamento inicial, atualização após escrita e retry seguem a mesma regra.

As requisições antigas não precisam ser canceladas para serem inofensivas: suas respostas são simplesmente ignoradas.

## Retry e foco

Antes, o botão era removido ao entrar em `loading`, causando perda de foco do teclado.

Agora o estado distingue retry de outros carregamentos. Quando a tentativa veio do botão:

- o mesmo botão permanece renderizado;
- o texto muda para `Tentando novamente…`;
- `aria-disabled="true"` comunica indisponibilidade temporária;
- o handler ignora cliques adicionais;
- em nova falha, o mesmo elemento retorna ao texto `Tentar novamente`;
- em sucesso, o botão é removido porque não há mais ação necessária.

Essa solução evita gerência manual de foco e não amplia a arquitetura.

## Testes executados

### ESLint dos arquivos envolvidos

Resultado: **aprovado**, sem erros ou avisos.

Arquivos verificados:

- `app/ShaftApp.tsx`;
- `app/lib/dashboard-state.ts`;
- `tests/rendered-html.test.mjs`.

### ESLint do projeto com artefatos excluídos

Resultado: **aprovado**, sem erros ou avisos.

Como já registrado anteriormente, `work/` contém pacotes compilados antigos e precisa ser ignorado na execução de lint para que artefatos não sejam avaliados como código-fonte.

### Testes automatizados

Resultado: **5 testes aprovados de 5**, sem falhas.

Casos executados:

1. renderização e identidade do Shaft;
2. alinhamento de fonte e metadados;
3. transições `loading`, `available`, `unavailable`, retry com sucesso e retry com falha;
4. respostas concorrentes fora de ordem;
5. listas válidas e inválidas de exercícios.

### Build vinext

Resultado: **aprovado**.

As cinco etapas de build concluíram e as rotas existentes permaneceram as mesmas. O aviso informativo do vinext sobre classificação estática de rotas continuou aparecendo, sem representar falha.

### Comando completo de testes do projeto

Resultado: **aprovado**.

O comando executou novo build e os mesmos cinco testes, todos aprovados.

### Integridade do diff

Resultado: **aprovado**.

`git diff --check` não encontrou erros.

## Decisão de produto pendente: conteúdo fixo de agosto

Por orientação explícita, o conteúdo fixo não foi alterado nesta etapa.

Continuam presentes, entre outros:

- `Quarta, 5 de agosto`;
- `Dia de trabalho`;
- `Treino de 04/08 aguarda confirmação`;
- ciclo fixo de treino;
- `Costas + Bíceps` como próximo treino;
- `Peito + Tríceps` como sessão planejada com selo `Aguardando`.

Permanece pendente uma decisão de produto sobre a natureza desse conteúdo:

1. assumir e identificar explicitamente que é conteúdo demonstrativo/editorial; ou
2. conectá-lo a dados atuais e fazê-lo obedecer ao estado de disponibilidade do Notion.

Essa decisão não bloqueou os ajustes técnicos solicitados nesta rodada, mas deve ser resolvida antes de afirmar que todo conteúdo factual da interface é atual.

## Resultado final

Os pontos bloqueadores da revisão pertencentes a esta etapa foram tratados:

- lista de exercícios inválida não habilita confirmação;
- somente a tentativa mais recente pode mudar o dashboard;
- testes exercitam a lógica real usada pela aplicação;
- retry preserva o elemento focado durante a tentativa.

Nenhuma publicação foi realizada.
