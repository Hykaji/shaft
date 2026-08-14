# Auditoria inicial do Shaft

**Data da auditoria:** 12 de agosto de 2026  
**Projeto inspecionado:** `D:\Aplicativos\Modo Eixo App`  
**Tipo de trabalho:** inspeção somente de leitura do código, configurações, documentação, estrutura de pastas e estado local do Git.  
**Escopo desta entrega:** registrar integralmente a auditoria técnica inicial e o plano de estabilização decorrente dela. Nenhum código da aplicação foi alterado para produzir este relatório.

## 1. Contexto do projeto

O Shaft é um aplicativo pessoal de produtividade e organização da vida. De acordo com o `AGENTS.md`, sua intenção é centralizar tarefas, organização pessoal, estudos, cursos, projetos, notas, metas, hábitos, planejamento e painéis pessoais.

O produto ainda está evoluindo. As instruções persistentes do projeto determinam que mudanças relevantes sejam explicadas antes de serem realizadas, que sistemas existentes sejam reaproveitados, que dados e integrações sejam preservados e que mudanças de arquitetura, banco de dados, autenticação, integrações externas, publicação, migrações destrutivas ou grandes refatorações aguardem aprovação humana.

A identidade visual definida é escura e minimalista, com fundo preto, vermelho-lagosta como cor de destaque, layouts limpos e uma linguagem moderna levemente futurista. Existe também uma direção visual futura, ainda não aprovada para implementação, que considera referências vitorianas e steampunk usadas com moderação.

O aplicativo já havia sido renomeado de Modo Eixo para Shaft. O nome visível e o pacote usam Shaft, mas a pasta física ainda se chama `Modo Eixo App`. A configuração local do Sites contém um projeto existente. Registros anteriores indicam que houve uma publicação privada e um repositório GitHub privado, mas esta auditoria não verificou ao vivo se a visibilidade externa continua igual.

## 2. Método e limites da auditoria

Foram inspecionados:

- `AGENTS.md` e a documentação disponível;
- estrutura de pastas e arquivos, excluindo a leitura exaustiva de dependências e artefatos compilados;
- `package.json`, lockfiles e configurações de TypeScript, ESLint, Vite, vinext, Drizzle e Sites;
- frontend React e CSS;
- rotas de backend que acessam o Notion;
- worker da Cloudflare;
- preparação existente para D1;
- manifestos, service workers e arquivos de PWA;
- scripts PowerShell de configuração, teste e publicação;
- testes existentes;
- estado local do Git, histórico recente, remoto configurado e arquivos ignorados;
- chaves de ambiente existentes, observando apenas os nomes das variáveis, nunca o valor do segredo.

Não foram executados build, testes ou lint porque esses comandos podem criar ou atualizar arquivos locais. Também não foram realizadas chamadas reais à API do Notion, publicação, escrita externa ou verificação online do Sites e do GitHub.

## 3. Resumo arquitetural

O Shaft é um aplicativo web full stack: frontend e backend ficam no mesmo projeto.

O fluxo principal é:

1. O navegador renderiza a interface React definida em `app/ShaftApp.tsx`.
2. A interface chama rotas internas, como `/api/notion/dashboard`, `/api/notion/checkins`, `/api/notion/finance` e `/api/notion/training`.
3. Essas rotas rodam no servidor, leem `NOTION_API_KEY` do ambiente e chamam a API do Notion.
4. As bases do Notion armazenam check-ins, XP, semanas, movimentações financeiras, exercícios, sessões de treino e cargas.
5. O vinext gera a aplicação compatível com o modelo do Next.js e o worker da Cloudflare atende as requisições publicadas.

Embora Drizzle ORM, SQLite e Cloudflare D1 estejam presentes, o D1 não está ativo. O banco efetivamente usado pelo produto é o Notion.

## 4. Tecnologias encontradas

### 4.1 TypeScript

É a linguagem principal do frontend, backend e worker. O projeto usa configuração estrita em `tsconfig.json`, não gera JavaScript diretamente pelo TypeScript e delega o empacotamento ao Vite/vinext.

### 4.2 React 19

A interface usa React 19. O componente principal é um client component e concentra estado, navegação, formulários e chamadas HTTP.

### 4.3 vinext e Vite

O projeto usa `vinext 1.0.0-beta.2` sobre Vite. Isso oferece uma estrutura compatível com App Router, componentes e rotas no estilo Next.js, mas voltada para a execução no ecossistema Cloudflare.

### 4.4 Cloudflare Workers e OpenAI Sites

`worker/index.ts` é a entrada do worker. Ele delega a aplicação ao handler do vinext e trata otimização de imagens. `.openai/hosting.json` identifica o projeto do Sites. Um plugin local em `build/sites-vite-plugin.ts` copia os metadados de publicação e as migrações Drizzle para a saída de build.

### 4.5 Notion API

É a integração de dados central do Shaft. A aplicação consulta e modifica bases do Notion usando um token privado disponível apenas no servidor como `NOTION_API_KEY`.

### 4.6 Drizzle ORM, SQLite e Cloudflare D1

As dependências e arquivos de configuração existem, mas `db/schema.ts` está vazio e `.openai/hosting.json` declara `d1: null`. `db/index.ts` somente seria utilizável se um binding `DB` fosse configurado. O conteúdo em `examples/d1` é exemplo, não funcionalidade ativa.

### 4.7 CSS e Tailwind

