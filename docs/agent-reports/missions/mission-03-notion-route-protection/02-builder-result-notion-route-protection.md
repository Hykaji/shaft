# Resultado do Builder: proteção server-side das rotas do Notion

**Data:** 14 de agosto de 2026  
**Missão:** `mission-03-notion-route-protection`  
**Papel:** Builder  
**Plano aprovado:** `docs/agent-reports/missions/mission-03-notion-route-protection/01-builder-plan-notion-route-protection.md`  
**Status:** Pronto para revisão

## Resultado

As quatro rotas ativas do Notion agora executam um guard compartilhado antes de
ler o corpo da requisição ou chamar a API do Notion. O guard reutiliza a
identidade fornecida pelo OpenAI Sites e exige correspondência com a lista de
proprietários configurada no servidor.

O comportamento implementado é:

- `401` para pedido sem identidade autenticada;
- `403` para usuário autenticado fora da lista permitida;
- `503` quando nenhuma lista de proprietários está configurada;
- acesso permitido quando ID ou e-mail corresponde à lista;
- acesso local permitido apenas fora de produção e somente para endereço
  loopback.

As respostas negadas não expõem IDs, e-mails ou valores de configuração e usam
`Cache-Control: private, no-store`.

## Arquivos alterados

- `app/lib/shaft-access-policy.ts`: nova política pura de parsing, autorização
  e reconhecimento seguro de desenvolvimento local.
- `app/chatgpt-auth.ts`: novo guard de API que combina identidade do Sites,
  listas do ambiente e respostas seguras.
- `app/api/notion/dashboard/route.ts`: guard antes de qualquer leitura.
- `app/api/notion/checkins/route.ts`: guard antes do JSON e de qualquer leitura
  ou escrita.
- `app/api/notion/finance/route.ts`: guard antes do JSON e da criação da
  movimentação.
- `app/api/notion/training/route.ts`: guard antes do JSON e das atualizações.
- `.env.example`: nomes das listas permitidas, sem dados reais.
- `README.md`: política, configuração hospedada e comportamento local.
- `package.json`: inclusão da nova suíte no comando de teste existente.
- `tests/shaft-access-policy.test.mjs`: testes puros e integrados de acesso.
- documentação da Missão 3: plano, índice e este resultado.

## Conformidade com o escopo

Não foram alterados interface, `app/page.tsx`, `app/ShaftApp.tsx`, Notion,
schema, banco, D1, R2, regras de XP, paginação, dados, `.env.local`, valores
hospedados ou configuração do projeto Sites. Nenhuma dependência foi adicionada
e não houve publicação, push, merge ou commit.

## Validações realizadas

1. Lint direcionado dos arquivos de autenticação, política, quatro rotas e
   testes: aprovado.
2. Lint completo, ignorando apenas artefatos gerados já conhecidos: aprovado.
3. Build completo do vinext/Vite: aprovado.
4. Suíte completa: **12 testes aprovados**, nenhum teste falhou.
5. Testes integrados confirmaram `401` nas quatro rotas antes do processamento.
6. Testes integrados confirmaram `503` sem configuração e `403` para usuário
   autenticado não permitido.
7. Testes puros confirmaram acesso por ID, acesso por e-mail sem diferença de
   maiúsculas, parsing de listas, configuração vazia e restrição do bypass
   local.
8. Busca final confirmou o uso do guard nas quatro rotas ativas sob
   `app/api/notion/`.
9. Revisão de escopo não encontrou arquivos inesperados.

Os testes de negação não chamaram o Notion real nem exibiram segredos.

## Limitações e riscos restantes

- Antes de uma publicação futura, o ambiente hospedado deverá receber
  `SHAFT_ALLOWED_USER_IDS` ou `SHAFT_ALLOWED_USER_EMAILS`; sem isso, as rotas
  falharão fechado com `503`.
- A página principal continua pública no nível da aplicação, conforme o escopo.
  Quando a política externa do Sites exigir login, ela continua protegida por
  essa camada; independentemente disso, as APIs pessoais agora possuem sua
  própria autorização.
- O identificador estável é preferível ao e-mail. O e-mail existe como fallback
  prático, mas pode exigir atualização se a conta mudar.
- A mensagem visual específica para `401` ou `403` não foi adicionada; a
  interface usa os fluxos de indisponibilidade e erro já existentes.

## Handoff ao Reviewer

O Reviewer deve verificar especialmente:

- se todos os caminhos de leitura e escrita passam pelo guard antes de efeitos
  colaterais;
- se cabeçalhos do cliente não substituem a decisão server-side fora do modelo
  de confiança do Sites;
- se a precedência `401` / `503` / `403` é segura e não revela configuração;
- se a exceção local não pode ser ativada em produção ou em host remoto;
- se IDs e e-mails são comparados de modo adequado;
- se os testes realmente falham antes de qualquer acesso ao Notion;
- se os limites aprovados foram respeitados.

Este resultado não autoriza commit, push, merge ou publicação.
