# Visão Geral e Arquitetura do Projeto — Sistema de Gestão para Oficina

## Objetivo Geral
Desenvolver um sistema de gestão para oficina mecânica moderno, intuitivo e modular, focado nas operações essenciais do dia a dia.

## Diretrizes e Decisões de Projeto
* **Abordagem:** *Spec-Driven Development* (desenvolvimento orientado a especificações).
* **Escopo e Perfil:** MVP com **perfil único de usuário** (sem perfil/função dividida para mecânico, orçamentista ou caixa).
* **Multi-tenancy:** Não (sistema *single-tenant* focado em apenas uma oficina).
* **Estratégia de Implementação:** Fatias verticais testáveis isoladamente (`Spec` → `Código` → `Teste`).
* **Padrões do Setor:** Baseado em processos consolidados de ERPs automotivos (máquina de estados formal para OS, gate obrigatório de aprovação e suporte a saldo pendente).

## Estrutura de Especificações
```text
/openspec
  config.yaml
  /specs
    /clientes-veiculos/spec.md
    /ordens-servico/spec.md
    /estoque-pecas/spec.md
    /agendamento/spec.md
    /faturamento/spec.md
/docs
  visao-geral.md
  modelo-dados.md
  escopo-e-limites.md
  pendencias.md
  plano-implementacao.md
```

> Os requisitos de negócio vivem em `openspec/specs/<domínio>/spec.md`, no formato do
> OpenSpec (Requirement / Scenario). O modelo de dados e a rastreabilidade entre
> entidades e specs estão em `docs/modelo-dados.md`. As lacunas entre especificação e
> implementação estão em `docs/pendencias.md`.

## Matriz de Dependência das Specs
```text
[ clientes-veiculos ] ──► [ agendamento ]
          │                      │
          ▼                      ▼
[ ordens-servico ] ◄─────────────┘
     │          ▲
     ▼          │
[ estoque-pecas ] ──┴──► [ faturamento ]
```

## Caminhos de Sequência Propostos
1. **Consolidação do Modelo de Dados:** Mapear tipos de dados, PKs e FKs antes do código.
2. **Execução Incremental:** Iniciar o desenvolvimento por **clientes-veiculos**, aplicando testes e critérios de aceite.
