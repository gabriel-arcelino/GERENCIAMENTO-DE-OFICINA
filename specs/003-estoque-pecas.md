# Spec 003 - Estoque de Peças

## Objetivo
Controlar o estoque de peças e suprimentos da oficina com integração direta às Ordens de Serviço.

## Entidades Envolvidas
* **Peca:** `id`, `codigo`, `descricao`, `quantidade_estoque`, `estoque_minimo`, `valor_custo`, `valor_venda`.
* **MovimentacaoEstoque:** `id`, `peca_id`, `tipo` (`ENTRADA` | `SAIDA` | `ESTORNO`), `quantidade`, `os_id` (opcional), `data_hora`.

## Regras de Negócio
* **Baixa Automática:** Ao adicionar uma peça em uma OS, a baixa no estoque é realizada automaticamente.
* **Estorno Automático:** O cancelamento ou reprovação de uma OS realiza o estorno automático dos itens para o estoque.
* **Sem Bloqueio por Falta de Estoque:** Se a quantidade solicitada na OS for superior à quantidade em estoque, o sistema **alerta o usuário, mas permite a inclusão** (o saldo da peça pode ficar negativo, acomodando casos em que a peça foi comprada na hora ou está a caminho).
* **Alerta de Reposição:** Peças com `quantidade_estoque` igual ou inferior ao `estoque_minimo` devem ser sinalizadas em uma lista de reposição.

## Fluxos Principais
1. Cadastro de peças e definição de preço de venda e estoque mínimo.
2. Lançamento de entrada de mercadorias no estoque.
3. Associação da peça a uma OS (gerando baixa automática).
4. Consulta ao relatório/painel de peças com baixo estoque.

## Casos Extremos / Validações
* **Adição de peça sem saldo suficiente:** Exibir alerta ao usuário ("Estoque insuficiente. Saldo atual: X"), permitindo confirmar a operação.
* **Alteração de quantidade de peça na OS:** Ajustar o saldo em estoque proporcionalmente à diferença.

## Fora de Escopo
* Emissão e importação de XML de NFe de fornecedores.
* Inventário físico de estoque com conciliação manual complexa.

## Critérios de Aceite
* Dado um produto com 5 unidades em estoque, quando adiciono 2 unidades em uma OS, então o estoque restante passa para 3.
* Dado uma OS reprovada, quando o status muda para `REPROVADO`, os itens baixados retornam automaticamente ao estoque.
* Dado uma peça com estoque zerado, quando adicionada à OS e confirmada, o saldo passa a ser -1 com um alerta exibido.
