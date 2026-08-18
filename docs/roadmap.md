# Roadmap do Shaft

Este documento registra prioridades e possibilidades futuras do produto. Uma
ideia presente aqui não está automaticamente aprovada para implementação. Cada
missão continua seguindo o fluxo definido em `docs/agent-workflow.md`.

## Mapa visual e política de atualização

O mapa-mestre visual está no FigJam:

- [Shaft - Mapa Mestre da Evolução](https://www.figma.com/board/066j3CbS6UNbjEGTD4izE6)

Ele deve ser atualizado somente após uma grande mudança de direção, a conclusão
de uma fase, a criação de uma nova trilha estratégica ou a alteração dos
critérios da versão 1.0. O acompanhamento cotidiano continua nos relatórios das
missões; o mapa não deve virar uma lista de tarefas pequenas.

## Caminhada de versões

### Alfa - confiabilidade e estabilização

É a fase atual. Busca tornar seguros e previsíveis os dados, sincronizações,
escritas, regras pessoais e testes críticos. As Missões 1 a 4 estão concluídas.

### Beta - sistema vivo e extensível

Começa quando as regras críticas estiverem confiáveis. Deve aproximar o Shaft
de um sistema que acompanha as alterações do dia sem reconstruções manuais,
com dados atuais, sincronização frequente, aplicativo modular, atualização
segura da PWA e uma estrutura simples para acrescentar novas funções.

### Versão 1.0 - aplicativo pessoal completo

A versão 1.0 exige, no mínimo:

- atualização confiável dos dados do dia;
- regras críticas protegidas por testes;
- inclusão de novas áreas sem grandes refatorações;
- instalação e atualização estáveis;
- estratégia Android definida e APK validado;
- privacidade, recuperação e integridade de dados verificadas;
- aprovação final por uso cotidiano real, não apenas por build técnico.

## Estabilização atual

1. Fallback e validação do dashboard do Notion - concluído.
2. Central de Comando Nível 1 - concluído.
3. Proteção server-side das rotas do Notion - concluído.
4. Paginação completa das movimentações financeiras - concluída.
5. Idempotência do check-in e consistência do XP - futura missão de
   estabilização.
6. Ampliação dos testes das regras críticas - evolução contínua.

## Direção aprovada: D1 como núcleo de dados

O Shaft adotará gradualmente o D1 como fonte canônica dos dados centrais. A
migração começa por check-ins e XP, onde unicidade, concorrência e ordem lógica
exigem garantias transacionais que o Notion não oferece no fluxo atual.

O Notion ficará fora do caminho crítico dos domínios migrados. Durante cada
transição ele poderá permanecer como fonte legada somente leitura; depois do
corte, poderá servir opcionalmente para consultas humanas, relatórios ou
exportações assíncronas. Essas operações não serão condição para confirmar uma
escrita no Shaft.

A evolução será dividida em missões independentes:

1. check-ins e XP;
2. finanças;
3. treinos e cargas;
4. demais dados centrais que demonstrarem benefício real.

Cada domínio exige auditoria, importação, reconciliação, backup e corte
verificados antes de abandonar sua fonte legada. Não haverá migração total em
uma única etapa nem exclusão automática de dados do Notion.

## Adição futura: integração financeira automática

**Status:** ideia registrada; ainda não planejada nem aprovada para
implementação.

### Objetivo futuro

Reduzir o registro manual de movimentações financeiras e permitir que o Shaft
receba, concilie e categorize transações com segurança.

### Evolução preferida

1. Começar por importação controlada de arquivos OFX ou CSV.
2. Avaliar integração com um aplicativo financeiro intermediário que ofereça
   API, webhook ou exportação confiável.
3. Se houver benefício suficiente, avaliar um parceiro autorizado de Open
   Finance para sincronização automática mediante consentimento.
4. Para volume e automação maiores, considerar um banco de dados próprio do
   Shaft como fonte financeira principal, mantendo o Notion como camada de
   organização humana e resumos.

### Requisitos indispensáveis

- nunca armazenar senha bancária nem automatizar por raspagem do internet
  banking;
- usar consentimento oficial e integração autorizada quando houver conexão
  bancária;
- proteger tokens e dados financeiros somente no servidor;
- usar identificadores estáveis para impedir transações duplicadas;
- prever conciliação, categorização, correção manual e trilha de origem;
- definir claramente a fonte principal antes de sincronizar Notion e banco de
  dados próprio;
- investigar custos, cobertura das instituições, renovação de consentimento,
  privacidade e portabilidade antes de escolher um fornecedor.

### Relação com o trabalho atual

Esta ideia não altera a Missão 4. Enquanto o Notion for a fonte financeira
ativa, a paginação completa continua necessária para evitar saldo parcial. A
integração automática deverá ser tratada futuramente como missão própria, com
investigação, plano, aprovação humana, Builder, Reviewer e migração segura.

A migração interna das finanças do Notion para o D1 pertence à direção de
arquitetura de dados e também exigirá missão própria. Ela é independente de uma
futura conexão bancária por OFX, CSV, aplicativo intermediário ou Open Finance.
