# Plano de correção do fallback do Notion

**Data:** 12 de agosto de 2026  
**Etapa:** primeira etapa do plano de estabilização  
**Status:** inspeção concluída; implementação ainda não iniciada e aguardando aprovação  
**Escopo:** comportamento da interface quando o dashboard do Notion está carregando, disponível ou indisponível

## Contexto

A primeira etapa de estabilização do Shaft busca impedir que dados antigos ou de exemplo sejam apresentados como informações atuais quando a sincronização com o Notion falha.

Os objetivos definidos para esta etapa são:

- não apresentar dados antigos ou de exemplo como dados atuais;
- deixar claro que o Notion está indisponível;
- apresentar estados vazios ou indisponíveis adequados nas informações dependentes do Notion;
- oferecer uma forma clara de tentar carregar novamente, sem mudar a arquitetura atual;
- preservar integralmente o comportamento atual quando o Notion funciona;
- evitar grandes refatorações;
- não alterar autenticação, banco de dados, estrutura do Notion ou áreas não relacionadas.

## Implementação atual inspecionada

O fluxo atual está concentrado em `app/ShaftApp.tsx`.

### Dados do dashboard

O tipo `DashboardData` representa:

- data de sincronização;
- nível;
- XP atual;
- XP do próximo nível;
- saldo financeiro formatado;
- semana ativa;
- último check-in;
- exercícios.

### Fallback atual

O objeto `fallbackNotion` contém dados antigos e específicos:

- sincronização de `05/08/2026`;
- nível 1 e XP 0;
- saldo de `R$ 415,27`;
- semana de 3 a 9 de agosto;
- check-in de 4 de agosto com humor, energia e relato pessoal;
- seis exercícios com cargas e grupos musculares.

Esse objeto é usado como valor inicial do estado:

```ts
const [notion, setNotion] = useState<DashboardData>(fallbackNotion);
```

Portanto, antes mesmo de a chamada ao Notion terminar, a interface já apresenta esses dados como conteúdo normal.

### Carregamento atual

A função `refresh` chama `/api/notion/dashboard` sem cache.

Quando a resposta funciona:

1. o JSON recebido substitui o fallback;
2. `live` é marcado como `true`.

Quando a resposta falha:

1. apenas `live` é marcado como `false`;
2. o estado `notion` continua contendo o fallback ou os últimos dados carregados;
3. nenhuma informação é apagada ou marcada individualmente como indisponível.

### Indicador de sincronização atual

O indicador sempre mostra o texto `Notion conectado`. Quando `live` é falso, o complemento muda para `Leitura de [data do fallback]`.

Isso cria dois problemas:

- afirma que o Notion está conectado mesmo após uma falha;
- usa a data do fallback como se fosse uma sincronização real.

### Componentes afetados

As quatro abas recebem o mesmo objeto `notion` e assumem que os dados existem:

- **Hoje:** exibe nível, XP e semana;
- **Diário:** exibe último check-in e métricas de XP;
- **Treinos:** monta a lista de exercícios e envia essa lista ao formulário de confirmação;
- **Finanças:** exibe o saldo.

O formulário de treino também recebe diretamente `notion.exercises`, portanto precisa de proteção caso o dashboard não tenha sido carregado.

### Nova tentativa

A função `refresh` já pode ser reutilizada para uma nova tentativa. Não é necessário criar rota, serviço ou arquitetura nova. Falta apenas expor essa ação de maneira clara na interface e representar o estado de carregamento durante a tentativa.

### Backend

`app/api/notion/dashboard/route.ts` já devolve os dados esperados quando as consultas funcionam e converte falhas em respostas HTTP de erro. Não foi encontrado motivo para alterar essa rota nesta etapa.

### Testes atuais

`tests/rendered-html.test.mjs` verifica:

- renderização server-side;
- identidade Shaft;
- título e ícones;
- alinhamento básico entre código, pacote, manifesto e service worker.

Não há teste que impeça a reintrodução de dados pessoais de fallback ou que verifique a existência de estados de carregamento e indisponibilidade.

## Problema central

O problema não é apenas visual. O modelo de estado atual considera que sempre existe um `DashboardData` válido, mesmo antes da primeira resposta da API ou depois de uma falha.

Consequentemente, a interface não consegue distinguir corretamente:

1. dados ainda sendo carregados;
2. dados atuais recebidos do Notion;
3. Notion indisponível e ausência de dados confiáveis.

## Riscos do comportamento atual

### Dados incorretos apresentados como atuais

Saldo, XP, check-in, semana e cargas podem ser interpretados como dados reais mesmo sem sincronização.

### Indicador de conexão enganoso

O texto afirma que o Notion está conectado durante uma falha.

