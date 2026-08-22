# Builder result: tentativa de neutralizar aprovação não atribuída

**Data:** 2026-08-21

**Missão:** `mission-09-main-protection`

**Classificação:** Nível 3 - crítico

**Papel:** Builder

**Plano aprovado:**

[`06-builder-plan-unattributed-approval.md`](06-builder-plan-unattributed-approval.md)

**Autorização:**

[`07-direction-unattributed-approval-fix-approval.md`](07-direction-unattributed-approval-fix-approval.md)

**Estado:** `PUT` mínimo rejeitado; estado remoto preservado; aguarda análise
da Direção

## 1. Resultado

Todas as pré-condições remotas do plano foram relidas antes da escrita e
coincidiram com a baseline aprovada. Foi feita exatamente uma chamada `PUT`
mínima ao ruleset `Protect main`, ID `21151016`, com:

- somente `enforcement` e `rules` no topo do payload;
- `enforcement: disabled` explícito;
- as quatro regras derivadas do readback imediatamente anterior;
- única mudança intencional em
  `require_extra_approval_for_unattributed_changes`, de `true` para `false`.

O GitHub rejeitou a chamada. A saída da CLI foi:

```text
gh: Invalid request.
```

Não foi retornado um objeto de sucesso. O invólucro do PowerShell interrompeu o
fluxo ao receber o erro nativo e não preservou o código HTTP na saída, portanto
este relatório não infere se a rejeição foi `4xx` específica nem atribui uma
causa sem evidência.

Conforme o plano e a autorização:

- não houve segunda tentativa;
- não houve fallback para payload completo;
- não houve recriação, exclusão ou ativação;
- foi feito somente o readback de segurança depois da rejeição;
- nenhum rollback foi executado, pois o estado remoto não mudou.

O objetivo de definir o campo como `false` **não foi alcançado**. O ruleset
permanece seguro, desabilitado e exatamente no snapshot anterior.

## 2. Pré-condições imediatamente anteriores

Antes do `PUT`, foi confirmado:

- repositório `Hykaji/shaft`, público, branch padrão `main` e permissão `admin`;
- exatamente um ruleset, ID `21151016`, nome `Protect main`, target `branch`;
- `enforcement: disabled`;
- bypass vazio;
- include somente `~DEFAULT_BRANCH` e exclude vazio;
- exatamente quatro regras na ordem observada: deletion, pull request,
  required status checks e non-fast-forward;
- `required_approving_review_count: 0` e demais flags de review em `false`;
- `required_reviewers: []`;
- `require_extra_approval_for_unattributed_changes: true`;
- merge methods `merge`, `squash` e `rebase`;
- required check `Lint, build and tests`, integração `15368`;
- strict e do-not-enforce-on-create em `false`;
- zero regras efetivas sobre `main`;
- `main.protected: false`;
- SHA da `main`: `310170674d8de6eac8b2746536470c7e51944ffc`;
- proteção clássica ausente, `404 Branch not protected`;
- workflow `CI`, ID `338958578`, caminho `.github/workflows/ci.yml`, ativo;
- Actions habilitadas para todas as Actions, sem SHA pinning obrigatório;
- token com permissão padrão `read` e sem poder aprovar reviews;
- merge commit, squash e rebase habilitados;
- histórico com uma versão, ID `47225866`, contendo o ruleset desabilitado e o
  campo em `true`.

Tentativas locais anteriores de montar a janela crítica falharam no parser ou
no tratamento do `404` esperado da proteção clássica. Elas pararam antes de
qualquer `PUT` e não produziram escrita remota. A chamada descrita neste
relatório foi a única tentativa remota de atualização.

## 3. Snapshot integral anterior

```json
{
  "id": 21151016,
  "name": "Protect main",
  "target": "branch",
  "source_type": "Repository",
  "source": "Hykaji/shaft",
  "enforcement": "disabled",
  "conditions": {
    "ref_name": {
      "exclude": [],
      "include": ["~DEFAULT_BRANCH"]
    }
  },
  "rules": [
    { "type": "deletion" },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": false,
        "required_reviewers": [],
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": false,
        "require_extra_approval_for_unattributed_changes": true,
        "allowed_merge_methods": ["merge", "squash", "rebase"]
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
    { "type": "non_fast_forward" }
  ],
  "node_id": "RRS_lACqUmVwb3NpdG9yec5O9fOvzgFCvSg",
  "created_at": "2026-08-21T11:42:18.525-03:00",
  "updated_at": "2026-08-21T11:42:18.595-03:00",
  "bypass_actors": [],
  "current_user_can_bypass": "never",
  "_links": {
    "self": {
      "href": "https://api.github.com/repos/Hykaji/shaft/rulesets/21151016"
    },
    "html": {
      "href": "https://github.com/Hykaji/shaft/rules/21151016"
    }
  }
}
```

## 4. Payload mínimo enviado

Endpoint:

`PUT /repos/Hykaji/shaft/rulesets/21151016`

Versão da API:

