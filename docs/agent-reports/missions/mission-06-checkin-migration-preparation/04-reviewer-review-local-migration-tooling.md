# Reviewer review: tooling local de migração de check-ins

**Date:** 2026-08-15  
**Mission:** `mission-06-checkin-migration-preparation`  
**Role:** Reviewer independente  
**Builder result reviewed:** `docs/agent-reports/missions/mission-06-checkin-migration-preparation/03-builder-result-local-migration-tooling.md`  
**Review type:** Strictly read-only

## Veredito final

**Changes requested**

A implementação cobre corretamente a maior parte do fluxo local: preserva o
registro bruto, usa parsing estrito, deduplica de forma determinística, bloqueia
conflitos e divergências de XP, mantém decisões lossy explícitas, faz preflight
das linhas, retoma o mesmo manifesto, reconcilia o ledger e nunca ativa o owner.
O teste focal da Missão 6 passou 12/12 neste ambiente.

Entretanto, dois achados bloqueiam a aprovação:

1. a verificação aceita itens alterados e hashes derivados forjados quando o
   hash autoarmazenado do manifesto também é recalculado; assim, o importador não
   prova que payload, fingerprint, conjunto, batch e proveniência foram realmente
   derivados do snapshot aprovado;
2. o cliente HTTP valida somente a URL inicial e segue redirecionamentos por
   padrão, podendo reenviar snapshot e manifesto para outro destino.

Nenhuma correção foi implementada nesta revisão. O escopo não está autorizado
para commit, push, migração, deploy ou publicação.

## Escopo e evidências revisados

Foram lidos integralmente:

- `AGENTS.md`;
- `docs/agent-workflow.md`;
- o README, o plano 01, a aprovação 02 e o resultado 03 da Missão 6;
- as decisões, o plano aprovado, o resultado, as revisões, a correção e a
  aceitação final relevantes da Missão 5;
- `docs/agent-reports/templates/reviewer-review.md`.

Também foram inspecionados integralmente o diff rastreado, todos os arquivos
não rastreados da Missão 6, o schema e o adapter D1 herdados da Missão 5, os
fixtures, os dois harnesses e a implementação canônica de payload/XP.

O HEAD observado foi `ae98974d458032e46030747054ea6f31b6f5b1a1`. Não havia
arquivo staged. O único diff rastreado era `package.json`; os demais arquivos
da Missão 6 estavam não rastreados. `docs/roadmap.md` e os arquivos rastreados
fora do escopo não possuíam diff.

## Evidências observadas

### Auditoria, parsing e preservação dos dados

- `scripts/checkin-migration/lib/legacy-checkin.mjs:127-141` clona o registro
  bruto, preserva-o em `raw`, calcula `rawHash` e mantém
  `normalizedCandidate` separado.
- Data lógica e timestamps são validados sem fallback; enums e inteiros
  ausentes, inválidos ou fora do intervalo viram bloqueadores em
  `legacy-checkin.mjs:25-42` e `88-125`.
- Textos que exigem trim ou truncamento geram decisão explícita antes de o
  candidato normalizado poder ser importável. Ausência de texto não vira string
  vazia silenciosamente no parser legado.
- `dogWalked: false` produz exatamente zero. `dogWalked: true` somente produz o
  representante 10 ou 20 quando o XP permite inferir inequivocamente o limiar;
  o resultado é marcado `lossy` e exige a decisão
  `accept_lossy_threshold_candidate`. Ambiguidade permanece bloqueante.
- XP legado e XP recalculado ficam lado a lado em `xpComparison`; divergência
  gera `XP_DIVERGENCE` sem ação aceita capaz de resolvê-la.

### Duplicatas, contagens e manifesto

- Os grupos usam `(ownerKey, date)` e são ordenados; o menor `pageId` se torna
  sobrevivente e os demais IDs idênticos viram `aliases` e `sourcePageIds` em
  `legacy-checkin.mjs:271-316`.
- Mais de um fingerprint no grupo cria `DUPLICATE_CONFLICT`, remove o grupo dos
  itens canônicos e bloqueia o manifesto inteiro.
- `legacyObservedCount` e `canonicalCount` usam `items.length`, portanto
  representam a contagem canônica após deduplicação. A contagem bruta fica em
  `snapshot.rawCount`.
