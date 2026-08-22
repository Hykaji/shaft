# Builder plan: proteção mínima da main

**Data:** 2026-08-21

**Missão:** `mission-09-main-protection`

**Classificação:** Nível 3 - crítico

**Papel:** Builder

**Estado:** Aguardando análise e aprovação humana

**Direção revisada:**
[`01-direction-brief-main-protection.md`](01-direction-brief-main-protection.md)

## 1. Objetivo e limite desta fase

Investigar a configuração local e remota atual e propor a menor proteção
recuperável para a `main`: integração somente por pull request, passagem pela
CI da Missão 8, bloqueio de force-push e exclusão e nenhuma dependência de
aprovação de outra pessoa.

Esta fase realizou somente leitura local e remota e criou documentação local.
Não houve mudança de ruleset, proteção clássica, required check, Actions
Settings, método de merge, workflow, branch, commit, push, PR ou outro estado
remoto.

## 2. Fontes e método de investigação

Foram lidos integralmente:

- `AGENTS.md`;
- `docs/agent-workflow.md`;
- `docs/agent-reports/templates/builder-plan.md`;
- os documentos existentes da Missão 9;
- toda a pasta `docs/agent-reports/missions/mission-08-github-ci/`;
- `.github/workflows/ci.yml`;
- `docs/roadmap.md`.

O checkout foi inspecionado com Git somente leitura. O GitHub foi consultado
pela CLI/API somente leitura nos endpoints de repositório, branch, proteção
clássica, rulesets, regras efetivas, workflows, runs, jobs, check-runs,
permissões de Actions e colaboradores. A documentação oficial atual do GitHub
foi usada para comparar rulesets, proteção clássica, required checks, bypass,
planos e cobrança.

## 3. Estado observado

### 3.1 Checkout canônico e preservação documental

- raiz: `D:\Aplicativos\Modo Eixo App`;
- branch atual: `main`;
- `HEAD`: `310170674d8de6eac8b2746536470c7e51944ffc`;
- `origin/main` local: o mesmo SHA;
- remoto: `https://github.com/Hykaji/shaft.git`;
- branch e commit não foram alterados.

Já existiam mudanças documentais não commitadas:

- `docs/agent-reports/README.md`;
- `docs/agent-reports/missions/mission-08-github-ci/README.md`;
- `docs/roadmap.md`;
- `docs/agent-reports/missions/mission-08-github-ci/15-direction-merge-completion.md`;
- os documentos 01 e README da Missão 9.

Elas foram preservadas. Nenhum desses documentos foi revertido, movido ou
reescrito. A única atualização em documento preexistente desta fase é a entrada
cronológica mínima deste plano no README da Missão 9.

### 3.2 Repositório, main e políticas remotas

Consulta realizada em 2026-08-21:

- repositório pessoal e público `Hykaji/shaft`;
- branch padrão: `main`;
- permissão da conta consultada: `ADMIN`;
- lista de colaboradores retornou somente `Hykaji`, com papel `admin`;
- `main`: `310170674d8de6eac8b2746536470c7e51944ffc`;
- `main.protected: false`;
- proteção clássica: ausente; endpoint respondeu `404 Branch not protected`;
- rulesets do repositório: zero;
- regras efetivas sobre `main`: zero;
- PRs abertos: zero;
- merge commit, squash e rebase: habilitados;
- auto-merge e exclusão automática da branch após merge: desabilitados;
- Actions: habilitadas para todas as Actions, sem obrigatoriedade global de
  SHA;
- `GITHUB_TOKEN`: permissão padrão de leitura e sem poder aprovar PRs.

A run de `push` da Missão 8 na `main`, `32488539006`, terminou em `success` no
mesmo SHA. Não foi encontrada alteração de proteção posterior à baseline da
Direção.

### 3.3 Identidade técnica exata do check

O texto composto exibido pela interface é `CI / Lint, build and tests`, mas os
objetos técnicos são separados:

