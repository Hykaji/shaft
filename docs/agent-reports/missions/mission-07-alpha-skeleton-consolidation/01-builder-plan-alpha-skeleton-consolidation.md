# Builder: plano de consolidação do esqueleto da Alfa

**Data:** 19 de agosto de 2026

**Missão:** `mission-07-alpha-skeleton-consolidation`

**Classificação:** Nível 1 - leve

## Evidência inicial

- `README.md` ainda descreve o starter Vinext, não o Shaft;
- `docs/roadmap.md` registra somente as Missões 1 a 4 como concluídas e chama a
  idempotência do check-in de futura, apesar das aceitações locais das Missões
  5 e 6;
- `docs/agent-reports/README.md` não lista as Missões 5 e 6;
- os níveis leve, supervisionado e crítico ainda não estão formalizados;
- não há critérios objetivos de encerramento da Alfa;
- `docs/roadmap.md` contém uma alteração local legítima e ainda não commitada
  sobre o futuro Shaft Desktop, que deve ser preservada.

## Escopo aprovado

- atualizar `README.md` com identidade, arquitetura, estado, comandos e limites
  reais do Shaft;
- resumir os três níveis em `AGENTS.md` e detalhá-los em
  `docs/agent-workflow.md`;
- corrigir o estado da Alfa e registrar critérios de encerramento em
  `docs/roadmap.md`, preservando integralmente as ideias futuras;
- incluir as Missões 5, 6 e 7 em `docs/agent-reports/README.md`;
- criar e manter os documentos desta missão.

## Fora de escopo

- código do aplicativo, estilos, testes, dependências ou configuração runtime;
- schema, banco, autenticação, integrações, dados reais ou segredos;
- D1 remoto, migração, corte, deploy ou publicação;
- commit, push, PR ou merge;
- atualização do FigJam, reservada para mudanças estratégicas maiores.

## Riscos

- declarar como concluída uma capacidade apenas preparada localmente;
- transformar ideia futura em aprovação implícita;
- enfraquecer a revisão independente em tarefas críticas;
- sobrescrever a alteração local do Shaft Desktop.

## Validação

- revisar o diff completo e confirmar que somente documentação foi alterada;
- verificar links Markdown locais;
- procurar estados contraditórios sobre Missões 5 e 6, modo padrão, dados reais
  e D1 remoto;
- confirmar que toda mudança crítica continua exigindo papéis separados e
  aprovação explícita;
- confirmar que a anotação do Shaft Desktop permanece no roadmap.
