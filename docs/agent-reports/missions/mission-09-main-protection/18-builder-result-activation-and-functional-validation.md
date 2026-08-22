# Builder result: ativação e validação funcional da proteção da main

**Data:** 2026-08-22

**Missão:** `mission-09-main-protection`

**Papel:** Builder

**Classificação:** Nível 3 - crítico

**Plano aprovado:**
[`16-builder-plan-activation-and-functional-validation.md`](16-builder-plan-activation-and-functional-validation.md)

**Registro inicial da Direção:**
[`17-direction-activation-and-functional-validation-approval.md`](17-direction-activation-and-functional-validation-approval.md)

**Status:** Ready for review

## Outcome

Os Gates 1 a 9 do plano 16 foram executados mediante autorizações humanas
separadas. A branch documental foi criada, recebeu um único checkpoint, foi
publicada sem force, e serviu como veículo não destrutivo para validar o
ruleset ativo, o required check e a ausência de aprovação obrigatória.

O ruleset `Protect main`, ID `21151016`, está `active`; suas quatro regras estão
efetivas sobre a `main`. O PR nº 3 está aberto, ready, verde, sem reviews ou
aprovações, e o GitHub o apresenta como mergeável e limpo. Nenhum rollback foi
necessário.

Este resultado conclui somente a implementação e a validação funcional sob
responsabilidade do Builder. A missão ainda depende de revisão independente,
aceitação humana e autorização específica para qualquer merge ou publicação
posterior.

## Decisões humanas e autorizações

O documento 17 aprovou exclusivamente os Gates 1 a 3: inventário Git,
criação da branch local e checkpoint commit nos 22 caminhos enumerados. Ele
não autorizou push, ativação, PR, CI, mudança para ready ou merge.

Depois do documento 17, a Direção concedeu autorizações explícitas e separadas
para:

- Gate 4: push seguro da branch e readback remoto;
- Gates 5 e 6: ativação mínima do ruleset, readback integral e rollback apenas
  como contingência;
- Gates 7 e 8: criação do PR inicialmente draft e observação exclusiva da run
  automática original da CI;
- Gate 9: retirada do modo draft e consulta da mergeabilidade;
- Gate 10: criação deste relatório e atualização mínima do README da missão.

Nenhuma dessas decisões posteriores reescreve ou amplia retroativamente a
autorização registrada no documento 17.

## Files changed

- `18-builder-result-activation-and-functional-validation.md`: registra as
  decisões, evidências, validações, riscos e o handoff do Builder;
- `README.md`: acrescenta este documento ao registro cronológico e atualiza o
  estado factual da missão sem declarar conclusão ou aceitação.

Nenhum outro caminho faz parte do Gate 10.

## Scope compliance

O checkpoint autorizado foi criado no commit
`ed38dc5e54173a6a2aaa1b7cac88238c055d7ce6`, com parent
`310170674d8de6eac8b2746536470c7e51944ffc`, na branch
`codex/mission-09-main-protection-validation`. A branch local e a branch remota
apontam para o mesmo checkpoint.

O push do Gate 4 foi executado sem force e com configuração de upstream. O
readback confirmou a branch remota exatamente no SHA do checkpoint. Não houve
push direto, tentativa de push direto, force-push ou refspec para a `main`.

Nos Gates 5 e 6, a única mudança configurável do ruleset foi
`enforcement: disabled` → `active`, por payload mínimo contendo somente
`enforcement`. Nome, ID, target, condições, bypass e regras foram preservados.
O readback não encontrou drift e, por isso, o rollback contingencial não foi
executado.

Nos Gates 7 a 9, foi criado um único PR draft, observada somente a execução
automática original da CI e, após autorização própria, o PR foi tornado ready.
Não houve rerun, review, aprovação ou merge.

## Evidência observada

### Git e branches

- checkpoint: `ed38dc5e54173a6a2aaa1b7cac88238c055d7ce6`;
- branch local e remota:
  `codex/mission-09-main-protection-validation`;
- upstream local:
  `origin/codex/mission-09-main-protection-validation`;
- readback remoto da branch: mesmo SHA do checkpoint;
- `main`: preservada em
  `310170674d8de6eac8b2746536470c7e51944ffc`;
- worktree: limpo imediatamente antes da criação deste relatório.

### Ruleset e proteção efetiva

- único ruleset: `Protect main`, ID `21151016`;
- transição autorizada: `enforcement: disabled` → `active`;
- versão ativa: `47289546`;
- `require_extra_approval_for_unattributed_changes: false`;
- quatro regras configuradas e quatro regras efetivas:
  `deletion`, `pull_request`, `required_status_checks` e
  `non_fast_forward`;
- `bypass_actors: []` e `current_user_can_bypass: never`;
- proteção clássica ausente: endpoint clássico respondeu `HTTP 404`;
- `main.protected: true`;
- nenhum rollback necessário.

### Pull request

