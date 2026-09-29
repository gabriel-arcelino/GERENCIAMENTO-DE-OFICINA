# Spec 001 - Clientes e Veículos

## Objetivo
Permitir cadastrar e consultar clientes e os veículos vinculados a eles, servindo de base para a abertura de Ordens de Serviço.

## Entidades Envolvidas
* **Cliente:** `id`, `nome`, `telefone`, `email` (opcional), `endereco` (opcional), `documento` (opcional).
* **Veiculo:** `id`, `placa`, `marca`, `modelo`, `ano`, `cor`, `cliente_id`.

## Regras de Negócio
* Um cliente pode ter múltiplos veículos.
* Um veículo pertence a exatamente um cliente por vez.
* Placa deve ser única no sistema.
* Cliente pode ser cadastrado sem veículo (ex.: primeiro contato antes de trazer o carro).
* Exclusão de cliente com veículos vinculados deve ser **bloqueada** para preservar a integridade do histórico.

## Fluxos Principais
1. Atendente cadastra um cliente novo.
2. Atendente adiciona um ou mais veículos ao cliente.
3. Atendente busca cliente por nome, telefone ou placa do veículo.
4. Atendente edita dados de cliente/veículo.

## Casos Extremos / Validações
* **Tentativa de cadastrar placa já existente:** Bloquear o cadastro e exibir o cliente proprietário atual do veículo.
* **Cliente sem veículo:** Deve ser listado normalmente nas buscas (não é considerado erro).
* **Formatos de placa:** O sistema deve aceitar tanto o padrão antigo (`ABC1234`) quanto o padrão Mercosul (`ABC1D23`).

## Fora de Escopo
* Histórico de serviços do veículo (coberto na Spec 002).
* Autenticação e gestão de usuários/permissões.
* Múltiplos proprietários simultâneos por veículo ou fluxo de transferência de propriedade.

## Critérios de Aceite
* Dado um cliente novo, quando cadastrado com nome e telefone, então aparece na listagem.
* Dado um veículo com placa já cadastrada, quando tento cadastrá-lo novamente, então o sistema bloqueia e exibe o cliente atual.
* Dado um cliente com veículos cadastrados, quando busco pela placa, então o sistema retorna o cliente correspondente.
