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
/specs
  /001-clientes-veiculos.md
  /002-ordens-servico.md
  /003-estoque-pecas.md
  /004-agendamento.md
  /005-faturamento.md
/docs
  visao-geral.md
  plano-implementacao.md
```

## Matriz de Dependência das Specs
```text
[ Spec 001: Clientes e Veículos ] ──► [ Spec 004: Agendamento ]
               │                                │
               ▼                                ▼
[ Spec 002: Ordens de Serviço ] ◄───────────────┘
       │               ▲
       ▼               │
[ Spec 003: Estoque ] ──┴──► [ Spec 005: Faturamento ]
```

## Caminhos de Sequência Propostos
1. **Consolidação do Modelo de Dados:** Mapear tipos de dados, PKs e FKs antes do código.
2. **Execução Incremental:** Iniciar o desenvolvimento pela **Spec 001** (Clientes e Veículos), aplicando testes e critérios de aceite.