- PR: [nº 3](https://github.com/Hykaji/shaft/pull/3);
- estado: aberto e ready (`isDraft: false`);
- base: `main` em
  `310170674d8de6eac8b2746536470c7e51944ffc`;
- head: `codex/mission-09-main-protection-validation` em
  `ed38dc5e54173a6a2aaa1b7cac88238c055d7ce6`;
- título: `docs: checkpoint missions 8 and 9 governance`;
- corpo: `Publishes the accepted Mission 8 closure and the Mission 9 governance history. This PR is also the authorized, non-destructive validation vehicle for the active main ruleset.`;
- diff: exatamente 22 arquivos e nenhum caminho não documental;
- ciclo autorizado: criado inicialmente como draft no Gate 7 e tornado ready
  somente no Gate 9;
- reviews: zero;
- aprovações: zero;
- `reviewDecision`: ausente/não requerida;
- API REST: `mergeable: true` e `mergeable_state: clean`;
- GraphQL: `mergeable: MERGEABLE` e `mergeStateStatus: CLEAN`.

### CI e required check

- run original: [32547234293](https://github.com/Hykaji/shaft/actions/runs/32547234293),
  run nº 5;
- evento: `pull_request`;
- tentativa: `1`;
- head SHA: `ed38dc5e54173a6a2aaa1b7cac88238c055d7ce6`;
- único job/check: `Lint, build and tests`;
- App: GitHub Actions, ID de integração `15368`;
- ambiente confirmado nos logs: Node `22.18.0`;
- instalação: `npm ci --no-audit --no-fund`, 472 pacotes instalados;
- lint: aprovado;
- build: concluído;
- testes: 57 executados, 57 aprovados;
- falhas: zero;
- cancelamentos: zero;
- skips: zero;
- reruns: zero;
- status rollup: `COMPLETED` / `SUCCESS`.

## Validation performed

- releitura integral de `AGENTS.md`, `docs/agent-workflow.md`, template de
  resultado do Builder, README da missão e documentos 16 e 17;
- readback local de branch, HEAD, upstream e worktree;
- readback remoto de `main` e da branch de validação;
- readback do ruleset, lista de rulesets, histórico, versão ativa, regras
  efetivas e endpoint de proteção clássica;
- readback REST e GraphQL do PR, arquivos, reviews e status rollup;
- readback da run, job, steps, check-run e logs da CI;
- validação dos links Markdown locais deste relatório e do README atualizado;
- `git diff --check`;
- confirmação final de exatamente dois caminhos modificados no worktree.

## Known limitations and remaining risks

### Limitações bloqueantes

Nenhuma limitação bloqueante foi encontrada para iniciar a revisão
independente.

### Riscos e observações não bloqueantes

- este relatório e a atualização do README são mudanças locais posteriores ao
  checkpoint e não fazem parte do PR nº 3;
- não há autorização para staging, commit ou push desta documentação;
- o ruleset permanece ativo enquanto aguarda revisão; qualquer mudança remota
  posterior exige novo readback;
- se a `main` avançar antes de uma futura decisão de merge, atualizar ou
  rebasear a branch constituirá novo commit, push e CI e exigirá autorização
  própria;
- merge, exclusão da branch e publicação final continuam pendentes de gates
  separados.

### Decisões futuras

- Reviewer independente deve emitir um dos vereditos previstos no workflow;
- a Direção decidirá separadamente sobre aceitação humana;
- eventual merge exige autorização explícita própria e não pode usar bypass
  administrativo, auto-merge ou exclusão automática da branch;
- a publicação desta documentação local também exige autorização própria.

## Builder conclusion

A implementação e a validação funcional previstas nos Gates 1 a 9 foram
concluídas sem drift, rollback ou ação destrutiva. A proteção da `main` está
ativa e o PR de validação demonstrou o required check e a mergeabilidade sem
aprovação humana artificial.

Esta é uma conclusão técnica do Builder, não uma declaração de missão
concluída, parecer independente ou aceitação humana.

## Reviewer handoff

O Reviewer deve iniciar em somente leitura e verificar independentemente:

1. o plano 16, o limite original do documento 17 e a separação das
   autorizações posteriores;
2. os SHAs da `main`, do checkpoint e das branches local/remota;
3. o ruleset `21151016`, a versão `47289546`, o campo adicional `false`, o
   bypass vazio, as quatro regras configuradas/efetivas e a ausência de
   proteção clássica;
4. o PR nº 3, seu diff exclusivamente documental, zero reviews/aprovações,
   status rollup e mergeabilidade;
5. a run original `32547234293`, tentativa 1, App `15368`, Node `22.18.0` e os
   resultados de instalação, lint, build e 57/57 testes;
6. a ausência de rerun, rollback, push direto para `main`, merge, exclusão de
   branch ou publicação final;
7. o diff local deste Gate 10, limitado a este relatório e ao README da missão.

O Builder entrega este resultado como **Ready for review** e para antes de
staging, commit, push, review, aprovação, merge ou qualquer nova alteração
remota.
