# Spec 004 - Agendamento

## Objetivo
Organizar a entrada e a previsão de veículos na oficina de forma simplificada por data.

## Entidades Envolvidas
* **Agendamento:** `id`, `cliente_id`, `veiculo_id`, `data_agendamento`, `observacao`, `status` (`AGENDADO` | `CONVERTIDO_EM_OS` | `CANCELADO`).

## Regras de Negócio
* **Controle por Dia:** O agendamento é agrupado por data (sem gestão fina de horários exatos, elevadores ou boxes de atendimento).
* **Conversão em OS:** Um agendamento pode ser convertido diretamente em uma nova Ordem de Serviço, reaproveitando os dados do cliente e do veículo.

## Fluxos Principais
1. Registro de agendamento selecionando cliente, veículo e a data prevista de chegada.
2. Visualização do calendário/lista de agendamentos do dia.
3. Recepção do veículo e conversão do agendamento em abertura de OS (Spec 002).

## Casos Extremos / Validações
* **Cliente/Veículo não cadastrado no momento do agendamento:** Permitir o cadastro rápido de cliente e veículo antes de concluir o agendamento.
* **Cancelamento de agendamento:** O agendamento muda para o status `CANCELADO` e sai da lista de previstos do dia.

## Fora de Escopo
* Alocação dinâmica de mecânicos ou baías/boxes de trabalho.
* Notificação automática por SMS ou WhatsApp para o cliente.

## Critérios de Aceite
* Dado um agendamento para a data de hoje, quando o cliente chega, o atendente clica em "Gerar OS" e o sistema abre uma nova OS com status `RECEBIDO` pré-preenchida.