A interface ativa usa CSS puro em `app/globals.css`, com variáveis de cor e seletores escritos manualmente. Tailwind e seu plugin PostCSS estão instalados, mas não foram encontrados utilitários Tailwind sendo usados na aplicação.

### 4.8 PWA

Existem ícones, manifesto web e service worker. Entretanto, a aplicação React principal não registra claramente o service worker, e existem cópias diferentes desses arquivos na raiz e em `public`.

### 4.9 ESLint e testes Node

O ESLint combina regras de JavaScript, TypeScript, React, hooks, acessibilidade e regras do Next. Os testes usam o test runner nativo do Node e verificam renderização server-side e consistência básica da identidade Shaft.

### 4.10 Gerenciamento de dependências

O projeto contém `pnpm-lock.yaml`, `pnpm-workspace.yaml` e `package-lock.json`. A preparação de publicação prefere um pnpm fornecido pelo runtime do Codex, enquanto alguns comandos documentados usam npm.

## 5. Estrutura das principais pastas

### `app/`

É o núcleo da aplicação. Contém layout, página inicial, componente principal, CSS, helper de autenticação, biblioteca do Notion e rotas HTTP.

### `app/api/notion/`

Contém o backend específico do Notion:

- `dashboard/route.ts`: monta os dados exibidos no painel;
- `checkins/route.ts`: cria check-ins e calcula XP e nível;
- `finance/route.ts`: cria movimentações financeiras;
- `training/route.ts`: confirma sessão de treino, cargas e sugestões de aumento.

### `app/lib/`

Contém `notion.ts`, que centraliza token, versão da API, IDs das fontes de dados, requisições, tratamento de erro e conversão de propriedades.

### `public/`

Contém arquivos servidos diretamente ao navegador: ícones, favicon, manifesto e service worker.

### `worker/`

Contém a entrada do Cloudflare Worker e o tratamento de otimização de imagens.

### `db/`

Contém a preparação para D1 e Drizzle. Não possui tabelas ativas.

### `drizzle/`

Contém o diário de migrações. O diário existe, mas não possui entradas de migração.

### `build/`

Apesar do nome, contém código-fonte necessário ao processo de publicação: `sites-vite-plugin.ts`. Esse arquivo não deve ser tratado automaticamente como um artefato descartável.

### `scripts/`

Contém automações PowerShell para:

- configurar o token do Notion por meio da área de transferência;
- testar leitura do Notion;
- testar escrita criando e enviando uma página temporária para a lixeira;
- migrar o projeto para o disco D;
- instalar dependências e preparar build para publicação.

### `tests/`

Contém atualmente um arquivo de testes de renderização e identidade.

### `examples/`

Contém um exemplo opcional de tabela e rotas usando D1. Não é importado pela aplicação ativa.

### `docs/`

Antes deste relatório, continha apenas `direcao-visual-futura.md`. Os documentos `architecture.md`, `roadmap.md` e `docs/decisions/` citados pelo `AGENTS.md` não existiam.

### Diretórios gerados e locais

- `.next`: metadados intermediários;
- `dist`: saída compilada;
- `.wrangler`: estado local do Wrangler/Cloudflare;
- `work`: logs, arquivos temporários e pacotes de publicação;
- `node_modules`: dependências instaladas;
- `.pnpm-store`: armazenamento local do pnpm.

Na data da inspeção, `node_modules` e `.pnpm-store` ocupavam juntos aproximadamente 825 MB. `work` possuía aproximadamente 27 MB. Esses diretórios estavam ignorados pelo Git.

## 6. Organização do frontend

`app/page.tsx` apenas renderiza `ShaftApp`. `app/layout.tsx` define idioma, título, descrição, viewport, cor de tema, manifesto e ícones.

`app/ShaftApp.tsx` concentra quase toda a interface. Ele oferece quatro abas:

- Hoje;
- Diário;
- Treinos;
- Finanças.

O mesmo arquivo também contém:

- tipos de dados;
- estado de navegação;
- estado de sincronização;
- carregamento do dashboard;
- função genérica de salvamento;
- notificações;
- tela Hoje;
- tela Diário;
- tela Treinos;
- tela Finanças;
- formulário de check-in;
- formulário financeiro;
- formulário de treino;
- componentes reutilizados de campo, seleção, texto e métrica.

O CSS está concentrado em `app/globals.css`. A interface é desenhada principalmente para uma largura semelhante à de celular, com limite de 480 pixels, barra inferior fixa, cartões escuros, cor coral/vermelho-lagosta e alguns ajustes para telas maiores.

## 7. Organização do backend

As rotas em `app/api/notion` são funções server-side. A interface envia JSON e recebe JSON.

### Dashboard

Consulta, em paralelo:

- último check-in criado;
- semana marcada como ativa;
- até 100 movimentações financeiras;
- até 100 exercícios ativos.

Depois calcula XP, nível e saldo e prepara os dados que o frontend exibe.

### Check-ins

Valida valores aceitos, escolhe a data atual no fuso `America/Sao_Paulo` quando necessário, verifica se já existe check-in naquela data, busca o check-in criado mais recentemente, calcula XP e cria uma página no Notion.

### Finanças

Valida tipo, categoria, meio, necessidade, valor e descrição. Usa a data atual quando o frontend não envia uma data e cria uma página na fonte financeira.

### Treinos

