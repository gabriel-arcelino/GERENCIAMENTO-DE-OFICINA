# Spec Delta

## Purpose

Apresentar ao atendente, em uma única tela, os indicadores operacionais e financeiros do dia e do mês, sempre refletindo o estado atual dos dados.

## ADDED Requirements

### Requirement: Indicadores do painel inicial

O sistema SHALL exibir no painel inicial a quantidade de ordens de serviço abertas, o faturamento do mês corrente, o total pendente de ordens entregues com saldo devedor, a quantidade de peças em alerta de reposição, a quantidade de agendamentos do dia e o total de clientes cadastrados.

#### Scenario: Exibição dos indicadores

- **WHEN** o atendente autenticado abre o painel inicial
- **THEN** o sistema apresenta os seis indicadores: ordens abertas, faturamento do mês, total pendente, peças em alerta, agendamentos do dia e total de clientes

#### Scenario: Contagem de ordens abertas exclui as encerradas

- **WHEN** o painel inicial é exibido
- **THEN** a contagem de ordens abertas inclui apenas ordens que não estão em ENTREGUE nem REPROVADO

#### Scenario: Peças em alerta consideram o estoque mínimo

- **WHEN** o painel inicial é exibido
- **THEN** são contadas como em alerta as peças cujo saldo seja menor ou igual ao estoque mínimo configurado

### Requirement: Indicadores refletem o estado atual dos dados

O sistema SHALL calcular os indicadores do painel no momento da consulta, de modo que alterações nos dados e a passagem do tempo sejam refletidas sem exigir nova implantação.

#### Scenario: Mutação refletida na consulta seguinte

- **WHEN** uma nova ordem de serviço é aberta e o atendente acessa o painel inicial
- **THEN** a contagem de ordens abertas inclui a ordem recém-criada

#### Scenario: Indicadores de período acompanham a passagem do tempo

- **WHEN** o dia corrente ou o mês corrente mudam
- **THEN** os indicadores de agendamentos do dia e de faturamento do mês passam a considerar o novo período, sem necessidade de nova implantação

#### Scenario: Pendência financeira refletida após pagamento

- **WHEN** um pagamento é registrado em uma ordem entregue com saldo devedor
- **THEN** o total pendente exibido no painel inicial deixa de incluir o valor quitado

### Requirement: Listas de apoio no painel inicial

O sistema SHALL exibir no painel inicial as cinco ordens de serviço mais recentes e os agendamentos do dia, com os dados de cliente e veículo correspondentes.

#### Scenario: Ordens recentes em ordem decrescente

- **WHEN** o painel inicial é exibido
- **THEN** as ordens recentes são apresentadas da mais nova para a mais antiga, limitadas a cinco

#### Scenario: Agendamentos do dia com cliente e veículo

- **WHEN** existem agendamentos com status AGENDADO para a data corrente
- **THEN** o painel os apresenta com o nome do cliente e a identificação do veículo

#### Scenario: Ausência de agendamentos no dia

- **WHEN** não há agendamentos para a data corrente
- **THEN** o painel indica a ausência sem apresentar erro nem lista vazia inconsistente
