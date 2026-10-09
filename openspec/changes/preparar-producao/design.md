# Design

## Context

Ver `proposal.md` para a motivação. Restrições que moldam a abordagem:

- **Next.js 14 (App Router) com Server Actions.** O `middleware.ts` roda no runtime **Edge** por padrão nesta versão — não há suporte a runtime Node no middleware.
- **Prisma 5.22 + PostgreSQL.** O `generator client` hoje não declara `binaryTargets`, e a aplicação vai rodar em ambiente serverless.
- **Um usuário por instalação.** Decisão de produto: cada oficina recebe uma instalação própria (ver `docs/visao-geral.md`), portanto não há multi-tenancy e cada banco tem um único atendente.
- **Fonte de verdade em `openspec/specs/`** com 27 requisitos em 5 capacidades, todos intactos por esta mudança.
- **Estado atual do build:** `tsc --noEmit` passa; `npm run build` falha apenas no estágio de ESLint; `next build --no-lint` conclui com sucesso e gera 15 páginas.

## Goals / Non-Goals

**Goals:**

- Fechar as três lacunas que impedem o deploy, na ordem em que bloqueiam: build → correção do painel → autenticação.
- Implantar em região brasileira, com aplicação e banco no mesmo país.
- Garantir recuperação de dados independente da janela curta do plano gratuito do banco.

**Non-Goals:**

- Multi-tenancy em instalação compartilhada. O modelo continua sendo uma instalação por oficina.
- Perfis, papéis e permissões diferenciadas — todos os usuários autenticados têm acesso idêntico.
- Autoria no histórico (`usuarioId` é criado, mas não utilizado nesta mudança).
- Observabilidade, monitoramento e error tracking.
- Tratamento das 9 vulnerabilidades pré-existentes em devDependencies.

## Decisions

### 1. Sessão assinada com `jose`, não Auth.js

Sessão em cookie `httpOnly` com JWT assinado por `jose`, verificado no `middleware.ts`; hash de senha com `bcryptjs` apenas nas Server Actions (runtime Node).

**Por quê:** `jose` funciona no runtime Edge do middleware (usa Web Crypto), enquanto `bcryptjs` não — então a verificação da sessão e a verificação da senha precisam acontecer em lugares diferentes, e essa separação é o desenho mais simples que respeita a restrição. Para um único atendente, sem OAuth e sem provedores externos, Auth.js traria uma abstração de provedores inteira para resolver o único caso que ela mesma documenta como o mais limitado (Credentials Provider).

**Alternativas consideradas:** Auth.js v5 — rejeitado por superfície de dependência desnecessária, especialmente relevante dado que o projeto já carrega 9 vulnerabilidades em dependências. `iron-session` — rejeitado por encapsular a criptografia de forma menos transparente para auditoria, sem ganho relevante neste tamanho.

### 2. Painel com `dynamic = 'force-dynamic'`, não `revalidatePath`

A rota `/` passa a ser renderizada sob demanda.

**Por quê:** a correção por `revalidatePath("/")` exige lembrar de adicioná-lo em **toda** action futura que afete qualquer indicador. A evidência de que isso falha já existe: são 12 pontos de `revalidatePath` no código e **nenhum** cobre `/`. O modo `force-dynamic` é correto por construção em vez de correto por disciplina.

**Custo aceito:** o painel consulta o banco a cada visita (6 queries em `Promise.all`). Para um usuário único, é irrelevante.

**Efeito colateral esperado:** com `/` fora da geração estática, o build deixa de precisar de banco acessível. A verificar durante a implementação.

### 3. `binaryTargets` e conexão pooled para o Prisma

Declarar `binaryTargets = ["native", "rhel-openssl-3.0.x"]` no `generator client` e usar a string de conexão pooled do Neon.

**Por quê:** são os dois modos de falha conhecidos de Next.js + Prisma em Vercel — engine não encontrada em runtime e esgotamento do pool de conexões. Ambos se manifestam apenas em produção, então é mais barato prevenir do que diagnosticar às cegas.

### 4. `usuarioId` criado agora, sem uso

Coluna opcional em `historico_status_os`, sem preenchimento nesta mudança.

**Por quê:** com um atendente, saber quem mudou o status é redundante. Mas ao comercializar para uma oficina com dois ou três atendentes, a autoria passa a valer — e **não há como preencher retroativamente** quem fez o quê. Uma coluna anulável custa uma linha de schema e nenhuma mudança de comportamento; adicioná-la depois exigiria migration em dados de produção.

