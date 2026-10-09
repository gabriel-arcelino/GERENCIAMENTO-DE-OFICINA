# Tasks

## 1. Destravar o build (lint)

- [ ] 1.1 Remover os imports não utilizados apontados pelo ESLint (`redirect` em `src/actions/clientes.ts`; `Badge` e `Separator` em `src/app/clientes/[id]/page.tsx`; `Users`, `ClipboardList` e `Clock` em `src/app/page.tsx`; `Car` e `AlertCircle` em `src/components/layout/sidebar.tsx`; `Link` em `src/components/ordens/painel-os.tsx`; `calcularTotalOS` em `src/services/faturamento.ts`; `Separator` em `src/app/ordens/[id]/page.tsx`) e verificar que `npm run lint` deixa de apontá-los
- [ ] 1.2 Corrigir os problemas restantes de lint nos arquivos sinalizados (`src/app/api/clientes/route.ts`, `src/app/clientes/page.tsx`, `src/app/estoque/page.tsx`, `src/app/financeiro/pendencias/page.tsx`) e verificar que `npm run lint` reporta 0 erros
- [ ] 1.3 Substituir os `any` de `calcularSaldoOS` em `src/components/ordens/painel-os.tsx` e `src/app/ordens/[id]/page.tsx:97` por tipos adequados e verificar que `npm run lint` e `npx tsc --noEmit` passam
- [ ] 1.4 Substituir os `any` de `src/services/__tests__/estoque.unit.test.ts` por tipos adequados e verificar que `npm test` continua com 46 testes passando
- [ ] 1.5 Corrigir as interfaces vazias de `src/components/ui/input.tsx` e `src/components/ui/textarea.tsx` e verificar que `npm run lint` não as aponta
- [ ] 1.6 Executar `npm run build` (sem `--no-lint`) e verificar que o código de saída é 0, confirmando que o gate de build está destravado

## 2. Painel inicial com dados atuais

- [ ] 2.1 Extrair a agregação pura de `carregarDashboard` (ordens abertas por status, faturamento do mês, total pendente, peças em alerta) para funções puras exportadas em `src/services/dashboard.ts` e verificar que `carregarDashboard` continua retornando os mesmos valores
- [ ] 2.2 Escrever testes unitários em `src/services/__tests__/dashboard.unit.test.ts` cobrindo cada agregador extraído, incluindo o limite "menor ou igual ao estoque mínimo" e a exclusão de ENTREGUE e REPROVADO da contagem de abertas, e verificar que `npm test` passa com os novos testes
- [ ] 2.3 Aplicar `export const dynamic = "force-dynamic"` em `src/app/page.tsx` e verificar na tabela de rotas de `npm run build` que `/` aparece marcada como dinâmica (`ƒ`) em vez de estática (`○`)
- [ ] 2.4 Verificar que o build não exige mais banco acessível: parar o Postgres e confirmar que `npm run build` conclui com código de saída 0
- [ ] 2.5 Verificar manualmente a atualidade dos indicadores com `npm run dev`: abrir uma OS e recarregar o painel confirmando o incremento em ordens abertas; registrar um pagamento em OS entregue com saldo e confirmar a redução em total pendente

## 3. Autenticação — modelo e sessão

- [ ] 3.1 Adicionar o modelo `Usuario` (`id`, `nome`, `email` único, `senhaHash`, `ativo`, `criadoEm`, `atualizadoEm`, mapeado para `usuarios`) e a coluna anulável `usuarioId` em `HistoricoStatusOS` no `prisma/schema.prisma`, gerar a migration e verificar que `npm run db:generate` e a aplicação da migration concluem sem erro
- [ ] 3.2 Adicionar as dependências `jose` e `bcryptjs` (com `@types/bcryptjs`) e verificar que a instalação conclui e que `npx tsc --noEmit` passa
- [ ] 3.3 Implementar `src/lib/sessao.ts` com assinatura e verificação de sessão via `jose` e criação de cookie `httpOnly`/`Secure`/`SameSite=Lax` com expiração, e cobrir com testes unitários de assinatura, verificação, expiração e token adulterado
- [ ] 3.4 Implementar `src/services/usuarios.ts` com criação de usuário (hash), autenticação por e-mail e senha que rejeita senha incorreta e usuário inativo, e alteração de senha exigindo a senha atual, e cobrir as regras puras com testes unitários
- [ ] 3.5 Escrever o script de criação do usuário do atendente em `scripts/criar-usuario.mjs`, recebendo a senha por argumento e nunca por valor versionado, e verificar que o usuário criado consegue autenticar

