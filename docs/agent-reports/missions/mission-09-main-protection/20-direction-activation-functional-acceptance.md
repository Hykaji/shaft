# Direção: aceitação da ativação e validação funcional

**Data:** 2026-08-22

**Missão:** `mission-09-main-protection`

**Papel:** Direção humana

**Classificação:** Nível 3 - crítico

**Resultado do Builder aceito:**
[`18-builder-result-activation-and-functional-validation.md`](18-builder-result-activation-and-functional-validation.md)

**Parecer independente aceito:**
[`19-reviewer-review-activation-and-functional-validation.md`](19-reviewer-review-activation-and-functional-validation.md)

**Decisão:** implementação e validação funcional aprovadas tecnicamente;
merge e publicação permanecem pendentes

## Decisão da Direção

A Direção aceita o veredito independente **Approved** e aprova tecnicamente a
implementação e a validação funcional da proteção da `main` descritas nos
relatórios 18 e 19.

Foram aceitos como evidência suficiente:

- o checkpoint documental `ed38dc5e54173a6a2aaa1b7cac88238c055d7ce6`;
- o ruleset `Protect main`, ID `21151016`, ativo e sem drift;
- o campo `require_extra_approval_for_unattributed_changes` preservado em
  `false`;
- as quatro regras configuradas e efetivas, sem bypass ou proteção clássica;
- a `main` protegida e inalterada em
  `310170674d8de6eac8b2746536470c7e51944ffc`;
- o PR nº 3 aberto, ready, sem reviews ou aprovações e com mergeabilidade
  limpa;
- a run original `32547234293`, no Node `22.18.0`, com instalação, lint, build
  e 57/57 testes aprovados;
- a preservação dos gates e a ausência de rerun, rollback, merge ou ação
  destrutiva.

## Efeito desta aceitação

Esta decisão encerra a avaliação técnica da ativação e da validação funcional.
Ela permite registrar factualmente no índice e no roadmap que a CI criada na
Missão 8 está exigida para integrações na `main` pelo ruleset validado na
Missão 9.

A Missão 9 ainda não está concluída: o PR nº 3 permanece aberto e exige uma
autorização específica de merge. Antes de qualquer decisão futura, a Direção
deve revalidar o estado remoto, o head e a base do PR, a CI, o ruleset, a
ausência de reviews e a mergeabilidade.

## Limites preservados

Esta aceitação autoriza somente este registro local e as atualizações
documentais correspondentes. Não autoriza:

- staging ou commit da documentação local;
- push documental;
- merge do PR nº 3;
- uso de bypass administrativo, auto-merge, squash ou rebase;
- rerun de CI ou novo commit;
- exclusão da branch;
- alteração adicional do ruleset;
- publicação final.

Os relatórios 18, 19 e este documento permanecem locais e fora do PR nº 3 até
uma autorização futura específica. Nenhum desses limites pode ser inferido
como superado por esta aceitação técnica.
