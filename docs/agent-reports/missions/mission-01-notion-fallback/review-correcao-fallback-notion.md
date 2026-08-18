# Revisão da correção do fallback do Notion

**Data:** 12 de agosto de 2026  
**Documento revisado:** `docs/agent-reports/missions/mission-01-notion-fallback/resultado-correcao-fallback-notion.md`  
**Plano de origem:** `docs/agent-reports/missions/mission-01-notion-fallback/plano-fallback-notion.md`  
**Tipo de revisão:** somente leitura da implementação; nenhuma correção aplicada  
**Parecer:** **requer ajustes antes de aprovação/publicação**

## Resumo executivo

O Builder respeitou o escopo de arquivos aprovado: as diferenças rastreadas em relação ao `HEAD` estão limitadas a `app/ShaftApp.tsx`, `app/globals.css` e `tests/rendered-html.test.mjs`. A criação do relatório de resultado também foi declarada. Não houve alteração de rota, autenticação, banco, integração ou estrutura do Notion nesta etapa. O pequeno agendamento do carregamento inicial por `setTimeout` continua relacionado ao estado do dashboard e não caracteriza ampliação material de escopo.

A remoção de `fallbackNotion` funciona para os valores antigos explicitamente identificados. No carregamento inicial e na falha simples de uma única requisição, `notion` fica nulo e saldo, XP, check-in e lista de exercícios deixam de usar o fallback.

Entretanto, foram encontrados cinco problemas: um **alto**, três **médios** e um **baixo**. Não foi encontrado problema crítico. O mais importante é que o bloqueio do treino considera qualquer array não vazio como uma lista válida. Uma linha malformada pode habilitar a confirmação e a rota existente pode concluir a sessão mesmo sem encontrar e salvar nenhum exercício correspondente.

## Classificação usada

- **Crítico:** risco imediato de perda grave, exposição ou indisponibilidade generalizada.
- **Alto:** pode produzir escrita incorreta ou violar diretamente um critério central da correção.
- **Médio:** falha funcional real, dependente de concorrência, dados específicos ou contexto de interface.
- **Baixo:** impacto limitado de interface ou acessibilidade, sem corrupção de dados.
- **Observação:** comportamento aceitável ou risco preexistente que merece registro, mas não bloqueia esta etapa por si só.

## Problemas encontrados

### 1. [ALTO] O bloqueio de treino não verifica se os exercícios são válidos

**Evidência:** `app/ShaftApp.tsx:152-160`, `app/ShaftApp.tsx:215-225` e `app/api/notion/training/route.ts:12-52`.

`hasExercises` é calculado somente com `exercises.length > 0`. Isso aceita, por exemplo:

- `[[]]`;
- `[["", "", ""]]`;
- linhas sem nome;
- linhas com formato diferente do tuple esperado;
- duplicatas ou valores não textuais recebidos em um JSON 200 malformado.

Nesses casos, a interface pode renderizar uma linha vazia, habilitar **Confirmar treino e cargas** e abrir `TrainingSheet`. O endpoint de treino rejeita apenas um array de tamanho zero. Para um item sem nome ou sem correspondência, nenhum registro de carga é encontrado, `saved` pode permanecer em zero e, ainda assim, a sessão planejada é atualizada para `Completo` ou `Mínimo`.

Portanto, o critério “impedir confirmação de treino sem uma lista válida de exercícios do Notion” não foi atendido integralmente. O teste adicionado comprova apenas a presença textual de `disabled={!hasExercises}` e não cobre a validade dos itens.

### 2. [MÉDIO] Conteúdo antigo e factual continua aparecendo quando o dashboard está indisponível

**Evidência:** `app/ShaftApp.tsx:125`, `app/ShaftApp.tsx:134` e `app/ShaftApp.tsx:156-158`.

Mesmo com `notion === null` e `syncStatus === "unavailable"`, a interface continua exibindo:

- `Quarta, 5 de agosto` e `Dia de trabalho`;
- `Treino de 04/08 aguarda confirmação`;
- o ciclo fixo de treino;
- `PRÓXIMO NO CICLO — Costas + Bíceps`;
- `SESSÃO PLANEJADA · NOTION — Peito + Tríceps` com o selo `Aguardando`.

