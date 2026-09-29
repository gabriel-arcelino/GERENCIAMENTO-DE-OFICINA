# Clientes e Veículos Specification

## Purpose
Gerenciamento de clientes e veículos vinculados, provendo a base cadastral e de busca para abertura de Ordens de Serviço e Agendamentos.

## Requirements

### Requirement: Cadastro de Clientes
O sistema SHALL permitir o cadastro e edição de clientes com informações de contato.

#### Scenario: Cadastro de cliente com sucesso
- **WHEN** o atendente submete um novo cliente com nome e telefone válidos
- **THEN** o cliente é persistido no banco e exibido nas listagens de busca

### Requirement: Cadastro e Validação de Veículos
O sistema SHALL vincular veículos a um cliente existente e validar a unicidade da placa em padrões antigo e Mercosul.

#### Scenario: Cadastro com placa válida (padrão antigo ou Mercosul)
- **WHEN** o atendente cadastra um veículo com placa no padrão ABC1234 ou ABC1D23
- **THEN** o veículo é registrado e vinculado ao cliente informado

#### Scenario: Bloqueio de duplicidade de placa
- **WHEN** o atendente tenta cadastrar um veículo com placa já existente no sistema
- **THEN** o sistema SHALL bloquear o cadastro e exibir o cliente proprietário atual do veículo

### Requirement: Integridade Histórica e Exclusão
O sistema SHALL preservar o histórico impedindo a exclusão de clientes que possuam veículos vinculados.

#### Scenario: Bloqueio de exclusão com veículos associados
- **WHEN** o usuário tenta excluir um cliente que possui um ou mais veículos cadastrados
- **THEN** a operação é rejeitada informando que o cliente possui veículos vinculados

### Requirement: Busca Unificada
O sistema SHALL permitir consultar clientes por nome, telefone ou placa de veículo.

#### Scenario: Busca por placa
- **WHEN** o atendente digita a placa de um veículo na busca
- **THEN** o sistema retorna o cliente titular e os dados do veículo