- O manifesto inclui registros brutos e candidatos, aliases, hashes brutos,
  decisões, anomalias, conflitos, itens, proveniência, hashes, batch e estado de
  aprovação.
- Snapshot e objetos canônicos usam JSON com chaves ordenadas e SHA-256. Os
  grupos e aliases são ordenados antes do hash do conjunto. O hash do manifesto
  é calculado antes da inclusão de `manifestHash` e verificado removendo somente
  essa chave; não há circularidade direta.
- A prova automatizada confirmou hashes idênticos para a mesma entrada e
  alteração do snapshot/manifesto quando a evidência bruta muda.

### Importação, retomada e reconciliação

- CLI e Worker chamam `verifySnapshotAndManifest` antes de qualquer chamada ao
  adapter D1.
- `db/checkin-migration.ts:277-295` consulta todas as linhas do manifesto antes
  de `ensureOwner` ou do primeiro insert. Uma linha encontrada por owner/data ou
  page ID precisa coincidir campo a campo com o item esperado.
- O owner é criado somente como `importing`, associado ao hash do manifesto e à
  contagem canônica. Owner existente precisa conservar esse mesmo manifesto,
  contagem, estado e `activated_at = null`.
- Inserts e atualização de `legacy_imported_count` usam um `D1Database.batch()`
  por chunk. A retomada faz novo preflight integral e reproduz somente linhas
  compatíveis do mesmo manifesto.
- A reconciliação compara quantidade, todos os campos da linha, owner, data,
  payload, XP, origem, page ID, batch e contagem do owner; também deriva soma de
  XP e maior data lógica.
- O teste D1 real confirmou rollback integral de um batch cujo segundo statement
  viola constraint.
- Não existe transição para `ready`, preenchimento de `activated_at` ou corte.

### Limites locais e ausência de Notion

- Owner é aceito somente com prefixo `local:` tanto na auditoria quanto na
  verificação/importação.
- A URL inicial exige `target=local`, protocolo `http:` e hostname literal
  `127.0.0.1`. `localhost`, HTTPS, hostname externo e IPv6 não passam por essa
  validação.
- A normalização retorna `url.origin`, descartando caminho, query, fragmento e
  credenciais eventualmente presentes na entrada.
- A busca em todo o tooling não encontrou host, token, consulta, paginação,
  escrita ou exportador real do Notion. As referências remanescentes são apenas
  nomes de proveniência do schema e fixtures sintéticos.
- Nenhum Notion real, D1 remoto ou outro serviço externo foi acessado durante a
  revisão.

### Escopo, runner serial e cleanup

- `package.json` acrescenta somente os três comandos do tooling, o teste focal e
  `--test-concurrency=1` na suíte completa.
- A serialização reduz o pico de dois arquivos de teste D1 simultâneos, ao custo
  de serializar também os testes que não usam Wrangler. Na execução completa
  desta revisão, os dois harnesses falharam sequencialmente e rapidamente no
  setup por falta de espaço, não por concorrência entre runtimes.
- O harness cria raiz com `mkdtemp` sob `os.tmpdir()`, valida prefixo e limite de
  path, usa config/logs/state/XDG internos, prende o listener a `127.0.0.1` e
  verifica links antes da remoção recursiva.
- No caminho de erro de inicialização, falhas de `stopChild` e `removeRoot` são
  suprimidas em `tests/helpers/wrangler-checkin-migration-harness.mjs:166-169`.
  Isso não amplia o alvo nem força remoção, mas pode ocultar resíduo; fica
  registrado como observação não bloqueante.

## Testes executados

### Lint direcionado

```powershell
& 'C:\Program Files\nodejs\npm.cmd' exec -- eslint db/checkin-migration.ts scripts/checkin-migration/audit-checkins.mjs scripts/checkin-migration/import-checkins-d1.mjs scripts/checkin-migration/reconcile-checkins-d1.mjs scripts/checkin-migration/lib/canonical.mjs scripts/checkin-migration/lib/cli.mjs scripts/checkin-migration/lib/legacy-checkin.mjs scripts/checkin-migration/lib/manifest.mjs tests/checkin-migration.test.mjs tests/helpers/wrangler-checkin-migration-harness.mjs tests/fixtures/checkin-migration-worker.ts
```

Resultado: exit code `0`, sem erros ou avisos.