- workflow: `CI`;
- workflow ID: `338958578`;
- caminho: `.github/workflows/ci.yml`;
- job ID no YAML: `quality`;
- `job.name` e `check_run.name`: `Lint, build and tests`;
- check-run da run verde na `main`: `96790524554`;
- check suite: `88068987152`;
- integração/GitHub App: `GitHub Actions`;
- slug da App: `github-actions`;
- `app.id`, usado como `integration_id`: `15368`;
- conclusão observada: `success`.

Portanto, o `context` técnico a exigir é **`Lint, build and tests`**, com
origem esperada na integração **GitHub Actions, ID `15368`**. Não se deve gravar
o texto composto `CI / Lint, build and tests` como `context`: `CI` é o prefixo
visual do workflow, não o nome retornado pelo check-run.

O vínculo com a App reduz o risco de outro usuário ou integração com permissão
de escrita publicar um status homônimo. O nome continua acoplado ao
`jobs.quality.name`; renomear o job ou convertê-lo em matriz deverá ser tratado
como mudança coordenada da CI e do ruleset.

## 4. Ruleset versus proteção clássica

As duas alternativas estão disponíveis para este repositório público mesmo no
GitHub Free. As duas conseguem exigir PR e status check e, por padrão, impedir
force-push e exclusão.

### Proteção clássica

Vantagens:

- configuração conhecida e suficiente para uma única branch;
- menor número de conceitos visíveis na interface;
- bloqueia force-push e exclusão quando as opções de permissão não são
  habilitadas.

Limitações neste repositório pessoal:

- somente uma regra clássica pode prevalecer sobre uma branch;
- administradores ficam fora das restrições por padrão, exigindo marcar
  explicitamente `Do not allow bypassing the above settings` para proteger o
  dono contra push direto acidental;
- listas de atores para bypass de branch protection são limitadas a
  repositórios de organização;
- não possui o estado nomeado `Disabled` de um ruleset para rollback temporário
  preservando a configuração.

### Branch ruleset

Vantagens:

- configuração nomeada, visível e consultável por leitura;
- pode ser criada desabilitada, verificada e depois ativada;
- pode ser desativada temporariamente sem apagá-la;
- bypass é explícito e granular;
- regras efetivas sobre `main` podem ser consultadas pela API;
- a origem esperada do required check pode ser fixada pela integração.

Riscos:

- rulesets se acumulam entre si e com proteção clássica; uma segunda regra
  futura pode impor a variante mais restritiva e causar bloqueio difícil de
  diagnosticar;
- é um mecanismo mais amplo do que a necessidade de uma única branch;
- o painel de insights de rulesets não está disponível no plano Free; isso não
  impede criar, ler, editar, desabilitar ou excluir o ruleset.

### Recomendação

Usar **um único branch ruleset de repositório**, sem proteção clássica em
paralelo. A capacidade de criar desabilitado, inspecionar e ativar, além do
rollback por desativação, torna o ruleset mais recuperável sem ampliar as
regras funcionais.

## 5. Configuração exata recomendada

### 5.1 Identidade, alvo e enforcement

- tipo: branch ruleset do repositório;
- nome: `Protect main`;
- alvo: incluir `Default branch`, atualmente `main`, e nenhuma exclusão;
- enforcement inicial durante preparação: `Disabled`;
- enforcement final, após conferência da configuração: `Active`;
- bypass list: vazia.

Uma bypass list vazia faz as regras alcançarem também a conta administradora no
uso normal. Isso impede que o push direto do próprio dono passe por engano. A
recuperação não depende de bypass permanente: `Hykaji`, como administrador,
continua autorizado a editar, desabilitar ou excluir o ruleset nas
configurações do repositório.

### 5.2 Regras que devem ser habilitadas

1. `Restrict deletions`.
2. `Require a pull request before merging` com:
   - required approvals: `0`;
   - dismiss stale approvals: desabilitado;
   - require Code Owner review: desabilitado;
   - require approval of the most recent reviewable push: desabilitado;
   - require conversation resolution: desabilitado;
   - allowed merge methods: `merge`, `squash` e `rebase`.
