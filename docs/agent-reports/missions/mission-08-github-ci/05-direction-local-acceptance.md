# Aceitação da Direção: implementação local do GitHub CI

**Data:** 2026-08-20

**Missão:** `mission-08-github-ci`

**Classificação:** Nível 3 - crítico

**Decisão:** Implementação local aceita

## Base da decisão

A Direção analisou:

- o plano do Builder;
- a autorização de implementação;
- o workflow e o relatório de resultado;
- a revisão independente com veredito
  `Approved with non-blocking observations`.

Após essa revisão, o usuário declarou explicitamente: “Aprovo a implementação
local da Missão 8”.

## Escopo aceito

- criação local de `.github/workflows/ci.yml` conforme o plano aprovado;
- uso de npm, Node `22.13.0` e runner `ubuntu-24.04`;
- gatilhos, permissões, pinning, timeouts, concorrência e comandos definidos;
- evidências locais de instalação, build, 57 testes e cleanup;
- classificação da falha local do lint como observação ambiental não
  bloqueadora causada pelo artefato ignorado sob `work/`.

## Observações preservadas

A aceitação local não considera comprovados o parser específico do GitHub
Actions, Linux, Node 22 ou o comportamento do checkout limpo. Esses pontos
dependem da primeira execução controlada no GitHub. A repetição da run e a
análise dos logs continuam obrigatórias antes de merge ou de qualquer proposta
para tornar o check obrigatório.

## Limites desta decisão

Esta decisão não autoriza:

- criar ou trocar branch;
- commit, push, abertura de PR ou merge;
- execução ou aprovação de Actions no GitHub;
- alteração de Actions Settings, rulesets ou proteção da `main`;
- publicação, deploy, acesso a secrets ou recursos remotos do produto.

## Próximo gate

A etapa local está aceita. O próximo gate, ainda pendente de autorização
humana específica, é preparar uma branch dedicada, criar um checkpoint e abrir
um PR controlado para observar a primeira execução da CI. A Missão 8 só poderá
receber aceitação final após essa execução, sua repetição, revisão independente
das evidências remotas e nova decisão da Direção.
