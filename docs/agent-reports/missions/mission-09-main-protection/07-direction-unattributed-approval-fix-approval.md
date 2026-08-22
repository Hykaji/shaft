# Direção: aprovação da correção de aprovação não atribuída

**Data:** 2026-08-21

**Missão:** `mission-09-main-protection`

**Classificação:** Nível 3 - crítico

**Decisão:** plano aprovado para uma única correção remota mínima

## Aprovação humana explícita

A Direção aprovou o plano
[`06-builder-plan-unattributed-approval.md`](06-builder-plan-unattributed-approval.md)
e autorizou:

1. uma única chamada `PUT` mínima ao ruleset `Protect main`, ID `21151016`;
2. definir
   `require_extra_approval_for_unattributed_changes` explicitamente como
   `false`;
3. manter `enforcement: disabled` na chamada, na resposta e no readback;
4. executar todas as pré-condições, comparações estruturais e condições de
   parada definidas no plano;
5. executar um único rollback contingencial somente se o `PUT` for aceito e
   causar alguma alteração não prevista.

## Condições vinculantes

- O Builder deve reler integralmente o estado remoto imediatamente antes da
  escrita e parar se qualquer pré-condição do plano divergir.
- O payload mínimo deve conter apenas `enforcement: disabled` e o array
  completo de regras, com a única mudança intencional de `true` para `false`.
- Não há autorização para segunda tentativa, payload completo como fallback,
  recriação, exclusão ou mudança de ID.
- Um erro `4xx` ou `5xx` exige readback e parada, sem nova escrita.
- O rollback contingencial só pode ocorrer após resposta de sucesso quando o
  readback provar drift causado pela operação. Ele deve restaurar exatamente o
  snapshot imediatamente anterior e manter o ruleset desabilitado.
- Após sucesso ou rollback, o Builder deve reler o ruleset, lista de rulesets,
  regras efetivas, branch, proteção clássica, workflow e configurações externas
  previstas no plano.

## Entrega obrigatória

O Builder deve criar o relatório cronológico
`08-builder-result-unattributed-approval-fix.md` e atualizar minimamente este
índice. O relatório deve preservar os snapshots anterior e posterior, a
resposta do endpoint, a comparação estrutural, o histórico/version ID e se o
rollback contingencial foi ou não necessário.

## Limites preservados

A ativação continua expressamente não autorizada. Esta aprovação não autoriza
alterar proteção clássica, workflow, Actions Settings, token, métodos de merge,
visibilidade, branch padrão, código, testes, dependências, dados, Notion, D1,
deploy, secrets, branch Git, commit, push, PR, rerun, merge ou publicação.

Depois da entrega do Builder, a correção ainda exige análise da Direção e
revisão independente antes de qualquer discussão sobre ativação.
