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
escritas, regras pessoais e testes críticos. As Missões 1 a 4 estão concluídas
no fluxo atual do Notion. As Missões 5 e 6 foram concluídas e aceitas somente no
escopo local de preparação do D1; dados reais, recurso remoto e corte continuam
pendentes.

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
2. Central de Comando, protocolo original de arquivos - concluído.
3. Proteção server-side das rotas do Notion - concluído.
4. Paginação completa das movimentações financeiras - concluída.
5. Núcleo D1 local para idempotência do check-in e consistência do XP -
   concluído e aceito localmente; ativação real pendente.
6. Tooling local para auditoria, importação e reconciliação dos check-ins
   legados - concluído e aceito com dados sintéticos; execução real pendente.
7. Consolidação documental, níveis de execução e critérios da Alfa - concluída
   e aceita na Missão 7.
8. Ampliação e automação dos testes das regras críticas - evolução contínua.

## Critérios de encerramento da Alfa

A Alfa somente termina quando todos os itens abaixo estiverem comprovados no
repositório e aceitos pela Direção:

- [x] fallback, autorização e paginação das integrações atuais protegidos;
- [x] núcleo D1 de check-ins e XP validado no ambiente local;
- [x] tooling de migração validado com fixtures sintéticas e D1 local;
- [x] documentação canônica e estado das missões alinhados após a Missão 7;
- [ ] auditoria somente leitura, snapshot e backup dos check-ins reais
  executados mediante autorização crítica específica;
- [ ] importação, reconciliação e rollback comprovados no D1 remoto antes do
  corte;
- [ ] corte para D1 aprovado, executado e observado sem perda ou duplicação de
  check-ins e XP;
- [x] suíte crítica automatizada para proteger integrações futuras na `main`;
- [ ] recuperação, privacidade e comportamento do modo legado documentados e
  verificados após o corte.

O encerramento da Missão 7 não encerra automaticamente a Alfa. Ele torna os
critérios explícitos e prepara as próximas missões técnicas, que continuam
sujeitas às autorizações de nível crítico.

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

## Adição futura: Shaft Desktop com assistente integrado

**Status:** ideia registrada; ainda não planejada nem aprovada para
implementação.

### Visão futura

Criar uma versão desktop do Shaft para Windows, instalada no computador e
integrada ao sistema operacional. Ela poderá oferecer abertura rápida, bandeja
do sistema, notificações, captura de informações, arquivos locais e uma
experiência mais contínua que a PWA no navegador.

O aplicativo poderá integrar uma camada de assistência da OpenAI em dois modos
com responsabilidades distintas:

1. **Assistente do Shaft:** conversa, planejamento e uso das ferramentas do
   próprio Shaft por meio da Responses API ou de uma arquitetura de agentes.
2. **Modo técnico:** tarefas de desenvolvimento e manutenção do projeto por
   meio do Codex SDK, com threads locais iniciáveis, continuáveis e retomáveis.

A integração não deve pressupor acesso automático à identidade, ao histórico
ou à memória desta conversa no ChatGPT. Contexto pessoal, memória durável,
permissões e continuidade deverão ser projetados explicitamente pelo Shaft.

### Possibilidades técnicas a avaliar

- empacotar a interface atual com Electron ou Tauri, comparando consumo,
  acesso ao Node.js, atualização e segurança;
- manter chaves e credenciais fora da interface, em backend local protegido,
  cofre do sistema ou serviço server-side;
- separar claramente conversa pessoal, ferramentas do Shaft e agente técnico;
- exigir confirmação para ações destrutivas, externas ou sensíveis;
- permitir operação básica do aplicativo sem IA quando a conexão estiver
  indisponível;
- avaliar custos, privacidade, retenção, observabilidade e recuperação antes de
  escolher modelos e recursos.

### Estratégia de template e núcleo compartilhado

A versão desktop não deve nascer como uma cópia independente do Shaft nem de
um template genérico de produtividade. A direção preferida é criar, quando o
número de funcionalidades justificar, um **Shaft Starter** próprio para a
camada de aplicativo instalada.

Esse scaffold deverá reutilizar o núcleo estável do Shaft e fornecer somente a
infraestrutura repetitiva do desktop, como janela, menus, ícone, notificações,
atualizador, armazenamento seguro, logs, diagnóstico e limites de integração
com o sistema operacional. Regras de negócio, contratos de dados, componentes
visuais e cliente de API deverão ser compartilhados com a aplicação web sempre
que isso for seguro e sustentável.

A primeira missão dessa trilha deverá comparar uma prova de conceito pequena
em Electron Forge e Tauri, medindo pelo menos consumo de memória, tamanho do
pacote, complexidade de build, atualização, assinatura, segurança e quantidade
de código realmente reutilizada. A escolha não deve ser feita apenas pela
rapidez do scaffold inicial. Python não é requisito presumido dessa estratégia;
novos runtimes só devem ser instalados quando a tecnologia escolhida realmente
os exigir.

### Relação com o roadmap atual

Esta ideia não altera a Missão 6, a migração D1, a PWA nem a estratégia Android
e APK da versão 1.0. O Shaft Desktop será uma trilha própria, planejada somente
quando o núcleo de dados e as regras críticas estiverem estáveis. Uma futura
missão deverá começar por uma prova de conceito pequena, sem acesso irrestrito
ao computador e sem automações silenciosas.
