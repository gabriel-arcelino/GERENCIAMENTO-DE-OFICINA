# Spec 005 - Faturamento

## Objetivo
Registrar o fechamento financeiro das Ordens de Serviço, com suporte a múltiplos pagamentos e controle de saldos pendentes.

## Entidades Envolvidas
* **Pagamento:** `id`, `os_id`, `forma_pagamento` (`DINHEIRO` | `PIX` | `CARTAO_DEBITO` | `CARTAO_CREDITO`), `valor`, `data_pagamento`.

## Regras de Negócio
* **Múltiplos Pagamentos:** Uma OS pode receber mais de um lançamento de pagamento (ex.: entrada em PIX e saldo no cartão).
* **Quitação:** Uma OS é considerada quitada quando a soma dos pagamentos for igual ao valor total da OS.
* **Entrega com Saldo Pendente (Fiado):** O veículo pode ser transicionado para o status `ENTREGUE` mesmo que o valor total não tenha sido totalmente quitado. O saldo devedor vai para uma listagem de pendências financeiras / cobrança.
* **Fora de Escopo Fiscal:** O sistema não realiza emissão de NFS-e/NF-e.

## Fluxos Principais
1. Abertura da tela de fechamento financeiro na OS.
2. Lançamento de um ou mais pagamentos com suas respectivas formas e valores.
3. Cálculo do saldo devedor ou do status de quitação.
4. Consulta da listagem de clientes/OS com saldo pendente.

## Casos Extremos / Validações
* **Valor pago maior que o valor da OS:** O sistema exibe um alerta indicando a diferença (troco/gorjeta), mas permite a gravação sem travar a operação.
* **Pagamentos fracionados ao longo do tempo:** O sistema mantém o histórico de todos os lançamentos parciais realizados.

## Fora de Escopo
* Emissão de Notas Fiscais (NF-e / NFS-e).
* DRE (Demonstrativo do Resultado do Exercício) e Contas a Pagar.
* Conciliação bancária automática.

## Critérios de Aceite
* Dado uma OS de R$ 500,00, quando é registrado R$ 300,00 em PIX e R$ 200,00 em Cartão, o status financeiro altera para quitado.
* Dado uma OS de R$ 400,00 com pagamento registrado de R$ 100,00 e entregue ao cliente, ela deve constar na listagem de pendências com saldo em aberto de R$ 300,00.
