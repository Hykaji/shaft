# Missão 08: GitHub CI

**Nível:** 3 - crítico

**Status:** Correção local para Node 22.18.0 aceita; checkpoint pendente

**Implementação:** Contrato local e workflow alinhados em Node 22.18.0; build e
57/57 testes aprovados no runtime mínimo

**Código, dados, D1 remoto, segredos e deploy:** Não alterados

## Objetivo futuro

Criar uma automação segura no GitHub para executar lint, build e a suíte
completa de testes antes de novas integrações na `main`.

O workflow foi publicado no PR controlado da missão. Sua primeira execução
remota passou por instalação, lint e build, mas os cinco arquivos de teste
falharam antes dos 57 casos devido ao contrato incompatível de Node/TypeScript.
A correção, uma nova execução, o merge e a eventual exigência do check na
proteção da `main` dependem de aprovações humanas separadas.

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
6. [`06-builder-plan-node-typescript-compatibility.md`](06-builder-plan-node-typescript-compatibility.md)
   - causa raiz da primeira falha remota, incluindo TypeScript e
     `module.registerHooks`;
   - comparação entre flags nativas, elevação do runtime e executor explícito;
   - recomendação mínima, arquivos, riscos, rollback, validações e nova
     aprovação requerida.
7. [`07-direction-node-compatibility-approval.md`](07-direction-node-compatibility-approval.md)
   - aprovação humana explícita da correção coordenada para Node `22.18.0`;
   - arquivos técnicos autorizados, restrições vinculantes e validação;
   - preservação dos gates separados de Git, execução remota e merge.
8. [`08-direction-lockfile-amendment.md`](08-direction-lockfile-amendment.md)
   - registro do churn adicional produzido pelo npm e da reversão integral;
   - autorização para editar somente o requisito Node do pacote raiz no lock;
   - uso de `npm ci` como prova de coerência, sem regeneração do lockfile.
9. [`09-builder-result-node-typescript-compatibility.md`](09-builder-result-node-typescript-compatibility.md)
   - implementação pontual e diff técnico da correção para Node `22.18.0`;
   - evidências de instalação, build, 57/57 testes, focados, imports e segurança;
   - limitação local preexistente do lint registrada e handoff para Reviewer.
10. [`10-reviewer-review-node-typescript-compatibility.md`](10-reviewer-review-node-typescript-compatibility.md)
    - revisão independente somente leitura do diff, lockfile, contrato Node e
      invariantes de segurança;
    - avaliação das evidências dinâmicas, da limitação local do lint e do estado
      Git/remoto sem ações mutantes;
    - veredito: `Approved with non-blocking observations`.
11. [`11-direction-node-compatibility-acceptance.md`](11-direction-node-compatibility-acceptance.md)
    - aceitação humana explícita da correção local para Node `22.18.0`;
    - preservação das observações não bloqueadoras do Reviewer;
    - separação entre checkpoint, publicação, execução remota e merge.

## Proveniência da investigação

A primeira entrega foi escrita por engano numa extração temporária do WinRAR.
Ela foi descartada como local de entrega e como fonte de evidência técnica. Seu
texto serviu apenas como fonte provisória; todas as afirmações preservadas foram
revalidadas no repositório canônico e no GitHub atual.

## Limites preservados

O workflow está no PR controlado da missão, e sua primeira execução falhou no
runtime anterior. A correção local alterou somente o requisito Node do projeto,
o campo raiz correspondente do lockfile npm, o README e a versão Node do
workflow. Não alterou código do aplicativo, dependências, scripts, testes,
harnesses, `pnpm-lock`, proteção da `main`, configurações do GitHub, dados,
Notion, D1, segredos ou deploy. Também não fez commit, push, novo PR, rerun ou
merge.

O próximo passo é uma autorização humana específica para o checkpoint local da
correção e de seus documentos. Push, repetição da execução, merge e proteção da
`main` permanecem gates separados conforme o nível da missão.