O plano autorizava preservar conteúdo fixo fora da correção, então isso não é uma ampliação indevida de escopo pelo Builder. O problema é semântico: parte desse conteúdo não parece editorial ou genérico; ele afirma datas, tipo do dia e estado de uma sessão explicitamente rotulada como proveniente do Notion. Durante uma falha, o usuário não consegue distinguir esses valores fixos de dados atuais.

O fallback antigo de saldo, XP, check-in e cargas foi removido corretamente, mas a afirmação do relatório de que nenhum dado antigo permanece aparentando atualidade é ampla demais.

### 3. [MÉDIO] Requisições concorrentes de `refresh` podem deixar a resposta errada vencer

**Evidência:** `app/ShaftApp.tsx:34-51` e `app/ShaftApp.tsx:53-63`.

`refresh` não possui identificador de tentativa, trava de requisição, cancelamento ou regra de “apenas a tentativa mais recente pode atualizar o estado”. A função pode ser chamada pelo carregamento inicial, pelo botão de nova tentativa e depois de qualquer gravação feita por `save`.

Cenários possíveis:

1. uma consulta inicial lenta continua em voo;
2. um check-in ou lançamento financeiro é salvo e inicia uma segunda consulta;
3. a segunda consulta termina primeiro;
4. a consulta antiga termina depois e sobrescreve o estado mais novo, ou falha e apaga dados que a consulta mais recente já havia carregado.

O inverso também é possível: uma tentativa mais recente falha e coloca a tela em `unavailable`, mas uma resposta antiga chega depois, volta o estado para `available` e reapresenta o snapshot daquela requisição. Assim, embora a falha simples execute `setNotion(null)`, ainda existe um caminho concorrente para dados anteriores reaparecerem depois de uma falha observada.

O clique humano repetido no botão tende a ser contido porque o botão some quando React renderiza `loading`, mas isso não resolve concorrência com as outras origens de `refresh`. Além disso, não há timeout: se a requisição ficar pendente indefinidamente, o botão desaparece e a interface pode permanecer presa em `loading` sem nova ação de recuperação.

### 4. [MÉDIO] Os testes adicionados não exercitam a correção

**Evidência:** `tests/rendered-html.test.mjs:61-71`.

O novo teste lê `ShaftApp.tsx` como texto e procura expressões regulares. Ele passa mesmo se:

- `setNotion(null)` estiver em um ramo inalcançável;
- o botão `Tentar novamente` não chamar `refresh`;
- uma resposta antiga vencer uma resposta nova;
- `available`, `loading` ou `unavailable` renderizarem o conteúdo errado;
- a confirmação estiver habilitada para itens de exercício inválidos;
- check-in e finanças quebrarem quando `notion` for nulo;
- o retry ficar preso ou permitir efeitos concorrentes.

O teste SSR existente valida somente a primeira renderização em `loading`; ele não simula `fetch`, falha, sucesso, transição de estados nem interação. Os três testes foram executados diretamente com `node --test tests/rendered-html.test.mjs` nesta revisão e passaram, mas esse resultado não fornece a cobertura comportamental necessária para a correção.

Cobertura ausente mais relevante:

- carregamento inicial sem dados;
- sucesso e renderização do payload;
- falha após sucesso com remoção do snapshot;
- retry com sucesso e com nova falha;
- ordenação de respostas concorrentes;
- lista vazia e linhas malformadas de exercícios;
- check-in e finanças com dashboard indisponível;
- foco e anúncios acessíveis durante o retry.

### 5. [BAIXO] O retry perde o foco do teclado ao entrar em carregamento

**Evidência:** `app/ShaftApp.tsx:109-112`.

Ao acionar **Tentar novamente**, o estado muda para `loading` e o botão é removido do DOM. O indicador com `role="status"` anuncia a mudança, mas não há destino de foco nem restauração do foco caso a tentativa falhe e o botão reapareça. Para navegação por teclado, o foco pode voltar ao documento e obrigar o usuário a reencontrar a ação.

Não foi encontrada regressão visual grave: os estilos mantêm a linguagem existente, o botão desabilitado possui estado visual e o status usa texto além da cor. A perda de foco é a regressão de acessibilidade concreta identificada.

## Verificação por item solicitado

### Escopo aprovado

