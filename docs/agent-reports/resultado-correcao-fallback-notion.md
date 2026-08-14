# Resultado da correção do fallback do Notion

**Data:** 12 de agosto de 2026  
**Plano de origem:** `docs/agent-reports/plano-fallback-notion.md`  
**Status:** implementação concluída e validada localmente  
**Publicação:** não realizada  
**Escopo:** somente o estado do dashboard quando o Notion está carregando, disponível ou indisponível

## 1. Objetivo

Corrigir o comportamento em que dados antigos e pessoais do objeto `fallbackNotion` eram apresentados como informações atuais antes da primeira sincronização ou depois de uma falha do Notion.

A implementação deveria:

- remover dados antigos e de exemplo do fallback;
- comunicar claramente indisponibilidade;
- mostrar estados vazios nas áreas dependentes do Notion;
- oferecer nova tentativa usando o fluxo existente;
- preservar o comportamento quando a integração funciona;
- evitar mudanças em arquitetura, autenticação, banco, rotas e estrutura do Notion.

## 2. Arquivos de código alterados

### `app/ShaftApp.tsx`

Alterações realizadas:

- remoção completa de `fallbackNotion` e de seus dados antigos;
- alteração do estado do dashboard para `DashboardData | null`;
- criação do tipo de estado `SyncStatus`, com:
  - `loading`;
  - `available`;
  - `unavailable`;
- início da aplicação sem dados presumidos;
- limpeza do dashboard com `setNotion(null)` quando a leitura falha;
- manutenção dos dados retornados normalmente quando a leitura funciona;
- criação do indicador `SyncNote` com mensagens específicas para cada estado;
- inclusão do botão `Tentar novamente`, reutilizando a função `refresh`;
- uso de `aria-live="polite"` no indicador de sincronização;
- estado vazio ou indisponível para:
  - XP e nível;
  - semana ativa;
  - último check-in;
  - exercícios e cargas;
  - saldo financeiro;
- bloqueio da confirmação de treino quando não há exercícios válidos;
- proteção adicional para que o formulário de treino só seja renderizado quando existe dashboard carregado;
- preservação dos formulários de check-in e finanças, que não dependem de uma leitura prévia do dashboard;
- preservação dos dados e conteúdos fixos que estavam fora do escopo desta etapa;
- agendamento do carregamento inicial para evitar a regra React contra atualização síncrona de estado dentro de um efeito.

### `app/globals.css`

Alterações realizadas:

- estilos para os estados de sincronização conectado, carregando e indisponível;
- cor diferenciada do ponto de status;
- estilo do botão `Tentar novamente`;
- estilo de cartões vazios;
- estilo do progresso indisponível;
- estado visual desabilitado do botão de confirmação de treino;
- preservação da paleta, tipografia e linguagem visual existentes.

### `tests/rendered-html.test.mjs`

Foi incluído o teste `keeps unavailable Notion data honest and retryable`, que verifica:

- ausência de `fallbackNotion`;
- ausência do saldo antigo `R$ 415,27`;
- ausência da data antiga `05/08/2026`;
- ausência do relato pessoal antigo do fallback;
- presença dos três estados de sincronização;
- presença da mensagem `Notion indisponível`;
- presença da ação `Tentar novamente`;
- limpeza dos dados após falha;
- bloqueio da confirmação de treino sem exercícios.

## 3. Arquivo de documentação criado

Este relatório foi criado em:

- `docs/agent-reports/resultado-correcao-fallback-notion.md`.

Os relatórios anteriores em `docs/agent-reports/` e o `AGENTS.md` não foram modificados nesta etapa.

## 4. Comportamento resultante

### Durante o carregamento inicial

- o dashboard começa sem saldo, XP, check-in, semana ou exercícios presumidos;
- o indicador mostra `Consultando o Notion`;
- os campos dependentes mostram `Carregando…`, traço ou explicação equivalente;
- nenhum dado do fallback antigo aparece.

### Quando o Notion funciona

- a mesma rota `/api/notion/dashboard` continua sendo usada;
- o mesmo formato `DashboardData` continua sendo consumido;
- os dados retornados preenchem as quatro abas;
- o indicador mostra `Notion conectado` e `Leitura e escrita ativas`;
- ações e formulários existentes continuam disponíveis;
- nenhuma rota, integração ou estrutura do Notion foi alterada.

### Quando o Notion falha

- dados anteriormente carregados são removidos para não permanecerem aparentando atualidade;
- o indicador mostra `Notion indisponível`;
- a explicação informa que não foi possível carregar os dados;
- XP, semana, check-in, exercícios e saldo mostram estados vazios ou indisponíveis;
- o treino não pode ser confirmado sem exercícios válidos;
- o botão `Tentar novamente` fica disponível.

### Ao tentar novamente

- a função `refresh` existente é reutilizada;
- o estado muda para carregamento;
- cliques repetidos no botão deixam de ser possíveis porque o botão só existe no estado indisponível;
- sucesso restaura os dados reais e o estado conectado;
- nova falha mantém o dashboard vazio e retorna ao estado indisponível.

## 5. Validações executadas

### 5.1 Inspeção do diff

Resultado: **aprovado**.

O Git mostrou somente estes três arquivos rastreados alterados:

- `app/ShaftApp.tsx`;
- `app/globals.css`;
- `tests/rendered-html.test.mjs`.

`git diff --check` não encontrou espaços inválidos ou erros de patch.

### 5.2 Verificação de dados proibidos

