# Revisão do Reviewer: proteção server-side das rotas do Notion

**Data:** 14 de agosto de 2026  
**Missão:** `mission-03-notion-route-protection`  
**Papel:** Reviewer  
**Resultado do Builder revisado:** `docs/agent-reports/missions/mission-03-notion-route-protection/02-builder-result-notion-route-protection.md`  
**Tipo de revisão:** Inicialmente somente de leitura; nenhuma correção implementada

## Parecer

**Aprovado com observações não bloqueadoras**

## Escopo e evidências revisados

- leitura integral de `AGENTS.md`, `docs/agent-workflow.md`, do índice da Missão 3, do plano aprovado e do resultado do Builder;
- comparação de todas as mudanças locais rastreadas e não rastreadas contra o HEAD `fb41a501e916d99838575062a83247a97d87eb87`;
- inspeção das quatro rotas sob `app/api/notion/`, do guard em `app/chatgpt-auth.ts`, da política em `app/lib/shaft-access-policy.ts`, do cliente Notion, da configuração do Sites, da documentação e dos testes;
- inspeção do contrato de identidade já documentado no starter do projeto em `README.md:30-84`, segundo o qual o Dispatch do OpenAI Sites injeta os cabeçalhos de identidade e administra as rotas e cookies de autenticação;
- lint direcionado, lint amplo com exclusão explícita de artefatos, build, suíte completa, `git diff --check` e uma matriz adicional de negação nas rotas compiladas.

O diff anterior a este relatório continha nove arquivos rastreados modificados e cinco arquivos não rastreados. Não foram encontrados outros arquivos de implementação ou configuração alterados fora dessa relação.

## Avaliação executiva

O objetivo de proteger server-side as quatro rotas ativas do Notion foi atingido. Em todas elas, o guard é aguardado e sua resposta é devolvida antes de `request.json()` e antes de qualquer `query`, `createPage` ou `updatePage`:

- dashboard: `app/api/notion/dashboard/route.ts:10-18`;
- check-ins: `app/api/notion/checkins/route.ts:21-37`;
- finanças: `app/api/notion/finance/route.ts:14-32`;
- treino: `app/api/notion/training/route.ts:9-22`.

A precedência da decisão é segura: sem identidade, retorna `401`; com identidade e sem lista efetiva, retorna `503`; com lista configurada e sem correspondência, retorna `403`. As respostas de negação contêm apenas uma mensagem genérica e `Cache-Control: private, no-store`, sem IDs de usuário, e-mails, conteúdo das listas ou segredos (`app/chatgpt-auth.ts:46-68` e `app/chatgpt-auth.ts:121-128`).

O parsing das listas remove espaços nas bordas, descarta entradas vazias e elimina duplicatas. IDs permanecem literais e sensíveis a maiúsculas/minúsculas; e-mails são normalizados nas duas pontas com `trim()` e `toLowerCase()` (`app/lib/shaft-access-policy.ts:19-47`). Listas ausentes, vazias ou compostas apenas por espaços falham fechado.

A exceção local exige simultaneamente ambiente não produtivo e hostname de loopback (`app/lib/shaft-access-policy.ts:51-68`). O build de produção substituiu `process.env.NODE_ENV` por `"production"` no worker compilado; uma requisição compilada para `http://localhost:3000` sem identidade continuou retornando `401`. Host remoto em desenvolvimento também é negado pela função pura.

A confiança nos cabeçalhos `oai-authenticated-user-id` e `oai-authenticated-user-email` está de acordo com o contrato do starter do OpenAI Sites presente no repositório: o Dispatch é responsável pela injeção de identidade, e SIWC fornece identidade, não autorização. A allowlist server-side implementa corretamente essa segunda camada. Essa conclusão pressupõe que a aplicação hospedada continue acessível apenas por esse Dispatch, que deve remover ou substituir cabeçalhos homônimos enviados pelo cliente.

Valores hospedados não foram modificados nem puderam ser inspecionados nesta revisão, conforme o escopo. A ausência deles foi reproduzida no worker compilado e resulta em `503` antes de qualquer acesso ao Notion, portanto o sistema falha fechado até que ao menos uma allowlist seja configurada.

## Achados

### [Baixo] Cobertura integrada de `503` e `403` está concentrada na rota de dashboard

- **Bloqueia a missão:** Não.
- **Evidência:** o teste integrado percorre as quatro rotas apenas para o caso anônimo (`tests/shaft-access-policy.test.mjs:98-127`). Configuração ausente e usuário não permitido são exercitados no worker compilado somente por `/api/notion/dashboard` (`tests/shaft-access-policy.test.mjs:129-181`). O teste de produção versus loopback é unitário, não integrado.
- **Impacto:** uma regressão futura que removesse ou reposicionasse o guard apenas em uma das três rotas POST poderia não ser detectada pelos casos integrados `503`/`403`, embora o caso `401` e a inspeção atual detectem a ordem correta.
- **Ação recomendada:** em trabalho futuro, parametrizar também `503` e `403` sobre as quatro rotas e adicionar um espião explícito para `fetch`, além de um caso compilado de loopback em produção. Não bloqueia porque o guard é compartilhado, todas as quatro rotas foram inspecionadas e a matriz independente do Reviewer cobriu esses casos sem acesso de rede.

### [Baixo] Um arquivo documental foi alterado fora da lista de arquivos aprovada

- **Bloqueia a missão:** Não.
- **Evidência:** `docs/agent-reports/README.md:21-22` adiciona a Missão 3 ao índice global, mas esse arquivo não aparece nas listas "Criar" ou "Modificar" do plano aprovado (`01-builder-plan-notion-route-protection.md:58-91`). O resultado do Builder o inclui genericamente como "documentação da Missão 3".
- **Impacto:** a alteração é benigna e coerente com a organização dos relatórios, mas reduz a precisão da afirmação de que não houve arquivo inesperado.
- **Ação recomendada:** registrar explicitamente desvios documentais semelhantes no handoff ou incluí-los no plano. Não há efeito em runtime e nenhuma exclusão material foi violada.