## 4. Autenticação — telas e proteção de rotas

- [ ] 4.1 Implementar a tela de login em `src/app/login/page.tsx` com a Server Action de autenticação, e verificar que credenciais válidas estabelecem a sessão e redirecionam ao painel
- [ ] 4.2 Verificar na tela de login que senha incorreta e usuário inativo exibem a mesma mensagem genérica, sem revelar a existência do e-mail
- [ ] 4.3 Implementar `middleware.ts` exigindo sessão válida em todas as rotas, exceto `/login`, e verificar que uma requisição anônima a uma página é redirecionada ao login
- [ ] 4.4 Verificar que uma requisição anônima a `/api/clientes` responde 401 sem corpo de dados
- [ ] 4.5 Implementar o encerramento de sessão (action e botão na interface) e verificar que, após acioná-lo, a próxima requisição volta a exigir login
- [ ] 4.6 Implementar a tela de alteração da própria senha em `src/app/conta/senha/page.tsx` e verificar que a senha atual correta permite a troca e que a incorreta é recusada sem alterar o hash
- [ ] 4.7 Documentar no `README.md` o fluxo de autenticação, a criação do usuário inicial e a variável de ambiente do segredo de sessão, e verificar que os comandos documentados executam como escritos
- [ ] 4.8 Atualizar `docs/visao-geral.md` para explicitar que *single-tenant* significa uma instalação por oficina e registrar a permissão uniforme entre usuários, e verificar que o documento não contradiz o plano de comercialização

## 5. Implantação

- [ ] 5.1 Declarar `binaryTargets = ["native", "rhel-openssl-3.0.x"]` no `generator client` do `prisma/schema.prisma` e verificar que `npm run build` e `npm test` continuam passando localmente
- [ ] 5.2 Criar `vercel.json` declarando `"regions": ["gru1"]` e verificar que a região aparece como São Paulo no resumo do deployment
- [ ] 5.3 Criar o projeto no Neon escolhendo a região São Paulo (`aws-sa-east-1`) e verificar a região na tela do projeto, confirmando que app e banco ficam no mesmo país
- [ ] 5.4 Configurar no Vercel as variáveis `DATABASE_URL` (string pooled do Neon) e o segredo de sessão, e verificar que a aplicação conecta sem erro de engine do Prisma nem de esgotamento de conexões
- [ ] 5.5 Verificar a compatibilidade do código com as colunas novas: rodar `npm run db:deploy` contra o banco de produção e confirmar a criação da tabela `usuarios`
- [ ] 5.6 Criar o usuário do atendente no banco de produção usando o script do item 3.5 e verificar o login na URL publicada
- [ ] 5.7 Ligar o Deployment Protection antes da primeira publicação pública, verificar que o acesso anônimo é bloqueado, e desligá-lo após confirmar o funcionamento do login — ele exige conta Vercel e não serve como autenticação do produto
- [ ] 5.8 Verificar o rollback executando `vercel rollback` para o deploy anterior e confirmando que a aplicação volta a responder, já que a migration é aditiva

## 6. Backup e recuperação

- [ ] 6.1 Escrever `scripts/backup-db.ps1` executando `pg_dump` da `DATABASE_URL` para um arquivo com data no nome e verificar que o arquivo é gerado e não está vazio
- [ ] 6.2 Agendar a execução diária e verificar que uma execução agendada produz o arquivo esperado
- [ ] 6.3 Restaurar um backup em um banco de teste e verificar que as tabelas e os registros conferem com a origem, comprovando que o backup é utilizável — backup não verificado não é backup
- [ ] 6.4 Documentar em `README.md` o procedimento de backup e restauração e o motivo de ele existir (janela de 6 horas do plano gratuito do banco), e verificar que o procedimento documentado é executável

## 7. Verificação de integração

- [ ] 7.1 Executar a suíte completa (`npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`) e verificar que todos retornam sucesso
- [ ] 7.2 Na URL publicada, percorrer o fluxo completo — autenticar, cadastrar cliente e veículo, abrir OS, adicionar item, aprovar orçamento, registrar pagamento, entregar e conferir o painel — verificando que cada etapa funciona atrás da autenticação
- [ ] 7.3 Verificar que nenhuma rota responde sem sessão, testando ao menos uma página, uma rota de API e um caminho aninhado
- [ ] 7.4 Executar `openspec validate preparar-producao --strict` e verificar que a mudança permanece válida após a implementação
