# Pendências e Lacunas Conhecidas

Divergências entre o que está especificado e o que está implementado, além de código morto
identificado durante a unificação das especificações (migração Kiro → OpenSpec).

---

## Resolvidas

### ✅ Alerta de estoque insuficiente nunca era exibido — corrigido em `74f9c3b`

O alerta era calculado e descartado: `estoque.ts` devolvia `alertaEstoqueInsuficiente`, mas
`src/actions/ordens.ts` chamava `baixarEstoque` sem capturar o retorno, e o painel da OS não
exibia nada. O requisito *"Tolerância a Saldo Negativo com Alerta"* não era cumprido.

Corrigido espelhando o padrão que já existia para o alerta de pagamento excedente
(`registrarPagamentoAction` + `painel-os.tsx`): a action agora propaga
`{ alertaEstoqueInsuficiente, saldoAtual }` e o painel exibe o aviso.

### ✅ Build de produção quebrado por ícone não importado — corrigido em `74f9c3b`

`src/app/page.tsx:201` usava `AlertTriangle` sem importar (a linha 11 importa `TriangleAlert`),
gerando `TS2304`. Como `next.config.mjs` não define `typescript.ignoreBuildErrors`,
`npm run build` falhava. Trocado para `TriangleAlert`.

### ✅ Edição e exclusão de veículo inacessíveis — corrigido em `74f9c3b`

`atualizarVeiculo` e `deletarVeiculo` existiam em `src/services/veiculos.ts` sem nenhum
chamador. Foram expostos:

- `atualizarVeiculoAction` + tela `/clientes/[id]/veiculos/[veiculoId]/editar`
- `deletarVeiculoAction` + `BotaoExcluirVeiculo` na listagem do cliente

`FormVeiculo` passou a operar em modo criar/editar. O bloqueio de exclusão de veículo com
ordens de serviço vinculadas já existia no service e agora chega à interface.

---

## Abertas

### 1. Ajuste de saldo ao editar quantidade de peça na OS (código morto)

`ajustarEstoqueOS(pecaId, osId, quantidadeAnterior, quantidadeNova)` existe em
`src/services/estoque.ts:191-220` — baixa a diferença se a quantidade aumentar, estorna se
diminuir. **Continua sem chamadores** (nem action, nem componente), e não existe
`atualizarItemOS`: `src/services/ordemServico.ts` só define `adicionarItemOS` e `removerItemOS`.

A regra era explícita na especificação legada. Hoje é inalcançável: alterar a quantidade de um
item já lançado numa OS não ajusta o estoque.

**Decisão necessária:** expor a edição de item (criando `atualizarItemOS` + action + UI) ou
remover a função morta.

### 2. Cadastro rápido de cliente/veículo no agendamento (não implementado)

A especificação legada previa, como caso extremo, permitir cadastrar cliente e veículo no
próprio fluxo de agendamento. Não está implementado:

- `src/app/agenda/novo/page.tsx` apenas seleciona cliente e veículo já existentes
- `src/app/api/clientes/route.ts` expõe somente `GET` (sem `POST`)
- `src/services/agendamento.ts` exige `clienteId` e `veiculoId` pré-existentes

**Decisão necessária:** implementar o fluxo ou confirmar que o cadastro prévio é obrigatório.

### 3. Cenários sem cláusula GIVEN (formato das especificações)

Nove cenários pré-existentes usam apenas WHEN/THEN, sem GIVEN:

| Arquivo | Cenários |
| :--- | :--- |
| `openspec/specs/agendamento/spec.md` | "Agendamento com sucesso", "Cancelamento" |
| `openspec/specs/clientes-veiculos/spec.md` | "Cadastro de cliente com sucesso", "Cadastro com placa válida (padrão antigo ou Mercosul)", "Bloqueio de duplicidade de placa", "Bloqueio de exclusão com veículos associados", "Busca por placa" |
| `openspec/specs/faturamento/spec.md` | "Quitação atingida" |
| `openspec/specs/ordens-servico/spec.md` | "Registro de auditoria após mudança de status" |

Não foi possível confirmar se isso reprova em `openspec validate --specs`, porque o CLI do
OpenSpec não está instalado. **Se reprovar, adicionar as cláusulas GIVEN.**

### 4. Cobertura de teste das funções que tocam banco

Os testes unitários do projeto cobrem apenas funções puras (ex.: `validarPlaca`) — nada que
acesse o Prisma. As funções recém-expostas (`atualizarVeiculo`, `deletarVeiculo`) e o caminho
do alerta de estoque não têm teste automatizado.

A infraestrutura para testes de integração já existe (`DATABASE_URL_TEST`,
`src/lib/prisma-test.ts`, `postgres_test` no Docker na porta 5433, script `test:integration`),
mas não há nenhum arquivo `*.integration.test.ts` no projeto.

### 5. `deletarClienteAction` também está sem interface

O grep por consumidores não encontra nenhum componente que chame `deletarClienteAction`
(`src/actions/clientes.ts`). A exclusão de cliente existe no service e na action, mas não há
botão em nenhuma tela. Mesmo padrão do que foi corrigido para veículo.
