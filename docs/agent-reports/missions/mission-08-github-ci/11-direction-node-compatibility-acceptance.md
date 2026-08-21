# Aceitação da Direção: correção Node e TypeScript

**Data:** 2026-08-20

**Missão:** `mission-08-github-ci`

**Classificação:** Nível 3 - crítico

**Decisão:** Correção local para Node `22.18.0` aceita

## Base da decisão

A Direção analisou o plano 06, a autorização 07, a emenda do lockfile 08, o
resultado do Builder 09 e a revisão independente 10, cujo veredito foi
`Approved with non-blocking observations`.

Após essa sequência, o usuário declarou explicitamente: “Aprovo a correção
local da Missão 8 para Node 22.18.0”.

## Escopo aceito

- `engines.node` alinhado em `>=22.18.0` no manifesto e na raiz do lockfile;
- requisito e justificativa curta atualizados no README;
- runtime da CI fixado em Node `22.18.0`;
- preservação de scripts, dependências, integridades, código, testes,
  harnesses, `pnpm-lock` e invariantes de segurança do workflow;
- evidências locais no runtime mínimo de instalação determinística, build,
  57/57 testes, testes focados e imports dos entrypoints de migração.

## Observações preservadas

- o lint local continua afetado somente pelo artefato antigo e ignorado sob
  `work/`; o mesmo comando passou no checkout remoto limpo;
- as execuções dinâmicas do Builder não foram repetidas pelo Reviewer para
  preservar o modo somente leitura;
- a correção ainda precisa ser comprovada pelo workflow atualizado no GitHub;
- o runtime portátil temporário permanece preservado até os próximos gates ou
  autorização específica de limpeza.

## Limites desta decisão

Esta aceitação não autoriza commit, push, alteração do PR, nova execução da CI,
merge, proteção da `main`, publicação, deploy ou configuração remota.

## Próximo gate

O próximo gate é a autorização humana para criar um checkpoint local com os
quatro arquivos técnicos e os documentos 06 a 11. Depois, push e nova execução
controlada no PR dependerão de autorização separada.
