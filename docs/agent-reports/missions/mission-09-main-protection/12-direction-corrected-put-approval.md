# Direção: aprovação da nova tentativa com serialização corrigida

**Data:** 2026-08-21

**Missão:** `mission-09-main-protection`

**Classificação:** Nível 3 - crítico

**Decisão:** autorizada uma única nova tentativa de `PUT`, sem ativação

## Aprovação humana explícita

A Direção aprovou o plano
[`11-builder-plan-invalid-request-diagnosis.md`](11-builder-plan-invalid-request-diagnosis.md)
e autorizou:

1. uma única nova chamada `PUT` ao ruleset `Protect main`, ID `21151016`;
2. payload mínimo com `enforcement: disabled` e `rules` validado como array;
3. definir
   `require_extra_approval_for_unattributed_changes` como `false`;
4. captura sanitizada do status HTTP, headers relevantes, corpo, stderr e exit
   code;
5. um único rollback contingencial somente após sucesso com drift comprovado.

A ativação continua expressamente não autorizada.

## Evidência aceita pela Direção

O diagnóstico recuperou a chamada anterior e demonstrou que o PowerShell 5.1
serializou `rules` como objeto `{value, Count}`. A Direção reproduziu
independentemente esse comportamento no PowerShell 5.1. O contrato do endpoint
exige um array. A nova tentativa deve corrigir somente essa falha demonstrada,
sem mudar simultaneamente cliente, endpoint ou versão da API.

## Condições vinculantes antes da escrita

- Reler e validar integralmente todas as pré-condições da seção correspondente
  do plano 11.
- Usar o mesmo endpoint e `X-GitHub-Api-Version: 2022-11-28`.
- Construir o payload a partir do readback atual, com somente `enforcement` e
  as quatro regras no topo.
- Validar os bytes finais exatos que serão enviados: JSON UTF-8 válido,
  `enforcement` literalmente `disabled`, `rules` como array de quatro itens e
  ausência das chaves `value` e `Count`.
- Comprovar por comparação estrutural que a única mudança intencional é o
  booleano de `true` para `false`.
- Registrar representação sanitizada, comprimento e hash do payload sem expor
  token, cookies, ambiente ou header de autorização.
- Se qualquer pré-condição ou asserção falhar, parar sem executar o `PUT`.

## Execução e captura

- Fazer exatamente uma chamada de atualização, sem retry, fallback ou
  reformulação automática.
- Usar captura controlada equivalente à proposta do plano, com `--include` e
  separação de stdout e stderr.
- Preservar de forma sanitizada exit code, status HTTP, corpo completo e apenas
  os headers permitidos pelo plano.
- Não usar `--verbose` nem `GH_DEBUG=api` por padrão.
- Após qualquer resposta, executar somente os readbacks previstos e comparar o
  estado integral.

## Condições de parada e rollback

- Resposta não `2xx`: fazer readback de preservação e parar. Não há rollback
  nem segunda tentativa.
- Sucesso com somente a mudança autorizada: manter `disabled`, registrar e
  parar para revisão.
- Sucesso com drift comprovadamente causado pela chamada: executar no máximo um
  rollback com o snapshot configurável anterior, mantendo `disabled`, fazer o
  readback final e parar.
- Falha ou divergência no rollback: parar e escalar. Não tentar novamente,
  recriar, excluir ou ativar o ruleset.

## Entrega obrigatória

O Builder deve criar
`13-builder-result-corrected-unattributed-approval-fix.md` e atualizar
minimamente o índice desta missão. O relatório deve registrar precondições,
payload sanitizado, hashes, resposta sanitizada, snapshots, comparação
estrutural, histórico/version ID e se houve rollback.

## Limites preservados

Não alterar proteção clássica, workflow, Actions Settings, token, métodos de
merge, visibilidade, branch padrão, código, testes, dependências, dados,
Notion, D1, deploy ou secrets. Não criar branch, commit, push, PR, rerun, merge
ou publicação.

O resultado exigirá análise da Direção e nova revisão independente antes de
qualquer discussão ou autorização de ativação.
