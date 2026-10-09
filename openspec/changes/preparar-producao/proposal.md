# Proposal

## Why

O sistema tem lógica de domínio sólida — 27 requisitos especificados, 46 testes unitários verdes e `tsc --noEmit` limpo — mas **não pode ir para produção hoje**, por três motivos independentes:

1. `npm run build` **falha**: os 27 erros de ESLint são `Error` (não `Warning`), e o Next.js reprova o build por causa deles. Nenhum deploy nasce.
2. O painel inicial (`/`) é **pré-renderizado no build e nunca revalidado** por nenhuma action. Indicadores como "agendamentos de hoje" e "faturamento do mês" são calculados com `new Date()` no momento da consulta, então em produção ficariam **congelados na data do deploy** — o sistema exibiria números plausíveis e falsos.
3. **Não existe autenticação alguma**: sem middleware, sem biblioteca de sessão, sem modelo de usuário. Qualquer pessoa que alcance a URL lê e altera clientes, ordens, estoque e pagamentos — que incluem dados pessoais (nome, telefone, CPF), atraindo a LGPD.

O plano é publicar inicialmente na camada gratuita do Vercel com Neon, e comercializar ao conseguir o primeiro cliente. As três lacunas precisam ser fechadas antes do primeiro deploy, porque nenhuma delas se resolve sozinha com o tempo.

## What Changes

- **Nova capacidade — autenticação por credenciais.** Login com e-mail e senha (hash via `bcryptjs`), sessão em cookie `httpOnly` assinado, proteção de todas as rotas por `middleware.ts`, e logout. Novo modelo `Usuario`. Como cada instalação atende **um único atendente**, ficam deliberadamente fora: perfis, permissões, cadastro público, convite e recuperação de senha.
- **Nova capacidade — painel inicial com dados atuais.** O painel em `/` passa a refletir o estado corrente dos dados no momento da consulta, em vez de valores fixados no build.
- **Correção do gate de qualidade do build.** Os 27 erros de ESLint são eliminados (imports não usados, dois `any`, dois `interface` vazios). Não altera comportamento observável e portanto **não gera spec**.
- **Configuração de implantação.** `vercel.json` fixando a região `gru1` (São Paulo), ajuste do gerador Prisma para o runtime serverless do Vercel, variáveis de ambiente, e rotina de backup lógico do banco.
- **BREAKING**: todas as rotas passam a exigir sessão; chamadas a `/api/clientes` sem autenticação passam a responder `401`.
- **Alinhamento de documentação.** `docs/visao-geral.md` passa a explicitar que *single-tenant* significa **uma instalação por oficina**, e não uma instalação compartilhada — hoje o documento declara "multi-tenancy: não" sem dizer o que isso implica para o plano de comercialização.

## Capabilities

### New Capabilities

- `autenticacao`: login por credenciais, ciclo de vida da sessão, proteção de rotas e encerramento de sessão, para exatamente um atendente por instalação.
- `painel-inicial`: indicadores exibidos no painel inicial e a garantia de que refletem o estado atual dos dados.

### Modified Capabilities

Nenhuma. As cinco capacidades existentes (`agendamento`, `clientes-veiculos`, `estoque-pecas`, `faturamento`, `ordens-servico`) mantêm seus 27 requisitos inalterados — a autenticação é uma camada de acesso, não uma mudança nas regras de negócio.

## Impact

- **Código novo**: `middleware.ts`, `src/app/login/`, `src/actions/auth.ts`, `src/services/usuarios.ts`, `src/lib/sessao.ts`
- **Código alterado**: `src/app/page.tsx` (dinamismo do painel), `src/lib/prisma.ts` (se necessário para serverless), correções de lint em ~10 arquivos, `next.config.mjs` (se necessário)
- **Banco**: nova tabela `usuarios`; campo `usuarioId` opcional em `historico_status_os` — sem uso imediato, mas evita uma migration com preenchimento retroativo quando houver mais de um usuário
- **Dependências novas**: `bcryptjs` (JS puro, evita bindings nativos problemáticos em serverless) e uma biblioteca de sessão assinada
- **Infra**: projeto Neon em `aws-sa-east-1` (São Paulo), projeto Vercel com região `gru1`, Deployment Protection ligado durante o desenvolvimento enquanto o login não existe
- **Operação**: rotina de backup lógico com `pg_dump`, obrigatória porque o plano gratuito do Neon oferece janela de restauração de apenas 6 horas e um único snapshot manual
- **Fora de escopo**: multi-tenancy em instalação compartilhada, perfis/permissões, autoria no histórico, observabilidade e monitoramento
