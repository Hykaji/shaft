# Direção: proteção mínima da main

**Data:** 2026-08-21

**Missão:** `mission-09-main-protection`

**Classificação:** Nível 3 - crítico

**Estado:** Investigação autorizada; implementação remota não autorizada

## Objetivo

Transformar a CI aprovada da Missão 8 em uma barreira efetiva para novas
integrações na `main`, mantendo uma rota segura de recuperação e evitando
exigências que dependam de outra pessoa para um repositório pessoal.

## Baseline observado pela Direção

Consulta somente leitura realizada em 2026-08-21:

- repositório público `Hykaji/shaft`;
- permissão atual da conta: `ADMIN`;
- branch padrão `main` no commit `310170674d8de6eac8b2746536470c7e51944ffc`;
- `main` sem proteção clássica e sem rulesets;
- workflow `CI` ativo;
- check exibido no PR como `CI / Lint, build and tests`;
- execução de `push` na `main` `32488539006` aprovada;
- Actions habilitadas para todas as Actions, SHA obrigatório desabilitado;
- merge commit, squash e rebase permitidos;
- exclusão automática de branch após merge desabilitada.

## Resultado desejado

O Builder deve investigar e recomendar a menor configuração capaz de:

- exigir integração por pull request;
- exigir o check correto da CI antes do merge;
- impedir force-push e exclusão da `main`;
- manter nomes e identificadores de check estáveis;
- definir comportamento quando a branch estiver desatualizada;
- preservar uma recuperação administrativa documentada caso a CI ou a regra
  seja configurada incorretamente;
- evitar aprovação obrigatória de outra pessoa nesta fase.

## Decisões a investigar

- ruleset ou proteção clássica, com justificativa e suporte no repositório;
- contexto técnico exato do required check, sem inferir apenas pelo texto da
  interface;
- necessidade e custo de exigir branch atualizada antes do merge;
- tratamento de administradores e bypass, equilibrando proteção contra pushes
  acidentais e recuperação;
- exigência ou não de resolução de conversas;
- interação com merge commit, squash e rebase já permitidos;
- rollback exato e validação posterior sem bloquear a `main`.

## Preferências iniciais, não decisões finais

- zero aprovações humanas obrigatórias enquanto o Shaft tiver direção pessoal;
- sem Code Owners, commits assinados, histórico linear, merge queue ou deploy
  gate nesta primeira proteção;
- sem alteração do workflow, Actions Settings, permissões do token ou política
  global de Actions, salvo novo plano e aprovação;
- sem exigir check que ainda não tenha evidência recente verde.

## Escopo documental futuro a considerar

O plano deve incluir o fechamento factual da Missão 8 já registrado, a entrada
da Missão 9 nos índices e o critério de CI automatizada do roadmap. Não deve
marcar a proteção como concluída antes de a regra ser aplicada e verificada.

## Exclusões

Esta investigação não autoriza alterar branch protection, rulesets, workflow,
repositório, merge methods, código, dados, autenticação, Notion, D1, deploy ou
secrets. Também não autoriza branch, commit, push, PR ou merge.

## Handoff esperado

O Builder deve produzir um plano cronológico com evidências atuais, comparação
das opções, configuração exata proposta, impacto para o fluxo solo, riscos,
rollback, validação e pedido de aprovação. Deve parar antes de qualquer escrita
remota.
