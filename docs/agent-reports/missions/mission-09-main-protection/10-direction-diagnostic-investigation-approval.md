# Direção: autorização da investigação diagnóstica

**Data:** 2026-08-21

**Missão:** `mission-09-main-protection`

**Classificação:** Nível 3 - crítico

**Decisão:** autorizada investigação diagnóstica estritamente sem escrita remota

## Aceitação do parecer

A Direção aceita o parecer independente
[`09-reviewer-review-unattributed-approval-fix.md`](09-reviewer-review-unattributed-approval-fix.md):
a tentativa autorizada foi encerrada de forma segura e o estado remoto foi
preservado, mas o objetivo de definir o campo como `false` não foi alcançado.

Essa aceitação não conclui a Missão 9 e não aceita a correção como funcional.

## Objetivo autorizado

O Builder pode investigar a causa do `gh: Invalid request.` e preparar um novo
plano diagnóstico. A investigação deve separar claramente:

- fatos demonstráveis sobre a chamada anterior;
- limitações causadas pela ausência do status HTTP e corpo de resposta;
- validação local da serialização e do payload;
- contrato oficial documentado do endpoint;
- comportamento empírico ou evidência comunitária, devidamente rotulada;
- hipóteses ainda não comprovadas;
- opções futuras, riscos e evidências necessárias para escolher entre elas.

## Atividades permitidas

- leitura integral dos documentos 01 a 10 da missão;
- inspeção somente leitura do estado local e remoto;
- consulta a documentação oficial, OpenAPI, ajuda e código-fonte público;
- inspeção de histórico ou transcript local disponível, sem expor tokens ou
  outros segredos;
- reconstrução e validação estritamente local da forma do comando e do JSON;
- comparação entre payload mínimo, payload configurável completo, versões da
  API e outras alternativas, sem executar nenhuma delas remotamente;
- criação do plano diagnóstico e atualização mínima do índice da missão.

## Limites vinculantes

- Não executar `PUT`, `PATCH`, `POST` ou `DELETE` contra o GitHub.
- Não repetir, simular contra o recurso real ou reformular a atualização.
- Não usar interface web para salvar ou aplicar configurações.
- Não ativar, recriar, excluir ou editar o ruleset.
- Não executar rollback.
- Não alterar proteção clássica, workflow, Actions Settings, token, métodos de
  merge, visibilidade ou branch padrão.
- Não alterar código, testes, dependências, dados, Notion, D1, deploy ou
  secrets.
- Não criar branch, commit, push, PR, rerun, merge ou publicação.

## Entrega

O Builder deve criar somente
`11-builder-plan-invalid-request-diagnosis.md` e atualizar minimamente o
`README.md` desta missão.

O plano deve explicar como uma eventual futura tentativa preservaria de forma
sanitizada o status HTTP, headers relevantes e corpo completo da resposta,
sem registrar credenciais. Nenhuma futura tentativa está autorizada por esta
decisão.

## Gates preservados

Qualquer nova escrita remota, rollback, validação funcional ou ativação exige
novo plano, análise da Direção e aprovação humana explícita.
