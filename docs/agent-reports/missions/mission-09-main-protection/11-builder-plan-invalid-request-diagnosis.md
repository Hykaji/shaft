# Builder plan: diagnóstico de `Invalid request`

**Data:** 2026-08-21

**Missão:** `mission-09-main-protection`

**Papel:** Builder

**Classificação:** Nível 3 - crítico

**Status:** diagnóstico concluído; aguarda análise e decisão humana, sem escrita
remota autorizada

## Objetivo

Diagnosticar a rejeição `gh: Invalid request.` registrada em
[`08-builder-result-unattributed-approval-fix.md`](08-builder-result-unattributed-approval-fix.md),
delimitar o que está comprovado e preparar os controles de uma eventual decisão
futura. Este documento não autoriza nova tentativa nem qualquer alteração no
ruleset.

## Escopo executado nesta investigação

Foram feitas somente:

- leitura de `AGENTS.md`, `docs/agent-workflow.md`, dos documentos 01 a 10 e do
  índice da missão;
- inspeção local de transcript, histórico, executáveis e serialização;
- consulta à documentação, ao OpenAPI e ao código-fonte públicos oficiais;
- uma leitura remota por `GET` do ruleset `Protect main`, ID `21151016`.

Não houve `PUT`, `PATCH`, `POST`, `DELETE`, alteração pela interface web,
rollback, commit, push, PR, rerun, merge ou publicação.

## Resultado diagnóstico

A causa primária demonstrável está na serialização local do payload. No
PowerShell 5.1, a construção usada na tentativa anterior converteu a coleção de
regras em um objeto que, depois de `ConvertTo-Json`, produziu esta forma:

```json
{
  "enforcement": "disabled",
  "rules": {
    "value": ["quatro regras omitidas aqui"],
    "Count": 4
  }
}
```

O contrato oficial exige que `rules` seja um array. Portanto, embora o corpo
fosse JSON sintaticamente válido e contivesse o booleano pretendido como
`false`, sua estrutura não correspondia ao endpoint.

O `gh api --input -` não fez validação de schema: recebeu o stdin e realizou a
requisição HTTP. A frase `Invalid request.` não existe como mensagem fixa no
código do GitHub CLI 2.97.0; ela é impressa após o CLI analisar uma resposta de
erro HTTP. Assim, ficaram distintos dois pontos:

1. o defeito que originou o corpo inválido ocorreu no cliente, durante a
   serialização feita pelo script PowerShell;
2. a rejeição desse corpo ocorreu no servidor GitHub e retornou ao `gh` como
   resposta HTTP de erro.

O status HTTP exato, os headers e o corpo integral da resposta anterior não
podem ser recuperados do registro disponível. A documentação lista `422` para
erro de validação, mas atribuir esse status à tentativa anterior seria apenas
uma hipótese.

## Evidências locais comprovadas

### Recuperação da tentativa anterior

O transcript local foi localizado em:

`D:\Desenvolvimento\CodexHome\sessions\2026\08\21\rollout-2026-08-21T12-15-32-01a024e4-3a4a-75b0-bc60-f97224c88e26.jsonl`

- sessão: `01a024e4-3a4a-75b0-bc60-f97224c88e26`;
- chamada: `call_j4ykXAFzT4nYNJDHN6YHopVN`;
- comando registrado na linha 434, em `2026-08-21T16:32:24.478Z`;
- resultado associado na linha 436, em `2026-08-21T16:32:31.139Z`;
- o comando recuperado não contém `Authorization`, `Bearer`, `GH_TOKEN` ou
  `GITHUB_TOKEN`; a autenticação ficou implícita no `gh`;
- SHA-256 do texto integral e sanitizado da entrada registrada:
  `ef08f2a6707025788abc665fc188da3d5853eb9ff72f7116b73aa86b39903d9f`;
- o histórico PSReadLine atual não contém o endpoint; não foi necessário expor
  outros comandos do histórico.

A chamada efetivamente construída foi:

```powershell
$payloadRules = (($preRuleset.rules | ConvertTo-Json -Depth 100 -Compress) |
  ConvertFrom-Json)
$payloadRules[1].parameters.require_extra_approval_for_unattributed_changes = $false
$payload = [ordered]@{
  enforcement = 'disabled'
  rules = $payloadRules
}
$payloadJson = $payload | ConvertTo-Json -Depth 100 -Compress
$putRaw = $payloadJson | & gh api --method PUT `
  -H "X-GitHub-Api-Version: 2022-11-28" `
  'repos/Hykaji/shaft/rulesets/21151016' --input - 2>&1
```

O resultado preservado foi somente `gh.exe : gh: Invalid request.`, seguido da
representação de `NativeCommandError` do PowerShell. Não há no transcript o
status HTTP, os headers ou conteúdo adicional da resposta.

