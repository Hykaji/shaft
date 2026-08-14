# Resultado da validação de carga dos exercícios

**Data:** 12 de agosto de 2026  
**Revisão de origem:** `docs/agent-reports/review-final-fallback-notion.md`  
**Status:** bloqueador corrigido e validado localmente  
**Publicação:** não realizada

## Escopo

Esta correção tratou somente a validação da carga dos exercícios antes de habilitar a confirmação de treino.

Não foram alterados:

- autenticação;
- backend do Notion;
- banco de dados;
- estrutura das bases do Notion;
- concorrência do dashboard;
- retry;
- conteúdo fixo de agosto;
- estilos;
- outras áreas do aplicativo.

## Arquivos alterados nesta correção

### `app/lib/dashboard-state.ts`

- `ExerciseRow` passou a representar um exercício já validado, com:
  - nome;
  - texto da carga para exibição;
  - carga numérica em quilos;
  - grupo muscular;
- foi criado `parseSupportedLoad`;
- `getValidExercises` agora rejeita toda a lista quando qualquer carga é inválida;
- a conversão para número ocorre somente depois de o texto corresponder integralmente a um formato reconhecido.

### `app/ShaftApp.tsx`

- a lista exibe `loadLabel`, proveniente da validação;
- o formulário recebe diretamente `loadKg`, já validado;
- foi removido `parseFloat(load) || 0`;
- não existe mais conversão silenciosa de carga inválida para zero.

### `tests/rendered-html.test.mjs`

- foram adicionados casos válidos e inválidos de carga;
- os testes exercitam diretamente o parser e o validador usados pela aplicação.

## Formatos aceitos

### Carga externa em quilos

É aceito um número não negativo seguido de `kg`, sem conteúdo adicional.

Exemplos aceitos:

- `30 kg`;
- `30kg`;
- `9,5 kg`;
- `9.5 kg`;
- `0 kg`.

Os decimais devem respeitar incrementos de 0,5, coerentes com o campo numérico atual do formulário, que usa `step="0.5"`.

### Peso corporal

`Peso corporal` é um formato reconhecido explicitamente.

Nesse caso:

- a interface preserva o texto `Peso corporal`;
- a carga numérica usada pelo formulário é `0`;
- essa conversão não é um fallback: ela ocorre apenas quando o texto corresponde ao formato conhecido.

## Formatos rejeitados

São rejeitados:

- string vazia;
- apenas espaços;
- texto arbitrário, como `banana`;
- número com unidade arbitrária, como `30 bananas`;
- texto adicional depois da carga, como `30kg extra`;
- número sem a unidade `kg`, como `30`;
- número negativo, como `-5 kg`;
- `NaN kg`;
- `Infinity kg`;
- decimal incompatível com passo de 0,5, como `9.25 kg`;
- qualquer carga que não seja uma string.

Se uma única linha contiver uma carga rejeitada, `getValidExercises` devolve uma lista vazia. Como a confirmação depende de haver exercícios validados, o botão permanece desabilitado e o formulário não é aberto.

## Eliminação da conversão silenciosa

O comportamento anterior usava:

```ts
parseFloat(load) || 0
```

Isso transformava carga vazia ou texto arbitrário em zero.

O novo fluxo é:

1. validar o texto inteiro;
2. rejeitar se o formato não for reconhecido;
3. converter para número apenas depois da validação;
4. transportar o número validado em `loadKg`;
5. inicializar o formulário diretamente com `loadKg`.

Uma busca no código confirmou que o fallback silencioso anterior não permanece em `app/ShaftApp.tsx`.

## Testes executados

### ESLint direcionado

Resultado: **aprovado**.

Arquivos verificados:

- `app/ShaftApp.tsx`;
- `app/lib/dashboard-state.ts`;
- `tests/rendered-html.test.mjs`.

### ESLint do projeto

Resultado: **aprovado** com os artefatos conhecidos `dist`, `.next` e `work` excluídos.

### Testes automatizados diretos

Resultado: **5 de 5 aprovados**.

O teste de exercícios confirmou:

- conversão correta de inteiros e decimais;
- suporte a vírgula e ponto decimal;
- suporte explícito a peso corporal;
- rejeição de cargas vazias e arbitrárias;
- rejeição da lista inteira quando uma carga é inválida.

### Build vinext

Resultado: **aprovado**.

As cinco etapas concluíram e as rotas existentes permaneceram inalteradas.

### Comando completo de testes

Resultado: **aprovado**.

O comando executou novo build e os cinco testes, todos aprovados.

### Integridade do diff

Resultado: **aprovado**.

`git diff --check` não encontrou erros.

## Resultado final

O bloqueador restante da revisão foi corrigido:

- carga vazia não habilita confirmação;
- texto arbitrário não habilita confirmação;
- somente formatos suportados são aceitos;
- carga inválida não é mais convertida silenciosamente para zero;
- os casos estão cobertos por testes que usam a lógica real da aplicação.

Nenhuma publicação foi realizada.
