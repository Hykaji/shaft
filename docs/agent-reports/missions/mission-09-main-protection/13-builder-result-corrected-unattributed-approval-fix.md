# Builder result: correção da aprovação não atribuída

**Data:** 2026-08-21

**Missão:** `mission-09-main-protection`

**Papel:** Builder

**Classificação:** Nível 3 - crítico

**Plano aprovado:**
[`11-builder-plan-invalid-request-diagnosis.md`](11-builder-plan-invalid-request-diagnosis.md)

**Autorização:**
[`12-direction-corrected-put-approval.md`](12-direction-corrected-put-approval.md)

**Status:** correção aplicada sem drift; `disabled`; pronto para revisão
independente

## Resultado

Foi feita exatamente uma chamada remota `PUT` ao ruleset `Protect main`, ID
`21151016`, usando `X-GitHub-Api-Version: 2022-11-28`.

A chamada foi aceita:

- exit code do `gh`: `0`;
- status HTTP: `200`;
- `require_extra_approval_for_unattributed_changes`: `true` → `false`;
- `enforcement`: permaneceu `disabled`;
- diferenças configuráveis além do booleano: nenhuma;
- regras efetivas sobre `main`: zero;
- rollback contingencial: não executado, pois não houve drift.

A ativação não foi executada e continua sem autorização. Este resultado ainda
depende de revisão independente e decisão humana.

## Pré-condições imediatamente anteriores

Todas as condições vinculantes foram relidas dentro da mesma janela que
precedeu o `PUT`:

- identidade autenticada: `Hykaji`;
- repositório: `Hykaji/shaft`, público, branch padrão `main`, permissão admin;
- rulesets: exatamente um, ID `21151016`, nome `Protect main`, target `branch`;
- `enforcement: disabled`;
- bypass vazio;
- include somente `~DEFAULT_BRANCH` e exclude vazio;
- quatro regras, integralmente iguais ao snapshot aprovado;
- campo alvo ainda `true`;
- zero regras efetivas sobre `main`;
- `main.protected: false`;
- SHA da `main`: `310170674d8de6eac8b2746536470c7e51944ffc`;
- proteção clássica ausente, `HTTP 404 Branch not protected`;
- workflow `CI`, ID `338958578`, caminho `.github/workflows/ci.yml`, ativo;
- check `Lint, build and tests`, App ID `15368`, concluído com sucesso;
- Actions com `allowed_actions: all` e sem SHA pinning obrigatório;
- token com permissão padrão `read` e sem poder aprovar reviews;
- merge commit, squash e rebase habilitados; auto-merge e exclusão automática
  de branch desabilitados;
- histórico com somente a versão anterior `47225866`;
- snapshot histórico anterior `disabled`, com o campo em `true`.

A comparação estrutural do readback atual contra o snapshot integral aprovado
retornou zero diferenças. Nenhuma pré-condição divergiu.

## Snapshot integral anterior

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

## Payload mínimo e validação dos bytes

Representação sanitizada exata:

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

Evidência dos bytes finais enviados:

- serialização compacta: `653` caracteres;
- comprimento: `653` bytes;
- codificação: UTF-8 válido, sem BOM e sem quebra de linha acrescentada;
- SHA-256:
  `1eb0ec906bd6fcba78ded6ba52ec0032812173bd745aa7b6909f3e3800110153`;
- chaves de topo: somente `enforcement` e `rules`;
- `enforcement`: literalmente `disabled`;
- `rules`: array de exatamente quatro elementos;
- chaves `value` e `Count`: ausentes;
- diferença estrutural anterior ao envio: exatamente
  `$.rules[1].parameters.require_extra_approval_for_unattributed_changes`, de
  `System.Boolean:true` para `System.Boolean:false`.

Os mesmos bytes foram escritos diretamente no stdin do `gh`; não houve
reconversão textual entre a validação e a rede.

## Única chamada e resposta sanitizada