### Reprodução estritamente local da serialização

A reconstrução usou o snapshot documentado no relatório 08 e a mesma sequência
de operadores, sem chamar o GitHub. No ambiente observado:

- PowerShell `5.1.19041.7663`;
- `$OutputEncoding` em US-ASCII (`20127`);
- GitHub CLI `2.97.0 (2026-07-31)`, observado no mesmo transcript às
  `2026-08-21T17:07:32Z`, cerca de 35 minutos depois da tentativa; a versão não
  foi registrada imediatamente antes do `PUT`, mas não há evidência de troca do
  binário nesse intervalo;
- payload serializado com 673 caracteres e SHA-256
  `616a2b2727101263c1a373ee8092ec2f2f54610a3ee2362656f4b5adb4306d33`.

Um processo local substituiu o executável remoto apenas para capturar argv e
stdin. Isso comprovou:

- argv: `api --method PUT -H "X-GitHub-Api-Version: 2022-11-28"
  repos/Hykaji/shaft/rulesets/21151016 --input -`;
- stdin com 675 bytes, terminando em quebra de linha, e SHA-256
  `88bb5200edd2a499a523c7eddab9c7e03f5026a841aee673308f9ababad55d76`;
- decodificação UTF-8 íntegra e JSON sintaticamente válido;
- `enforcement` igual a `disabled`;
- `rules` como objeto com as chaves `value` e `Count`, não como array;
- quatro regras dentro de `rules.value` e o campo pretendido igual a `false`;
- nenhum caractere não ASCII, eliminando a codificação US-ASCII como causa
  desta rejeição específica.

A validação anterior comparou a coleção em memória antes de serializá-la. Ela
não reabriu os bytes finais e, por isso, não detectou que `ConvertTo-Json`
mudaria a forma estrutural de `rules`.

### Estado remoto atual por leitura

O `GET` feito em 2026-08-21 confirmou:

- ID `21151016` e nome `Protect main`;
- `target: branch`;
- `enforcement: disabled`;
- quatro regras;
- `require_extra_approval_for_unattributed_changes: true`;
- `required_reviewers` vazio.

O ruleset continua desativado e a correção funcional permanece pendente.

## Contrato oficial e comportamento do cliente

### Documentação REST e OpenAPI oficiais

