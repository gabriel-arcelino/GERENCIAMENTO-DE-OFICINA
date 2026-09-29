# Estoque de Peças Specification

## Purpose
Controle do catálogo de peças e suprimentos da oficina com movimentações integradas diretamente às Ordens de Serviço (baixa automática, estorno e alertas de reposição).

## Requirements

### Requirement: Baixa Automática de Peças
O sistema SHALL realizar a baixa imediata no estoque no momento em que uma peça é adicionada como item de uma Ordem de Serviço.

#### Scenario: Baixa de estoque ao adicionar peça na OS
- **GIVEN** uma peça com saldo de 10 unidades
- **WHEN** 2 unidades são adicionadas como item em uma OS
- **THEN** o saldo em estoque passa imediatamente para 8 unidades e registra movimentação de SAIDA

### Requirement: Estorno Automático por Cancelamento ou Reprovação
O sistema SHALL estornar automaticamente as peças alocadas quando uma Ordem de Serviço for cancelada ou tiver status alterado para REPROVADO.

#### Scenario: Estorno de peças de OS reprovada
- **GIVEN** uma OS com peças vinculadas que foram baixadas do estoque
- **WHEN** o cliente reprova o orçamento e a OS vai para o status REPROVADO
- **THEN** todas as peças da OS são devolvidas ao estoque com registros de movimentação de ESTORNO

### Requirement: Tolerância a Saldo Negativo com Alerta
O sistema SHALL permitir a inclusão de itens mesmo que a quantidade solicitada exceda o estoque disponível, emitindo um alerta visual para o operador.

#### Scenario: Inclusão com estoque insuficiente
- **GIVEN** uma peça com saldo 0 no estoque
- **WHEN** o operador adiciona 1 unidade da peça na OS e confirma
- **THEN** o sistema exibe alerta de estoque insuficiente, permite a inclusão e o saldo em estoque passa a ser -1

### Requirement: Alerta de Ponto de Reposição
O sistema SHALL sinalizar no painel de estoque todas as peças cujo saldo atual seja menor ou igual ao estoque mínimo configurado.

#### Scenario: Sinalização de reposição necessária
- **GIVEN** uma peça com estoque_minimo de 5 unidades e saldo atual de 4 unidades
- **WHEN** o usuário visualiza a listagem de estoque
- **THEN** a peça aparece destacada na lista de itens em reposição necessária
