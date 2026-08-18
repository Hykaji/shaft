# Builder: resultado do tooling local de migração

**Missão:** `mission-06-checkin-migration-preparation`  
**Plano:** `01-builder-plan-checkin-migration-preparation.md`  
**Aprovação aplicável:** `02-direction-approval-local-tooling.md`  
**Estado:** Pronto para revisão

## Resultado

Foi implementada somente a fase local aprovada: parser/auditor determinístico
para snapshots sintéticos, manifesto verificável, importador idempotente e
retomável, reconciliação e prova do adapter contra D1 local real via Wrangler.

O parser mantém o registro bruto separado do candidato normalizado e classifica
anomalias como `blocker`, `review` ou `observation`. Duplicatas idênticas geram
uma linha canônica e aliases; conflitos bloqueiam o grupo. XP legado e
recalculado ficam lado a lado, e divergência bloqueia. Passeio falso produz zero;
passeio verdadeiro só produz 10/20 como representante lossy do limiar mediante
decisão sintética explícita; caso ambíguo permanece bloqueado.

O manifesto registra contagens bruta e canônica, aliases, anomalias, decisões,
proveniência e hashes. `legacy_observed_count` recebe a contagem canônica. A
importação valida snapshot e manifesto antes do D1, aceita somente owner
`local:*`, target `local` e `http://127.0.0.1`, faz preflight de todas as linhas,
e recusa item pendente, adulteração, batch/manifesto diferente e linha
incompatível. O owner permanece `importing`; nenhuma ativação foi adicionada.

Não existe exportador ou consulta ao Notion nesta implementação.

## Arquivos modificados

- `package.json` — comandos `checkin-migration:*`, suíte focal e inclusão
  obrigatória na suíte completa; arquivos de teste rodam em série para não
  iniciar dois runtimes D1 simultaneamente.

## Arquivos criados

- `scripts/checkin-migration/audit-checkins.mjs`;
- `scripts/checkin-migration/import-checkins-d1.mjs`;
- `scripts/checkin-migration/reconcile-checkins-d1.mjs`;
- `scripts/checkin-migration/lib/canonical.mjs`;
- `scripts/checkin-migration/lib/cli.mjs`;
- `scripts/checkin-migration/lib/legacy-checkin.mjs`;
- `scripts/checkin-migration/lib/manifest.mjs`;
- `db/checkin-migration.ts`;
- `tests/checkin-migration.test.mjs`;
- `tests/helpers/wrangler-checkin-migration-harness.mjs`;
- `tests/fixtures/checkin-migration-worker.ts`;
- `tests/fixtures/checkin-migration/notion-clean.json`;
- `tests/fixtures/checkin-migration/notion-anomalies.json`;
- `tests/fixtures/checkin-migration/notion-duplicates.json`;
- este relatório.

Schema, migrações, rotas, autenticação, bindings, `.openai/hosting.json`,
`app/lib/notion.ts`, modo padrão e lockfiles não foram alterados.

## Validação

- lint direcionado: aprovado, sem erros ou warnings;
- lint amplo com `work` excluído: aprovado;
- `npm run test:checkin-migration`: 12 testes aprovados, zero skip;
- D1 local real: importação limpa, replay, interrupção/retomada, rejeição de
  manifesto diferente, linha incompatível, reconciliação e rollback do batch;
- `npm run build`: aprovado, quatro rotas geradas;
- `npm run test:checkin-idempotency`: 14 testes aprovados;
- regressões das Missões 3 e 4: 23 testes aprovados;
- `npm test`: build aprovado e 55 testes aprovados, zero falha, cancelamento,
  skip ou pendência.

O harness usa Wrangler 4.92.0 com `--local`, UUID fictício, loopback,
persistência/config/logs sob raiz temporária validada, métricas desativadas e
cleanup após inspeção de links/reparse points. A inspeção final encontrou zero
processo Wrangler/workerd e zero raiz temporária remanescente.

Uma checagem suplementar `tsc --noEmit` ainda falha por diagnósticos
preexistentes em módulos da Missão 5, tipos globais Cloudflare, worker e exemplo
D1. Após substituir a dependência global do adapter novo por uma interface
mínima, nenhum diagnóstico dessa checagem aponta para arquivo criado nesta
missão. Build e lints obrigatórios passam.

## Ocorrência de validação

O primeiro passe focal reutilizou os mesmos page IDs sintéticos para owners
diferentes. A restrição global de proveniência do schema recusou corretamente
esses registros. Os fixtures foram isolados com page IDs distintos por origem;
a restrição não foi afrouxada. Todos os passes finais foram aprovados.

## Limitações preservadas

- fixtures e owners são exclusivamente sintéticos e locais;
- não há snapshot, owner, credencial, backup ou dado pessoal real;
- não há auditoria/importação Notion, D1 remoto, estado `ready`, corte ou
  publicação;
- decisões reais sobre owner, retenção, passeio histórico e política canônica
  de XP continuam para fases posteriores autorizadas;
- o tooling importa um owner por manifesto, coerente com a fase pessoal atual.

## Handoff ao Reviewer

Revisar prioritariamente: preservação bruto/candidato, classificação e gates de
anomalia, determinismo dos hashes, deduplicação e aliases, bloqueio de XP e
passeio ambíguo, verificação dupla de artefatos, preflight anterior à escrita,
retomada somente do mesmo manifesto, reconciliação integral, rejeição de target
remoto, uso real do D1 local e ausência completa de Notion/exportador.

**Pronto para revisão independente.** Nenhum commit, push, deploy, publicação,
acesso ao Notion real ou operação D1 remota foi realizado.