A documentação oficial do endpoint
[`PUT /repos/{owner}/{repo}/rulesets/{ruleset_id}`](https://docs.github.com/en/rest/repos/rules#update-a-repository-ruleset)
e os OpenAPI oficiais
[`2022-11-28`](https://github.com/github/rest-api-description/blob/main/descriptions/api.github.com/api.github.com.2022-11-28.json)
e
[`2026-03-10`](https://github.com/github/rest-api-description/blob/main/descriptions/api.github.com/api.github.com.2026-03-10.json)
foram comparados.

Nas duas versões:

- `name`, `target`, `enforcement`, `bypass_actors`, `conditions` e `rules`
  aparecem como propriedades superiores opcionais da atualização;
- `rules` tem tipo `array` de `repository-rule`;
- para uma regra `pull_request`, `type` é obrigatório;
- dentro de `parameters`, são obrigatórios
  `dismiss_stale_reviews_on_push`, `require_code_owner_review`,
  `require_last_push_approval`, `required_approving_review_count` e
  `required_review_thread_resolution`;
- `allowed_merge_methods`, `dismissal_restriction` e `required_reviewers`
  também são descritos, mas não são obrigatórios;
- `require_extra_approval_for_unattributed_changes` não aparece no OpenAPI nem
  na documentação textual;
- as respostas documentadas são `200`, `404`, `422` e `500`.

O schema não marca `additionalProperties: false` nos parâmetros da regra. Isso
significa que o OpenAPI não proíbe expressamente propriedades adicionais, mas
também não constitui garantia oficial de que esse campo não documentado será
aceito pelo endpoint.

### GitHub CLI oficial

O manual oficial do [`gh api`](https://cli.github.com/manual/gh_api) define que
`--input -` lê um corpo preconstruído do stdin; `--include` inclui status e
headers da resposta; e `--verbose` inclui detalhes de requisição e resposta.

No código-fonte oficial do
[`gh api` 2.97.0](https://github.com/cli/cli/blob/v2.97.0/pkg/cmd/api/api.go),
o arquivo informado por `--input` — stdin neste caso — é encaminhado como
`requestBody`. O tratamento de `Invalid request.` ocorre depois de existir uma
resposta HTTP de erro. Quando a resposta JSON traz `errors` como string sem
`message`, o CLI pode imprimir somente essa string, sem anexar `(HTTP n)`.

O `GH_DEBUG=api` também pode registrar tráfego HTTP, conforme a
[`documentação de ambiente`](https://cli.github.com/manual/gh_help_environment),
mas amplia o risco de captura excessiva. Não é a opção recomendada para uma
futura tentativa.

## Evidências comunitárias, separadas do contrato oficial

As referências comunitárias já catalogadas no plano 06 permanecem úteis, mas
não mudam o status não documentado do campo:

- [issue `electron/governance#2860`](https://github.com/electron/governance/issues/2860)
  e [PR `electron/governance#2861`](https://github.com/electron/governance/pull/2861)
  relatam que o GitHub honrou o valor `false` em outro repositório;
- o [ruleset público `electron/electron` ID
  `12916979`](https://api.github.com/repos/electron/electron/rulesets/12916979)
  expõe o campo como `false` em leitura;
- a implementação pública do
  [Mainstay](https://github.com/vergil-repos/vergil/blob/main/packages/mainstay/src/ruleset.ts)
  usa o campo em um payload configurável completo.

Esses casos demonstram comportamento empírico fora do Shaft. Eles não provam
que o endpoint aceitará o payload pretendido neste repositório, nesta versão da
API ou com uma atualização parcial.

## Classificação das conclusões

### Fatos comprovados

- O comando anterior foi recuperado e não contém credenciais.
- O payload final tinha `rules` como objeto `{value, Count}`.
- O contrato oficial exige `rules` como array.
- O JSON era sintaticamente válido; argv, stdin e o booleano `false` chegaram
  à etapa local esperada.
- O GitHub CLI encaminhou o stdin e exibiu erro derivado de uma resposta HTTP.
- O ruleset não mudou e permanece `disabled`, com o campo ainda igual a `true`.

### Inferência fortemente sustentada

- A forma incorreta de `rules` é causa suficiente para a rejeição por
  validação e é a explicação primária do `Invalid request.` observado.

### Hipóteses ainda não comprovadas

- O status anterior provavelmente foi `422`; ele não foi preservado.
- Mesmo com `rules` como array, o campo não documentado pode ser rejeitado.
- A versão `2022-11-28`, a atualização parcial ou defaults retornados apenas no
  `GET` podem influenciar uma tentativa corrigida.
- Um payload configurável completo pode ter comportamento diferente do payload
  mínimo.

### Pontos inconclusivos

- O corpo integral e os headers da resposta anterior.
- Se o servidor encontrou somente a forma errada de `rules` ou também rejeitou
  outros aspectos.
- Se o payload estruturalmente correto seria aceito atualmente no Shaft.

## Alternativas para uma eventual decisão futura

Nenhuma alternativa abaixo foi executada ou está autorizada.

### A. Manter o `gh`, a versão e o payload mínimo; corrigir a serialização

Projetar `rules` explicitamente como array de objetos, serializar uma vez e
validar os bytes finais. É a alternativa de menor mudança e melhor atribuição
causal: preserva cliente, versão `2022-11-28`, endpoint e escopo já aprovados.
Continua existindo o risco do campo não documentado.

### B. Usar a versão atual `2026-03-10`

Alinha a chamada à versão atualmente destacada na documentação, mas mudaria
simultaneamente serialização e versão. Isso piora a capacidade de atribuir o
resultado e não faz o campo aparecer no OpenAPI.

### C. Enviar o payload configurável completo

Pode se aproximar dos exemplos comunitários e tornar explícitos `name`,
`target`, `bypass_actors` e `conditions`, além de `enforcement` e `rules`.
Entretanto, aumenta a superfície de drift e o custo da comparação. Só deve ser
considerado se houver evidência de que a atualização parcial não é aceita.

### D. Trocar o cliente HTTP

Um cliente direto poderia facilitar a captura de status, headers e corpo, mas
mudaria também o transporte e aumentaria o cuidado necessário com autenticação.
O `gh` já permite a captura necessária; trocar de cliente não é justificado
pela evidência atual.

### E. Interface web

Permanece excluída. Além de não estar autorizada, reduziria a auditabilidade do
payload e do retorno.

## Plano recomendado para uma eventual tentativa futura

Este é um desenho de controle, não uma autorização de execução.

### 1. Novo gate humano

Exigir análise da Direção e aprovação explícita, separada, para exatamente uma
tentativa. A ativação continua sendo outro gate e não pode fazer parte dela.

### 2. Precondições imediatamente antes da escrita

Fazer um `GET` integral com a versão aprovada e interromper antes do `PUT` se
qualquer condição divergir:

- repositório, ID `21151016`, nome `Protect main` e `target: branch`;
- `enforcement: disabled`;
- campo ainda igual a `true`;
- regras, condições e bypasses estruturalmente iguais ao baseline aprovado;
- ausência de regra efetiva e de alteração concorrente;
- identidade autenticada, permissão, endpoint e versão da API esperados;
- snapshot integral e projeção configurável preservados em memória para
  comparação e eventual rollback.

### 3. Construção e validação local dos bytes finais

Construir o payload mínimo somente com:

- `enforcement: disabled`;
- `rules` como array das quatro regras atuais, com a única alteração do campo
  para `false`.

Antes de qualquer rede, validar sobre os exatos bytes que seriam enviados:

- UTF-8, JSON válido e objeto superior sem chaves inesperadas;
- `rules` é array de quatro elementos, nunca objeto e nunca contém `value` ou
  `Count`;
- `enforcement` é literalmente `disabled`;
- comparação estrutural prova uma única diferença contra a projeção do GET;
- SHA-256, comprimento e representação sanitizada ficam no relatório;
- nenhum token, header de autorização ou conteúdo de ambiente é registrado.

Se qualquer asserção falhar, parar sem executar o `PUT`.

### 4. Única chamada e captura sanitizada da resposta

Se e somente se houver autorização futura, realizar uma única chamada `PUT`,
sem retry, fallback ou reformulação automática. Recomenda-se manter o `gh` e
usar `--include`, com stdin, stdout e stderr separados por um processo local
controlado. Essa forma deve preservar:

- exit code do `gh`;
- primeira linha HTTP e status numérico;
- allowlist de headers relevantes: `content-type`,
  `x-github-api-version-selected`, `x-github-request-id`, `date` e headers de
  rate limit;
- corpo completo da resposta, sem truncamento, junto de comprimento e SHA-256;
- stderr completo e sanitizado.

Antes de persistir evidência, remover ou bloquear `Authorization`, cookies,
tokens, secrets e headers fora da allowlist. Não usar `--verbose` ou
`GH_DEBUG=api` por padrão, pois podem capturar dados de requisição em excesso.
O payload já terá sua própria evidência sanitizada e seu hash.

Uma resposta não `2xx` encerra a tentativa: fazer somente o readback de
preservação, sem segunda chamada de escrita.

### 5. Readback integral e comparação estrutural

Após a chamada, independentemente de sucesso ou erro, fazer um novo `GET`
integral e comparar por estrutura, não por ordem textual:

- todos os campos do snapshot anterior;
- regras por tipo e parâmetros internos;
- condições, bypasses, nome, target e metadados configuráveis;
- `enforcement` obrigatoriamente `disabled`;
- única diferença admissível em caso de sucesso:
  `require_extra_approval_for_unattributed_changes`, de `true` para `false`;
- zero regras efetivas enquanto o ruleset permanecer desativado.

Registrar propriedades adicionadas, removidas ou alteradas e separar defaults
de resposta de campos efetivamente graváveis.

### 6. Rollback contingencial

O rollback não é automático e exige autorização humana expressa no mesmo gate
futuro. Só pode ocorrer uma vez quando:

- o `PUT` foi aceito;
- o readback prova drift causado pela operação além da única diferença
  autorizada;
- o ruleset continua identificável e `disabled`;
- a projeção configurável do snapshot anterior está íntegra e validada.

Nesse caso, uma única chamada deve restaurar exatamente `name`, `target`,
`enforcement: disabled`, `bypass_actors`, `conditions` e `rules` do snapshot
prévio. Depois, um `GET` integral deve comprovar igualdade estrutural. Se o
rollback falhar ou deixar divergência, parar e escalar; não fazer segunda
tentativa, fallback, recriação, exclusão ou ativação.

## Riscos e requisitos de preservação

- O campo continua não documentado oficialmente.
- Uma coleção correta em memória não garante JSON correto; a validação deve ser
  posterior à serialização.
- Defaults presentes em `GET` podem não pertencer ao contrato de escrita.
- Atualização parcial reduz superfície, mas seu comportamento com o campo não
  documentado ainda não está comprovado.
- O ruleset deve permanecer `disabled` antes, durante e depois de qualquer
  decisão futura.
- Ativação, validação funcional, rollback e nova tentativa continuam como
  autorizações separadas.

## Alterações documentais desta etapa

- criado somente este plano;
- atualizado minimamente o `README.md` da missão para incluir o documento 11 e
  o estado atual.

## Pedido à Direção

Solicita-se apenas a análise deste diagnóstico. A recomendação técnica, caso a
Direção venha a considerar outra execução, é a alternativa A com validação dos
bytes pós-serialização e captura por `--include`. Nenhuma escrita remota,
rollback ou ativação está solicitada ou autorizada por este documento.