Resultado: **aprovado**.

Não foram encontrados em `app/ShaftApp.tsx`:

- `fallbackNotion`;
- `R$ 415,27`;
- `05/08/2026`;
- o relato pessoal antigo usado no fallback.

### 5.3 Lint direcionado

Comando lógico executado: ESLint sobre `app/ShaftApp.tsx` e `tests/rendered-html.test.mjs`.

Resultado: **aprovado**, sem erros ou avisos.

### 5.4 Lint do projeto com artefatos excluídos

Comando lógico executado: ESLint sobre o projeto, ignorando `dist`, `.next` e `work`.

Resultado: **aprovado**, sem erros ou avisos.

### 5.5 Build

Comando executado: build vinext pelo pnpm já usado pelo projeto.

Resultado: **aprovado**.

O build concluiu as cinco etapas:

1. análise de referências do cliente;
2. análise de referências do servidor;
3. ambiente RSC;
4. ambiente cliente;
5. ambiente SSR.

As rotas reconhecidas permaneceram:

- `/`;
- `/api/notion/checkins`;
- `/api/notion/dashboard`;
- `/api/notion/finance`;
- `/api/notion/training`.

O vinext exibiu apenas seu aviso informativo já esperado de que algumas rotas não puderam ser classificadas por análise estática.

### 5.6 Testes automatizados

Resultado: **aprovado**.

Total:

- 3 testes executados;
- 3 testes aprovados;
- 0 falhas;
- 0 cancelados;
- 0 ignorados.

Testes aprovados:

1. `server-renders the Shaft application identity`;
2. `keeps the Shaft source and install metadata aligned`;
3. `keeps unavailable Notion data honest and retryable`.

O comando de testes também executou e aprovou um novo build antes do test runner.

### 5.7 Inspeção do HTML renderizado

Resultado: **aprovado**.

O servidor local respondeu `/` com HTTP 200. No HTML server-side:

- `Consultando o Notion` estava presente;
- `fallbackNotion` não estava presente;
- `R$ 415,27` não estava presente.

Isso confirma que a primeira renderização não envia dados antigos ao navegador.

### 5.8 Verificação do caminho de sucesso do dashboard

Resultado: **aprovado**.

Foi feita somente uma leitura do endpoint local `/api/notion/dashboard`. Nenhum conteúdo pessoal foi registrado neste relatório.

O endpoint respondeu HTTP 200 e preservou o formato esperado, com as chaves:

- `balance`;
- `checkin`;
- `exercises`;
- `level`;
- `nextLevel`;
- `syncedAt`;
- `week`;
- `xp`.

Isso confirma que o caminho atual de sucesso continuou funcional e que não houve mudança no backend.

### 5.9 Inspeção interativa no navegador

Resultado: **não executada por indisponibilidade do ambiente**.

O navegador integrado não estava disponível na sessão. A verificação não foi substituída por automação não prevista. Foram usados, como cobertura proporcional:

- teste automatizado;
- inspeção do HTML server-side;
- servidor local;
- leitura do endpoint real;
- inspeção do fluxo de estado no código.

O servidor local usado para validação foi encerrado ao final.

## 6. Problemas encontrados durante a validação

### 6.1 Lint completo incluía pacotes antigos em `work/`

O script `pnpm run lint` verifica `eslint .` e ignora `dist` e `.next`, mas não ignora `work`.

Como `work/` contém pacotes antigos de publicação com JavaScript compilado, o lint inicial retornou milhares de erros nesses artefatos. Esse problema já existia na configuração do projeto e não foi causado pela correção do fallback.

Nenhuma mudança foi feita em `eslint.config.mjs`, porque isso estaria fora dos três arquivos autorizados.

Para validar corretamente esta etapa, foram executados:

- lint direcionado aos arquivos alterados;
- lint do projeto com `work` explicitamente ignorado.

Ambos passaram.

### 6.2 Regra React no carregamento inicial

A primeira versão chamava uma função que atualizava imediatamente o estado dentro de `useEffect`. O ESLint apontou `react-hooks/set-state-in-effect`.

A implementação foi ajustada dentro de `app/ShaftApp.tsx` para agendar o carregamento inicial e manter a função `refresh` reutilizável. O lint direcionado passou depois da correção.

### 6.3 Navegador integrado indisponível

Não havia navegador conectado para inspeção interativa. Isso impediu cliques reais no botão `Tentar novamente` durante a sessão de validação.

O comportamento foi coberto por teste estático, inspeção do fluxo, HTML renderizado e verificação do endpoint. Não foi encontrada falha funcional nessas validações.

## 7. Itens deliberadamente não alterados

- autenticação;
- banco de dados;
- Drizzle e D1;
- `.openai/hosting.json`;
- rotas do backend;
- `app/lib/notion.ts`;
- estrutura ou propriedades das bases do Notion;
- publicação do Sites;
- conteúdo fixo fora do fallback;
- configuração global do ESLint;
- outros componentes, scripts ou documentos.

## 8. Conclusão

A primeira etapa de estabilização foi concluída dentro do escopo aprovado.

O Shaft não usa mais dados pessoais ou antigos como fallback do dashboard. A aplicação agora distingue carregamento, sucesso e indisponibilidade, comunica falhas claramente, oferece nova tentativa e impede confirmação de treino sem dados válidos.

Build, testes, lint aplicável, HTML inicial e caminho de sucesso do endpoint foram aprovados. A única validação não realizada foi a interação por navegador, porque não havia navegador disponível na sessão.