3. `Require status checks to pass` com:
   - context: `Lint, build and tests`;
   - expected source: `GitHub Actions`;
   - `integration_id`: `15368`;
   - `Require branches to be up to date before merging`: desabilitado;
   - não dispensar checks na criação da branch.
4. `Block force pushes`.

Representação técnica dos parâmetros relevantes para conferência posterior:

```json
{
  "name": "Protect main",
  "target": "branch",
  "enforcement": "active",
  "bypass_actors": [],
  "conditions": {
    "ref_name": {
      "include": ["~DEFAULT_BRANCH"],
      "exclude": []
    }
  },
  "rules": [
    { "type": "deletion" },
    {
      "type": "pull_request",
      "parameters": {
        "allowed_merge_methods": ["merge", "squash", "rebase"],
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
    { "type": "non_fast_forward" }
  ]
}
```

Esse JSON é uma especificação para conferência e futura implementação
autorizada, não registro de uma chamada executada nesta fase.

### 5.3 Regras que devem permanecer desabilitadas

- restrict creations e restrict updates;
- approvals humanas obrigatórias;
- Code Owners;
- resolução obrigatória de conversas;
- commits assinados;
- histórico linear;
- merge queue;
- deploy gate;
- code scanning ou code quality obrigatório;
- restrições de metadata, nomes, arquivos ou tamanho;
- qualquer bypass de usuário, role, App ou deploy key.

Não alterar Actions Settings, política global de SHA, permissões de token,
workflow, merge methods do repositório, auto-merge ou exclusão automática de
branch.

## 6. PR sem aprovação humana

A regra `Require a pull request before merging` exige que o commit chegue por
uma branch e seja associado a um PR, mas o GitHub permite
`required_approving_review_count: 0`. Assim, o dono pode abrir o PR, aguardar a
CI e fazer o próprio merge sem depender de outra pessoa.

Não se deve habilitar Code Owners, aprovação do último push, dismiss stale
approvals ou required reviewers. Também não se deve exigir resolução de
conversas nesta primeira proteção: além de não acrescentar revisão humana real
no fluxo atual, um comentário esquecido poderia virar bloqueio burocrático.

O PR continua útil para diff, cronologia, check e ponto explícito de merge. Ele
não equivale a revisão independente e não protege contra uma conta
administradora comprometida.

## 7. Branch atualizada antes do merge

Recomenda-se a política **loose**:
`strict_required_status_checks_policy: false`.

Com ela, o check precisa passar no commit exigido do PR, mas a branch não
precisa ser atualizada toda vez que a `main` avança. Isso evita, no fluxo solo:

- clicar em `Update branch`, fazer merge da `main` ou rebasear;
- resolver conflitos apenas para satisfazer a política;
- disparar e aguardar uma CI adicional depois de cada avanço da base;
- recomeçar o ciclo quando dois PRs prontos são integrados em sequência.

Contrapartida: se outro PR alterar a `main` depois da última CI, a combinação
final pode não ter sido testada. O evento de `push` executará CI depois do
merge, mas essa detecção seria tardia. A política strict deve ser reavaliada se
houver PRs concorrentes frequentes, colaboradores, mudanças com alto
acoplamento ou falhas pós-merge por base desatualizada.

## 8. Administradores, bypass e recuperação

### Operação normal

- bypass list vazia;
- a conta `Hykaji` também usa PR e CI;
- nenhum ator recebe push direto, force-push, exclusão ou merge sem check;
- não habilitar `Restrict updates`, pois PR + required check já controlam a
  integração e essa regra poderia transformar qualquer atualização em
  dependência de bypass.

### Recuperação administrativa

O ruleset não remove a permissão do administrador de editar regras. Se a CI ou
a configuração bloquear merges incorretamente:

