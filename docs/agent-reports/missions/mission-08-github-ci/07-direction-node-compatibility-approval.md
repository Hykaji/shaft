# Aprovação da Direção: compatibilidade Node e TypeScript

**Data:** 2026-08-20

**Missão:** `mission-08-github-ci`

**Classificação:** Nível 3 - crítico

**Decisão:** Correção para Node `22.18.0` autorizada no escopo abaixo

## Base da decisão

A primeira execução do PR 2 comprovou que instalação, lint e build funcionam
no checkout limpo, mas os cinco arquivos de teste não carregam módulos `.ts`
no Node `22.13.0`. A investigação do Builder também confirmou que parte dos
testes usa `module.registerHooks`, indisponível nessa versão.

A Direção analisou o plano
[`06-builder-plan-node-typescript-compatibility.md`](06-builder-plan-node-typescript-compatibility.md)
e o usuário declarou explicitamente: “Aprovo a correção da Missão 8 para Node
22.18.0”.

## Escopo técnico autorizado

- alterar `package.json` de `engines.node: ">=22.13.0"` para
  `engines.node: ">=22.18.0"`;
- sincronizar somente esse requisito do pacote raiz em `package-lock.json`;
- atualizar o requisito correspondente no `README.md` e acrescentar a
  explicação curta prevista no plano;
- alterar somente `node-version` de `"22.13.0"` para `"22.18.0"` em
  `.github/workflows/ci.yml`;
- criar o relatório cronológico de resultado e atualizar o índice da missão.

## Restrições vinculantes

- preservar todos os scripts, dependências, versões e integridades;
- preservar `pnpm-lock.yaml`, `pnpm-workspace.yaml`, código, testes e
  harnesses;
- não adicionar `tsx`, flags de TypeScript ou solução exclusiva do workflow;
- não alterar gatilhos, permissões, SHAs, concorrência, timeouts ou comandos da
  CI;
- interromper a implementação se o npm produzir qualquer alteração no
  `package-lock.json` além do requisito `engines.node` do pacote raiz;
- não acessar Notion, D1 remoto, dados pessoais, secrets ou deploy.

## Validação obrigatória

O Builder deve validar com Node exatamente `v22.18.0`:

- instalação determinística pelo `package-lock.json`;
- lint;
- build e os 57 testes pela suíte completa;
- os dois comandos de teste focados;
- carregamento sem efeitos remotos dos três entrypoints de migração;
- sintaxe e invariantes de segurança do workflow;
- ausência de resíduos e alterações fora do escopo.

Se o runtime exato não puder ser usado localmente, o Builder deve registrar a
limitação e não representar Node 24 como prova equivalente.

## Limites ainda não autorizados

Esta decisão não autoriza commit, push, rerun do GitHub Actions, merge,
alteração do PR, proteção da `main`, configuração remota ou publicação. Após a
implementação local, um Reviewer independente deve avaliar o diff e as
evidências antes de nova decisão da Direção.
