# Ordens de Serviço Specification

## Purpose
Gerenciamento completo do ciclo de vida das Ordens de Serviço (OS), controlando o fluxo por máquina de estados estrita, gate formal de aprovação e auditoria de transições.

## Requirements

### Requirement: Máquina de Estados Estrita
O sistema SHALL impor a transição sequencial de status da OS: RECEBIDO -> DIAGNOSTICO -> AGUARDANDO_APROVACAO -> APROVADO -> EM_EXECUCAO -> CONFERENCIA -> PRONTO_PARA_ENTREGA -> ENTREGUE, com saída para REPROVADO a partir de AGUARDANDO_APROVACAO.

#### Scenario: Transição sequencial permitida
- **GIVEN** uma OS no status RECEBIDO
- **WHEN** o atendente conclui a recepção e inicia a análise
- **THEN** o status avança para DIAGNOSTICO

#### Scenario: Bloqueio de transição inválida
- **GIVEN** uma OS no status RECEBIDO
- **WHEN** o usuário tenta avançar diretamente para EM_EXECUCAO
- **THEN** o sistema SHALL recusar a transição com erro de regra de negócio

### Requirement: Gate de Aprovação Obrigatório
O sistema SHALL exigir o registro formal de aprovação do cliente para transicionar de AGUARDANDO_APROVACAO para APROVADO ou EM_EXECUCAO.

#### Scenario: Bloqueio de execução sem aprovação
- **GIVEN** uma OS com orçamento em AGUARDANDO_APROVACAO
- **WHEN** há tentativa de alterar o status para EM_EXECUCAO sem registro de aceite
- **THEN** o sistema SHALL bloquear o avanço

#### Scenario: Registro de aprovação do cliente
- **GIVEN** uma OS em AGUARDANDO_APROVACAO
- **WHEN** o cliente aprova o orçamento e o atendente confirma o aceite formal
- **THEN** o status avança para APROVADO

### Requirement: Itens e Recálculo de Orçamento
O sistema SHALL calcular o valor total da OS pela soma de peças e mão de obra, exigindo nova aprovação em caso de itens extras pós-aprovação.

#### Scenario: Adição de item extra pós-aprovação
- **GIVEN** uma OS que já foi aprovada ou está em execução
- **WHEN** um técnico adiciona uma nova peça ou serviço extra
- **THEN** o sistema SHALL recalcular o valor total e retornar a OS para o status AGUARDANDO_APROVACAO

### Requirement: Auditoria de Status
O sistema SHALL registrar em histórico imutável cada alteração de status com identificador da OS, status anterior, novo status e data/hora.

#### Scenario: Registro de auditoria após mudança de status
- **WHEN** uma OS sofre qualquer transição de status
- **THEN** um registro correspondente é criado em HistoricoStatusOS

### Requirement: Abertura de Ordem de Serviço
O sistema SHALL permitir abrir uma Ordem de Serviço vinculada a um cliente e a um veículo, registrando o relato inicial do cliente e a quilometragem de entrada, sempre com status inicial RECEBIDO.

#### Scenario: Abertura de OS com relato e quilometragem
- **GIVEN** um cliente com veículo cadastrado
- **WHEN** o atendente abre uma OS informando veículo, cliente, relato inicial e quilometragem de entrada
- **THEN** a OS é criada com status RECEBIDO e o primeiro registro de histórico de status é gerado

### Requirement: Exigência de Itens para Avanço do Status
O sistema SHALL impedir que uma Ordem de Serviço sem itens cadastrados avance para além do status DIAGNOSTICO.

#### Scenario: Bloqueio de avanço de OS sem itens
- **GIVEN** uma OS no status DIAGNOSTICO sem nenhum item (peça ou mão de obra) cadastrado
- **WHEN** o usuário tenta avançar o status para AGUARDANDO_APROVACAO ou para qualquer etapa posterior
- **THEN** o sistema SHALL recusar a transição informando que a OS precisa ter pelo menos um item para avançar além do diagnóstico

### Requirement: Bloqueio de Inclusão de Itens em Status Avançados
O sistema SHALL impedir a inclusão de novos itens em Ordens de Serviço cujo status seja CONFERENCIA, PRONTO_PARA_ENTREGA, ENTREGUE ou REPROVADO.

#### Scenario: Bloqueio de item em OS em conferência
- **GIVEN** uma OS no status CONFERENCIA
- **WHEN** o técnico tenta adicionar uma peça ou serviço à OS
- **THEN** o sistema SHALL recusar a inclusão informando que não é possível adicionar itens naquele status

#### Scenario: Bloqueio de item em OS reprovada
- **GIVEN** uma OS no status REPROVADO
- **WHEN** o usuário tenta adicionar um item à OS
- **THEN** o sistema SHALL recusar a inclusão informando que não é possível adicionar itens naquele status

### Requirement: Retenção do Histórico de Ordens de Serviço
O sistema SHALL manter o registro de todas as Ordens de Serviço, inclusive as reprovadas, preservando status, datas e itens, e SHALL NOT oferecer operação de exclusão da OS.

#### Scenario: OS reprovada permanece disponível para consulta
- **GIVEN** uma OS cujo orçamento foi reprovado e que assumiu o status REPROVADO
- **WHEN** o usuário consulta a OS ou o histórico do cliente e do veículo
- **THEN** o registro da OS permanece disponível para consulta, com status, datas e itens preservados, sem opção de exclusão
