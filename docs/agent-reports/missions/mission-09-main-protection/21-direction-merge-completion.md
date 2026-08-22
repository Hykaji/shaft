# Direção: conclusão do merge e da Missão 9

**Data:** 2026-08-22

**Missão:** `mission-09-main-protection`

**Papel:** Direção humana

**Classificação:** Nível 3 - crítico

**Aceitação anterior:**
[`20-direction-activation-functional-acceptance.md`](20-direction-activation-functional-acceptance.md)

**Decisão:** merge autorizado concluído; CI pós-merge aprovada; objetivo técnico
da missão concluído

## Resultado do merge

Após a aceitação técnica da implementação e do parecer independente, a Direção
autorizou separadamente o merge do PR nº 3 pelo método merge commit, sem bypass
administrativo, auto-merge, squash, rebase ou exclusão da branch.

O readback remoto confirmou:

- PR nº 3 fechado e integrado;
- horário registrado pelo GitHub: `2026-08-22T03:53:46Z`;
- merge commit:
  `3fb975207558a96a73cff393424708cfe3e9b846`;
- `main` remota apontando exatamente para o merge commit;
- branch `codex/mission-09-main-protection-validation` preservada em
  `ed38dc5e54173a6a2aaa1b7cac88238c055d7ce6`;
- nenhuma tentativa alternativa de merge ou exclusão da branch.

## CI pós-merge

O push do merge commit disparou automaticamente uma única execução do workflow
`CI`:

- run: [32550225861](https://github.com/Hykaji/shaft/actions/runs/32550225861);
- run nº 6;
- evento: `push`;
- tentativa: `1`;
- head SHA:
  `3fb975207558a96a73cff393424708cfe3e9b846`;
- job/check: `Lint, build and tests`;
- todas as nove etapas concluídas com `success`;
- Node `22.18.0` confirmado nos logs;
- `npm ci --no-audit --no-fund`, lint e build aprovados;
- 57 testes executados e 57 aprovados;
- zero falhas, cancelamentos e skips;
- nenhum rerun.

## Proteção após o merge

O estado remoto permaneceu coerente depois da integração:

- ruleset `Protect main`, ID `21151016`, ainda `active`;
- `require_extra_approval_for_unattributed_changes: false`;
- quatro regras efetivas sobre a `main`;
- `main.protected: true`;
- nenhuma alteração adicional do ruleset ou rollback.

## Conclusão da Direção

O objetivo técnico da Missão 9 está concluído: novas integrações na `main`
passam pelo ruleset ativo, pelo fluxo de PR e pelo required check validado. A
implementação foi revisada independentemente, aceita pela Direção, integrada
sem bypass e comprovada pela CI pós-merge.

Esta conclusão não publica automaticamente os documentos locais 18 a 21. Eles,
o README atualizado, o índice geral e o ajuste factual do roadmap permanecem
no worktree e exigem um futuro checkpoint e publicação documental autorizados
separadamente.

## Limites preservados

Não estão autorizados por este registro:

- staging ou commit da documentação de fechamento;
- push ou novo PR documental;
- exclusão da branch de validação;
- alteração adicional do ruleset;
- rerun de CI;
- novo merge ou qualquer outra publicação.

A branch local não foi trocada nem atualizada após o merge remoto, preservando
com segurança os documentos locais pendentes. Qualquer sincronização ou
publicação futura deve começar com novo inventário Git e remoto.
