# Builder plan: neutralizar aprovação extra para mudanças não atribuídas

**Data:** 2026-08-21

**Missão:** `mission-09-main-protection`

**Classificação:** Nível 3 - crítico

**Papel:** Builder

**Estado:** Aguardando análise e aprovação humana

**Direção revisada:**
[`05-direction-blocker-unattributed-approval.md`](05-direction-blocker-unattributed-approval.md)

## 1. Objetivo e limite desta fase

Investigar o suporte do endpoint do GitHub ao campo
`require_extra_approval_for_unattributed_changes` e preparar uma futura
alteração mínima que defina explicitamente o valor `false`, sem modificar
qualquer outra configuração do ruleset `Protect main`, ID `21151016`.

Esta fase realizou somente consultas locais, remotas e documentais. O ruleset
não foi editado, recriado, excluído nem ativado. Nenhuma chamada remota de
escrita foi executada.

## 2. Estado remoto inspecionado

Consulta somente leitura realizada em 2026-08-21:

- repositório: `Hykaji/shaft`;
- ruleset: `Protect main`, ID `21151016`;
- target: `branch`;
- source: `Hykaji/shaft`, tipo `Repository`;
- enforcement: `disabled`;
- bypass actors: `[]`;
- condição: somente `~DEFAULT_BRANCH`, sem exclusões;
- regras: deletion, pull request, required status checks e non-fast-forward;
- `required_approving_review_count: 0`;
- `require_extra_approval_for_unattributed_changes: true`;
- rulesets no repositório: exatamente um;
- regras efetivas sobre `main`: zero;
- `main`: `310170674d8de6eac8b2746536470c7e51944ffc`;
- `main.protected: false`;
- proteção clássica: ausente, `HTTP 404 Branch not protected`.

O valor adicional foi retornado tanto com
`X-GitHub-Api-Version: 2022-11-28` quanto com
`X-GitHub-Api-Version: 2026-03-10`. Isso confirma que o serviço atual expõe o
campo na leitura nas duas versões consultadas; não constitui, isoladamente,
prova de que ele integra o contrato oficial de entrada.

### Histórico disponível

O endpoint de histórico retornou uma versão:

- version ID: `47225866`;
- data: `2026-08-21T11:42:18.708-03:00`;
- actor type: `User`;
- estado armazenado: ruleset integral ainda `disabled`, com o campo em `true`.

Essa versão é uma fonte remota de recuperação e comparação. A API documenta a
leitura de versões, mas não oferece neste fluxo uma operação de “restaurar esta
versão”; um rollback ainda exigiria um novo `PUT` com os campos configuráveis do
estado anterior.

## 3. Suporte do endpoint ao campo

### 3.1 Documentação e fontes oficiais

A documentação oficial confirma:

- endpoint de atualização:
  `PUT /repos/{owner}/{repo}/rulesets/{ruleset_id}`;
- permissão necessária: `Administration` do repositório em modo write;
- campos de topo como `name`, `target`, `enforcement`, `bypass_actors`,
  `conditions` e `rules` são parâmetros opcionais da atualização;
- respostas previstas incluem `200`, `404`, `422` e `500`;
- endpoints separados permitem ler o ruleset, seu histórico e uma versão.

Entretanto, em 2026-08-21:

- a página oficial de parâmetros do ruleset não lista
  `require_extra_approval_for_unattributed_changes`;
- busca pelo nome exato no repositório oficial `github/docs` retornou zero
  ocorrência;
- busca pelo nome exato no repositório oficial
  `github/rest-api-description` retornou zero ocorrência;
- os tipos OpenAPI oficiais consumidos por projetos da comunidade ainda não
  expressam o campo.

Assim, a documentação oficial confirma o endpoint e sua forma geral de update,
mas **não confirma formalmente esse campo específico como parâmetro de
entrada**. O fato de o GET devolvê-lo é evidência do serviço oficial em runtime,
não uma garantia documental de escrita ou estabilidade.

Fontes oficiais:

