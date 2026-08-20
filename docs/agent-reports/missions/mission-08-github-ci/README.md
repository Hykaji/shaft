# Missão 08: GitHub CI

**Nível:** 3 - crítico

**Status:** Implementação local aceita; execução controlada no GitHub pendente

**Implementação:** Workflow local aprovado pela Direção após revisão independente

**Código, dados, D1 remoto, segredos e deploy:** Não alterados

## Objetivo futuro

Criar uma automação segura no GitHub para executar lint, build e a suíte
completa de testes antes de novas integrações na `main`.

O workflow foi implementado somente no checkout local. Sua primeira execução,
qualquer ação Git e a eventual exigência do check na proteção da `main`
dependem de aprovações humanas separadas.

## Registro cronológico

1. [`01-builder-plan-github-ci.md`](01-builder-plan-github-ci.md)
   - evidências locais do checkout canônico e evidências remotas atuais;
   - desenho proposto do workflow, segurança, recursos e rollback;
   - validação, primeira execução controlada, critérios de aceitação e decisões
     pendentes da Direção.
2. [`02-direction-implementation-approval.md`](02-direction-implementation-approval.md)
   - aprovação humana explícita do plano;
   - escopo técnico autorizado e validação obrigatória;
   - limites preservados para Git, GitHub remoto, merge e proteção da `main`.
3. [`03-builder-result-github-ci.md`](03-builder-result-github-ci.md)
   - implementação local de `.github/workflows/ci.yml`;
   - resultados de instalação, YAML, lint, build, testes e cleanup;
   - handoff para revisão independente de Nível 3, com a limitação local do
     lint registrada sem ampliar o escopo.
4. [`04-reviewer-review-github-ci.md`](04-reviewer-review-github-ci.md)
   - revisão independente somente leitura do workflow e do handoff;
   - classificação da falha local do lint e das limitações de validação;
   - veredito para a decisão humana sobre a etapa local.
5. [`05-direction-local-acceptance.md`](05-direction-local-acceptance.md)
   - aceitação humana explícita da implementação local;
   - preservação das observações não bloqueadoras do Reviewer;
   - separação entre a etapa local aceita e os gates Git/remotos pendentes.

## Proveniência da investigação

A primeira entrega foi escrita por engano numa extração temporária do WinRAR.
Ela foi descartada como local de entrega e como fonte de evidência técnica. Seu
texto serviu apenas como fonte provisória; todas as afirmações preservadas foram
revalidadas no repositório canônico e no GitHub atual.

## Limites preservados

O workflow existe apenas localmente. Não houve alteração de código do
aplicativo, dependências, lockfiles, proteção da `main`, configurações do
GitHub, dados, Notion, D1, segredos ou deploy. Também não houve criação ou troca
de branch, commit, push, PR ou merge.

O próximo passo é uma autorização humana específica para branch, checkpoint,
push e PR controlado. A execução remota, sua repetição, a análise dos logs,
merge e proteção da `main` permanecem gates separados.
