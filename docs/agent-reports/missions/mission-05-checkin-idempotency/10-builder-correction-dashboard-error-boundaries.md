# Correção do Builder: limites de erro do dashboard D1

**Data:** 15 de agosto de 2026  
**Missão:** `mission-05-checkin-idempotency`  
**Achado corrigido:** bloqueador Medium de `09-reviewer-review-d1-core-checkins.md`  
**Papel:** Builder  
**Status:** Pronto para nova revisão

## Resultado

O tratamento de erros do dashboard em modo D1 foi separado em dois limites:

1. identidade, binding e leitura do ledger de check-ins/XP permanecem em um
   bloco próprio; qualquer falha nesse núcleo retorna `503` com
   `Check-ins e XP estão indisponíveis no momento.`;
2. somente depois do sucesso D1 são consultados semana, finanças e exercícios
   no Notion; falhas nessa etapa são encaminhadas a `apiError(error)`.

Assim, um status HTTP conhecido preservado por `queryAllPages` também chega ao
cliente no modo D1, usando a mensagem genérica e sanitizada já aprovada na
Missão 4. Resultados financeiros só são reduzidos a saldo depois de todas as
páginas terem sido obtidas; uma falha posterior não devolve `balance` parcial.

O ramo legado `getNotionDashboard` não foi alterado. Nenhuma leitura, escrita,
sincronização ou projeção de check-ins para o Notion foi adicionada.

## Arquivos alterados

- `app/api/notion/dashboard/route.ts`
  - separa falhas do núcleo D1 das falhas das consultas Notion;
  - mantém o `503` específico de check-ins/XP apenas no primeiro limite;
  - encaminha o segundo limite para `apiError(error)`.
- `tests/notion-finance-pagination.test.mjs`
  - adiciona binding D1 falso pronto ao Worker compilado;
  - reproduz falha na segunda página financeira com status `418` e sentinelas;
  - confirma status preservado, mensagem sanitizada e ausência de `balance`;
  - reproduz falha interna do ledger e confirma `503`, mensagem própria de
    check-ins/XP, ausência de detalhes internos e zero consulta ao Notion.
- `docs/agent-reports/missions/mission-05-checkin-idempotency/10-builder-correction-dashboard-error-boundaries.md`
  - este relatório e handoff.

Nenhum outro arquivo foi alterado nesta correção. Em especial, schema,
migração, autenticação, política de acesso, binding, outras rotas,
`app/lib/notion.ts`, arquitetura, relatório 09 e índice da missão foram
preservados.

## Evidência do teste compilado

No cenário de falha financeira em modo `SHAFT_CHECKIN_STORE=d1`:

- o binding D1 falso retorna owner pronto, ausência de último check-in e
  `xp_total = 65`;
- a primeira página financeira retorna 100 movimentos e um cursor sentinela;
- a segunda página retorna HTTP `418` com cursor e detalhe remoto sentinela;
- a rota compilada responde HTTP `418`;
- o corpo contém somente
  `{ "error": "Não foi possível carregar todos os resultados do Notion." }`;
- nenhuma sentinela e nenhum campo `balance` aparecem na resposta.

No cenário separado de falha do ledger D1:

- o batch falso lança um detalhe interno sentinela;
- a rota compilada responde HTTP `503`;
- o corpo contém somente
  `{ "error": "Check-ins e XP estão indisponíveis no momento." }`;
- o detalhe interno não aparece;
- nenhuma chamada às consultas Notion ocorre.

Esses dois cenários demonstram a distinção exigida pelo Reviewer sem alterar o
contrato do modo legado.

## Validações executadas

### Lint direcionado

```powershell
& 'C:\Program Files\nodejs\npm.cmd' exec -- eslint app/api/notion/dashboard/route.ts tests/notion-finance-pagination.test.mjs
```

Resultado: exit code `0`, sem erros ou avisos.

### Build

```powershell
& 'C:\Program Files\nodejs\npm.cmd' run build
```

Resultado: exit code `0`; as quatro rotas foram geradas, incluindo o dashboard
compilado exercitado pelos testes.

### Teste focal do tratamento financeiro

```powershell
& 'C:\Program Files\nodejs\node.exe' --test tests/notion-finance-pagination.test.mjs
```

Resultado: `16` testes aprovados, zero falhas. Os dois novos testes compilados
em modo D1 passaram.

### Suíte focal D1 real

```powershell
& 'C:\Program Files\nodejs\npm.cmd' run test:checkin-idempotency
```

Resultado: `14` testes aprovados, zero falhas, cancelamentos ou skips. As provas
de concorrência, unicidade, replay, conflito, retroatividade e rollback real
permanecem aprovadas.

### Regressões das Missões 3 e 4

```powershell
& 'C:\Program Files\nodejs\node.exe' --test tests/notion-finance-pagination.test.mjs tests/shaft-access-policy.test.mjs
```

Resultado: `23` testes aprovados, zero falhas. Permaneceram cobertos o guard da
Missão 3, a paginação/sanitização da Missão 4 e os novos limites do modo D1.

### Suíte completa

```powershell
& 'C:\Program Files\nodejs\npm.cmd' test
```

Resultado: build aprovado e `43` testes aprovados, sem falhas, cancelamentos,
skips ou pendências.

## Escopo e segurança

- A resposta Notion continua sanitizada por `queryAllPages` e `apiError`;
  conteúdo remoto sensível não é devolvido.
- Nenhum saldo parcial é calculado ou retornado após falha de paginação.
- Falha D1 não inicia consultas Notion e não expõe detalhes do binding/ledger.
- O modo `notion` permanece no mesmo código e tratamento anteriores.
- Não houve alteração de schema, migração, autenticação, allowlist, binding,
  dependência, lockfile, outra rota ou arquitetura.
- Não houve acesso ao Notion real, D1 remoto ou outro serviço.
- Não houve commit, push, deploy, publicação ou migração remota.

## Handoff ao Reviewer

Revisar prioritariamente:

1. a fronteira entre o primeiro `try/catch` D1 e o segundo limite Notion;
2. o uso de `apiError(error)` somente para semana, finanças e exercícios;
3. o teste compilado que preserva HTTP `418` sem sentinelas nem `balance`;
4. o teste compilado que mantém falha D1 em `503` sem consultar o Notion;
5. a ausência de mudanças no ramo legado e fora do escopo autorizado.

**Estado: Pronto para nova revisão.** Nenhuma ação de Git ou publicação foi
executada.