**Atendido.** Após normalizar finais de linha CRLF/LF, somente os três arquivos rastreados previstos diferem do `HEAD`. As demais diferenças aparentes sem normalização eram apenas finais de linha. As rotas foram consultadas apenas para avaliar segurança e não foram alteradas.

### Estados `loading`, `available` e `unavailable`

**Parcialmente correto.** O fluxo simples está coerente:

- inicia com `notion = null` e `loading`;
- um JSON 200 define dados e `available`;
- uma falha limpa os dados e define `unavailable`;
- a nova tentativa volta para `loading`.

Os problemas são a falta de coordenação entre tentativas concorrentes e a ausência de validação mínima do JSON recebido. Qualquer JSON em uma resposta HTTP 200 é aceito como `DashboardData`; payload incompleto pode causar erro de renderização em `notion.checkin.date` ou `exercises.map`.

### Dados antigos após falha

**Parcialmente atendido.** O objeto de fallback e os valores pessoais enumerados foram removidos, e uma falha isolada limpa o snapshot carregado. Ainda assim:

- conteúdo factual fixo de agosto continua visível;
- uma resposta antiga concorrente pode reaparecer depois de uma falha mais recente.

### Botão `Tentar novamente`

**Funciona no caminho simples, com casos de borda.** Ele reutiliza `refresh`, some durante o carregamento e volta após nova falha. Os comportamentos inesperados possíveis são perda de foco, espera infinita sem timeout e disputa com outra chamada de `refresh`.

O critério do plano dizia que o botão deveria comunicar o carregamento. Na implementação, quem comunica é o indicador global; o botão é removido. Isso é compreensível visualmente, mas não atende literalmente à formulação e contribui para o problema de foco.

### Bloqueio de treino sem exercícios válidos

**Não atendido integralmente.** Lista ausente ou vazia é bloqueada; lista não vazia, porém inválida, não é bloqueada. Este é o problema de severidade alta.

### Check-in e finanças com dashboard indisponível

**Seguros para o objetivo desta etapa.** Os formulários não leem `notion`, as rotas POST fazem validação própria e uma falha na recarga posterior não transforma um POST bem-sucedido em erro. Se o POST falhar, o formulário permanece aberto, exibe a mensagem e libera o botão para nova tentativa.

Existe uma condição preexistente fora do diff: o botão de fechar continua ativo durante o salvamento, e a conclusão tardia de uma gravação pode fechar outro sheet aberto posteriormente. Ela não foi causada pela correção do fallback e não altera o parecer desta etapa.

### Acessibilidade e interface

**Sem regressão visual grave; uma regressão baixa de foco.** Pontos positivos:

- status não depende apenas de cor;
- `role="status"` e `aria-live="polite"` anunciam mudanças;
- o ponto decorativo foi ocultado da árvore acessível;
- o botão de treino usa `disabled` nativo;
- o botão de retry possui `type="button"`.

Ponto negativo: remoção do elemento focado no retry sem gerenciamento de foco.

### Suficiência dos testes

**Insuficiente.** O teste novo é uma proteção estática contra reintrodução dos literais antigos, mas não valida o comportamento que a etapa pretende estabilizar.

## Casos de borda não considerados

- duas ou mais chamadas de `refresh` terminando fora de ordem;
- requisição de dashboard que nunca termina;
- HTTP 200 com JSON incompleto ou com tipos inesperados;
- `exercises` não vazio com linhas vazias, incompletas ou duplicadas;
- resposta antiga chegando depois de uma falha mais recente;
- usuário de teclado acionando retry e perdendo o foco;
- conteúdo fixo rotulado como Notion permanecendo visível durante indisponibilidade.

## Conclusão

O Builder foi disciplinado quanto ao escopo e resolveu o defeito original no caminho linear mais comum: não há mais `fallbackNotion`, o primeiro HTML não contém os valores antigos e a falha simples limpa o dashboard. Check-in e finanças permanecem utilizáveis com segurança proporcional quando a leitura agregada está indisponível.

A implementação, porém, não deve ser considerada plenamente aprovada enquanto o bloqueio de exercícios inválidos e a ordenação de recargas não forem tratados. O conteúdo factual fixo também precisa de uma decisão explícita de produto: ou é assumidamente demonstrativo, ou deve obedecer ao mesmo estado de indisponibilidade dos demais dados do Notion. Por fim, os testes precisam migrar de inspeção textual para exercícios reais das transições e interações centrais.