### Lint amplo

```powershell
& 'C:\Program Files\nodejs\npm.cmd' run lint -- --ignore-pattern work
```

Resultado: exit code `0`, sem erros ou avisos; `work` foi excluído
explicitamente.

### Teste focal da Missão 6

```powershell
& 'C:\Program Files\nodejs\npm.cmd' run test:checkin-migration
```

Resultado: exit code `0`; 12 testes aprovados, zero falhas, cancelamentos,
skips ou pendências; duração aproximada de 4,5 segundos. O D1 local iniciou,
importou, retomou, reconciliou e provou rollback.

A falha de acesso negado observada pela Direção dentro do isolamento não foi
reproduzida. Como o mesmo comando passou integralmente neste ambiente e a falha
anterior ocorreu antes do Worker, ela permanece classificada como limitação
específica daquele ambiente, sem evidência de defeito funcional.

### Teste focal D1 da Missão 5

```powershell
& 'C:\Program Files\nodejs\npm.cmd' run test:checkin-idempotency
```

Resultado: inconclusivo por limitação ambiental. O comando não produziu
resultado em 184 segundos e foi encerrado pelo timeout externo. A execução
deixou a árvore Node/Wrangler/workerd e uma raiz temporária porque o encerramento
externo impediu o `after` do teste. Os PIDs e o path foram identificados e apenas
esses recursos efêmeros, criados pela própria revisão, foram encerrados/removidos
após validação de path, tipo e ausência de reparse points.

A execução completa posterior tornou a restrição ambiental objetiva: a
unidade C: estava sem espaço e o Wrangler falhou ao gravar seu primeiro log.
Não houve falha individual de regra de idempotência.

### Regressões das Missões 3 e 4

```powershell
& 'C:\Program Files\nodejs\node.exe' --test tests/notion-finance-pagination.test.mjs tests/shaft-access-policy.test.mjs
```

Resultado: 23 testes aprovados, zero falhas. Permaneceram cobertos o guard antes
de I/O, `query` single-page, paginação financeira, resultado incompleto com
10.000 registros, sanitização, status conhecido e ausência de saldo parcial.

### Build

```powershell
& 'C:\Program Files\nodejs\npm.cmd' run build
```

Resultado: exit code `0`; as quatro rotas foram geradas.

### Suíte completa

```powershell
& 'C:\Program Files\nodejs\npm.cmd' test
```

Resultado: exit code `1`. O build passou. Dos 55 testes, 29 passaram e 26 foram
marcados como falha porque os hooks de setup dos dois arquivos D1 não
conseguiram iniciar o runtime. O erro raiz dos dois harnesses foi:

```text
ENOSPC: no space left on device, write
```

O Wrangler falhou ao criar o log sob as respectivas raízes temporárias. A
unidade C: apresentava 0 MB livres naquele instante. Os 14 casos da Missão 5 e
os 12 casos da Missão 6 herdaram a falha dos hooks; não foram 26 defeitos
individuais. As regressões independentes passaram. Classificação: limitação
específica do ambiente, não bloqueador funcional da implementação.

### TypeScript sem emissão

```powershell
& 'C:\Program Files\nodejs\npm.cmd' exec -- tsc --noEmit --pretty false
```

Resultado: exit code `1`, com dez diagnósticos:

- dois `TS5097` em `app/lib/checkin-service.ts` e `db/checkins.ts`;
- três diagnósticos de `D1Database`/`cloudflare:workers` em `db/checkins.ts` e
  `db/index.ts`;
- dois `TS2339` no exemplo D1;
- um diagnóstico de `D1Database` no fixture da Missão 5;
- dois diagnósticos de globais Cloudflare em `worker/index.ts`.

Todos os arquivos diagnosticados existem no HEAD e estão sem diff. Nenhum
diagnóstico aponta para `db/checkin-migration.ts`, o novo Worker fixture ou os
scripts da Missão 6. A alegação do Builder de que os diagnósticos observados são
preexistentes foi confirmada. O `tsconfig.tsbuildinfo` produzido pelo comando
foi identificado e removido ao final, para preservar o escopo solicitado.

### Provas negativas adicionais do Reviewer

Foi executado um ensaio puro, sem D1, que:

1. gerou um manifesto aprovado a partir do fixture limpo;
2. alterou `item.payload.win` e o `payloadJson` depois da auditoria;
3. manteve o fingerprint antigo;
4. substituiu `hashes.canonicalSet` por 64 caracteres `f`;
5. recalculou somente o `manifestHash` autoarmazenado.

`verifySnapshotAndManifest` aceitou o artefato e devolveu o payload alterado, o
fingerprint obsoleto e o hash de conjunto forjado.

Outro ensaio iniciou dois servidores exclusivamente em `127.0.0.1`. O primeiro
respondeu `307` para o segundo; `postLocalJson` seguiu o redirecionamento,
repetiu o POST e aceitou a resposta do destino. Nenhuma rede externa foi usada
no ensaio.

### Higiene final

- `git diff --check HEAD`: exit code `0`;
- nenhum processo Wrangler/workerd remanescente;
- nenhuma raiz `shaft-checkin-*` ou `shaft-migration-*` remanescente;
- nenhum arquivo staged;
- nenhum acesso real ao Notion ou D1 remoto;
- a unidade C: permanecia criticamente cheia, com cerca de 0,75 MB livre.

## Achados bloqueantes

### [High] Manifesto re-hashado pode importar conteúdo que não deriva do snapshot aprovado

- **Bloqueia a missão:** Sim.
- **Evidência:** `scripts/checkin-migration/lib/manifest.mjs:20-27` compara o
  hash do snapshot e o hash autoarmazenado do manifesto, mas
  `manifest.mjs:28-72` não recalcula `payloadFingerprint`,
  `hashes.canonicalSet`, `batchId`, `ledgerId`, hashes brutos, aliases ou a
  derivação dos itens a partir de `snapshot.records`. A igualdade de
  `payloadJson` e `payload` não os vincula ao snapshot nem ao fingerprint.
- **Reprodução:** o ensaio descrito acima foi aceito com payload alterado,
  fingerprint antigo e `canonicalSet` forjado depois de recalcular apenas o
  `manifestHash`.
- **Impacto:** o preflight D1 compara a linha existente com o manifesto
  recebido, não com a auditoria original. Em um banco vazio, o artefato
  re-hashado pode criar uma linha cujo conteúdo, fingerprint e hashes alegados
  são mutuamente incoerentes e não correspondem ao snapshot apresentado. O
  status de aprovação também está dentro do mesmo documento auto-hashado; a CLI
  não recebe um hash aprovado independente.
- **Ação necessária:** vincular criptograficamente e validar novamente todos
  os derivados usados pela importação, seja reconstruindo o resultado
  canônico a partir do snapshot/decisões, seja exigindo uma referência de
  aprovação independente e verificando payload, fingerprint, conjunto, batch,
  IDs, aliases, contagens e proveniência. Acrescentar testes que recalculam o
  hash externo após adulterar cada classe de derivado e comprovam rejeição
  antes de qualquer D1.

### [High] POST local segue redirecionamento sem revalidar o destino

- **Bloqueia a missão:** Sim.
- **Evidência:** `assertLocalTarget` valida a URL inicial em
  `scripts/checkin-migration/lib/manifest.mjs:76-84`, mas
  `scripts/checkin-migration/lib/cli.mjs:40-45` chama `fetch` sem política de
  redirect. O comportamento padrão é seguir o redirecionamento.
- **Reprodução:** um endpoint inicial em `127.0.0.1` respondeu HTTP `307` para
  outro endpoint; o cliente repetiu o POST no segundo destino e retornou
  sucesso.
- **Impacto:** um serviço local comprometido, proxy ou resposta manipulada pode
  fazer o processo reenviar o snapshot bruto e o manifesto para uma URL que
  nunca passou pela restrição de protocolo/hostname. Um `307` preserva método e
  corpo. Isso viola o critério explícito de ausência de caminho por
  redirecionamento e pode expor dados de check-in.
- **Ação necessária:** recusar redirects no cliente ou revalidar cada hop antes
  de enviar corpo, mantendo somente HTTP e o hostname literal `127.0.0.1`.
  Cobrir redirects 301/302/303/307/308 para loopback alternativo, IPv6,
  hostname e destino externo sem realizar rede externa real.

## Observações não bloqueantes

### [Observation] Falhas de cleanup no caminho de setup são silenciadas

- O caminho normal valida a raiz e links antes de remover e falha caso o stop ou
  a remoção falhem.
