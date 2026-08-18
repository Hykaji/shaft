# Builder: correção de integridade dos artefatos e redirects

**Data:** 2026-08-17  
**Missão:** `mission-06-checkin-migration-preparation`  
**Papel:** Builder  
**Plano e aprovação:** `01-builder-plan-checkin-migration-preparation.md` e `02-direction-approval-local-tooling.md`  
**Revisão corrigida:** `04-reviewer-review-local-migration-tooling.md`  
**Estado:** Pronto para nova revisão

## Resultado

Foram corrigidos exclusivamente os dois bloqueadores `High` da primeira
revisão: coerência integral do manifesto com o snapshot aprovado e proibição
efetiva de redirecionamentos no POST local.

O manifesto agora inclui o `ownerMap` usado na auditoria. Antes de qualquer
acesso ao D1, CLI e Worker exigem um `approvedManifestHash` fornecido fora do
manifesto, conferem o hash autoarmazenado e reexecutam deterministicamente a
auditoria a partir do snapshot, `ownerMap` e decisões. O resultado reconstruído
deve ser canonicamente idêntico ao manifesto recebido. Isso revalida registros
brutos, hashes, candidatos normalizados, payloads, fingerprints, XP, aliases,
IDs de origem e sobrevivente, contagens, conjunto canônico, batch, ledger,
proveniência, anomalias, conflitos, decisões e aprovação.

O cliente HTTP local agora usa `redirect: "error"`. Além disso, rejeita
defensivamente qualquer status 3xx, resposta marcada como redirecionada ou URL
final diferente da URL validada. Snapshot e manifesto não são reenviados para
outro destino.

## Arquivos alterados nesta correção

- `scripts/checkin-migration/lib/legacy-checkin.mjs` — preserva no manifesto o
  mapa de owners que alimenta a rederivação;
- `scripts/checkin-migration/lib/manifest.mjs` — exige hash aprovado externo e
  compara o manifesto com uma auditoria integral reconstruída;
- `scripts/checkin-migration/lib/cli.mjs` — recusa redirects no transporte e
  valida status, flag e URL final;
- `scripts/checkin-migration/import-checkins-d1.mjs` — exige
  `--approved-manifest-hash` e o encaminha separadamente ao Worker;
- `scripts/checkin-migration/reconcile-checkins-d1.mjs` — aplica o mesmo gate
  independente na reconciliação;
- `tests/fixtures/checkin-migration-worker.ts` — repete a verificação do hash
  externo e a rederivação no limite do Worker;
- `tests/checkin-migration.test.mjs` — cobre adulterações re-hashadas e a matriz
  de redirects;
- este relatório e o índice `README.md` da missão.

## Conformidade de escopo

Não foram alterados schema, migrações, banco remoto, rotas do aplicativo,
autenticação, bindings, Notion, modo padrão, ativação de owner ou política de
corte. Nenhum dado real, credencial, Notion real ou D1 remoto foi acessado.
Nenhum commit, push, merge, deploy ou publicação foi executado.

As observações não bloqueadoras da revisão anterior — cleanup suprimido no
erro de setup, validação do owner limitada ao prefixo local e serialização da
suíte — não foram modificadas, conforme o limite explícito da correção.

## Validação realizada

- lint direcionado dos arquivos da Missão 6: aprovado, sem saída;
- `npm run test:checkin-migration`: 14 testes aprovados, zero falha;
- matriz de redirect: 301, 302, 303, 307 e 308 contra loopback alternativo,
  `localhost`, IPv6 e destino externo, totalizando 20 recusas; o servidor de
  destino local recebeu zero requisições e não houve rede externa;
- adulteração re-hashada: classes de hash bruto, candidato, payload JSON,
  fingerprint, XP, aliases/origens, sobrevivente, contagens, conjunto canônico,
  batch/IDs, owner/data/proveniência, anomalias, conflitos, decisões e aprovação
  foram recusadas antes do D1;
- hash de aprovação ausente ou diferente: recusado antes do D1;
- `npm test`: build aprovado e 57 testes aprovados, zero falha, cancelamento,
  skip ou pendência.

O primeiro passe focal dentro do sandbox não chegou aos testes porque o
Wrangler não pôde resolver o fixture no disco D (`Acesso negado`). A repetição
autorizada fora do sandbox executou normalmente e aprovou os 14 testes. Essa
ocorrência foi ambiental e não exigiu mudança de código.

## Limitações e riscos preservados

- o hash aprovado ainda precisa ser guardado e fornecido como artefato separado
  no futuro fluxo humano; nesta fase local ele é exercitado somente com fixtures;
- todos os owners e registros continuam sintéticos e locais;
- a missão ainda depende de nova revisão independente e aceitação humana;
- auditoria real, importação real, estado `ready`, corte e publicação continuam
  fora de escopo.

## Handoff ao Reviewer

Revisar novamente apenas os dois bloqueadores de
`04-reviewer-review-local-migration-tooling.md`:

1. tentar adulterar cada classe derivada, recalcular `manifestHash` e fornecer
   esse hash forjado como expectativa, confirmando que a rederivação integral
   ainda rejeita o artefato antes do D1;
2. confirmar que o hash aprovado original, fornecido separadamente, recusa
   qualquer manifesto re-hashado;
3. confirmar que o POST usa `redirect: "error"` e que 301/302/303/307/308 não
   alcançam loopback alternativo, `localhost`, IPv6 ou rede externa;
4. preservar as observações não bloqueadoras anteriores sem ampliar o escopo.

**Pronto para nova revisão independente.** Este relatório não representa
aprovação final nem autorização de Git ou migração real.