Busca a sessão planejada mais recente, consulta os registros de carga relacionados, tenta associar cada exercício pelo começo do título do registro, atualiza as cargas e finalmente atualiza o status da sessão.

## 8. Organização dos dados

O Notion contém fontes de dados com IDs fixos para:

- atividades;
- check-ins;
- semanas;
- finanças;
- exercícios;
- sessões;
- cargas.

Além dos IDs, o código depende de nomes exatos de propriedades, como `Data`, `XP total`, `Status`, `Valor`, `Tipo`, `Exercício`, `Carga atual kg` e outras.

O token do Notion está representado apenas por `NOTION_API_KEY`. `.env.local` está ignorado e não está rastreado pelo Git. `.env.example` informa apenas o nome necessário da variável.

Não há banco D1 em uso. Portanto, não há transações de banco, restrições de unicidade ou esquema local protegendo as regras de dados.

## 9. Integrações existentes

### 9.1 Notion

Integração ativa de leitura e escrita. É responsável pelos dados que deveriam ser persistentes.

### 9.2 OpenAI Sites

Há configuração de projeto em `.openai/hosting.json` e empacotamento específico dentro do build. Registros anteriores indicam publicação privada bem-sucedida, mas o estado online não foi revalidado nesta auditoria.

### 9.3 Cloudflare Workers

É o runtime do servidor gerado pelo vinext. A configuração também prevê bindings D1 e R2, mas ambos estão nulos no arquivo atual.

### 9.4 Sign in with ChatGPT

`app/chatgpt-auth.ts` contém funções para ler cabeçalhos de usuário, exigir login e construir caminhos seguros de entrada e saída. Nenhuma tela ou rota ativa importa esse helper.

### 9.5 GitHub

O remoto local `origin` aponta para `https://github.com/Hykaji/shaft.git`. A branch local `main` acompanhava `origin/main` no momento da inspeção. Registros anteriores indicam que o repositório era privado; isso não foi verificado online nesta auditoria.

### 9.6 PWA

Existem manifesto, ícones e service worker. A integração está incompleta devido à ausência de registro claro do worker na aplicação React e à duplicidade de arquivos.

## 10. Arquivos mais importantes

### `AGENTS.md`

Contexto técnico persistente, regras de comportamento, identidade visual e exigência de aprovação para mudanças grandes. No momento da inspeção, era o único arquivo não rastreado pelo Git.

### `package.json`

Define versões, scripts, dependências e requisito de Node `>=22.13.0`.

### `app/ShaftApp.tsx`

Contém quase toda a experiência do usuário e comunicação do frontend com o backend.

### `app/globals.css`

Contém toda a identidade visual ativa e comportamento responsivo.

### `app/lib/notion.ts`

É o núcleo da integração com o Notion e contém os IDs das fontes de dados.

### `app/api/notion/*/route.ts`

Contêm as regras de negócio que criam ou consultam dados pessoais.

### `vite.config.ts`

Monta vinext, plugin do Sites e plugin Cloudflare. Também prepara bindings locais opcionais.

### `worker/index.ts`

Entrada de execução da aplicação publicada.

### `.openai/hosting.json`

Identifica o projeto no Sites e informa que D1 e R2 não estão ativos.

### `build/sites-vite-plugin.ts`

Empacota configuração do Sites e migrações após o build.

### `app/chatgpt-auth.ts`

Helper de autenticação existente, porém ainda desconectado da aplicação.

### `db/index.ts`, `db/schema.ts` e `drizzle.config.ts`

Fundação inativa para D1/Drizzle.

### `tests/rendered-html.test.mjs`

Único conjunto de testes atual.

### `README.md`

Documentação ainda baseada no starter genérico do vinext, não em uma visão real do Shaft.

## 11. Pontos positivos observados

- O segredo do Notion não está no código-fonte e `.env.local` está ignorado.
- O frontend não recebe diretamente o token do Notion.
- As rotas fazem validação básica de campos, limites numéricos e tamanhos de texto.
- O fuso de São Paulo é usado para definir a data dos check-ins e finanças.
- Há tratamento especial para limite de requisições `429` do Notion, com uma única tentativa adicional.
- O cálculo de XP nunca produz XP negativo.
- A linguagem da interface procura evitar punição por tarefas não planejadas.
- O script de teste de escrita tenta limpar imediatamente a página temporária e interrompe novas tentativas quando a limpeza falha.
- O helper de autenticação valida caminhos relativos para reduzir risco de redirecionamento aberto.
- Artefatos gerados, dependências, arquivos de ambiente e trabalho temporário estão ignorados pelo Git.
- O projeto possui build publicado anteriormente e testes mínimos de identidade, em vez de não possuir nenhuma verificação.

## 12. Problemas, riscos e observações detalhadas

### 12.1 Dados antigos aparecem como se fossem atuais

`fallbackNotion` contém data de sincronização, semana, saldo, check-in e exercícios antigos. Quando `/api/notion/dashboard` falha, a aplicação mantém esses dados na tela.

**Risco:** informações fictícias ou antigas podem ser interpretadas como dados reais.

**Impacto para o usuário:** decisões financeiras, leitura de progresso e percepção da rotina podem se basear em valores incorretos.

**Arquivos relacionados:**

- `app/ShaftApp.tsx`;
- `app/globals.css`.

**Observação:** o texto “Notion conectado” continua visível mesmo quando `live` é falso. Só a frase secundária muda. O estado deveria dizer explicitamente que a sincronização falhou.