Endpoint:

`PUT /repos/Hykaji/shaft/rulesets/21151016`

Versão:

`X-GitHub-Api-Version: 2022-11-28`

Opções de diagnóstico usadas: `--include` e `--input -`. Não foram usados
`--verbose` nem `GH_DEBUG=api`.

### Resultado de transporte

- exit code: `0`;
- status: `HTTP 200`;
- stderr completo: vazio;
- corpo: `1174` bytes;
- SHA-256 do corpo:
  `3f8e72e31e3fd05a64431e119be70238210218dfac6825a4556e13732ce26297`.

### Headers permitidos

```text
content-type: application/json; charset=utf-8
date: Fri, 21 Aug 2026 17:35:22 GMT
x-github-api-version-selected: 2022-11-28
x-github-request-id: D9F6:B0C04:9747CB:9B78B4:6A888C59
x-ratelimit-limit: 5000
x-ratelimit-remaining: 4989
x-ratelimit-reset: 1787337292
x-ratelimit-resource: core
x-ratelimit-used: 11
```

Nenhum header fora da allowlist e nenhuma credencial foram registrados.

### Corpo completo

```json
{"id":21151016,"name":"Protect main","target":"branch","source_type":"Repository","source":"Hykaji/shaft","enforcement":"disabled","conditions":{"ref_name":{"exclude":[],"include":["~DEFAULT_BRANCH"]}},"rules":[{"type":"deletion"},{"type":"pull_request","parameters":{"required_approving_review_count":0,"dismiss_stale_reviews_on_push":false,"required_reviewers":[],"require_code_owner_review":false,"require_last_push_approval":false,"required_review_thread_resolution":false,"require_extra_approval_for_unattributed_changes":false,"allowed_merge_methods":["merge","squash","rebase"]}},{"type":"required_status_checks","parameters":{"strict_required_status_checks_policy":false,"do_not_enforce_on_create":false,"required_status_checks":[{"context":"Lint, build and tests","integration_id":15368}]}},{"type":"non_fast_forward"}],"node_id":"RRS_lACqUmVwb3NpdG9yec5O9fOvzgFCvSg","created_at":"2026-08-21T11:42:18.525-03:00","updated_at":"2026-08-21T14:35:21.921-03:00","bypass_actors":[],"current_user_can_bypass":"never","_links":{"self":{"href":"https://api.github.com/repos/Hykaji/shaft/rulesets/21151016"},"html":{"href":"https://github.com/Hykaji/shaft/rules/21151016"}}}
```

## Snapshot integral posterior

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
  ],
  "node_id": "RRS_lACqUmVwb3NpdG9yec5O9fOvzgFCvSg",
  "created_at": "2026-08-21T11:42:18.525-03:00",
  "updated_at": "2026-08-21T14:35:21.921-03:00",
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

## Comparação estrutural e estado externo

### Snapshot anterior versus posterior

As únicas diferenças diretas foram:

- `require_extra_approval_for_unattributed_changes`: `true` → `false`, mudança
  autorizada;
- `updated_at`: `2026-08-21T11:42:18.595-03:00` →
  `2026-08-21T14:35:21.921-03:00`, metadata esperada.

Depois de aplicar ao esperado o booleano autorizado e o novo `updated_at`, a
comparação estrutural integral retornou **zero diferenças**. ID, nome, target,
source, enforcement, condições, bypass, quatro regras, todos os demais
parâmetros, node ID, created_at e links permaneceram iguais.

### Histórico

Antes:

- uma versão, ID `47225866`, campo `true`, `disabled`.

Depois:

- nova versão ID `47244358`, em
  `2026-08-21T14:35:22.027-03:00`, actor `User` ID `173323031`;
- versão anterior `47225866` preservada;
- leitura da versão `47244358` confirmou ruleset ID `21151016`, quatro regras,
  bypass vazio, `enforcement: disabled` e campo `false`.

### Estado externo posterior