### [Observação] O comando oficial de lint depende de excluir um artefato pré-existente sob `work/`

- **Bloqueia a missão:** Não.
- **Evidência:** `npm run lint` falhou ao analisar JavaScript minificado sob `work/shaft-package-.../dist/`. O mesmo lint amplo passou com `--ignore-pattern work`, e o lint direcionado de todos os arquivos de implementação e teste da missão passou sem avisos.
- **Impacto:** não é regressão desta missão; `work/` já é ignorado pelo Git. Contudo, o relatório do Builder deveria registrar o comando ou a exclusão exata ao afirmar que o lint completo foi aprovado.
- **Ação recomendada:** tratar a higiene do comando de lint em missão separada, se desejado. Nenhuma correção é necessária para aprovar esta proteção.

### [Observação] A resposta de sucesso de finanças preserva um ID de página do Notion

- **Bloqueia a missão:** Não.
- **Evidência:** `app/api/notion/finance/route.ts:32-46` continua retornando `page.id` após uma gravação autorizada. Esse comportamento já existia no HEAD `fb41a50`; não foi introduzido pelo Builder. As respostas de negação novas não retornam qualquer ID.
- **Impacto:** o ID estrutural é visível apenas ao proprietário autorizado. Não cria exposição anônima ou para usuário fora da allowlist, mas uma interpretação futura de "nenhum ID em nenhuma resposta" teria de remover esse campo.
- **Ação recomendada:** decidir separadamente se respostas de sucesso ao proprietário podem carregar IDs do Notion. Isso estava fora do plano aprovado e não bloqueia o critério de proteção contra acesso não autorizado.

### [Observação] A garantia contra spoofing depende do perímetro administrado pelo Sites

- **Bloqueia a missão:** Não.
- **Evidência:** `getChatGPTUser()` confia diretamente nos dois cabeçalhos de identidade. O contrato local do starter declara que o Dispatch administra autenticação e injeção desses cabeçalhos (`README.md:30-32` e `README.md:78-84`). A configuração `.openai/hosting.json` referencia o projeto Sites e não declara um segundo backend público.
- **Impacto:** se no futuro o worker for exposto por uma origem direta que não remova cabeçalhos enviados pelo cliente, um atacante poderia forjar identidade. Dentro do modelo atual do OpenAI Sites, os testes locais que enviam esses cabeçalhos apenas simulam o Dispatch.
- **Ação recomendada:** manter o worker atrás do Dispatch e revalidar o contrato da plataforma antes de qualquer mudança de hospedagem ou publicação por origem alternativa. A busca em documentação pública oficial da OpenAI nesta data não encontrou uma página específica para esses cabeçalhos; a evidência direta disponível é o contrato do starter entregue no próprio projeto.

## Conformidade com as exclusões do plano

- `app/page.tsx`, `app/ShaftApp.tsx`, interface e fluxos visuais: não alterados;
- `.env.local`, valores hospedados e política externa do Sites: não alterados;
- token, bases, propriedades e schema do Notion: não alterados;
- paginação, idempotência, XP e salvamento parcial de treino: não alterados;
- dependências, middleware global e autenticação própria: não adicionados;
- Git, commit, push, merge e publicação: não executados.

Fora o acréscimo benigno ao índice global de relatórios descrito acima, o Builder respeitou os arquivos e todas as exclusões materiais do plano.

## Avaliação das validações

### Reproduzidas pelo Reviewer

1. `git diff --check fb41a50`: aprovado.
2. Lint direcionado da política, guard, quatro rotas e teste: aprovado.
3. Lint amplo com `--ignore-pattern dist --ignore-pattern .next --ignore-pattern work`: aprovado.
4. `npm test`: aprovado; executou novo build e encerrou com 12 testes aprovados, zero falhas.
5. Build `vinext` dentro de `npm test`: aprovado; as quatro rotas API aparecem no artefato.
6. Testes versionados carregam `dist/server/index.js`, portanto exercitam as rotas compiladas, e não apenas as funções TypeScript (`tests/shaft-access-policy.test.mjs:91-99`; `package.json:12`).
7. Matriz adicional do Reviewer no worker compilado: 16 verificações cobrindo as quatro rotas para `401`, `503`, `403` e loopback em build de produção. Foi configurado um token Notion falso e um espião global de `fetch`; o total de chamadas externas permaneceu zero.
8. Inspeção das respostas da matriz: nenhum corpo continha os IDs, e-mail ou segredo falsos usados no ensaio.
9. Status Git após lint, build e testes: inalterado em arquivos rastreados e não rastreados; somente artefatos ignorados foram regenerados antes da criação deste relatório.

### Limitações

- Os valores efetivamente configurados no ambiente hospedado não foram lidos nem alterados. Foi validado o comportamento seguro quando eles estão ausentes.
- Não foi feita publicação nem teste end-to-end no domínio hospedado, pois isso está explicitamente fora do escopo e não autorizado.
- A garantia de que visitantes não podem forjar os cabeçalhos antes de eles chegarem ao worker pertence ao Dispatch do OpenAI Sites; a implementação está alinhada ao contrato do starter, mas essa camada não é reproduzível no worker local.

## Handoff final

Não há achado Crítico, Alto ou Médio, nem violação material de escopo. As observações registradas não impedem a Missão 3. Este parecer não autoriza commit, push, merge ou publicação; a aceitação final e qualquer ação de repositório continuam dependentes da direção humana.

Aprovado com observações não bloqueadoras