### 12.2 Grande parte do painel Hoje é fixa

A data “Quarta, 5 de agosto”, o tipo de dia, metas de horário, Linha Vermelha, dia de descanso, próximo treino e treino pendente estão escritos diretamente no JSX.

**Risco:** o painel envelhece e contradiz o estado real.

**Impacto para o usuário:** a tela central perde confiança e utilidade diária.

**Arquivos relacionados:**

- `app/ShaftApp.tsx`;
- `app/api/notion/dashboard/route.ts`;
- `app/lib/notion.ts`.

**Observação:** tornar todos os blocos dinâmicos de uma vez não é necessário. Data atual e treino pendente são os candidatos iniciais.

### 12.3 Conteúdo financeiro parcialmente fixo

As datas 15 e 30 e os cartões de pagamento habitual são estáticos. O backend não fornece essas informações.

**Risco:** datas podem ser entendidas como compromissos confirmados quando são apenas texto de interface.

**Impacto para o usuário:** expectativa incorreta sobre recebimentos.

**Arquivos relacionados:**

- `app/ShaftApp.tsx`;
- possível fonte futura de planejamento no Notion.

**Observação:** o texto reconhece que valores são variáveis, mas não distingue completamente previsão de compromisso confirmado.

### 12.4 Ação chamada de diário por voz não usa voz

Os botões dizem “Iniciar diário” e usam símbolos de microfone, mas abrem um formulário convencional. Não há captura de áudio nem API de voz.

**Risco:** expectativa de funcionalidade inexistente.

**Impacto para o usuário:** confusão ao iniciar o check-in.

**Arquivos relacionados:**

- `app/ShaftApp.tsx`;
- `app/globals.css`.

**Observação:** a promessa de não salvar áudio está correta, porém hoje nenhum áudio chega a ser capturado.

### 12.5 Rotas dependem da privacidade externa do Sites

As rotas que escrevem no Notion não verificam usuário nem autorização. O helper de Sign in with ChatGPT existe, mas não é usado.

**Risco:** se a política do Sites for alterada ou o projeto for publicado de forma pública, qualquer visitante capaz de chamar as rotas poderá tentar modificar os dados pessoais.

**Impacto para o usuário:** check-ins, finanças, treinos e cargas podem ser alterados ou poluídos.

**Arquivos relacionados:**

- `app/chatgpt-auth.ts`;
- todas as rotas em `app/api/notion`;
- possivelmente `app/page.tsx`.

**Observação:** enquanto a barreira privada externa estiver corretamente ativa, o risco prático é menor, mas permanece uma defesa de camada única. Qualquer alteração de autenticação exige aprovação humana prévia conforme o `AGENTS.md`.

### 12.6 O saldo financeiro considera no máximo 100 registros

O dashboard consulta `page_size: 100` e não segue cursor de paginação.

**Risco:** depois de 100 movimentações, registros adicionais podem não participar do saldo.

**Impacto para o usuário:** saldo exibido incorreto.

**Arquivos relacionados:**

- `app/lib/notion.ts`;
- `app/api/notion/dashboard/route.ts`;
- testes futuros.

**Observação:** a função `query` informa `has_more`, mas não retorna nem utiliza `next_cursor`, o que também impede paginação genérica.

### 12.7 O check-in pode sofrer corrida e duplicidade

A rota primeiro consulta se já existe um check-in para a data e só depois cria a página. Duas requisições simultâneas podem passar pela verificação antes de qualquer uma criar o registro.

**Risco:** dois check-ins para o mesmo dia e totais de XP concorrentes.

**Impacto para o usuário:** XP ou nível incorretos e histórico duplicado.

**Arquivos relacionados:**

- `app/api/notion/checkins/route.ts`;
- `app/lib/notion.ts`;
- testes futuros.

**Observação:** o Notion não fornece as mesmas restrições e transações de um banco relacional. A solução precisará priorizar idempotência e detecção/reconciliação.

### 12.8 O XP anterior é escolhido pelo horário de criação

A rota busca o check-in criado mais recentemente e usa seu campo `XP total`. Isso não garante que o registro tenha a maior data lógica ou o maior XP válido.

**Risco:** um check-in retroativo ou registro fora de ordem pode redefinir a base do cálculo.

**Impacto para o usuário:** sequência de XP inconsistente.

**Arquivos relacionados:**

- `app/api/notion/checkins/route.ts`.

**Observação:** ordenar por data ou calcular a partir de uma fonte canônica seria mais previsível, mas também precisa lidar com registros retroativos.

### 12.9 Treinos são salvos em várias operações não atômicas

Cada registro de exercício é atualizado separadamente; alguns exercícios podem atualizar também a página de exercício. A sessão só é atualizada ao final.

**Risco:** uma falha no meio deixa parte das cargas atualizada e parte pendente.

**Impacto para o usuário:** treino e cargas contraditórios.

**Arquivos relacionados:**

- `app/api/notion/training/route.ts`;
- `app/ShaftApp.tsx`;
- testes futuros.

**Observação:** o Notion não oferece transação multi-página. É importante validar previamente, registrar resultados por item e tornar uma repetição segura.

### 12.10 Associação de exercício por começo do título é frágil

A rota procura um registro cujo título começa com o nome enviado pelo frontend.

**Risco:** nomes parecidos, renomeados ou prefixos comuns podem associar a carga ao registro errado ou ignorar o exercício.

