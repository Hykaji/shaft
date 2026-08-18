# Missão 6 — plano de preparação da migração de check-ins

**Papel:** Builder  
**Estado:** planejamento concluído; nenhuma execução autorizada  
**Escopo desta etapa:** investigação local e documental, sem acesso ao Notion, D1 ou qualquer serviço real

## 1. Conclusão e base de decisão

Este plano complementa, sem repetir, a arquitetura aceita na Missão 5: D1 será a fonte canônica de check-ins e XP; o Notion permanecerá legado e somente leitura durante a transição; não haverá projeção ou reconciliação automática de volta ao Notion. As referências normativas são `05-direction-decision-d1-core.md`, `06-builder-plan-d1-core-checkins.md` e `12-direction-final-acceptance.md`.

A migração pode ser segura sem alterar agora o schema D1, desde que use um snapshot externo imutável, um manifesto determinístico por lote e a proveniência já prevista em `checkin_ledger` (`origin`, `legacy_notion_page_id` e `import_batch_id`). A ativação de um owner deve continuar condicionada ao estado `ready`, às contagens reconciliadas e ao fingerprint aprovado.

O inventário abaixo foi inferido exclusivamente do código local que hoje escreve e lê o Notion. Ele é um contrato esperado, não uma confirmação do schema ou dos dados reais. Uma futura etapa read-only deverá conferir o schema efetivo e interromper diante de qualquer divergência.

## 2. Inventário e mapeamento Notion → D1

| Fonte legada | Tipo esperado | Destino | Regra de migração |
| --- | --- | --- | --- |
| ID da página | metadado Notion | `legacy_notion_page_id` | obrigatório, preservado exatamente e único entre registros importados |
| `Check-in` | título | auditoria | não é fonte de data; comparar com `Check-in YYYY-MM-DD` e registrar divergência |
| `Data` | date | `checkin_date`, `payload_date` | fonte lógica da data após validação estrita |
| `Tipo de dia` | select | `day_type` | normalizar somente para valores aceitos pelo contrato atual |
| `Sono` | select | `sleep` | idem |
| `Treino` | select | `workout` | idem |
| `Estudo` | select | `study` | idem |
| `Humor` | select | `mood` | idem |
| `Energia` | number | `energy` | inteiro no intervalo atual; coerção ou clamp exige revisão |
| `Audiobook min` | number | `audio_minutes` | inteiro não negativo; coerção exige revisão |
| `Música min` | number | `music_minutes` | inteiro não negativo; coerção exige revisão |
| `Passeio com cachorro` | checkbox | `dog_minutes` | dado legado é lossy; aplicar apenas a política aprovada na seção 4 |
| `Vitória do dia` | rich text | `win` | texto normalizado pelo contrato atual; truncamento deve ser registrado |
| `Dificuldade` | rich text | `difficulty` | idem |
| `Próximo passo` | rich text | `next_step` | idem |
| `Resumo` | rich text | `summary` | idem |
| `XP do dia` | number | evidência de auditoria | não copiar cegamente; comparar com XP recalculado |
| `XP total` | number | evidência de auditoria | snapshot informativo; nunca alimentar contador no D1 |
| `Nível` | number | evidência de auditoria | snapshot informativo |
| `created_time` | metadado Notion | evidência de auditoria | reproduzir a ordem do writer legado apenas para diagnóstico |
| `last_edited_time` | metadado Notion | snapshot/fingerprint | detectar alteração entre passes de exportação |

