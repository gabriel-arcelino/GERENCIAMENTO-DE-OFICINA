# Modelo de Dados — Sistema de Gestão para Oficina

Este documento detalha o modelo relacional implementado no banco PostgreSQL através do Prisma ORM (`prisma/schema.prisma`), rastreado pelas especificações do **OpenSpec**.

---

## 1. Diagrama Entidade-Relacionamento (ERD)

```mermaid
erDiagram
    Cliente ||--o{ Veiculo : "possui (1:N)"
    Cliente ||--o{ OrdemServico : "solicita (1:N)"
    Cliente ||--o{ Agendamento : "agenda (1:N)"
    Veiculo ||--o{ OrdemServico : "vinculado (1:N)"
    Veiculo ||--o{ Agendamento : "agendado (1:N)"
    OrdemServico ||--o{ ItemOrdemServico : "contém (1:N)"
    OrdemServico ||--o{ HistoricoStatusOS : "audita (1:N)"
    OrdemServico ||--o{ Pagamento : "recebe (1:N)"
    OrdemServico ||--o| Agendamento : "origem (1:1)"
    Peca ||--o{ ItemOrdemServico : "alocada (1:N)"
    Peca ||--o{ MovimentacaoEstoque : "registra (1:N)"

    Cliente {
        string id PK "cuid"
        string nome
        string telefone
        string email "opcional"
        string endereco "opcional"
        string documento "opcional (CPF/CNPJ)"
        datetime criadoEm
        datetime atualizadoEm
    }

    Veiculo {
        string id PK "cuid"
        string placa UK "Mercosul ou padrão antigo"
        string marca
        string modelo
        int ano
        string cor "opcional"
        string clienteId FK
    }

    OrdemServico {
        string id PK "cuid"
        int numero UK "autoincrement"
        string veiculoId FK
        string clienteId FK
        StatusOS status "Default: RECEBIDO"
        datetime dataAbertura
        datetime dataPrevisaoEntrega "opcional"
        datetime dataEntrega "opcional"
        int kmEntrada "opcional"
        string relatoCliente "opcional"
        string diagnosticoTecnico "opcional"
        boolean orcamentoAprovado "Gate de aprovação formal"
    }

    ItemOrdemServico {
        string id PK "cuid"
        string osId FK
        TipoItem tipo "PECA | MAO_DE_OBRA"
        string descricao
        decimal quantidade "Decimal(10,3)"
        decimal valorUnitario "Decimal(10,2)"
        string pecaId FK "opcional (apenas para PECA)"
    }

    HistoricoStatusOS {
        string id PK "cuid"
        string osId FK
        StatusOS statusAnterior "opcional (null no RECEBIDO)"
        StatusOS statusNovo
        datetime dataHora
    }

    Peca {
        string id PK "cuid"
        string codigo UK
        string descricao
        decimal quantidadeEstoque "Decimal(10,3)"
        decimal estoqueMinimo "Decimal(10,3)"
        decimal valorCusto "Decimal(10,2)"
        decimal valorVenda "Decimal(10,2)"
    }

    MovimentacaoEstoque {
        string id PK "cuid"
        string pecaId FK
        TipoMovimentacao tipo "ENTRADA | SAIDA | ESTORNO"
        decimal quantidade "Decimal(10,3)"
        string osId "opcional (null em entrada manual)"
        datetime dataHora
    }

    Agendamento {
        string id PK "cuid"
        string clienteId FK
        string veiculoId FK
        datetime dataAgendamento
        string observacao "opcional"
        StatusAgendamento status "Default: AGENDADO"
        string osGeradaId UK "opcional (1:1 com OrdemServico)"
    }

    Pagamento {
        string id PK "cuid"
        string osId FK
        FormaPagamento formaPagamento "DINHEIRO | PIX | CARTAO_DEBITO | CARTAO_CREDITO"
        decimal valor "Decimal(10,2)"
        datetime dataPagamento
    }
```

---

## 2. Enums do Sistema

### `StatusOS` (Ciclo de Vida da Ordem de Serviço)
* `RECEBIDO`: Veículo deu entrada na oficina.
* `DIAGNOSTICO`: Em avaliação técnica preliminar e elaboração de orçamento.
* `AGUARDANDO_APROVACAO`: Orçamento finalizado aguardando aceite formal do cliente.
* `APROVADO`: Orçamento formalmente aprovado (gate obrigatório para execução).
* `EM_EXECUCAO`: Mecânico executando os serviços e instalando as peças.
* `CONFERENCIA`: Controle de qualidade e inspeção final pós-serviço.
* `PRONTO_PARA_ENTREGA`: Veículo pronto para retirada pelo cliente.
* `ENTREGUE`: Veículo retirado pelo cliente (permite quitação total ou saldo pendente).
* `REPROVADO`: Orçamento recusado pelo cliente (dispara estorno automático de peças).

### `TipoItem`
* `PECA`: Peça física baixada do estoque (vinculada a `pecaId`).
* `MAO_DE_OBRA`: Serviço prestado pela oficina (não vinculada ao estoque).

### `TipoMovimentacao`
* `ENTRADA`: Adição manual de mercadorias no estoque.
* `SAIDA`: Baixa automática realizada pela inclusão de item em OS.
* `ESTORNO`: Devolução automática ao estoque por cancelamento ou reprovação de OS.

### `StatusAgendamento`
* `AGENDADO`: Marcado para comparecimento na data.
* `CONVERTIDO_EM_OS`: Convertido em Ordem de Serviço pelo botão "Gerar OS".
* `CANCELADO`: Cancelado pelo cliente ou atendente.

### `FormaPagamento`
* `DINHEIRO`, `PIX`, `CARTAO_DEBITO`, `CARTAO_CREDITO`.

---

## 3. Rastreabilidade com as Especificações (OpenSpec)

| Entidades | Spec OpenSpec | Regras de Negócio Chave |
| :--- | :--- | :--- |
| `Cliente`, `Veiculo` | `openspec/specs/clientes-veiculos/spec.md` | Placa única (Mercosul/Antiga), bloqueio de exclusão com veículo. |
| `OrdemServico`, `ItemOrdemServico`, `HistoricoStatusOS` | `openspec/specs/ordens-servico/spec.md` | Máquina de estados estrita, gate `orcamentoAprovado`, auditoria obrigatória. |
| `Peca`, `MovimentacaoEstoque` | `openspec/specs/estoque-pecas/spec.md` | Baixa na OS, estorno no `REPROVADO`, alerta de saldo negativo e reposição. |
| `Agendamento` | `openspec/specs/agendamento/spec.md` | Agrupamento por dia, conversão direta 1:1 para OS. |
| `Pagamento` | `openspec/specs/faturamento/spec.md` | Múltiplos pagamentos por OS, quitação por soma, liberação de entrega com saldo pendente (fiado). |
