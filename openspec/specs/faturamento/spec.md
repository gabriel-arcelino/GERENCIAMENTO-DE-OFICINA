# Faturamento Specification

## Purpose
Gestão do encerramento financeiro das Ordens de Serviço, com suporte a múltiplos pagamentos, cálculo de quitação e liberação de entrega com saldo pendente (fiado).

## Requirements

### Requirement: Múltiplos Meios e Parcelas de Pagamento
O sistema SHALL suportar pagamentos fracionados para uma mesma OS em dinheiro, PIX, cartão de débito ou crédito.

#### Scenario: Pagamento composto
- **GIVEN** uma OS com total de R$ 500,00
- **WHEN** o cliente paga R$ 300,00 via PIX e R$ 200,00 via Cartão
- **THEN** ambos os pagamentos são registrados e vinculados à OS

### Requirement: Controle de Quitação
O sistema SHALL calcular automaticamente o saldo devedor e considerar a OS quitada quando a soma dos pagamentos for maior ou igual ao valor total da OS.

#### Scenario: Quitação atingida
- **WHEN** a soma dos pagamentos registrados é igual ao valor total dos itens da OS
- **THEN** o status financeiro da OS é atualizado para QUITADO

### Requirement: Entrega com Saldo Pendente (Fiado)
O sistema SHALL permitir a transição da OS para o status ENTREGUE mesmo se houver saldo restante em aberto, encaminhando o débito para a lista de cobrança.

#### Scenario: Entrega com débito pendente
- **GIVEN** uma OS de R$ 400,00 com apenas R$ 100,00 pagos
- **WHEN** o veículo é entregue ao cliente e a OS avança para ENTREGUE
- **THEN** a OS é concluída com sucesso e incluída na listagem de pendências financeiras com saldo devedor de R$ 300,00

### Requirement: Tolerância a Pagamento Excedente com Alerta
O sistema SHALL alertar o atendente quando o valor informado for superior ao total da OS (troco ou gorjeta), permitindo a confirmação da operação.

#### Scenario: Registro de valor superior
- **GIVEN** uma OS com valor restante de R$ 90,00
- **WHEN** o atendente registra um pagamento em dinheiro de R$ 100,00
- **THEN** o sistema exibe o valor de troco calculado (R$ 10,00) e permite registrar a operação
