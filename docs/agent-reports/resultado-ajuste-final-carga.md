# Resultado do ajuste final de carga

**Data:** 13 de agosto de 2026  
**Escopo:** formulário de confirmação de treino e validação local de carga

## Resultado

Os dois pontos restantes da revisão foram corrigidos sem alterar backend, integração com o Notion, autenticação, banco de dados ou concorrência do dashboard.

- O campo de carga agora preserva o texto digitado durante a edição. Campo apagado ou valor inválido permanece vazio/inválido, bloqueia o botão **Salvar treino** e não é convertido silenciosamente para `0`.
- Exercícios de **Peso corporal** mantêm essa identificação no formulário, exibem “Peso corporal” e “Sem carga externa”, não mostram um campo numérico com `0 kg` e não oferecem aumento de `+5 kg`.
- Uma carga numérica real de `0 kg` continua sendo aceita e permanece semanticamente diferente de **Peso corporal**.
- Os formatos de carga anteriormente aprovados foram mantidos.

## Arquivos alterados

- `app/ShaftApp.tsx`: passou a usar o estado textual validado da carga, bloquear confirmação inválida e renderizar o estado específico de Peso corporal.
- `app/lib/dashboard-state.ts`: preserva o tipo da carga (`weight` ou `bodyweight`) e concentra as funções puras usadas para criar, atualizar, validar e converter os itens do formulário.
- `app/globals.css`: estilos mínimos para a apresentação de Peso corporal no formulário.
- `tests/rendered-html.test.mjs`: atualiza as expectativas do tipo de carga e adiciona cobertura para campo apagado, texto inválido, carga válida, zero real e Peso corporal.
- `docs/agent-reports/resultado-ajuste-final-carga.md`: este relatório.

## Validações executadas

1. Lint direcionado:
   - `pnpm exec eslint app/ShaftApp.tsx app/lib/dashboard-state.ts tests/rendered-html.test.mjs`
   - Resultado: aprovado, sem erros.
2. Lint completo:
   - `pnpm exec eslint . --ignore-pattern dist --ignore-pattern .next --ignore-pattern work`
   - Resultado: aprovado, sem erros.
3. Build:
   - `pnpm run build`
   - Resultado: aprovado; build do Vinext concluído.
4. Testes:
   - `pnpm test`
   - Resultado: **6 testes aprovados, 0 falhas**. O comando também executou um novo build com sucesso.

## Casos acrescentados aos testes

- Apagar uma carga mantém `""`, torna o formulário inválido e impede a criação do payload.
- Digitar texto arbitrário mantém o texto inválido, torna o formulário inválido e impede a criação do payload.
- Uma carga válida em incremento de `0,5 kg` volta a permitir a confirmação.
- Peso corporal permanece identificado separadamente de uma carga numérica real de `0 kg`.
- Uma tentativa de editar a carga de um exercício de Peso corporal não altera sua semântica.

## Problemas encontrados

Nenhum problema bloqueador foi encontrado nas validações. O aviso informativo do Vinext sobre classificação estática de algumas rotas permaneceu no build e não está relacionado a esta alteração.

Não houve publicação nem alteração de infraestrutura.