1. confirmar o SHA da `main`, o ruleset efetivo, o nome do check e a origem da
   App;
2. se somente o check estiver incorreto, editar o ruleset e remover
   temporariamente apenas `required_status_checks`, mantendo PR, exclusão e
   non-fast-forward;
3. se o próprio ruleset estiver incoerente, mudar `enforcement` de `Active`
   para `Disabled`, preservando seu conteúdo para diagnóstico;
4. corrigir a CI ou os parâmetros por PR quando possível;
5. obter uma run verde recente do check correto;
6. restaurar o requisito, reativar o ruleset e repetir a validação objetiva;
7. registrar a janela de exceção e a decisão da Direção.

Não desabilitar o workflow enquanto ele for required check: isso pode deixar o
requisito sem conclusão. Não apagar o ruleset como primeira resposta; desativar
é mais recuperável.

Como o endpoint de colaboradores retornou somente `Hykaji`, não há redundância
administrativa observada. Perda de acesso à conta dependeria da recuperação de
conta do GitHub. Um clone local preserva objetos Git, mas não permite editar as
configurações do repositório remoto; republicar em outro remoto seria último
recurso e mudança de escopo.

## 9. Interação com os métodos de merge

O ruleset deve permitir os três métodos já habilitados no repositório:

- **merge commit:** preserva commits e cria um nó explícito de integração; foi
  o método usado na Missão 8;
- **squash:** gera um commit único na `main`, útil para PRs com checkpoints
  ruidosos;
- **rebase:** reaplica os commits sem merge commit.

PR e required check são compatíveis com os três. Não exigir histórico linear é
necessário para continuar permitindo merge commits. Restringir métodos agora
seria uma decisão de política de histórico sem evidência de necessidade.

## 10. Plano futuro de aplicação segura

Cada item abaixo depende de aprovação humana explícita de escrita remota:

1. registrar novamente SHA da `main`, proteção clássica, rulesets, regras
   efetivas, Actions Settings, merge methods e check-run recente;
2. criar `Protect main` com enforcement `Disabled` e exatamente os parâmetros
   deste plano;
3. ler de volta o ruleset pela API e comparar alvo, bypass e todas as regras;
4. interromper e corrigir ainda desabilitado se houver qualquer divergência;
5. mudar somente o enforcement para `Active`;
6. executar as validações objetivas abaixo;
7. produzir handoff de Builder e revisão independente de Nível 3;
8. aguardar aceitação final da Direção.

Não criar proteção clássica antes, durante ou depois. Rulesets e proteção
clássica se somam; manter os dois criaria uma segunda fonte de bloqueio.

### 10.1 Escopo exato de uma futura implementação aprovada

Configuração remota:

- criar somente o branch ruleset `Protect main` descrito na seção 5;
- fazer somente a transição posterior de `Disabled` para `Active` depois da
  leitura de volta;
- não alterar qualquer outra configuração do repositório.

Documentação cronológica:

- criar o resultado do Builder e atualizar o README desta Missão 9;
- deixar a criação do parecer do Reviewer e das decisões finais para os papéis
  e gates correspondentes;
- acrescentar a Missão 9 ao índice `docs/agent-reports/README.md` sem reescrever
  as entradas existentes;
- atualizar `docs/roadmap.md` somente depois da proteção ativa e verificada,
  para distinguir a suíte automatizada concluída na Missão 8 da exigência de
  PR + CI na `main` concluída na Missão 9;
- preservar o fechamento factual da Missão 8 já registrado em
  `mission-08-github-ci/README.md` e
  `15-direction-merge-completion.md`; não reabrir nem reescrever essa missão.

O roadmap não deve marcar a proteção como concluída na criação desabilitada,
na ativação isolada ou antes da validação e revisão. As mudanças documentais já
presentes no worktree deverão ser comparadas e preservadas no momento de cada
edição futura.

## 11. Validação objetiva depois da aplicação

### Imediata, sem mutação de conteúdo

