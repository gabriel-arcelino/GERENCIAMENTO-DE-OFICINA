# Pendências e Lacunas Conhecidas

Este documento registra divergências entre o que está especificado e o que está de fato
implementado, além de código morto identificado durante a unificação das especificações
(migração Kiro → OpenSpec). **Nada aqui está resolvido** — são itens para triagem.

---

## 1. Alerta de estoque insuficiente nunca é exibido (bug)

**Requisito:** `openspec/specs/estoque-pecas/spec.md` — *"Tolerância a Saldo Negativo com
Alerta"* exige alertar o usuário quando a quantidade lançada excede o saldo disponível.

**Situação:** o alerta é calculado e descartado.

- `src/services/estoque.ts:134` calcula `const alertaEstoqueInsuficiente = estoqueAtual < quantidade;`
- `src/services/estoque.ts:150` devolve o valor no retorno de `baixarEstoque`
- `src/actions/ordens.ts:68` chama `await baixarEstoque(...)` **sem capturar o retorno**

**Consequência:** o saldo fica negativo (comportamento permitido pela regra), mas o usuário
nunca é avisado. O requisito está especificado, porém não cumprido.

**Correção sugerida:** capturar o retorno na action e propagar o aviso até a UI (por exemplo,
incluir o sinal no `ActionResult` e exibir um alerta).

---

## 2. Ajuste de saldo ao editar quantidade de peça na OS (código morto)

`ajustarEstoqueOS(pecaId, osId, quantidadeAnterior, quantidadeNova)` existe em
`src/services/estoque.ts:191-220` — baixa a diferença se a quantidade aumentar, estorna se
diminuir. **Porém não é chamada em lugar nenhum** (nem action, nem componente), e não existe
`atualizarItemOS`: `src/services/ordemServico.ts` só define `adicionarItemOS` e `removerItemOS`.

A regra era explícita na especificação legada. Hoje é inalcançável: alterar a quantidade de um
item já lançado numa OS não ajusta o estoque.

**Decisão necessária:** expor a edição de item (criando `atualizarItemOS` + action + UI) ou
remover a função morta.

---

## 3. Edição e exclusão de veículo (código morto)

`atualizarVeiculo` (`src/services/veiculos.ts:92`) e `deletarVeiculo` (`:151`) existem mas **não
têm chamadores**: `src/actions/clientes.ts` expõe apenas `criarVeiculoAction`, e
`src/app/clientes/[id]/veiculos/` contém somente `novo/page.tsx` — não há rota de edição.

A especificação legada previa *"atendente edita dados de cliente/veículo"*. A edição de cliente
funciona; a de veículo não está acessível pela interface.

**Decisão necessária:** criar a tela/action de edição ou remover as funções mortas.

---

## 4. Cadastro rápido de cliente/veículo no agendamento (não implementado)

A especificação legada previa, como caso extremo, permitir cadastrar cliente e veículo no próprio
fluxo de agendamento. Não está implementado:

- `src/app/agenda/novo/page.tsx` apenas seleciona cliente e veículo já existentes
- `src/app/api/clientes/route.ts` expõe somente `GET` (sem `POST`)
- `src/services/agendamento.ts` exige `clienteId` e `veiculoId` pré-existentes

**Decisão necessária:** implementar o fluxo ou confirmar que o cadastro prévio é obrigatório.

---

## 5. Cenários sem cláusula GIVEN (formato das especificações)

Nove cenários pré-existentes usam apenas WHEN/THEN, sem GIVEN:

| Arquivo | Cenários |
| :--- | :--- |
| `openspec/specs/agendamento/spec.md` | "Agendamento com sucesso", "Cancelamento" |
| `openspec/specs/clientes-veiculos/spec.md` | "Cadastro de cliente com sucesso", "Cadastro com placa válida (padrão antigo ou Mercosul)", "Bloqueio de duplicidade de placa", "Bloqueio de exclusão com veículos associados", "Busca por placa" |
| `openspec/specs/faturamento/spec.md` | "Quitação atingida" |
| `openspec/specs/ordens-servico/spec.md` | "Registro de auditoria após mudança de status" |

Não foi possível confirmar se isso reprova em `openspec validate --specs`, porque o CLI do
OpenSpec não está instalado. **Se reprovar, adicionar as cláusulas GIVEN.**