### Ação de treino baseada em dados antigos

O formulário de confirmação pode ser aberto usando exercícios e cargas do fallback.

### Falta de recuperação visível

O usuário não possui um botão claro para repetir a consulta depois de uma falha temporária.

### Regressão silenciosa

Os testes existentes não impedem que valores de exemplo voltem a ser usados no futuro.

## Plano curto de implementação

### 1. Alterar `app/ShaftApp.tsx`

Mudanças planejadas:

- remover o objeto `fallbackNotion` com dados antigos e pessoais;
- representar o dashboard como `DashboardData | null`;
- introduzir um estado de sincronização explícito, capaz de distinguir pelo menos `loading`, `available` e `unavailable`;
- durante o primeiro carregamento, mostrar que a consulta está em andamento sem apresentar números fictícios;
- quando a chamada funcionar, manter o fluxo e os dados atuais intactos;
- quando a chamada falhar, garantir que nenhum dado antigo ou de exemplo seja apresentado como atual;
- mostrar um indicador claro de `Notion indisponível`;
- incluir um botão `Tentar novamente` que reutilize `refresh`;
- indicar carregamento enquanto a nova tentativa estiver em andamento;
- apresentar estados vazios apropriados para XP, semana, check-in, exercícios e saldo;
- impedir confirmação de treino sem uma lista válida de exercícios do Notion;
- manter disponíveis, quando seguro, ações que não dependem da leitura prévia do dashboard, sem alterar suas rotas de escrita;
- preservar o conteúdo fixo que não faz parte desta correção.

### 2. Alterar `app/globals.css`

Mudanças planejadas:

- adicionar estilos pequenos para o estado de indisponibilidade;
- diferenciar visualmente sucesso, carregamento e erro de sincronização;
- estilizar o botão de nova tentativa;
- estilizar estados vazios sem introduzir uma nova linguagem visual;
- preservar a paleta escura e vermelho-lagasta atual.

### 3. Alterar `tests/rendered-html.test.mjs`

Mudanças planejadas:

- verificar que os dados pessoais e valores antigos do `fallbackNotion` não permanecem no código ativo;
- verificar a presença de estados explícitos de carregamento e indisponibilidade;
- verificar a existência da ação de nova tentativa;
- manter todos os testes atuais de identidade e renderização.

## Arquivos que não devem ser alterados nesta etapa

- `app/api/notion/dashboard/route.ts`;
- demais rotas em `app/api/notion`;
- `app/lib/notion.ts`;
- `app/chatgpt-auth.ts`;
- arquivos de banco e Drizzle;
- `.openai/hosting.json`;
- estrutura das bases do Notion;
- configurações de autenticação e publicação;
- componentes e scripts não relacionados ao estado do dashboard.

## Critérios de aceitação propostos

### Quando o Notion funciona

- o dashboard exibe os mesmos dados retornados atualmente;
- abas e formulários continuam funcionando como antes;
- o indicador informa que leitura e escrita estão ativas;
- não há mudança nas rotas ou no formato da resposta.

### Durante o carregamento inicial

- nenhum saldo, XP, check-in, semana ou carga de exemplo é exibido;
- a interface comunica que está consultando o Notion;
- não há mensagem prematura de erro.

### Quando o Notion falha

- o texto não afirma que o Notion está conectado;
- nenhum dado antigo ou de exemplo é apresentado como atual;
- XP, saldo, semana, check-in e exercícios exibem estado vazio ou indisponível;
- confirmação de treino não pode usar exercícios inexistentes ou antigos;
- existe um botão claro para tentar novamente.

### Ao tentar novamente

- a mesma função de carregamento é reutilizada;
- o botão comunica o estado de carregamento e evita cliques repetidos durante a tentativa;
- em caso de sucesso, os dados reais aparecem e o estado volta a conectado;
- em nova falha, a interface continua no estado indisponível sem restaurar exemplos.

## Validação planejada após aprovação

Após a implementação, a validação deverá incluir:

1. inspeção do diff para garantir que apenas os três arquivos previstos foram alterados;
2. lint do projeto;
3. build completo;
4. testes automatizados;
5. inspeção do HTML renderizado;
6. teste controlado no navegador dos estados de carregamento, sucesso, falha e nova tentativa, se o ambiente local permitir simular a indisponibilidade sem alterar integrações reais.

## Observação final

Esta correção pode ser feita sem mudar a arquitetura. O ajuste principal é substituir o pressuposto “sempre há dados” por um estado explícito de disponibilidade. A rota atual e o formato do dashboard podem permanecer intactos.

Nenhuma implementação descrita neste documento foi realizada. O próximo passo depende de aprovação explícita do plano.