- exatamente um ruleset, mesmo ID e ainda `disabled`;
- regras efetivas sobre `main`: zero;
- SHA da `main`: `310170674d8de6eac8b2746536470c7e51944ffc`;
- `main.protected: false`;
- proteção clássica: ausente, `HTTP 404`;
- repositório público e branch padrão `main`;
- workflow `CI` preservado e ativo;
- Actions Settings e permissões do token preservadas;
- merge commit, squash e rebase preservados;
- auto-merge e exclusão automática de branch preservados como desabilitados.

Resultado agregado da comparação externa: `true`, estado preservado.

## Rollback

**Rollback contingencial executado:** não.

O `PUT` retornou sucesso e o readback provou a única mudança autorizada, sem
drift. Executar rollback nessa condição violaria a autorização.

## Ocorrências locais antes da chamada

Duas ocorrências locais pararam antes de qualquer processo de escrita remota:

1. a primeira orquestração inline excedeu o limite do executor e foi rejeitada
   antes de iniciar o PowerShell;
2. a primeira execução do script transitório encerrou na comparação local do
   snapshot porque `Set-StrictMode` tratou uma lista vazia como `$null` antes
   da linha do `PUT`.

A asserção local foi corrigida, o parser retornou zero erros e toda a janela de
pré-condições foi refeita. O script transitório executado tinha `18155` bytes e
SHA-256
`8fa681212d5e925f603e92af01006be6bf729e196ded3b9363bfe5a5d0d65256`.
Ele foi removido depois da operação. Nenhuma credencial foi gravada nele.

Essas ocorrências não foram chamadas remotas `PUT`. O transcript da execução e
a única nova versão histórica `47244358` são coerentes com exatamente uma
atualização remota aceita.

## Arquivos alterados

- `13-builder-result-corrected-unattributed-approval-fix.md`: este relatório;
- `README.md`: atualização mínima do status e da cronologia da Missão 9.

Nenhum código, teste, workflow, dependência, dado ou outro documento foi
alterado nesta etapa. O script operacional transitório ficou fora do
repositório e foi removido.

## Conformidade de escopo

- exatamente um `PUT` remoto de correção;
- payload mínimo e versão `2022-11-28`;
- nenhuma segunda tentativa, retry ou fallback;
- nenhuma ativação, recriação ou exclusão;
- nenhum rollback, porque não houve drift;
- nenhuma proteção clássica, mudança de workflow, Actions Settings, token,
  merge method, visibilidade ou branch padrão;
- nenhum commit, push, PR, rerun, merge ou publicação;
- nenhuma alteração em código, testes, dependências, dados, Notion, D1, deploy
  ou secrets;
- somente este relatório e a atualização mínima do índice como mudanças
  documentais persistentes desta etapa.

## Limitações e riscos restantes

- o campo continua fora da documentação e do OpenAPI oficiais, embora esta
  operação e o readback tenham comprovado sua aceitação atual neste ruleset;
- o ruleset continua `disabled` e ainda não protege efetivamente a `main`;
- nenhuma validação funcional por PR foi realizada ou autorizada;
- ativação, revisão independente, aceitação humana, commit e publicação
  continuam gates separados.

## Handoff ao Reviewer

O Reviewer independente deve verificar, em somente leitura:

1. a autorização 12 e a contagem de uma única nova versão histórica;
2. ruleset ID `21151016`, `enforcement: disabled` e campo `false`;
3. igualdade estrutural das quatro regras e demais campos;
4. zero regras efetivas, SHA da `main`, ausência de proteção clássica e estado
   externo preservado;
5. captura sanitizada do HTTP `200`, headers, corpo, stderr e hashes;
6. que o rollback não era necessário e não foi executado;
7. que ativação e ações Git continuam sem autorização.

Este relatório não declara a Missão 9 concluída. O Builder para com o ruleset
desabilitado e aguarda revisão independente e decisão da Direção.