**Impacto para o usuário:** carga salva no item errado ou não salva.

**Arquivos relacionados:**

- `app/api/notion/training/route.ts`;
- `app/api/notion/dashboard/route.ts`;
- `app/ShaftApp.tsx`.

**Observação:** a interface deveria transportar IDs estáveis do Notion, não apenas nomes.

### 12.11 IDs e nomes de propriedades do Notion estão fixos

Os IDs das fontes e todos os nomes de coluna são literais no código.

**Risco:** renomear uma propriedade ou substituir uma base quebra consultas e escritas.

**Impacto para o usuário:** falha de sincronização ou de salvamento, possivelmente com mensagem pouco clara.

**Arquivos relacionados:**

- `app/lib/notion.ts`;
- todas as rotas em `app/api/notion`;
- scripts de teste do Notion.

**Observação:** IDs não são segredos, mas representam forte acoplamento à estrutura atual do workspace.

### 12.12 Tratamento de erro pode expor detalhes internos

Erros desconhecidos retornam ao navegador o texto de `Error.message`.

**Risco:** mensagens internas da API ou do runtime podem revelar detalhes desnecessários.

**Impacto para o usuário:** mensagens técnicas e pouco acionáveis; pequeno risco de exposição de implementação.

**Arquivos relacionados:**

- `app/lib/notion.ts`;
- todas as rotas que usam `apiError`.

**Observação:** o token não é incluído diretamente nas mensagens observadas, mas é mais seguro registrar detalhes no servidor e devolver códigos amigáveis.

### 12.13 O componente principal está grande e mistura responsabilidades

`ShaftApp.tsx` possui navegação, carregamento, telas, formulários e componentes genéricos.

**Risco:** alterações em uma área podem causar regressões em outra e revisões ficam mais difíceis.

**Impacto para o usuário:** indireto; evolução e correção ficam mais lentas e arriscadas.

**Arquivos relacionados:**

- `app/ShaftApp.tsx`;
- `app/globals.css`;
- futuros componentes ou módulos.

**Observação:** não é necessário reescrever. A separação pode ser incremental e preservar o comportamento atual.

### 12.14 Algumas ações visuais não possuem comportamento

O botão “Adicionar exercícios quando eu lembrar” não possui handler. Alguns cartões com seta também parecem interativos sem executar ação.

**Risco:** controles mortos reduzem confiança na interface.

**Impacto para o usuário:** cliques sem resposta.

**Arquivos relacionados:**

- `app/ShaftApp.tsx`;
- `app/globals.css`.

**Observação:** enquanto não houver comportamento, esses elementos deveriam ser texto, estado desabilitado explícito ou removidos da superfície interativa.

### 12.15 Estrutura da PWA está duplicada e incompleta

Há `manifest.webmanifest` e `sw.js` na raiz, além das versões em `public`. As versões possuem caminhos diferentes. O registro do service worker existe apenas no `index.html` legado, não na aplicação React.

**Risco:** cache offline não instalado, arquivos errados armazenados ou comportamento diferente entre modos de execução.

**Impacto para o usuário:** instalação ou uso offline inconsistente.

**Arquivos relacionados:**

- `public/manifest.webmanifest`;
- `public/sw.js`;
- `manifest.webmanifest` da raiz;
- `sw.js` da raiz;
- `index.html`;
- `app/layout.tsx`;
- possível componente de registro no frontend.

**Observação:** a versão em `public` usa os caminhos adequados ao roteamento atual. Os arquivos da raiz parecem herança da versão estática anterior, mas só devem ser removidos depois de confirmação.

### 12.16 `index.html` parece ser legado

O aplicativo atual entra por `app/page.tsx`, mas existe uma página HTML estática completa na raiz com cópia antiga da interface e JavaScript próprio de navegação.

**Risco:** duas implementações divergentes confundem manutenção e podem ser publicadas por engano.

**Impacto para o usuário:** possível experiência diferente dependendo do caminho de execução.

**Arquivos relacionados:**

- `index.html`;
- `app/ShaftApp.tsx`;
- manifestos e service workers.

**Observação:** nenhum import ativo do vinext aponta para esse arquivo durante a inspeção.

### 12.17 Os testes cobrem apenas identidade e renderização básica

Os testes verificam status HTML, título Shaft, marca, ícone, nome do pacote, manifesto e cache do service worker.

**Risco:** alterações podem quebrar saldo, XP, validação, autenticação e gravação sem falhar nos testes.

**Impacto para o usuário:** regressões de dados chegam à publicação sem aviso.

**Arquivos relacionados:**

- `tests/rendered-html.test.mjs`;
- `package.json`;
- futuros testes unitários e de integração.

**Observação:** o script `test` executa build antes dos testes. Isso aumenta a duração, mas ao menos valida a saída compilada.

### 12.18 README e documentação técnica estão incompletos

O README ainda apresenta o projeto como `vinext-starter`. Os arquivos `docs/architecture.md`, `docs/roadmap.md` e `docs/decisions/` citados no `AGENTS.md` não existiam.

**Risco:** novos colaboradores ou agentes partem de informação genérica e podem tomar decisões inconsistentes.

**Impacto para o usuário:** indireto; manutenção menos confiável.

**Arquivos relacionados:**

- `README.md`;
- `AGENTS.md`;
- `docs/`.

