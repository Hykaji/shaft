# Builder result: criação desabilitada do ruleset

**Data:** 2026-08-21

**Missão:** `mission-09-main-protection`

**Classificação:** Nível 3 - crítico

**Papel:** Builder

**Plano aprovado:**
[`02-builder-plan-main-protection.md`](02-builder-plan-main-protection.md)

**Autorização:**
[`03-direction-disabled-ruleset-approval.md`](03-direction-disabled-ruleset-approval.md)

**Estado:** Ruleset criado e preservado como `disabled`; ativação proibida;
aguarda análise da Direção sobre defaults adicionais retornados pelo GitHub

## 1. Resultado

Foi criado exatamente um branch ruleset no repositório `Hykaji/shaft`:

- ID: `21151016`;
- nome: `Protect main`;
- target: `branch`;
- enforcement: `disabled`;
- bypass actors: nenhum;
- alvo: somente `~DEFAULT_BRANCH`;
- regras configuradas: deletion, pull request, required status checks e
  non-fast-forward.

O ruleset não foi ativado. Não houve segunda tentativa, edição, correção,
exclusão ou outra escrita remota.

A comparação dos campos aprovados passou. A API acrescentou dois campos de
resposta dentro de `pull_request.parameters` que não constavam do payload:

- `required_reviewers: []`;
- `require_extra_approval_for_unattributed_changes: true`.

O primeiro representa uma lista vazia. O segundo não aparece na documentação
pública de parâmetros consultada durante esta etapa. Como o ruleset está
desabilitado, nenhum deles produz regra efetiva sobre a `main`. Eles são
registrados como limitação e divergência de representação servidor/payload,
sem inferir o efeito de uma futura ativação e sem correção remota automática.

## 2. Baseline final imediatamente anterior à criação

A confirmação foi executada no mesmo fluxo que precedeu a chamada de criação:

- repositório: `Hykaji/shaft`;
- visibilidade: `public`; `private: false`;
- branch padrão: `main`;
- permissão da conta: `admin`;
- SHA da `main`: `310170674d8de6eac8b2746536470c7e51944ffc`;
- `main.protected: false`;
- proteção clássica: ausente, `HTTP 404 Branch not protected`;
- rulesets: zero;
- regras efetivas sobre `main`: zero;
- check-run recente:
  - ID: `96790524554`;
  - nome: `Lint, build and tests`;
  - estado/conclusão: `completed` / `success`;
  - concluído em `2026-08-21T13:46:27Z`;
  - App: `GitHub Actions`, slug `github-actions`, ID `15368`;
- workflow: ID `338958578`, nome `CI`, caminho
  `.github/workflows/ci.yml`, estado `active`;
- Actions: habilitadas, `allowed_actions: all`,
  `sha_pinning_required: false`;
- token: `default_workflow_permissions: read`,
  `can_approve_pull_request_reviews: false`;
- merge commit, squash e rebase: habilitados;
- auto-merge e exclusão automática de branch: desabilitados.

Nenhuma baseline material havia mudado, então a criação desabilitada pôde
prosseguir no escopo autorizado.

## 3. Payload enviado

```json
{
  "name": "Protect main",
  "target": "branch",
  "enforcement": "disabled",
  "bypass_actors": [],
  "conditions": {
    "ref_name": {
      "include": [
        "~DEFAULT_BRANCH"
      ],
      "exclude": []
    }
  },
  "rules": [
    {
      "type": "deletion"
    },
    {
      "type": "pull_request",
      "parameters": {
        "allowed_merge_methods": [
          "merge",
          "squash",
          "rebase"
        ],
        "dismiss_stale_reviews_on_push": false,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_approving_review_count": 0,
        "required_review_thread_resolution": false
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "do_not_enforce_on_create": false,
        "required_status_checks": [
          {
            "context": "Lint, build and tests",
            "integration_id": 15368
          }
        ],
        "strict_required_status_checks_policy": false
      }
    },
    {
      "type": "non_fast_forward"
    }
  ]
}
```

## 4. Objeto integral observado na releitura

Endpoint lido imediatamente após a criação:
`GET /repos/Hykaji/shaft/rulesets/21151016`.

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
      "include": [
        "~DEFAULT_BRANCH"
      ]
    }
  },
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
        "require_extra_approval_for_unattributed_changes": true,
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

