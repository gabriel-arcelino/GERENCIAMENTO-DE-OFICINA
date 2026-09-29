# Agendamento Specification

## Purpose
Organização simplificada da entrada de veículos na oficina por data, permitindo recepção ágil e conversão direta em Ordens de Serviço pré-preenchidas.

## Requirements

### Requirement: Registro de Agendamento por Data
O sistema SHALL permitir criar agendamentos associando cliente, veículo e data prevista de chegada.

#### Scenario: Agendamento com sucesso
- **WHEN** o atendente registra um agendamento com cliente, veículo e data
- **THEN** o agendamento é salvo com status AGENDADO e listado na agenda do respectivo dia

### Requirement: Conversão em Ordem de Serviço
O sistema SHALL permitir converter um agendamento ativo diretamente em uma nova Ordem de Serviço com status RECEBIDO.

#### Scenario: Conversão direta em OS
- **GIVEN** um agendamento com status AGENDADO
- **WHEN** o atendente clica na ação de gerar OS
- **THEN** o sistema cria uma nova OS com status RECEBIDO pré-preenchida com cliente e veículo, e altera o status do agendamento para CONVERTIDO_EM_OS

### Requirement: Cancelamento de Agendamento
O sistema SHALL permitir cancelar agendamentos que não forem comparecidos.

#### Scenario: Cancelamento
- **WHEN** o atendente cancela um agendamento pendente
- **THEN** o agendamento assume o status CANCELADO e é removido da lista de pendentes do dia
