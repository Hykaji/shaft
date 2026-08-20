# Aprovação da Direção: implementação do GitHub CI

**Data:** 2026-08-20

**Missão:** `mission-08-github-ci`

**Classificação:** Nível 3 - crítico

**Decisão:** Plano aprovado e implementação autorizada no escopo abaixo

## Decisão humana

A Direção aprovou explicitamente o plano registrado em
[`01-builder-plan-github-ci.md`](01-builder-plan-github-ci.md) com a declaração:
“Aprovo o plano da Missão 8”.

O Builder está autorizado a implementar o workflow proposto e a registrar seu
resultado para revisão independente. Esta autorização não representa aceitação
final da missão nem autorização para ações Git ou mudanças remotas.

## Escopo técnico autorizado

- criar somente `.github/workflows/ci.yml` no código do projeto;
- preservar `package.json`, lockfiles, testes, harnesses e código da aplicação;
- usar npm com Node `22.13.0` e runner `ubuntu-24.04`;
- executar `npm ci --no-audit --no-fund`, `npm run lint` e `npm test`;
- usar os gatilhos, permissões, timeouts, concorrência, nomes e SHAs definidos
  no plano aprovado;
- manter cache, artefatos, secrets, deploy e recursos remotos fora do workflow;
- registrar o relatório de resultado na pasta desta missão.

Ao escrever o YAML, os valores de ambiente `CI` e
`WRANGLER_SEND_METRICS` devem ser representados como strings explícitas. Os
SHAs das Actions devem ser novamente verificados imediatamente antes da
edição, como previsto no plano.

## Validação obrigatória do Builder

- validar a sintaxe do YAML;
- executar instalação determinística pelo `package-lock.json`;
- executar lint e a suíte completa, incluindo o build realizado por
  `npm test`;
- confirmar que os comandos não alteraram arquivos fora do escopo;
- confirmar ausência de processos Wrangler/Workerd e raízes temporárias dos
  harnesses ao final;
- registrar limitações ambientais, resultados e diff completo no handoff.

## Limites ainda não autorizados

- criar ou trocar branch;
- fazer commit, push, abrir PR ou merge;
- executar ou aprovar Actions no GitHub;
- alterar Actions Settings, rulesets ou proteção da `main`;
- tornar o check obrigatório;
- acessar secrets, Notion, D1 remoto, dados pessoais ou deploy;
- ampliar o workflow ou ajustar código, dependências, testes ou lockfiles.

Se a implementação exigir qualquer item fora do escopo aprovado, o Builder
deve parar essa parte e devolver a decisão à Direção.

## Próximo handoff

O Builder deve implementar apenas o escopo autorizado, validar localmente e
produzir o relatório de resultado. Em seguida, um Reviewer independente fará a
revisão de Nível 3 antes de qualquer aceitação final ou ação Git.
