# Spec 002 - Ordens de Serviço (OS)

## Objetivo
Registrar e acompanhar o ciclo de vida de um serviço, do recebimento do veículo até a entrega final, seguindo o fluxo padrão do setor.

## Entidades Envolvidas
* **OrdemServico:** `id`, `numero`, `veiculo_id`, `cliente_id`, `status`, `data_abertura`, `data_previsao_entrega`, `data_entrega`, `km_entrada`, `relato_cliente`, `diagnostico_tecnico`.
* **ItemOrdemServico:** `id`, `os_id`, `tipo` (`PECA` | `MAO_DE_OBRA`), `descricao`, `quantidade`, `valor_unitario`.
* **HistoricoStatusOS:** `id`, `os_id`, `status_anterior`, `status_novo`, `data_hora`.

## Máquina de Estados / Fluxo de Status
```text
RECEBIDO → DIAGNOSTICO → AGUARDANDO_APROVACAO → APROVADO → EM_EXECUCAO → CONFERENCIA → PRONTO_PARA_ENTREGA → ENTREGUE
                                    ↳ REPROVADO (encerra sem execução)
```

## Regras de Negócio
* Transições de status devem seguir estritamente a máquina de estados (não há alteração livre de status).
* **Gate de Aprovação Obrigatório:** O sistema não permite transição do status `AGUARDANDO_APROVACAO` para `EM_EXECUCAO` sem o registro formal de aprovação do orçamento pelo cliente.
* Valor total da OS = Soma dos Itens (Peças + Mão de Obra).
* A OS só pode ir para o status `ENTREGUE` se estiver antes em `CONFERENCIA` ou `PRONTO_PARA_ENTREGA`.
* Toda alteração de status gera uma entrada de auditoria com data e hora.

## Fluxos Principais
1. Atendente abre uma OS vinculada a um cliente/veículo e registra o relato inicial e a quilometragem.
2. Técnico/Atendente insere o diagnóstico e cadastra os itens (peças e mão de obra) do orçamento.
3. Orçamento é apresentado ao cliente. Havendo aprovação, o aceite é registrado na OS.
4. OS avança para `EM_EXECUCAO`.
5. Serviço concluído passa por conferência e segue para entrega.

## Casos Extremos / Validações
* **Orçamento Reprovado:** Caso o cliente não aprove, a OS assume o status `REPROVADO`. O registro é mantido para histórico e não é excluído.
* **Inclusão de Peça/Serviço Adicional pós-aprovação:** Se houver necessidade de novos itens durante a execução, o valor total é atualizado e o sistema exige nova aprovação do cliente para prosseguir.
* **OS sem itens cadastrados:** Impedida de avançar para além da etapa de `DIAGNOSTICO`.

## Fora de Escopo
* Gestão de múltiplos responsáveis/papéis por etapa de execução.
* Agendamento de horário na agenda (Spec 004).
* Pagamento e controle financeiro (Spec 005).

## Critérios de Aceite
* Dado um orçamento não aprovado, quando tento alterar o status para `EM_EXECUCAO`, então o sistema bloqueia a transição.
* Dado uma OS aprovada, quando adiciono um item extra, então o valor total é recalculado e exige nova aprovação.
* Dado uma OS entregue, quando consulto o histórico do veículo, então o registro aparece completo com datas, status e itens.