- [REST API endpoints for repository rules](https://docs.github.com/en/rest/repos/rules);
- [OpenAPI oficial do GitHub](https://github.com/github/rest-api-description);
- [fonte oficial da documentação](https://github.com/github/docs).

### 3.2 Evidências comunitárias

A evidência comunitária mais forte encontrada é o projeto público
`vergil-project/vergil-tooling`:

- a issue 2860 propôs enviar explicitamente `false` e distinguir se o servidor
  aceitaria o valor ou reinjetaria `true`;
- o PR 2861, integrado em 2026-08-20, registra que o `PUT` foi aplicado, que o
  GitHub preservou `false` no readback e que a auditoria pós-aplicação ficou
  verde;
- o código atual inclui o campo em `false` no payload completo enviado ao
  endpoint de rulesets;
- uma consulta atual ao ruleset público `Branch protection`, ID `12916979`,
  retornou o campo em `false`, coerente com o relato de aplicação.

Outras evidências comunitárias:

- `electron/sheriff` remove o campo durante comparação porque ele aparece nas
  respostas, mas ainda não pode ser expresso pelo schema de configuração e
  pelos tipos OpenAPI consumidos pelo projeto;
- `jakehildreth/Mainstay` inclui explicitamente `false` em um payload de criação
  de ruleset e documenta a intenção de evitar aprovação com contador zero;
- snapshots públicos de outros repositórios mostram o campo materializado em
  respostas, geralmente com o default `true`.

Essas fontes são úteis e reproduzíveis, mas não são contrato do GitHub:

- [vergil-project/vergil-tooling#2860](https://github.com/vergil-project/vergil-tooling/issues/2860);
- [vergil-project/vergil-tooling#2861](https://github.com/vergil-project/vergil-tooling/pull/2861);
- [electron/sheriff](https://github.com/electron/sheriff/blob/25450cfbbeb372c6b4fc846f37511e2b511108d4/src/permissions/ruleset.ts);
- [Mainstay](https://github.com/jakehildreth/Mainstay/blob/b17b304d70afe014b57b207f3ed7049abab889c8/Private/New-MainstayProtection.ps1).

### 3.3 Conclusão sobre aceitação

**Conclusão:** o endpoint atual do GitHub Cloud aceita empiricamente
`require_extra_approval_for_unattributed_changes: false`, conforme uma aplicação
com readback comunitário recente e um estado remoto público ainda observável.
A confiança operacional é alta, mas o suporte permanece não documentado e fora
do OpenAPI oficial.

Para `Hykaji/shaft`, a confirmação definitiva só poderá ocorrer numa futura
chamada autorizada que termine em `200` e seja seguida por leitura integral com
o valor `false`. Um `422`, campo reinjetado como `true` ou qualquer drift exige
parada; não autoriza fallback, recriação ou ativação.

## 4. Alternativas de atualização

O endpoint oficial usa `PUT`, não JSON Patch nem PATCH aninhado. Mesmo na opção
“mínima”, alterar um parâmetro dentro da regra `pull_request` exige reenviar o
array `rules` completo; enviar somente a regra de pull request arriscaria
substituir/remover deletion, required status checks e non-fast-forward.

### 4.1 Payload mínimo no topo

Enviar somente:

- `enforcement: disabled`, para fixar explicitamente a barreira de segurança;
- o array integral `rules`, idêntico ao readback, exceto pela troca de
  `require_extra_approval_for_unattributed_changes` de `true` para `false`.

Vantagens:

- não reenvia nem expõe a normalização de nome, target, bypass ou condições;
- reduz o blast radius aos dois campos de topo necessários;
- usa o fato oficialmente documentado de que os parâmetros de topo da
  atualização são opcionais;
- mantém o ruleset desabilitado na própria chamada.

Riscos:

- o array de regras inteiro ainda é substituído;
- depende da semântica de preservação dos campos de topo omitidos;
- o campo específico continua fora do contrato oficial.

### 4.2 Payload configurável completo

Reenviar nome, target, enforcement, bypass, condições e todas as regras,
removendo apenas metadados somente leitura como ID, source, node ID, datas,
links e `current_user_can_bypass`.

Vantagens:

- pedido autocontido e fácil de reconstruir a partir do snapshot;
- coincide com o formato dos exemplos oficiais e de ferramentas comunitárias;
- explicita todos os valores desejados numa única representação.

Riscos:

- amplia a superfície de mudança para campos que não precisam ser tocados;
- pode normalizar alvo, bypass ou condições por causa de diferença de versão ou
  default;
- um erro de serialização pode alterar configurações fora do único booleano;
- torna a comparação e o rollback mais amplos.

### 4.3 Recomendação

Usar o **payload mínimo no topo**, sem fallback automático para payload
completo. O payload completo deve ficar reservado ao rollback de um drift já
observado e somente se esse rollback tiver sido autorizado de antemão.

## 5. Payload mínimo proposto

Numa futura implementação explicitamente autorizada, usar o mesmo endpoint e a
mesma versão de API empregada na criação e validação original:

`PUT /repos/Hykaji/shaft/rulesets/21151016`

`X-GitHub-Api-Version: 2022-11-28`

```json
{
  "enforcement": "disabled",
  "rules": [
    {
      "type": "deletion"
    },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": false,
        "required_reviewers": [],
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": false,
        "require_extra_approval_for_unattributed_changes": false,
        "allowed_merge_methods": [
          "merge",
          "squash",
          "rebase"
        ]
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": false,
        "do_not_enforce_on_create": false,
        "required_status_checks": [
          {
            "context": "Lint, build and tests",
            "integration_id": 15368
          }
        ]
      }
    },
    {
      "type": "non_fast_forward"
    }
  ]
}
```

Não enviar `name`, `target`, `bypass_actors` ou `conditions` nesta opção. Não
enviar campos de resposta somente leitura. Não omitir nenhuma das quatro regras
nem nenhum parâmetro atualmente materializado dentro delas.

## 6. Pré-condições da futura escrita

Imediatamente antes do `PUT`, confirmar e registrar:

1. repositório ainda `Hykaji/shaft`, público e com branch padrão `main`;
2. ruleset ID `21151016`, nome `Protect main`, target `branch`;
3. exatamente um ruleset no repositório;
4. enforcement ainda `disabled`;
5. bypass vazio e condição somente `~DEFAULT_BRANCH`;
6. quatro regras e todos os parâmetros iguais ao snapshot 04;
7. valor atual do campo ainda `true`;
8. zero regras efetivas sobre `main` e `main.protected: false`;
9. SHA atual da `main` registrado;
10. proteção clássica ausente;
11. workflow, Actions Settings, token e métodos de merge inalterados;
12. histórico e version ID atuais lidos integralmente;
13. JSON configurável anterior preservado em memória e no futuro relatório para
    comparação e rollback.

Se qualquer item divergir, parar antes da escrita e retornar à Direção. Entre o
último GET e o `PUT`, executar sem pausa ou ação paralela. A API não documenta
neste fluxo um compare-and-swap obrigatório; permanece um risco residual de
corrida administrativa.

## 7. Sequência futura proposta

Após aprovação humana específica:

1. executar todas as pré-condições da seção 6;
2. construir o payload a partir do snapshot validado, não de memória manual;
3. comparar estruturalmente o payload com o estado anterior e exigir como única
   diferença intencional o booleano `true` -> `false`, além da presença
   explícita de `enforcement: disabled`;
4. fazer uma única chamada `PUT` com o payload da seção 5;
5. se a resposta não for `200`, não tentar novamente nem usar payload completo;
6. ler integralmente a resposta e executar imediatamente um novo
   `GET /repos/Hykaji/shaft/rulesets/21151016`;
7. ler lista de rulesets, regras efetivas, branch, proteção clássica, workflow,
   Actions Settings, token, merge methods e histórico;
8. comparar estruturalmente e produzir o resultado do Builder;
9. manter `enforcement: disabled` e entregar para análise da Direção e revisão
   independente antes de qualquer ativação.

## 8. Comparação estrutural posterior

A validação deve carregar os JSONs como objetos, sem depender de ordem de
propriedades ou formatação textual.

### Única diferença configurável permitida

- `rules[pull_request].parameters.require_extra_approval_for_unattributed_changes`:
  `true` -> `false`.

### Campos que devem permanecer idênticos

- ID, nome, target, source e source type;
- enforcement `disabled`;
- bypass actors vazio;
- include somente `~DEFAULT_BRANCH` e exclude vazio;
- exatamente quatro regras, sem adição, remoção ou duplicação;
- approvals `0`, required reviewers vazio e todos os outros flags de PR;
- métodos merge, squash e rebase;
- required check `Lint, build and tests`, integração `15368`;
- strict e do-not-enforce-on-create em `false`;
- deletion e non-fast-forward presentes;
- node ID, created_at e links.

### Mudanças de metadados permitidas

- `updated_at` posterior;
- nova version ID no histórico;
- timestamp e actor da nova versão.

Qualquer outro campo novo, removido ou alterado é drift. Não normalizar ou
ignorar defaults adicionais silenciosamente.

### Estado externo que deve permanecer igual

- exatamente um ruleset e mesmo ID;
- regras efetivas sobre `main`: zero;
- `main.protected: false` e SHA inalterado durante a operação;
- proteção clássica ausente;
- repositório ainda público e branch padrão `main`;
- workflow, Actions Settings, token e métodos de merge inalterados;
- nenhuma branch, commit, push, PR, run ou configuração adicional criada.

## 9. Rollback

### Falha antes ou rejeição do PUT

- se a pré-condição falhar, não escrever;
- se o endpoint responder `4xx` ou `5xx`, reler o estado;
- se o estado permanecer igual, não há rollback a executar;
- não tentar outro formato ou payload no mesmo gate.

### PUT aceito e readback correto

Não executar rollback. Preservar o ruleset em `disabled`, registrar a nova
versão e aguardar os próximos gates.

### PUT aceito com drift

O futuro pedido de autorização deve decidir explicitamente se inclui um
rollback contingencial. Se incluído:

1. usar o JSON configurável integral capturado imediatamente antes da escrita,
   correspondente à versão anterior do histórico;
2. remover apenas metadados somente leitura;
3. executar um único `PUT` completo para restaurar nome, target, enforcement
   `disabled`, bypass, condições e as quatro regras, incluindo o valor anterior
   `true`;
4. reler integralmente e comparar com o snapshot anterior;
5. confirmar novamente zero regras efetivas, `main.protected: false`, SHA e
   configurações externas inalteradas;
6. parar mesmo se o rollback falhar ou divergir; não excluir, recriar ou ativar
   o ruleset.

Se o rollback contingencial não for autorizado, qualquer drift exige parada no
estado desabilitado e nova decisão humana. O histórico ajuda a reconstruir a
baseline, mas não substitui uma autorização de escrita.

## 10. Riscos e preservação

- **Campo não documentado:** pode mudar ou deixar de ser aceito. Mitigação:
  chamada única, `422` tratado como parada e readback obrigatório.
- **Sem patch aninhado:** o array de regras inteiro precisa ser reenviado.
  Mitigação: construir do GET atual e comparar antes da escrita.
- **Semântica de PUT:** payload completo amplia o blast radius; payload mínimo
  ainda depende da preservação dos campos omitidos. Mitigação: opção mínima e
  comparação integral.
- **Corrida administrativa:** outra mudança entre GET e PUT pode ser
  sobrescrita. Mitigação: janela curta, baseline estrita e parada por drift.
- **Novos defaults:** o servidor pode materializar outros campos. Mitigação:
  não ignorar diferenças e manter enforcement desabilitado.
- **Rollback também escreve:** não deve ser presumido pela autorização da
  correção. Mitigação: solicitar autorização contingencial explícita.
- **Ativação acidental:** qualquer payload que omita ou mude enforcement pode
  cruzar o gate. Mitigação: enviar e validar explicitamente `disabled`.

## 11. Escopo documental futuro

Uma implementação futura autorizada deve criar apenas o resultado cronológico
correspondente e atualizar minimamente este índice. Parecer do Reviewer,
decisões da Direção e eventual ativação permanecem documentos e gates
posteriores.

## 12. Exclusões explícitas

- não editar, recriar, excluir ou ativar o ruleset nesta fase;
- não executar PUT, PATCH, POST ou DELETE remoto;
- não alterar proteção clássica, workflow, Actions Settings, token, merge
  methods, visibilidade ou branch padrão;
- não criar branch, commit, push, PR, rerun ou merge;
- não alterar código, testes, dependências, dados, Notion, D1, deploy ou
  secrets;
- não usar payload completo como fallback automático;
- não autorizar rollback, correção ou ativação por implicação.

## 13. Pedido de aprovação

Solicita-se à Direção analisar:

1. o uso de um único `PUT` mínimo, com `enforcement: disabled` e o array
   completo de regras;
2. a definição explícita do campo como `false`;
3. a comparação estrutural e as condições de parada;
4. se uma futura autorização incluirá ou não o rollback contingencial descrito
   na seção 9.

Nenhuma aprovação deste plano deve ser interpretada como autorização para
ativar o ruleset. A alteração para `false`, o rollback contingencial e a
ativação são gates distintos.

**O Builder para aqui. O ruleset `21151016` permanece `disabled` e inalterado.**