`X-GitHub-Api-Version: 2022-11-28`

```json
{
  "enforcement": "disabled",
  "rules": [
    { "type": "deletion" },
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
        "allowed_merge_methods": ["merge", "squash", "rebase"]
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
    { "type": "non_fast_forward" }
  ]
}
```

A comparação estrutural anterior ao envio confirmou que esse array era igual
ao snapshot remoto, exceto pela troca intencional do booleano para `false`.

## 5. Snapshot integral posterior

O `GET /repos/Hykaji/shaft/rulesets/21151016` posterior retornou:

```json
{
  "id": 21151016,
  "name": "Protect main",
  "target": "branch",
  "source_type": "Repository",
  "source": "Hykaji/shaft",
  "enforcement": "disabled",
  "conditions": {
    "ref_name": {
      "exclude": [],
      "include": ["~DEFAULT_BRANCH"]
    }
  },
  "rules": [
    { "type": "deletion" },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": false,
        "required_reviewers": [],
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": false,
        "require_extra_approval_for_unattributed_changes": true,
        "allowed_merge_methods": ["merge", "squash", "rebase"]
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
    { "type": "non_fast_forward" }
  ],
  "node_id": "RRS_lACqUmVwb3NpdG9yec5O9fOvzgFCvSg",
  "created_at": "2026-08-21T11:42:18.525-03:00",
  "updated_at": "2026-08-21T11:42:18.595-03:00",
  "bypass_actors": [],
  "current_user_can_bypass": "never",
  "_links": {
    "self": {
      "href": "https://api.github.com/repos/Hykaji/shaft/rulesets/21151016"
    },
    "html": {
      "href": "https://github.com/Hykaji/shaft/rules/21151016"
    }
  }
}
```

## 6. Comparação estrutural e estado externo

### Ruleset anterior versus posterior

- diferenças estruturais observadas: nenhuma;
- `updated_at`: inalterado;
- booleano: permaneceu `true`;
- enforcement: permaneceu `disabled`;
- quantidade, tipos e parâmetros das regras: inalterados;
- nome, target, source, condições, bypass, node ID, criação e links:
  inalterados.

### Histórico

- versões antes: somente `47225866`;
- versões depois: somente `47225866`;
- nova versão criada: não;
- snapshot histórico existente: ruleset `disabled`, booleano `true`.

### Estado externo posterior

- rulesets: exatamente um, mesmo ID e ainda `disabled`;
- regras efetivas sobre `main`: zero;
- `main.protected: false`;
- SHA da `main`: `310170674d8de6eac8b2746536470c7e51944ffc`;
- proteção clássica: ausente;
- repositório: público, branch padrão `main`;
- workflow `CI`: mesmo ID, nome, caminho e estado ativo;
- Actions Settings e permissões do token: inalteradas;
- merge commit, squash e rebase: inalterados;
- runs recentes: mesmos IDs observados; nenhum rerun foi criado.

## 7. Rollback

**Rollback contingencial executado:** não.

O rollback só estava autorizado após um `PUT` aceito com drift comprovado. A
chamada foi rejeitada, o readback permaneceu idêntico e o histórico não ganhou
versão. Portanto, não havia mudança a restaurar e uma segunda escrita teria
violado o plano.

## 8. Arquivos alterados

- `08-builder-result-unattributed-approval-fix.md`: este resultado e as
  evidências da tentativa rejeitada;
- `README.md`: atualização mínima do status e da cronologia da Missão 9.

Nenhum código, teste, workflow, dependência, dado ou outro documento foi
alterado nesta etapa.

## 9. Conformidade de escopo

- uma única tentativa `PUT` mínima;
- nenhuma segunda tentativa ou fallback;
- nenhuma ativação, recriação ou exclusão;
- nenhum rollback, pois não houve alteração remota;
- nenhum commit, push, PR, rerun, merge ou publicação;
- nenhuma mudança de branch, proteção clássica, workflow, Actions Settings,
  token, método de merge, visibilidade, código, dados, Notion, D1, deploy ou
  secrets;
- somente o relatório obrigatório e a atualização mínima do índice local.

## 10. Limitações e riscos restantes

- a rejeição não confirma se o campo específico é ou não aceito pelo endpoint
  neste repositório, porque não foi preservado um status HTTP ou corpo de erro
  detalhado;
- o plano não autoriza diagnosticar por nova tentativa com outro transporte,
  versão de API, payload ou conjunto de campos;
- o booleano continua `true`, então a ativação permanece bloqueada;
- qualquer investigação adicional que possa escrever remotamente exige novo
  plano e nova autorização humana explícita.

## 11. Handoff

A Direção deve analisar a rejeição e decidir se deseja somente investigação
adicional ou um novo plano para outra tentativa futura. Este resultado ainda
exige revisão independente de Nível 3. Não há autorização para ativação nem
para repetir ou reformular o `PUT`.

**O Builder para aqui. O ruleset `21151016` permanece `disabled`, inalterado e
com `require_extra_approval_for_unattributed_changes: true`.**