**Observação:** este relatório reduz parte dessa lacuna, mas não substitui documentação arquitetural curta e mantida junto às mudanças.

### 12.19 `AGENTS.md` não está rastreado pelo Git

O estado local mostrou `?? AGENTS.md` como único arquivo não rastreado antes da criação deste relatório.

**Risco:** instruções persistentes podem ser perdidas ou não chegar a outro computador.

**Impacto para o usuário:** agentes futuros podem ignorar limites, identidade e exigência de aprovação.

**Arquivos relacionados:**

- `AGENTS.md`.

**Observação:** adicionar ao Git exige uma ação posterior de commit, que não faz parte desta documentação.

### 12.20 Existem dois lockfiles

O repositório contém `package-lock.json` e `pnpm-lock.yaml`.

**Risco:** npm e pnpm podem resolver árvores diferentes ou atualizar apenas um arquivo.

**Impacto para o usuário:** builds diferentes em máquinas ou fluxos distintos.

**Arquivos relacionados:**

- `package-lock.json`;
- `pnpm-lock.yaml`;
- `pnpm-workspace.yaml`;
- `package.json`;
- scripts de preparação.

**Observação:** a decisão deve escolher um gerenciador oficial e validar build e testes antes de remover o lockfile excedente.

### 12.21 Dependências e caches duplicam espaço local

`node_modules` e `.pnpm-store` possuem volumes semelhantes e somam aproximadamente 825 MB.

**Risco:** consumo de disco e cópias lentas.

**Impacto para o usuário:** operacional, não funcional.

**Arquivos relacionados:** diretórios gerados locais.

**Observação:** limpeza é destrutiva e deve ser realizada apenas mediante pedido explícito. Os diretórios podem ser recriados por instalação e build.

### 12.22 Tailwind está instalado, mas não é usado

Dependências e configuração PostCSS existem, porém a interface usa CSS puro.

**Risco:** dependência e configuração sem função aumentam superfície de manutenção.

**Impacto para o usuário:** praticamente nenhum no momento.

**Arquivos relacionados:**

- `package.json`;
- `postcss.config.mjs`;
- `app/globals.css`.

**Observação:** não é prioridade. Pode ser removido futuramente ou adotado conscientemente, sem misturar estilos por acidente.

### 12.23 Código D1/Drizzle está inativo

Existem dependências, configurações, worker tipado com `DB`, esquema vazio e exemplo separado, mas nenhum recurso ativo usa D1.

**Risco:** confusão sobre qual é a fonte de verdade e manutenção de fundação não utilizada.

**Impacto para o usuário:** nenhum imediato.

**Arquivos relacionados:**

- `db/index.ts`;
- `db/schema.ts`;
- `drizzle.config.ts`;
- `drizzle/meta/_journal.json`;
- `.openai/hosting.json`;
- `examples/d1`;
- dependências Drizzle.

**Observação:** D1 só deve ser ativado quando houver uma necessidade concreta. Isso seria uma mudança de banco e exige aprovação.

### 12.24 `build/` contém fonte, mas está ignorado pelo ESLint

`build/sites-vite-plugin.ts` é importado por `vite.config.ts`, porém a configuração do ESLint ignora todo `build/**`.

**Risco:** erros ou padrões inadequados nesse plugin não são cobertos pelo lint.

**Impacto para o usuário:** possível falha de empacotamento/publicação não detectada cedo.

**Arquivos relacionados:**

- `build/sites-vite-plugin.ts`;
- `eslint.config.mjs`;
- `vite.config.ts`.

**Observação:** o nome da pasta faz parecer que todo o conteúdo é gerado, mas esse arquivo é fonte manual.

### 12.25 vinext está em versão beta

O projeto usa `vinext 1.0.0-beta.2`.

**Risco:** mudanças futuras, APIs instáveis ou incompatibilidades com versões de Vite, React ou Cloudflare.

**Impacto para o usuário:** baixo enquanto a versão atual continuar compilando e executando.

**Arquivos relacionados:**

- `package.json`;
- lockfile escolhido;
- `vite.config.ts`;
- `worker/index.ts`;
- testes.

**Observação:** atualizar sem boa cobertura de testes pode ser mais arriscado do que manter temporariamente a versão atual.

### 12.26 A direção visual futura não deve ser confundida com trabalho aprovado

`docs/direcao-visual-futura.md` registra steampunk/vitoriano e eventual versão pública apenas como ideias futuras.

**Risco:** um agente pode interpretar o documento como autorização para redesign ou publicação.

**Impacto para o usuário:** desvio de prioridade e identidade prematuramente alterada.

**Arquivos relacionados:**

- `docs/direcao-visual-futura.md`;
- `AGENTS.md`;
- frontend e CSS, caso um redesign fosse autorizado.

**Observação:** estabilização de dados, segurança e testes deve vir antes de redesign ou abertura pública.

## 13. Plano de estabilização em ordem de prioridade

Escala de dificuldade usada:

- **Baixa:** mudança localizada e risco técnico pequeno;
- **Média:** envolve mais de uma camada ou exige testes novos;
- **Alta:** altera autenticação, arquitetura, armazenamento ou vários fluxos críticos.

## 13.1 Corrigir agora

### Prioridade 1 — Não exibir dados antigos como atuais