- `main` conserva o SHA observado imediatamente antes da aplicação;
- ruleset `Protect main` existe uma vez, está `Active`, alvo somente na branch
  padrão e tem bypass list vazia;
- endpoint de regras efetivas de `main` retorna exatamente deletion, pull
  request, required status checks e non-fast-forward;
- branch informa proteção efetiva, enquanto a proteção clássica continua
  ausente;
- required check retorna context `Lint, build and tests` e
  `integration_id: 15368`;
- `strict_required_status_checks_policy` é `false`;
- approvals requeridas são `0` e os três métodos estão permitidos;
- force-push e deletion aparecem bloqueados;
- Actions Settings, workflow, permissões do token e métodos de merge do
  repositório permanecem iguais à baseline;
- nenhum segundo ruleset ou regra clássica foi criado.

### Funcional, em gate remoto separado

No próximo PR normal e explicitamente autorizado:

1. observar que o PR não exige aprovação humana;
2. observar que o merge fica bloqueado enquanto o check está pendente ou
   falho;
3. confirmar que a run vem do workflow `CI`, check-run
   `Lint, build and tests` e App `github-actions` ID `15368`;
4. confirmar que, após sucesso, o PR pode ser integrado sem atualizar a branch
   apenas por política;
5. confirmar nova run de `push` na `main` e preservar seu resultado no
   relatório.

Não testar force-push nem exclusão ao vivo. Esses testes seriam destrutivos, e
um erro de configuração poderia efetivar a operação. A presença das regras
efetivas na API é o critério objetivo para esses dois controles. Também não
fazer um push direto de teste na `main`: se a regra estiver incorreta, o teste
alteraria a branch que pretende proteger.

## 12. Rollback

### Rollback imediato

1. registrar ID e JSON atual do ruleset, motivo e SHA da `main`;
2. alterar somente `enforcement` para `Disabled`;
3. confirmar que não há regras efetivas sobre `main` e que o SHA não mudou;
4. confirmar que a proteção clássica continua ausente e que Actions/workflow e
   merge methods não mudaram;
5. manter o ruleset desabilitado para diagnóstico e decisão da Direção.

### Rollback definitivo

Após análise e aprovação humana, excluir somente o ruleset `Protect main` pelo
ID confirmado. Em seguida, exigir:

- lista de rulesets sem o objeto removido;
- regras efetivas de `main` vazias;
- `main.protected: false`;
- proteção clássica ausente;
- SHA da `main` inalterado.

Desabilitar ou excluir o ruleset não reverte commits já integrados e não
corrige uma CI defeituosa; apenas restaura a baseline de governança remota.

## 13. Custos, plano e limitações

O endpoint autenticado não expôs o nome do plano da conta (`plan: null`), então
esta investigação não afirma se a conta é Free ou Pro. Isso não bloqueia a
decisão: branch rulesets e proteção clássica estão disponíveis em repositórios
públicos pessoais inclusive no GitHub Free.

Para o estado atual:

- criar e aplicar este branch ruleset não acrescenta cobrança;
- runners padrão hospedados pelo GitHub são gratuitos e ilimitados para
  repositórios públicos; o workflow usa `ubuntu-24.04` padrão;
- larger runners continuariam cobrados, mas não são usados nem propostos;
- tornar o repositório privado pode alterar a disponibilidade dessas proteções
  conforme o plano e faria a CI entrar nas cotas/cobrança de minutos e
  armazenamento; visibilidade e plano devem ser revalidados antes dessa
  mudança;
- o painel de insights de rulesets é limitado a GitHub Team/Enterprise, sem
  impacto na leitura das regras e no rollback básico;
- repositório pessoal não possui teams nem rulesets em nível de organização;
- regras dependem da disponibilidade do GitHub e da App GitHub Actions. Uma
  indisponibilidade pode bloquear merge, embora branches locais e branches
  remotas não protegidas possam continuar recebendo trabalho.

## 14. Riscos e requisitos de preservação

