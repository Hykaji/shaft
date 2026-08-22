# Direção: aprovação do plano e criação desabilitada

**Data:** 2026-08-21

**Missão:** `mission-09-main-protection`

**Classificação:** Nível 3 - crítico

**Decisão:** Plano aprovado; criação do ruleset desabilitado autorizada

## Decisão humana

A Direção analisou
[`02-builder-plan-main-protection.md`](02-builder-plan-main-protection.md) e o
usuário declarou explicitamente: “Aprovo o plano da Missão 9 e autorizo criar
apenas o ruleset Protect main em estado Disabled”.

## Escopo remoto autorizado

O Builder pode criar exatamente um branch ruleset no repositório
`Hykaji/shaft`:

- nome: `Protect main`;
- alvo: somente `~DEFAULT_BRANCH`;
- enforcement: `disabled`;
- bypass list: vazia;
- regras e parâmetros: exatamente os definidos na seção 5 do plano aprovado.

A criação desabilitada não deve produzir regras efetivas sobre a `main`.

## Validação obrigatória

Após a criação, o Builder deve ler o ruleset de volta pela API e comparar
integralmente nome, target, enforcement, bypass, condições e regras. Também
deve confirmar:

- SHA da `main` inalterado;
- ruleset único e desabilitado;
- regras efetivas de `main` ainda vazias;
- proteção clássica ausente;
- workflow, Actions Settings, permissões e métodos de merge preservados.

Qualquer divergência exige parada imediata; não deve ser corrigida por ativação,
segundo ruleset ou proteção clássica.

## Condição de visibilidade e plano

Esta autorização considera o repositório público no estado observado. Se a
visibilidade mudar para privada antes da criação ou validação, o Builder deve
parar e retornar à Direção para revalidar a disponibilidade do recurso no plano
da conta.

## Limites ainda não autorizados

Não está autorizada a transição para `active`, nem alteração posterior do
ruleset, proteção clássica, mudança de visibilidade, workflow, Actions Settings,
merge methods, branch, commit, push, PR, merge, código, dados, Notion, D1,
deploy ou secrets.

Após o relatório do Builder, a ativação dependerá de nova análise e aprovação
humana explícita.