**Risco:** informações de fallback parecem reais quando o Notion falha.  
**Impacto para o usuário:** pode tomar decisões com base em saldo, XP, check-in ou semana incorretos.  
**Dificuldade:** Média.  
**Arquivos prováveis:** `app/ShaftApp.tsx`, `app/globals.css`.  
**Direção recomendada:** substituir dados de exemplo por estado vazio explícito, mensagem de falha, data da última sincronização válida quando disponível e botão de nova tentativa.

### Prioridade 2 — Proteger as rotas do Notion

**Risco:** mudanças na política externa de privacidade podem expor rotas de escrita.  
**Impacto para o usuário:** dados pessoais alterados por terceiros.  
**Dificuldade:** Alta.  
**Arquivos prováveis:** `app/chatgpt-auth.ts`, todas as rotas de `app/api/notion`, possivelmente `app/page.tsx`.  
**Direção recomendada:** definir uma política única de autenticação/autorização server-side e aplicá-la a todas as rotas. Esta etapa deve ser explicada e aprovada antes da implementação.

### Prioridade 3 — Paginar completamente as finanças

**Risco:** saldo deixa de incluir registros depois do limite atual.  
**Impacto para o usuário:** saldo incorreto.  
**Dificuldade:** Média.  
**Arquivos prováveis:** `app/lib/notion.ts`, `app/api/notion/dashboard/route.ts`, testes novos.  
**Direção recomendada:** adicionar suporte a `next_cursor`, consultar todas as páginas necessárias e testar mais de 100 movimentações.

### Prioridade 4 — Tornar o check-in idempotente e o XP consistente

**Risco:** duplicidade, corrida e cálculo a partir do registro errado.  
**Impacto para o usuário:** XP e nível inconsistentes.  
**Dificuldade:** Média a alta.  
**Arquivos prováveis:** `app/api/notion/checkins/route.ts`, `app/lib/notion.ts`, `app/ShaftApp.tsx`, testes novos.  
**Direção recomendada:** usar uma identificação determinística por data, tratar repetição como operação segura, escolher uma fonte canônica do total e detectar conflitos.

### Prioridade 5 — Cobrir regras críticas com testes

**Risco:** regressões de dados e segurança passam despercebidas.  
**Impacto para o usuário:** problemas chegam à publicação.  
**Dificuldade:** Média.  
**Arquivos prováveis:** `tests/rendered-html.test.mjs`, novos arquivos em `tests`, `package.json`.  
**Direção recomendada:** testar autenticação, paginação e saldo, XP, duplicidade, validações, erros do Notion e salvamento parcial.

## 13.2 Corrigir em breve

### Prioridade 6 — Trocar dados fixos por fontes reais

**Risco:** o painel diário envelhece e contradiz o estado real.  
**Impacto para o usuário:** perda de confiança na tela Hoje.  
**Dificuldade:** Média a alta.  
**Arquivos prováveis:** `app/ShaftApp.tsx`, `app/api/notion/dashboard/route.ts`, `app/lib/notion.ts`, possíveis novas rotas ou propriedades no Notion.  
**Direção recomendada:** começar por data, tipo do dia e treino pendente; depois tratar foco, semana e entradas futuras.

### Prioridade 7 — Evitar salvamento parcial de treinos

**Risco:** cargas e sessão ficam em estados diferentes.  
**Impacto para o usuário:** histórico de treino contraditório.  
**Dificuldade:** Média.  
**Arquivos prováveis:** `app/api/notion/training/route.ts`, `app/ShaftApp.tsx`, testes novos.  
**Direção recomendada:** validar todos os IDs antes de escrever, usar IDs em vez de nomes, devolver resultado por item e permitir repetição segura.

### Prioridade 8 — Validar a estrutura do Notion

**Risco:** alterações de schema quebram a aplicação silenciosamente.  
**Impacto para o usuário:** sincronização indisponível sem explicação útil.  
**Dificuldade:** Média.  
**Arquivos prováveis:** `app/lib/notion.ts`, rotas de Notion e scripts de diagnóstico.  
**Direção recomendada:** centralizar nomes, verificar propriedades obrigatórias e devolver erros amigáveis sem expor detalhes internos.

### Prioridade 9 — Dividir `ShaftApp.tsx`

**Risco:** acoplamento crescente e regressões difíceis de localizar.  
**Impacto para o usuário:** indireto, por tornar correções futuras menos seguras.  
**Dificuldade:** Média.  
**Arquivos prováveis:** `app/ShaftApp.tsx`, `app/globals.css`, novos componentes ou módulos.  
**Direção recomendada:** separar telas, formulários, componentes compartilhados e cliente HTTP de forma incremental.

### Prioridade 10 — Consolidar a PWA

**Risco:** instalação e cache offline inconsistentes.  
**Impacto para o usuário:** aplicativo instalado pode não funcionar offline ou atualizar corretamente.  
**Dificuldade:** Média.  
**Arquivos prováveis:** arquivos PWA de `public`, `app/layout.tsx`, novo registro do service worker e, após validação, arquivos legados da raiz.  
**Direção recomendada:** escolher `public` como fonte única, registrar o worker na aplicação e testar instalação, atualização e fallback offline antes de excluir duplicatas.

### Prioridade 11 — Atualizar documentação e versionar instruções

**Risco:** contexto se perde entre máquinas e agentes.  
**Impacto para o usuário:** manutenção inconsistente.  
**Dificuldade:** Baixa.  
**Arquivos prováveis:** `AGENTS.md`, `README.md`, `docs/architecture.md`, `docs/roadmap.md`, `docs/decisions/`.  
**Direção recomendada:** substituir o README de starter por documentação real e incluir o `AGENTS.md` no versionamento em uma mudança posterior autorizada.