- **Context incorreto:** exigir o rótulo visual composto em vez do check-run
  real bloquearia todos os merges. Mitigação: context e integration ID exatos,
  criação desabilitada e leitura de volta.
- **Renome do job:** mudança futura de `jobs.quality.name` quebra o requisito.
  Mitigação: alteração coordenada, run verde recente e gate próprio.
- **Bloqueio administrativo:** sem bypass, uma falha exige editar/desabilitar o
  ruleset. Mitigação: rota documentada, não excluir de início e preservar
  acesso admin.
- **Base desatualizada:** política loose pode permitir combinação não testada.
  Mitigação: reavaliar strict por evidência de concorrência ou falha.
- **Camadas invisíveis:** novo ruleset ou proteção clássica somaria restrições.
  Mitigação: um ruleset único e inspeção de regras efetivas.
- **Dependência externa:** outage de Actions/GitHub pode impedir merge.
  Mitigação: não conceder bypass cotidiano; usar recuperação administrativa
  somente por decisão explícita.
- **Segurança limitada:** PR com zero aprovações garante trilha e CI, não revisão
  humana. Administrador ou conta comprometida ainda pode editar as regras.
- **Mudança de visibilidade/plano:** pode alterar disponibilidade e custos.
  Mitigação: revalidar antes de privatizar ou trocar plano.

## 15. Contrapontos à recomendação

1. Para somente uma branch, proteção clássica seria suficiente e mais familiar;
   o ganho do ruleset é principalmente recuperação e observabilidade.
2. A bypass list vazia aumenta a chance de auto-bloqueio operacional quando CI
   ou context falham; um bypass admin permanente seria mais rápido, mas
   permitiria push direto acidental e enfraqueceria o objetivo.
3. Não exigir branch atualizada reduz runs e conflitos artificiais, mas aceita
   o risco real de a base avançar depois do check.
4. Manter os três métodos de merge evita política nova, mas permite histórico
   misto e resultados diferentes para os commits finais na `main`.
5. Exigir PR para toda alteração acrescenta branch, PR e espera da CI até para
   documentação ou hotfix; esse é o custo mínimo necessário para transformar a
   CI em barreira.
6. Zero aprovações significa que o PR não fornece segunda opinião. A revisão
   independente do protocolo Shaft continua documental e humana, não é
   garantida pelo GitHub.
7. A run de `push` na `main` detecta problemas após o merge; ela não substitui
   strict nem merge queue. Não há evidência atual que justifique adicionar
   essa burocracia.

## 16. Exclusões explícitas

- não alterar ruleset, proteção clássica, required check ou configuração do
  GitHub;
- não alterar Actions Settings, workflow ou merge methods;
- não criar/trocar branch, commit, push, PR, rerun ou merge;
- não alterar código, testes, dependências, lockfiles, dados, Notion, D1,
  deploy ou secrets;
- não propor Code Owners, aprovação humana obrigatória, commits assinados,
  merge queue, deploy gate ou mudança do workflow;
- não marcar a proteção como concluída nesta fase.

## 17. Referências oficiais

- [About rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
- [Available rules for rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)
- [Creating rulesets for a repository](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository)
- [Managing rulesets for a repository](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/managing-rulesets-for-a-repository)
- [About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [REST API endpoints for repository rules](https://docs.github.com/en/rest/repos/rules)
- [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)

## 18. Pedido de aprovação

Solicita-se à Direção somente a análise deste plano e da configuração proposta.
Uma aprovação posterior deve distinguir, no mínimo:

1. autorização para criar o ruleset ainda `Disabled`;
2. conferência e autorização para ativá-lo;
3. validação remota funcional em PR separado;
4. revisão independente e aceitação final.

Nenhuma aprovação deste documento deve ser interpretada como autorização para
branch, commit, push, PR, merge, mudança do workflow ou outra configuração
remota.

**O Builder para aqui, antes de qualquer escrita remota.**