## 5. Comparação campo por campo

| Campo | Esperado | Observado | Resultado |
| --- | --- | --- | --- |
| `name` | `Protect main` | `Protect main` | Aprovado |
| `target` | `branch` | `branch` | Aprovado |
| `enforcement` | `disabled` | `disabled` | Aprovado |
| `bypass_actors` | `[]` | `[]` | Aprovado |
| `conditions.ref_name.include` | somente `~DEFAULT_BRANCH` | somente `~DEFAULT_BRANCH` | Aprovado |
| `conditions.ref_name.exclude` | `[]` | `[]` | Aprovado |
| quantidade de regras | 4 | 4 | Aprovado |
| `deletion` | uma regra | uma regra | Aprovado |
| approvals | `0` | `0` | Aprovado |
| dismiss stale reviews | `false` | `false` | Aprovado |
| Code Owners | `false` | `false` | Aprovado |
| last push approval | `false` | `false` | Aprovado |
| conversation resolution | `false` | `false` | Aprovado |
| merge methods | merge, squash, rebase | merge, squash, rebase | Aprovado |
| required check context | `Lint, build and tests` | `Lint, build and tests` | Aprovado |
| required check integration | `15368` | `15368` | Aprovado |
| strict | `false` | `false` | Aprovado |
| do not enforce on create | `false` | `false` | Aprovado |
| `non_fast_forward` | uma regra | uma regra | Aprovado |
| `required_reviewers` | não enviado | `[]` | Default adicional do servidor |
| `require_extra_approval_for_unattributed_changes` | não enviado | `true` | Default adicional não documentado no plano |

Metadados gerados pelo GitHub — ID, source, node ID, timestamps, links e
`current_user_can_bypass` — não são campos configuráveis enviados no payload e
foram preservados integralmente na seção anterior.

## 6. Validação posterior

- rulesets no repositório: exatamente `1`;
- ID único: `21151016`;
- enforcement: `disabled`;
- regras efetivas sobre `main`: zero;
- `main`: `310170674d8de6eac8b2746536470c7e51944ffc`, inalterada;
- `main.protected`: `false`, coerente com ruleset desabilitado;
- proteção clássica: continua ausente, `HTTP 404`;
- visibilidade: continua pública;
- branch padrão: continua `main`;
- workflow `CI`: mesmo ID, caminho e estado;
- Actions Settings: inalteradas;
- permissões do token: inalteradas;
- merge commit, squash e rebase: inalterados;
- auto-merge e exclusão automática de branch: inalterados.

Nenhuma regra está sendo aplicada à `main` nesta etapa.

## 7. Conformidade de escopo

- nenhuma ativação do ruleset;
- nenhuma edição ou correção remota posterior;
- nenhuma proteção clássica;
- nenhuma mudança de workflow, Actions Settings, token, visibilidade ou método
  de merge;
- nenhuma branch, commit, push, PR, rerun ou merge;
- nenhum código, teste, dependência, dado, Notion, D1, deploy ou secret;
- alterações documentais locais anteriores preservadas;
- somente este relatório e a entrada cronológica mínima no README da Missão 9
  foram criados/alterados localmente nesta etapa.

## 8. Limitações e decisão pendente

O GitHub aceitou o payload aprovado, mas normalizou a resposta com
`required_reviewers: []` e
`require_extra_approval_for_unattributed_changes: true`. Não foi encontrada
descrição pública oficial para o segundo campo durante esta execução. Seu
efeito real, caso o ruleset seja ativado, permanece não verificado.

Por isso:

- a configuração principal pedida está presente e desabilitada;
- a igualdade integral entre payload e objeto observado possui a diferença de
  defaults registrada acima;
- nenhuma alteração deve ser feita para tentar remover ou mudar esses defaults
  sem novo plano e autorização;
- a ativação permanece proibida até análise humana explícita e a revisão
  independente exigida pelo Nível 3.

## 9. Handoff

A Direção deve decidir se os defaults adicionais retornados pelo GitHub são
aceitáveis para a próxima fase ou se exigem investigação complementar. Qualquer
edição, recriação, exclusão ou ativação do ruleset será uma nova escrita remota
e depende de autorização própria.

**O Builder para aqui. O ruleset `21151016` permanece `disabled`.**
