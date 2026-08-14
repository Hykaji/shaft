# Plano do Builder: proteção server-side das rotas do Notion

**Data:** 14 de agosto de 2026  
**Missão:** `mission-03-notion-route-protection`  
**Papel:** Builder  
**Status:** Aguardando aprovação humana

## Objetivo

Adicionar uma barreira de autorização no servidor antes de qualquer leitura,
validação de corpo ou escrita feita pelas rotas do Notion. O acesso será
permitido somente ao proprietário configurado do Shaft.

## Implementação atual inspecionada

- `app/chatgpt-auth.ts` já lê os cabeçalhos confiáveis enviados pelo OpenAI
  Sites e fornece `getChatGPTUser()`, mas nenhuma rota do Notion o utiliza.
- `GET /api/notion/dashboard` lê check-ins, semana, finanças e exercícios.
- `POST /api/notion/checkins` cria um check-in e calcula XP.
- `POST /api/notion/finance` cria movimentações financeiras.
- `POST /api/notion/training` atualiza sessão, registros de carga e exercícios.
- As quatro rotas chamam o Notion diretamente após validações locais e não
  verificam identidade ou autorização.
- `app/page.tsx` e `app/ShaftApp.tsx` não precisam ser modificados para tornar
  as APIs seguras; respostas negadas já seguem o fluxo de indisponibilidade ou
  erro existente.
- O ambiente local não injeta automaticamente uma identidade do OpenAI Sites.
- A configuração do Sites não declara D1 ou R2 e não precisa mudar.

## Política de acesso proposta

1. Usar somente `getChatGPTUser()` e os cabeçalhos injetados pelo OpenAI Sites;
   não criar login, senha, cookie ou OAuth próprio.
2. Exigir usuário autenticado em todas as quatro rotas.
3. Exigir também correspondência com pelo menos uma lista de proprietários
   configurada no servidor:
   - `SHAFT_ALLOWED_USER_IDS`, preferencial por usar o identificador estável do
     usuário naquele Site;
   - `SHAFT_ALLOWED_USER_EMAILS`, alternativa prática ou de recuperação.
4. Comparar IDs literalmente e e-mails normalizados em minúsculas, aceitando
   listas separadas por vírgula e ignorando entradas vazias.
5. Falhar fechado:
   - `401` quando não houver identidade autenticada;
   - `403` quando houver identidade, mas ela não estiver permitida;
   - `503` quando nenhuma lista de proprietários estiver configurada.
6. Não retornar IDs, e-mails permitidos ou detalhes de configuração nas
   respostas de erro.
7. Preservar o desenvolvimento local somente quando o processo não estiver em
   produção **e** o endereço da requisição for loopback (`localhost`,
   `127.0.0.1` ou `::1`). Essa exceção não será controlada por cabeçalho enviado
   pelo navegador.

Essa política complementa a privacidade externa do Sites. Ela não considera um
login do ChatGPT, sozinho, autorização suficiente para acessar dados pessoais.

## Alterações propostas por arquivo

### Criar

- `app/lib/shaft-access-policy.ts`
  - concentrar parsing das listas, normalização e decisão pura de acesso;
  - manter a regra testável sem depender do Notion ou do runtime do Sites.
- `tests/shaft-access-policy.test.mjs`
  - testar proprietário por ID e e-mail, usuário ausente, usuário não
    permitido, configuração ausente, listas vazias, normalização de e-mail e
    exceção local restrita.
- `docs/agent-reports/missions/mission-03-notion-route-protection/02-builder-result-notion-route-protection.md`
  - registrar implementação, validações e handoff ao Reviewer.

### Modificar

- `app/chatgpt-auth.ts`
  - adicionar um guard compartilhado para APIs que combine a identidade do
    Sites com a política pura;
  - produzir respostas JSON seguras para `401`, `403` e `503`.
- `app/api/notion/dashboard/route.ts`
  - receber a requisição e executar o guard antes de consultar o Notion.
- `app/api/notion/checkins/route.ts`
  - executar o guard antes de ler o JSON ou consultar/criar páginas.
- `app/api/notion/finance/route.ts`
  - executar o guard antes de ler o JSON ou criar a movimentação.
- `app/api/notion/training/route.ts`
  - executar o guard antes de ler o JSON ou atualizar qualquer registro.
- `.env.example`
  - documentar as duas listas permitidas sem incluir dados pessoais reais.
- `package.json`
  - incluir o novo arquivo de testes no comando já existente, sem adicionar
    dependências.
- `README.md`
  - documentar a política, as variáveis necessárias e o comportamento local.
- `docs/agent-reports/missions/mission-03-notion-route-protection/README.md`
  - atualizar o estado e o registro cronológico da missão.

## Exclusões explícitas

- não proteger ou redirecionar `app/page.tsx` nesta missão;
- não alterar `app/ShaftApp.tsx` ou a interface;
- não editar `.env.local`, valores hospedados ou políticas do projeto Sites;
- não alterar token, bases, propriedades ou schema do Notion;
- não corrigir paginação, idempotência, XP ou salvamento parcial de treino;
- não adicionar dependências, middleware global ou autenticação própria;
- não publicar, fazer push, merge ou auto-merge.

## Riscos e preservação

- A publicação futura deverá configurar pelo menos uma lista permitida no
  ambiente hospedado; sem isso, as rotas retornarão `503` de propósito.
- A exceção local deve depender simultaneamente de ambiente não produtivo e
  endereço loopback para não virar um bypass remoto.
- O guard deve rodar antes de `request.json()` e antes de qualquer chamada ao
  Notion, evitando trabalho ou efeitos colaterais para pedidos negados.
- Os erros devem preservar o formato JSON atualmente consumido pela interface.
- A rota de dashboard não deve manter resposta privada em cache para usuários
  não autorizados.

## Plano de validação

1. Testes puros da política de acesso para todas as decisões e casos de borda.
2. Testes das quatro rotas confirmando que pedidos anônimos recebem `401` antes
   de qualquer dependência do Notion.
3. Verificação de que usuário autenticado não permitido recebe `403` e
   configuração ausente recebe `503`.
4. Verificação da exceção local somente para ambiente não produtivo e loopback.
5. Lint direcionado dos arquivos alterados.
6. Suíte completa de testes e build do Shaft.
7. Busca final para confirmar que todas as rotas ativas em `app/api/notion/`
   usam o guard compartilhado.
8. Revisão do diff para confirmar que nenhuma área excluída foi alterada.

Os testes de negação não devem chamar a API real do Notion nem expor valores de
ambiente.

## Aprovação solicitada

Solicita-se aprovação para implementar exatamente a política e os arquivos
descritos acima. Autenticação própria, proteção da página inteira, mudanças no
Notion e publicação permanecem fora do escopo.