## 13.3 Pode esperar

### Prioridade 12 — Escolher entre npm e pnpm

**Risco:** árvores de dependência divergentes.  
**Impacto para o usuário:** baixo enquanto o build atual for reproduzível.  
**Dificuldade:** Baixa, com validação completa posterior.  
**Arquivos prováveis:** `package-lock.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `package.json`, scripts.  
**Direção recomendada:** escolher um gerenciador oficial e só então remover o lockfile excedente.

### Prioridade 13 — Limpar caches locais

**Risco:** apenas consumo de disco e lentidão de cópia.  
**Impacto para o usuário:** recuperação de espaço.  
**Dificuldade:** Baixa.  
**Pastas prováveis:** `node_modules`, `.pnpm-store`, `work`, `dist`, `.next`, `.wrangler`.  
**Direção recomendada:** realizar apenas mediante pedido explícito, com validação exata dos alvos. A operação é destrutiva, embora os diretórios possam ser recriados.

### Prioridade 14 — Decidir se D1 é realmente necessário

**Risco:** confusão e dependências inativas; uma migração prematura aumentaria muito o escopo.  
**Impacto para o usuário:** nenhum imediato.  
**Dificuldade:** Alta se houver migração.  
**Arquivos prováveis:** `db`, `drizzle`, `drizzle.config.ts`, `.openai/hosting.json`, rotas e migrações.  
**Direção recomendada:** manter o Notion enquanto ele atender. Considerar D1 apenas diante de necessidade concreta de transações, escala, desempenho ou múltiplos usuários.

### Prioridade 15 — Atualizar ou substituir o vinext beta

**Risco:** instabilidade de versão beta; atualização sem testes também é arriscada.  
**Impacto para o usuário:** baixo no estado atual.  
**Dificuldade:** Média a alta.  
**Arquivos prováveis:** `package.json`, lockfile escolhido, `vite.config.ts`, `worker/index.ts`, testes.  
**Direção recomendada:** revisar somente depois que os testes críticos existirem e fazer a atualização isoladamente.

### Prioridade 16 — Evolução visual e versão pública

**Risco:** redesign ou abertura pública antes de segurança e dados estarem estáveis.  
**Impacto para o usuário:** aparência nova sem confiabilidade correspondente.  
**Dificuldade:** Alta.  
**Arquivos prováveis:** `docs/direcao-visual-futura.md`, `app/globals.css`, componentes, autenticação e configuração de publicação.  
**Direção recomendada:** tratar apenas depois da estabilização e mediante decisão específica.

## 14. Sequência prática recomendada

1. Tornar o estado de sincronização honesto e remover dados falsos do fallback.
2. Definir e aprovar a proteção server-side das rotas.
3. Corrigir paginação financeira.
4. Corrigir idempotência e cálculo de XP.
5. Criar testes para as regras críticas.
6. Substituir gradualmente conteúdo fixo por dados reais.
7. Tornar treinos resistentes a falhas parciais e usar IDs estáveis.
8. Validar o schema do Notion e melhorar mensagens de erro.
9. Separar o frontend em módulos menores.
10. Consolidar a PWA.
11. Completar documentação e versionamento das instruções.
12. Só depois tratar gerenciador de pacotes, limpeza local, D1, atualização do vinext, redesign e versão pública.

## 15. Estado do Git observado

Antes da criação deste relatório:

- branch local: `main`;
- acompanhamento: `origin/main`;
- remoto: `https://github.com/Hykaji/shaft.git`;
- commits recentes observados: publicação, renomeação para Shaft e ajuste para ignorar metadados do Windows;
- único arquivo não rastreado: `AGENTS.md`;
- `.env.local`, `dist`, `.next`, `node_modules`, `.pnpm-store` e `work` não estavam rastreados.

Após esta entrega, espera-se também que `docs/agent-reports/auditoria-inicial.md` apareça como novo arquivo não rastreado até que seja incluído em um commit futuro.

## 16. Observações finais

O Shaft possui uma base coerente para um aplicativo pessoal: frontend, backend, publicação e integração com Notion já estão conectados. A maior fragilidade não é ausência de tecnologia, mas a diferença entre o que a interface aparenta ser dinâmico e o que realmente vem de dados atuais.

As prioridades de estabilização devem proteger três propriedades:

1. **Verdade dos dados:** nunca mostrar exemplo antigo como informação atual.
2. **Integridade:** evitar saldo incompleto, XP concorrente e treino parcialmente salvo.
3. **Controle de acesso:** não depender apenas de uma configuração externa para proteger rotas que modificam dados pessoais.

O Notion continua adequado como fonte de dados pessoal enquanto suas limitações forem tratadas conscientemente. Migrar para D1, refazer a identidade visual ou preparar uma versão pública não resolve os riscos imediatos e pode esperar.

## 17. Convenção para análises longas

Análises técnicas longas do Shaft devem ser preservadas integralmente como arquivos Markdown dentro de `docs/agent-reports/`, com nome descritivo, contexto, data, escopo, evidências, riscos, arquivos relacionados, observações e próximos passos. O texto entregue em chat pode apontar para o relatório, mas o arquivo deve conter o resultado completo e não apenas um resumo.
