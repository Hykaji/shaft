# Direção: bloqueio antes da ativação

**Data:** 2026-08-21

**Missão:** `mission-09-main-protection`

**Classificação:** Nível 3 - crítico

**Decisão:** ativação bloqueada até tratar o default de aprovação adicional

## Evidência observada

A leitura posterior à criação confirmou que o ruleset remoto `Protect main`, ID
`21151016`, permanece com `enforcement: disabled`, mas o GitHub acrescentou o
campo abaixo à regra de pull request:

```json
"require_extra_approval_for_unattributed_changes": true
```

O campo não fazia parte do plano aprovado. Evidências públicas atuais indicam
que esse default pode exigir uma aprovação para commits que o GitHub não consiga
atribuir a um usuário, mesmo quando `required_approving_review_count` é zero.
Essa evidência deve ser tratada como comunitária, não como documentação oficial.

## Impacto na decisão

O estado remoto atual é seguro porque o ruleset está desabilitado. Entretanto,
ativá-lo com esse campo em `true` pode contrariar o fluxo individual aprovado
para o Shaft, cujo requisito é zero aprovações humanas obrigatórias.

## Direção

Antes de qualquer ativação, o Builder deve investigar e propor uma correção
mínima para definir explicitamente
`require_extra_approval_for_unattributed_changes: false`, mantendo:

- o mesmo ruleset e o mesmo alvo;
- `enforcement: disabled` durante toda a correção;
- todas as demais regras e parâmetros aprovados;
- um readback completo e uma comparação estrutural depois da futura alteração;
- um rollback definido antes da execução.

O plano deve confirmar o suporte do endpoint ao campo, distinguir documentação
oficial de evidência comunitária e comparar o risco de uma alteração mínima com
o de substituir o payload completo.

## Limites desta decisão

Esta decisão não autoriza editar, recriar, excluir ou ativar o ruleset. Também
não autoriza alterações em código, Git local, workflows, banco, autenticação,
deploy ou qualquer outra configuração remota. A próxima entrega é somente um
plano do Builder e a atualização mínima do índice da missão.
