# Shaft

Shaft é uma aplicação pessoal de produtividade e organização da vida. O projeto
centraliza check-ins, XP, treinos, finanças e painéis pessoais em uma PWA com
interface escura e foco em uso individual.

O produto está na fase **Alfa**, dedicada à confiabilidade dos dados, proteção
das rotas, regras críticas e preparação da migração gradual do Notion para um
núcleo próprio no Cloudflare D1.

## Estado atual

- dashboard, check-ins, treinos e finanças continuam disponíveis pela integração
  existente com o Notion;
- as rotas do Notion possuem autenticação e autorização server-side;
- consultas financeiras percorrem todas as páginas antes de calcular o saldo;
- o núcleo D1 de check-ins e XP está implementado e aceito somente no ambiente
  local;
- o tooling local para auditar, importar e reconciliar check-ins legados está
  implementado e aceito com dados sintéticos;
- o modo padrão continua `notion`;
- nenhum owner real, D1 remoto, importação real, corte ou deploy da migração foi
  autorizado.

O histórico verificável das entregas fica em
[`docs/agent-reports/missions/`](docs/agent-reports/missions/). O roadmap do
produto está em [`docs/roadmap.md`](docs/roadmap.md).

## Arquitetura atual

- **Interface:** React 19, Vinext e Tailwind CSS;
- **Aplicação:** PWA full-stack com rotas server-side em `app/api/`;
- **Identidade:** cabeçalhos de identidade do OpenAI Sites e allowlist do Shaft;
- **Dados atuais:** Notion no caminho padrão;
- **Núcleo em transição:** Cloudflare D1 e Drizzle para check-ins e XP;
- **Hospedagem:** OpenAI Sites com binding D1 declarado como `DB`;
- **Qualidade:** build, ESLint e testes Node cobrindo acesso, paginação,
  idempotência e tooling de migração.

O D1 será adotado por domínio, não por uma migração total de uma só vez. Durante
cada transição, o Notion poderá permanecer como fonte legada somente leitura.
Dados reais exigem auditoria, backup, reconciliação, rollback e autorização
específica antes de qualquer corte.

## Requisitos

- Node.js `>=22.13.0`;
- variáveis locais e segredos configurados fora do repositório;
- acesso ao Notion somente quando necessário para o modo atual.

Nunca registre tokens, credenciais, dados pessoais ou conteúdo de `.env` no
Git, nos relatórios das missões ou em prompts de agentes.

## Desenvolvimento local

```bash
npm install
npm run dev
```

Comandos principais:

- `npm run dev`: inicia o ambiente local;
- `npm run build`: gera e valida o build;
- `npm run lint`: executa a análise estática;
- `npm test`: executa o build e a suíte completa de testes;
- `npm run test:checkin-idempotency`: valida o núcleo D1 de check-ins e XP;
- `npm run test:checkin-migration`: valida o tooling local de migração;
- `npm run db:generate`: gera migrações Drizzle após alterações aprovadas de
  schema.

Os comandos `checkin-migration:*` são ferramentas controladas. A existência
deles não autoriza acesso ao Notion real, D1 remoto ou migração de dados.

## Configuração de acesso

As rotas em `app/api/notion/` exigem identidade autenticada e correspondência
com uma allowlist server-side:

- `SHAFT_ALLOWED_USER_IDS`: IDs estáveis separados por vírgula;
- `SHAFT_ALLOWED_USER_EMAILS`: e-mails autorizados separados por vírgula.

IDs são preferíveis. Sem allowlist em produção, as rotas falham de forma
fechada antes de analisar o corpo ou acessar o Notion.

O modo de armazenamento dos check-ins é controlado por
`SHAFT_CHECKIN_STORE`. Na ausência do valor explícito `d1`, o Shaft preserva o
modo `notion`. Não altere esse padrão nem configure dados reais sem uma missão
crítica aprovada.

## Central de Comando

O projeto segue as regras de [`AGENTS.md`](AGENTS.md) e o processo descrito em
[`docs/agent-workflow.md`](docs/agent-workflow.md). O trabalho é classificado
como leve, supervisionado ou crítico para equilibrar economia de repasses e
revisão independente proporcional ao risco.

O repositório é a fonte técnica durável. Conversas e históricos de terminal
podem ajudar, mas decisões importantes devem ser registradas junto da missão
correspondente.