- O `catch` de inicialização, porém, ignora erros tanto do stop quanto da
  remoção. Isso pode deixar processo ou pasta sem tornar explícita a falha de
  cleanup, embora não amplie nem force o alvo de exclusão.
- A suíte completa com ENOSPC não deixou resíduos. O timeout imposto de fora do
  processo deixou resíduos porque nenhum hook de teardown pôde executar; eles
  foram limpos de forma validada pela revisão.

### [Observation] O owner local é validado somente por prefixo

- `startsWith("local:")` rejeita identidades hospedadas, mas também aceitaria a
  chave vazia `local:` ou sufixos sem formato definido.
- Os fixtures e o uso atual empregam chaves falsas bem formadas. A observação
  não cria acesso remoto por si só, mas uma futura fase deveria explicitar o
  formato aceito antes de reutilizar o tooling com dados reais.

### [Observation] Serialização global reduz pico de memória, mas amplia duração

- `--test-concurrency=1` evita a sobreposição conhecida dos arquivos D1 e
  preserva a obrigatoriedade dos dois testes.
- A opção serializa todos os cinco arquivos da suíte, inclusive os que não usam
  Wrangler. É uma troca de portabilidade por tempo de execução, não um defeito
  funcional.
- A serialização não protege contra disco cheio e não pôde produzir uma suíte
  verde neste ambiente.

## Riscos residuais

- O tooling continua limitado a fixtures sintéticos; ainda não existe captura
  real, dupla leitura do Notion, aprovação humana de manifesto real, binding
  remoto, backup, corte ou ativação.
- O schema D1 valida apenas o formato estrutural da data. A validação de
  calendário real depende do parser e, portanto, reforça a necessidade de fechar
  o vínculo entre snapshot e itens importados.
- Aliases permanecem no manifesto e somente o `pageId` sobrevivente é gravado
  no ledger. A conservação e disponibilidade do manifesto são essenciais para
  preservar a proveniência completa das duplicatas.
- A unidade C: sem espaço torna qualquer nova prova Wrangler instável até a
  capacidade local ser restaurada; isso deve ser resolvido antes da nova rodada
  de Reviewer para distinguir resultados de código e ambiente.
- O modo operacional da aplicação continua `notion`; nenhum owner foi ativado e
  nenhuma garantia desta fase autoriza corte.

## Divergências em relação ao Builder

1. **Integridade dos artefatos:** o resultado 03 afirma validação dos hashes e
   rejeição de adulteração antes do D1. Isso foi confirmado apenas para
   alteração sem recalcular o hash autoarmazenado. Um manifesto re-hashado com
   payload e hashes derivados incoerentes foi aceito nesta revisão.
2. **Target exclusivamente local:** a validação da URL inicial foi confirmada,
   mas a afirmação não cobre o redirect seguido automaticamente pelo `fetch`.
   Há, portanto, um caminho alternativo de destino.
3. **Suíte focal da Missão 6:** o resultado 12/12 do Builder foi reproduzido.
4. **Suíte focal da Missão 5 e suíte completa:** os resultados verdes do
   Builder não puderam ser reproduzidos nesta máquina. A evidência atual é
   ambiental: timeout no focal e `ENOSPC` explícito no full suite antes dos
   Workers. Não houve falha individual das regras de negócio.
5. **`tsc --noEmit`:** a alegação do Builder foi confirmada; os dez diagnósticos
   observados estão em arquivos preexistentes e inalterados, sem diagnóstico da
   Missão 6.
6. **Cleanup:** o estado final ficou limpo, como alegado pelo Builder. A revisão
   registra, contudo, que o caminho de erro do setup silencia falha de cleanup e
   que encerramento externo do runner pode impedir totalmente o teardown.

## Handoff final

O fluxo funcional local demonstrado pelo D1 não apresentou regressão nas provas
que chegaram a executar. Os bloqueadores estão nas fronteiras de confiança que
precedem a escrita: autenticidade/coerência dos derivados do manifesto e
restrição efetiva do destino HTTP.

O veredito é **Changes requested**. O trabalho deve retornar ao Builder apenas
para os bloqueadores registrados e depois passar por nova revisão independente.
Nenhuma ação de Git, migração, acesso real, deploy ou publicação está
autorizada.