**Trade-off assumido:** é uma coluna especulativa. Aceito porque o custo é trivial e a alternativa é irreversível, não porque tenho caso de uso imediato.

### 5. Corrigir o lint, não silenciá-lo

Os 27 erros são corrigidos; `eslint.ignoreDuringBuilds` **não** será usado.

**Por quê:** silenciar transformaria um gate real em decoração, e os erros são mecânicos (imports não usados, dois `any`, dois `interface` vazios). Nenhum exige decisão de arquitetura.

### 6. Backup lógico próprio, por script agendado

Script `pg_dump` agendado fora do provedor de banco.

**Por quê:** o plano gratuito do Neon oferece janela de histórico de 6 horas e um único snapshot manual. Isso não cobre o caso real de "percebi ontem que algo foi apagado". O backup precisa ser independente do provedor.

### 7. Região: Neon em `aws-sa-east-1` e Vercel em `gru1`

**Por quê:** aplicação e banco no mesmo país reduz latência e mantém dados pessoais em território nacional, o que simplifica a postura perante a LGPD. A região do projeto Neon é **fixa na criação** — não há como corrigir depois sem criar outro projeto e migrar. O padrão do Vercel é `iad1` (Virgínia), portanto a região precisa ser declarada explicitamente, ou o app roda nos EUA conversando com um banco em São Paulo a cada query.

**Alternativa rejeitada:** Render — não possui região na América do Sul, o que colocaria aplicação e dados nos EUA.

## Risks / Trade-offs

- [Sessão implementada à mão em vez de biblioteca consagrada] → Usar `jose` (biblioteca auditada) apenas para assinar e verificar; cookie com `httpOnly`, `Secure` e `SameSite=Lax`; expiração curta com renovação; testes de unidade para os helpers de sessão.
- [`bcryptjs` é mais lento que `bcrypt` nativo] → Irrelevante: um único login esporádico. E evita bindings nativos, que são a causa comum de falha em serverless.
- [Deployment Protection exige conta Vercel por pessoa] → É paliativo temporário para desenvolvimento, removido assim que o login entrar. Não serve como autenticação do produto.
- [Neon Free: 0,5 GB de armazenamento] → Suficiente para anos de dados textuais de uma oficina. Monitorar e migrar para o plano pago ao comercializar.
- [Neon Free: computação hiberna após 5 minutos] → Pequena latência na primeira consulta após ociosidade. Aceitável.
- [Migrar para multi-tenant depois seria uma refatoração grande] → Decisão consciente e documentada de uma instalação por oficina. Registrar em `docs/visao-geral.md` para que não seja redescoberta como surpresa.
- [9 vulnerabilidades em devDependencies] → Não alcançam o runtime de produção (eslint, vitest, vite, esbuild). Tratar em mudança separada.
- [`carregarDashboard` carrega todas as OS em memória] → Limitação de escala pré-existente, não introduzida aqui. Para uma oficina, irrelevante por anos; registrar como dívida conhecida.

## Migration Plan

A migration é **aditiva** (nova tabela + coluna anulável), portanto compatível com o deploy anterior — o que permite publicar sem janela de indisponibilidade e reverter com segurança.

1. Corrigir o lint e confirmar `npm run build` retornando 0.
2. Aplicar `force-dynamic` no painel e confirmar que os indicadores acompanham mutações.
3. Implementar autenticação e confirmar as specs de `autenticacao`.
4. Criar o projeto Neon em São Paulo e rodar `npm run db:deploy`.
5. Criar o usuário do atendente com senha definida no momento (nunca versionada).
6. Publicar no Vercel com `regions: ["gru1"]` e Deployment Protection ligado.
7. Configurar o backup agendado e **testar uma restauração** — backup não verificado não é backup.
8. Atualizar `docs/visao-geral.md`.

**Rollback:** `vercel rollback` para o deploy anterior. Como as mudanças de schema são aditivas, o código antigo continua funcionando; a tabela `usuarios` e a coluna `usuarioId` permanecem inertes até serem usadas.

## Open Questions

- **Alvo exato do engine do Prisma no runtime do Vercel.** `rhel-openssl-3.0.x` é o valor esperado, mas será confirmado no primeiro deploy — se estiver errado, o erro nomeia o alvo correto. Não muda specs, abordagem nem tarefas.
- **Onde o backup agendado vai rodar.** Hoje não existe remote Git nem CI, então o caminho imediato é uma tarefa agendada local; quando o repositório tiver remote, um cron de GitHub Actions é mais confiável por não depender da máquina ligada. A escolha não altera a abordagem nem as tarefas, apenas o alvo do script.
