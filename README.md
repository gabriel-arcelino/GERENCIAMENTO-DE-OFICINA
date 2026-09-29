# Sistema de Gestão — Oficina Mecânica

Sistema de gestão para oficina mecânica, desenvolvido com Next.js 14, TypeScript, Prisma ORM e PostgreSQL.

## Stack

- **Framework:** Next.js 14 (App Router, Server Actions)
- **Linguagem:** TypeScript
- **Banco de dados:** PostgreSQL
- **ORM:** Prisma
- **UI:** shadcn/ui + Tailwind CSS
- **Testes:** Vitest (unitários + integração)

## Módulos

| Módulo | Rota | Descrição |
|--------|------|-----------|
| Clientes e Veículos | `/clientes` | Cadastro e consulta de clientes e veículos |
| Ordens de Serviço | `/ordens` | Ciclo completo de OS com máquina de estados |
| Agenda | `/agenda` | Agendamentos por data com conversão em OS |
| Estoque | `/estoque` | Controle de peças com baixa/estorno automático |
| Pendências | `/financeiro/pendencias` | OS entregues com saldo em aberto |

## Pré-requisitos

- Node.js 18+
- Docker Desktop (para o PostgreSQL)

## Setup

### 1. Instalar dependências

```bash
# Clone novo ou CI: instala exatamente as versões do package-lock.json
npm ci

# Durante o desenvolvimento, se você alterou o package.json
npm install
```

### 2. Subir o banco de dados

```bash
docker compose up -d
```

### 3. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env` (já vem configurado para o Docker local):

```bash
copy .env.example .env
```

### 4. Gerar o Prisma Client e aplicar as migrations

```bash
npm run db:generate
npm run db:deploy
```

> `db:deploy` (`prisma migrate deploy`) aplica as migrations já versionadas em
> `prisma/migrations/` e **não** pede nome de migration — é o comando correto para
> um clone novo ou CI. Para **criar** uma migration nova durante o desenvolvimento,
> use `npm run db:migrate`.

### 5. (Opcional) Instalar os browsers do Playwright

Necessário apenas para rodar os testes end-to-end:

```bash
npm run playwright:install
```

### 6. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

## Testes

```bash
# Todos os testes unitários
npm test

# Apenas unitários (lógica de negócio pura, sem banco)
npm run test:unit

# Testes de integração (exigem banco rodando)
npm run test:integration

# Com cobertura
npm run test:coverage

# End-to-end com Playwright (exige `npm run playwright:install` antes)
npm run test:e2e

# Verificação manual do fluxo completo contra o banco real (11 passos)
npm run verify:fluxo
```

## Comandos úteis

```bash
# Interface visual do banco
npm run db:studio

# Gerar client Prisma após alterar o schema
npm run db:generate

# Criar nova migration (desenvolvimento)
npm run db:migrate

# Aplicar migrations versionadas (clone novo, CI, produção)
npm run db:deploy

# Resetar banco (apaga todos os dados)
npm run db:reset
```

## Arquitetura

```
src/
├── app/                    # Rotas e páginas (App Router)
│   ├── api/                # API Routes
│   ├── clientes/           # Módulo de clientes e veículos
│   ├── ordens/             # Módulo de ordens de serviço
│   ├── agenda/             # Módulo de agendamento
│   ├── estoque/            # Módulo de estoque
│   └── financeiro/         # Módulo financeiro
├── actions/                # Server Actions (ponto de entrada das mutações)
├── components/             # Componentes React
│   ├── ui/                 # Componentes base (shadcn/ui)
│   ├── layout/             # Layout (Sidebar, etc.)
│   ├── clientes/           # Componentes de clientes
│   ├── ordens/             # Componentes de OS
│   ├── agenda/             # Componentes de agenda
│   └── estoque/            # Componentes de estoque
├── services/               # Service layer — lógica de negócio pura e testável
│   ├── clientes.ts
│   ├── veiculos.ts
│   ├── ordemServico.ts     # Máquina de estados da OS
│   ├── estoque.ts          # Baixa/estorno automático
│   ├── agendamento.ts
│   ├── faturamento.ts
│   └── __tests__/          # Testes unitários
└── lib/
    ├── prisma.ts           # Cliente Prisma (singleton)
    ├── prisma-test.ts      # Cliente Prisma para testes
    └── utils.ts            # Utilitários (cn, formatCurrency, etc.)

prisma/
├── schema.prisma           # Schema completo com todas as entidades
└── migrations/             # Migrations versionadas

openspec/
├── config.yaml             # Configuração do OpenSpec
└── specs/                  # Especificações — fonte de verdade dos requisitos

docs/                       # Documentação do projeto
scripts/                    # Scripts utilitários (verificação manual de fluxo)
```

> **Especificações:** os requisitos de negócio ficam em `openspec/specs/<domínio>/spec.md`,
> no formato do OpenSpec (Requirement / Scenario com SHALL). O modelo de dados é
> detalhado em `docs/modelo-dados.md`, que faz a rastreabilidade entre entidades e specs.
> Os limites do sistema estão em `docs/escopo-e-limites.md`, e as divergências conhecidas
> entre especificação e implementação em `docs/pendencias.md`.

## Fluxo de Status das OS

```
RECEBIDO → DIAGNOSTICO → AGUARDANDO_APROVACAO → APROVADO → EM_EXECUCAO → CONFERENCIA → PRONTO_PARA_ENTREGA → ENTREGUE
                                    ↳ REPROVADO
```

- Transições são estritas (seguem a máquina de estados)
- Gate obrigatório: aprovação formal do cliente para sair de AGUARDANDO_APROVACAO
- Item extra pós-aprovação retorna a OS para AGUARDANDO_APROVACAO
- Toda mudança de status é auditada em HistoricoStatusOS