Título e rich text longos devem ser recuperados por paginação da propriedade, quando necessário: a API pode truncar referências inline e oferece o endpoint de property items para paginação ([Notion — Retrieve a page property item](https://developers.notion.com/reference/retrieve-a-page-property)). Nenhum helper permissivo que transforme propriedade ausente em zero ou vazio deve ser reutilizado na auditoria.

## 3. Parsing estrito, datas e timezone

O exportador futuro deve preservar o valor bruto e produzir separadamente um candidato normalizado, com anomalias estruturadas:

- propriedade ausente, tipo diferente, `null`, número não inteiro, valor fora do intervalo, enum desconhecido, truncamento e default aplicado são estados distintos;
- data exatamente `YYYY-MM-DD` é aceita como data lógica;
- timestamp com offset explícito pode ser convertido para `America/Sao_Paulo`, mas fica `review-required`;
- timestamp sem timezone, data inválida ou data ausente bloqueia o registro;
- o fallback atual de data inválida para “hoje” jamais pode ser acionado na migração: a validação estrita deve ocorrer antes de `normalizeCheckinPayload`;
- o D1 guarda apenas a data lógica; `created_time` não decide ordem nem XP. O último check-in é `MAX(checkin_date)`/ordenação descendente por `checkin_date`;
- `xp_day` importado deve ser calculado de forma determinística a partir do payload normalizado aprovado, e o total deve ser exclusivamente `SUM(xp_day)`.

Para auditoria, devem ser calculadas duas sequências legadas: por `created_time`, reproduzindo a seleção histórica, e por data lógica. Divergência entre `XP do dia` legado e XP recalculado, ou entre snapshots de `XP total`/`Nível` e qualquer sequência reconstruída, é anomalia; não autoriza correção automática nem alteração no Notion.

## 4. Inconsistências e política de anomalias

Classificação proposta:

- **bloqueante:** resposta incompleta, snapshot instável, data inválida/ausente, owner não mapeado com exatidão, page ID repetido de modo incompatível, duplicata conflitante, hash divergente ou linha D1 incompatível já existente;
- **revisão obrigatória:** enum/número ausente ou inválido, clamp/default/truncamento, conversão de timestamp, diferença de XP e qualquer transformação lossy;
- **informativa:** título divergente, texto opcional vazio, `XP total` ou `Nível` desatualizado, desde que as demais invariantes fechem.

Há uma perda histórica concreta: o writer gravou `Passeio com cachorro` como `dogMinutes >= 10`, mas o ledger exige minutos. Não existe reconstrução geral do valor exato. A política recomendada, sujeita à Direção, é:

1. `false` → `dog_minutes = 0`;
2. `true` → inferir `10` ou `20` somente quando a diferença entre `XP do dia` legado e todos os outros componentes determinísticos identificar sem ambiguidade os 3 ou 5 XP correspondentes;
3. caso contrário, bloquear para decisão manual, sem inventar um default;
4. registrar no manifesto o valor bruto, a inferência, a regra e o caráter lossy.

## 5. Owner e duplicatas

O writer legado não grava identidade do usuário na página. Logo, `owner_key` não pode ser inferido dos check-ins. Para o produto pessoal atual, a Direção deve aprovar uma associação privada e exata entre o conjunto exportado e o identificador estável do usuário hospedado, produzindo `chatgpt:<oai-authenticated-user-id>`. E-mail ou allowlist não se tornam identidade canônica. Fixtures locais usam apenas `local:shaft-owner`; nunca se promove essa chave para produção.

Depois de mapear owner e normalizar a data, agrupar por `(owner_key, checkin_date)`:

- fingerprints canônicos iguais: duplicata idêntica; escolher deterministicamente como sobrevivente o menor page ID lexicográfico, importar uma linha e registrar todos os page IDs como aliases no manifesto;
- fingerprints diferentes: conflito; bloquear todo o grupo. Não escolher vencedor, mesclar, sobrescrever ou apagar automaticamente;
- diferenças apenas em campos não canônicos continuam visíveis como warning.

Como o ledger aceita uma linha por owner/data, `legacy_observed_count` deve significar **quantidade canônica aprovada após deduplicação**, enquanto o total bruto de páginas fica no manifesto. Essa interpretação é necessária para que `legacy_observed_count === legacy_imported_count` seja atingível sem perda de auditoria e requer aprovação explícita da Direção. Se a Direção exigir que `legacy_observed_count` continue sendo contagem bruta, será necessária mudança de schema/migração — fora desta preparação.

## 6. Snapshot, proveniência e fingerprints

Uma query do Notion não oferece snapshot transacional. A exportação final deve ocorrer em janela de manutenção/freeze e executar dois passes completos read-only. Ordenados por page ID, ambos devem coincidir em conjunto de IDs, `last_edited_time` e hash do conteúdo bruto; qualquer diferença aborta. Uma auditoria anterior pode ser provisional, nunca apta ao corte.

Respostas `request_status.type = incomplete`, inclusive `query_result_limit_reached`, são falha segura. A API passou a limitar a profundidade de paginação de queries a 10.000 resultados; se necessário, uma estratégia futura de partição por data/edição, com sobreposição e deduplicação verificáveis, precisará ser aprovada antes de uso ([Notion changelog — query result limits](https://developers.notion.com/page/changelog)).

Artefatos de execução ficam em `work/checkin-migration/<batch-id>/`, já ignorado pelo Git:

- `source-pass-1.ndjson`, `source-pass-2.ndjson`, `source.snapshot.ndjson` e `source.sha256`;
- `owner-map.private.json`;
- `audit.manifest.json`, `audit.manifest.sha256` e `audit-report.json`;
- `import-plan.json` e `reconciliation.json`;
- `d1-pre-import.sql`, `d1-pre-cutover.sql`, hashes e `restore-verification.json`.

Cada página recebe hash SHA-256 bruto e fingerprint do payload normalizado. O conjunto recebe SHA-256 sobre JSON canônico determinístico, ordenado e sem timestamps de geração. O `batch-id` deve derivar desse hash, por exemplo `checkins-v1-<16 primeiros hex>`. O hash completo do manifesto aprovado alimenta `legacy_audit_fingerprint`; cada linha usa o mesmo `import_batch_id`. Arquivos locais somente read-only não bastam como imutabilidade: antes da importação, snapshot, manifesto e backups devem ser copiados para destino criptografado, versionado e aprovado.

## 7. Dry-run e importação futura

O dry-run não abre D1 nem escreve no Notion. Ele consome somente o snapshot, valida hashes, gera candidatos e informa:

- páginas brutas, linhas canônicas aceitas, bloqueadas e em revisão;
- propriedades ausentes/inválidas e transformações;
- grupos de duplicata idêntica/conflitante;
- conjunto de datas, XP legado observado e `SUM(xp_day)` recalculado;
- último check-in lógico e sequências históricas de XP;
- hashes da origem, snapshot, manifesto e plano.

A importação futura deve consumir exclusivamente snapshot e manifesto aprovados — nunca consultar o Notion. Sequência recomendada:

1. autorização separada cria o owner em `awaiting_audit`;
2. após aprovação do manifesto, uma transação/batch coloca o owner em `importing`, fixa fingerprint, contagem canônica e `audit_completed_at`;
3. chunks determinísticos usam IDs derivados de owner + page ID e `INSERT ... ON CONFLICT DO NOTHING`;
4. após cada tentativa, ler a linha e comparar todos os campos, fingerprint, page ID e batch; replay idêntico é sucesso, qualquer incompatibilidade aborta;
5. uma interrupção mantém `importing` e retoma somente com o mesmo manifesto;
6. `legacy_imported_count` só é finalizado depois de reconciliação completa;
7. `ready` e `activated_at` são gravados juntos somente após os gates da seção 9.

Operações dependentes de atomicidade devem usar `D1Database.batch()`, que executa statements em ordem dentro de transação e aborta/rolls back o lote em falha ([Cloudflare D1 — batch statements](https://developers.cloudflare.com/d1/worker-api/d1-database/)). Chunks não eliminam a necessidade de idempotência por linha.

## 8. Reconciliação obrigatória

O resultado deve provar, para o owner e batch exatos:

- contagem bruta da fonte, aliases deduplicados, contagem canônica e linhas importadas;
- igualdade dos conjuntos de datas e ausência de linhas extras no ledger;
- igualdade por linha de payload, fingerprint, page ID sobrevivente, origem e batch;
- igualdade entre `SUM(xp_day)` do manifesto e do D1;
- igualdade do último check-in pela maior data lógica;
- contabilização de toda duplicata, conflito, exclusão e decisão humana;
- revalidação dos hashes do snapshot e manifesto;
- separação explícita entre XP canônico recalculado e snapshots legados.

Nenhuma reconciliação usa `created_time` para definir o estado canônico.

## 9. Backup, prontidão e rollback

Antes da importação e novamente antes do corte, exportar o D1 para SQL, calcular SHA-256, guardar no destino protegido e restaurar em uma instância isolada para verificar schema, contagens, hashes, XP e último check-in. Wrangler suporta exportação SQL de D1 ([Cloudflare — `wrangler d1 export`](https://developers.cloudflare.com/workers/wrangler/commands/d1/); [guia de import/export](https://developers.cloudflare.com/d1/best-practices/import-export-data/)). Time Travel é defesa adicional, não o único backup: tem janela de retenção limitada e o restore atua sobre o banco ([Cloudflare D1 Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/)).

Um owner só pode virar `ready` quando:

1. o snapshot final duplo é completo e estável sob freeze;
2. o owner foi mapeado e aprovado de forma exata;
3. não há bloqueadores e toda revisão tem decisão registrada;
4. manifesto e fingerprint foram aprovados;
5. contagem canônica/importada, datas, linhas, XP, último check-in e hashes reconciliam;
6. backup e restore isolado foram testados;
7. uma checagem delta final encontra zero mudança;
8. `activated_at` e `ledger_state = ready` são persistidos atomicamente.

Antes do corte, rollback restaura o backup pré-importação ou, sob autorização destrutiva explícita, remove apenas `(owner_key, import_batch_id)` exatos e devolve o owner a `awaiting_audit`; o Notion permanece intocado. Depois do corte e de novas escritas D1, não se volta silenciosamente ao Notion: entrar em manutenção, exportar o estado corrente, restaurar backup/Time Travel compatível e reconciliar. Reverse migration é outra missão.

## 10. Critérios futuros de corte

O modo padrão continua `notion`. Alterar para `d1` exige nova autorização depois de owner `ready`, backup restaurável, reconciliação aceita, teste do guard, dashboard/POST em D1 e plano de observabilidade/rollback. O corte deve ser uma mudança pequena de configuração e publicação separada, com smoke test autenticado; não se mistura com exportação, importação ou saneamento.

## 11. Segurança e privacidade

- credenciais somente por ambiente/secret manager; nunca em argumentos, manifestos ou logs;
- owner map real e conteúdo pessoal ficam fora do Git, com acesso mínimo e retenção aprovada;
- logs contêm somente batch/hash, contagens, códigos e anomalias redigidas, nunca textos do check-in, tokens ou respostas remotas;
- artefatos e backups são criptografados e verificados por hash; descarte futuro exige autorização e política de retenção;
- testes bloqueiam rede real e usam respostas Notion sintéticas;
- o exportador real futuro deve exigir flag explícita, permitir apenas o host oficial e nunca compartilhar credenciais com o worker de importação.

## 12. Testes locais obrigatórios na implementação futura

Testes puros com fixtures devem cobrir mapeamento completo, ausência/tipo inválido, timezone, rejeição de data ambígua, limites numéricos/textuais, inferência de passeio, cálculo de XP, duplicatas idênticas/conflitantes, owner map e hashes determinísticos. Respostas falsas do Notion devem cobrir paginação de propriedades e resultado incompleto/limite de 10.000, sempre com zero rede.

O adapter de produção deve ser exercitado sem skip contra D1 local real via Wrangler para: importação limpa, replay, interrupção/retomada, conflito com rollback do batch, unicidade física, contagens, `SUM(xp_day)`, maior data, fingerprint, owner ainda não pronto, rollback do batch exato e export/restore isolado. Configuração, persistência e logs ficam numa raiz temporária validada; executar workers serialmente para evitar colisões do runtime; encerrar o processo e remover somente a raiz criada pelo harness, após validação de caminho e reparse points. Manter regressões das Missões 3, 4 e 5.

## 13. Fases e autorizações

| Fase | Resultado | Autorização adicional |
| --- | --- | --- |
| A — plano | este documento | aprovação do plano |
| B — tooling local | scripts, fixtures e testes; nenhum dado real | autorizar implementação local |
| C — auditoria provisional | exportação read-only real e dry-run | autorizar credencial/Notion real e destino seguro |
| D — decisão de anomalias | owner map, políticas e manifesto aprovados | decisão humana explícita |
| E — preparação D1 remota | recurso/schema e backup inicial | autorizar recurso e migração remotos |
| F — snapshot final/importação | freeze, dois passes, delta zero e carga | autorizar acesso e escrita remota |
| G — prontidão | reconciliação, restore drill e owner `ready` | aceite humano do resultado |
| H — corte/publicação | `SHAFT_CHECKIN_STORE=d1` e smoke test | autorização separada de configuração e deploy |

Cada fase pode parar sem avançar à seguinte. Nenhuma autorização anterior implica a posterior.

## 14. Arquivos previstos para a implementação local

Criações:

- `scripts/checkin-migration/export-notion-checkins.mjs`
- `scripts/checkin-migration/audit-checkins.mjs`
- `scripts/checkin-migration/import-checkins-d1.mjs`
- `scripts/checkin-migration/reconcile-checkins-d1.mjs`
- `scripts/checkin-migration/lib/legacy-checkin.ts`
- `scripts/checkin-migration/lib/manifest.ts`
- `db/checkin-migration.ts`
- `tests/checkin-migration.test.mjs`
- `tests/helpers/wrangler-checkin-migration-harness.mjs`
- `tests/fixtures/checkin-migration-worker.ts`
- `tests/fixtures/checkin-migration/notion-clean.json`
- `tests/fixtures/checkin-migration/notion-anomalies.json`
- `tests/fixtures/checkin-migration/notion-duplicates.json`

Modificação:

- `package.json`, apenas para scripts focais e inclusão obrigatória da suíte em `npm test`.

Não se prevê alterar `db/schema.ts`, migrações Drizzle, `.openai/hosting.json`, `.gitignore`, rotas, `app/lib/notion.ts`, autenticação ou o modo padrão. Se a decisão de contagem exigir schema novo, a implementação deve parar e retornar à Direção.

## 15. Riscos, exclusões e decisões bloqueantes

Riscos principais: fonte sem snapshot transacional; propriedade legada de passeio lossy; histórico de XP potencialmente inconsistente; ausência de owner no Notion; limite de query; dados pessoais em artefatos; importação interrompida; e falsa confiança em backup não restaurado. As medidas correspondentes estão nos gates acima.

Ficam fora do escopo: corrigir/apagar Notion, projetar D1 para Notion, migrar finanças/treinos, mudar autenticação, criar owner/recurso real, alterar schema, importar, cortar, publicar ou definir reverse migration.

Antes da implementação com dados reais, a Direção precisa decidir somente:

1. aprovar a regra lossy de `Passeio com cachorro` e o tratamento manual dos casos não inferíveis;
2. confirmar que o XP canônico será o recalculado do payload aprovado, mantendo `XP do dia`, `XP total` e `Nível` apenas como evidência;
3. aprovar `legacy_observed_count` como contagem canônica após deduplicação, com contagem bruta no manifesto, ou autorizar futura mudança de schema;
4. fornecer/aprovar o mapeamento privado do conjunto legado para o user ID hospedado estável;
5. escolher destino criptografado/versionado, acesso e retenção de snapshots/backups;
6. autorizar separadamente cada fase C a H e a janela de freeze do snapshot final.

Até essas decisões, a Missão 6 está **pronta para revisão do plano**, não para acesso real, importação ou corte.
