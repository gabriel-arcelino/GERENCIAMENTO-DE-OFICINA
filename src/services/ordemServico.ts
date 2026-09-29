import { prisma } from "@/lib/prisma";
import { StatusOS, TipoItem } from "@prisma/client";
import { z } from "zod";
import { Decimal } from "@prisma/client/runtime/library";

// ─────────────────────────────────────────────────────────────────────────────
// Máquina de estados
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mapa de transições válidas de status.
 * Cada chave é o status atual; o array é a lista de próximos status permitidos.
 */
export const TRANSICOES_VALIDAS: Record<StatusOS, StatusOS[]> = {
  RECEBIDO: [StatusOS.DIAGNOSTICO],
  DIAGNOSTICO: [StatusOS.AGUARDANDO_APROVACAO],
  AGUARDANDO_APROVACAO: [StatusOS.APROVADO, StatusOS.REPROVADO],
  APROVADO: [StatusOS.EM_EXECUCAO],
  EM_EXECUCAO: [StatusOS.CONFERENCIA],
  CONFERENCIA: [StatusOS.PRONTO_PARA_ENTREGA],
  PRONTO_PARA_ENTREGA: [StatusOS.ENTREGUE],
  ENTREGUE: [],
  REPROVADO: [],
};

/**
 * Status que encerram a OS (sem mais transições possíveis).
 */
export const STATUS_FINAIS: StatusOS[] = [StatusOS.ENTREGUE, StatusOS.REPROVADO];

/**
 * Verifica se uma transição é válida na máquina de estados.
 */
export function isTransicaoValida(atual: StatusOS, proximo: StatusOS): boolean {
  return TRANSICOES_VALIDAS[atual].includes(proximo);
}

// ─────────────────────────────────────────────────────────────────────────────
// Schemas de validação
// ─────────────────────────────────────────────────────────────────────────────

export const AbrirOSSchema = z.object({
  veiculoId: z.string().min(1),
  clienteId: z.string().min(1),
  kmEntrada: z.number().int().min(0).optional(),
  relatoCliente: z.string().optional(),
  dataPrevisaoEntrega: z.date().optional(),
});

export const ItemOSSchema = z.object({
  osId: z.string().min(1),
  tipo: z.nativeEnum(TipoItem),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  quantidade: z.number().positive("Quantidade deve ser maior que zero"),
  valorUnitario: z.number().positive("Valor deve ser maior que zero"),
  pecaId: z.string().optional(),
});

export type AbrirOSInput = z.infer<typeof AbrirOSSchema>;
export type ItemOSInput = z.infer<typeof ItemOSSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Funções de serviço
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Abre uma nova Ordem de Serviço com status RECEBIDO.
 * Registra o primeiro histórico de status.
 */
export async function abrirOS(data: AbrirOSInput) {
  const parsed = AbrirOSSchema.parse(data);

  return prisma.$transaction(async (tx) => {
    const os = await tx.ordemServico.create({
      data: {
        veiculoId: parsed.veiculoId,
        clienteId: parsed.clienteId,
        status: StatusOS.RECEBIDO,
        kmEntrada: parsed.kmEntrada,
        relatoCliente: parsed.relatoCliente,
        dataPrevisaoEntrega: parsed.dataPrevisaoEntrega,
      },
      include: { veiculo: true, cliente: true },
    });

    // Registra o primeiro histórico
    await tx.historicoStatusOS.create({
      data: {
        osId: os.id,
        statusAnterior: null,
        statusNovo: StatusOS.RECEBIDO,
      },
    });

    return os;
  });
}

/**
 * Transiciona o status de uma OS.
 *
 * Regras:
 * - Transições devem seguir a máquina de estados
 * - Gate: AGUARDANDO_APROVACAO → APROVADO exige que `orcamentoAprovado` seja true
 * - OS sem itens não pode sair do status DIAGNOSTICO
 */
export async function transicionarStatus(osId: string, novoStatus: StatusOS) {
  const os = await prisma.ordemServico.findUnique({
    where: { id: osId },
    include: { itens: true },
  });

  if (!os) throw new Error(`OS não encontrada: ${osId}`);

  // Validação da máquina de estados
  if (!isTransicaoValida(os.status, novoStatus)) {
    throw new Error(
      `Transição inválida: ${os.status} → ${novoStatus}. Transições permitidas a partir de ${os.status}: ${TRANSICOES_VALIDAS[os.status].join(", ") || "nenhuma"}.`
    );
  }

  // Gate de aprovação: não pode ir para APROVADO sem o gate formal
  if (novoStatus === StatusOS.APROVADO && !os.orcamentoAprovado) {
    throw new Error(
      "O orçamento precisa ser formalmente aprovado pelo cliente antes de avançar para EM_EXECUCAO. Use a função aprovarOrcamento() para registrar a aprovação."
    );
  }

  // Bloqueio: OS sem itens não avança além de DIAGNOSTICO
  const statusQueExigemItens: StatusOS[] = [
    StatusOS.AGUARDANDO_APROVACAO,
    StatusOS.APROVADO,
    StatusOS.EM_EXECUCAO,
    StatusOS.CONFERENCIA,
    StatusOS.PRONTO_PARA_ENTREGA,
    StatusOS.ENTREGUE,
  ];
  if (statusQueExigemItens.includes(novoStatus) && os.itens.length === 0) {
    throw new Error(
      "A OS precisa ter pelo menos um item (peça ou mão de obra) para avançar além do diagnóstico."
    );
  }

  return prisma.$transaction(async (tx) => {
    const osAtualizada = await tx.ordemServico.update({
      where: { id: osId },
      data: {
        status: novoStatus,
        dataEntrega:
          novoStatus === StatusOS.ENTREGUE ? new Date() : undefined,
      },
      include: { veiculo: true, cliente: true, itens: true },
    });

    await tx.historicoStatusOS.create({
      data: {
        osId,
        statusAnterior: os.status,
        statusNovo: novoStatus,
      },
    });

    return osAtualizada;
  });
}

/**
 * Registra a aprovação formal do orçamento pelo cliente.
 * Obrigatório antes de avançar de AGUARDANDO_APROVACAO → APROVADO.
 */
export async function aprovarOrcamento(osId: string) {
  const os = await prisma.ordemServico.findUnique({ where: { id: osId } });
  if (!os) throw new Error(`OS não encontrada: ${osId}`);

  if (os.status !== StatusOS.AGUARDANDO_APROVACAO) {
    throw new Error(
      `A OS deve estar em AGUARDANDO_APROVACAO para ser aprovada. Status atual: ${os.status}`
    );
  }

  // Marca como aprovada e imediatamente transiciona para APROVADO
  await prisma.ordemServico.update({
    where: { id: osId },
    data: { orcamentoAprovado: true },
  });

  return transicionarStatus(osId, StatusOS.APROVADO);
}

/**
 * Adiciona um item (peça ou mão de obra) à OS.
 *
 * Se a OS já foi aprovada, a adição de novo item reseta `orcamentoAprovado`
 * para false e retorna o status para AGUARDANDO_APROVACAO, exigindo nova aprovação.
 */
export async function adicionarItemOS(data: ItemOSInput) {
  const parsed = ItemOSSchema.parse(data);

  const os = await prisma.ordemServico.findUnique({
    where: { id: parsed.osId },
  });
  if (!os) throw new Error(`OS não encontrada: ${parsed.osId}`);

  // Status em que não é mais permitido adicionar itens
  const statusBloqueados: StatusOS[] = [
    StatusOS.CONFERENCIA,
    StatusOS.PRONTO_PARA_ENTREGA,
    StatusOS.ENTREGUE,
    StatusOS.REPROVADO,
  ];
  if (statusBloqueados.includes(os.status)) {
    throw new Error(
      `Não é possível adicionar itens a uma OS com status ${os.status}.`
    );
  }

  const precisaReaprovacao =
    os.status === StatusOS.EM_EXECUCAO || os.status === StatusOS.APROVADO;

  return prisma.$transaction(async (tx) => {
    const item = await tx.itemOrdemServico.create({
      data: {
        osId: parsed.osId,
        tipo: parsed.tipo,
        descricao: parsed.descricao,
        quantidade: parsed.quantidade,
        valorUnitario: parsed.valorUnitario,
        pecaId: parsed.pecaId || null,
      },
    });

    // Se item extra pós-aprovação, exige nova aprovação
    if (precisaReaprovacao) {
      await tx.ordemServico.update({
        where: { id: parsed.osId },
        data: {
          orcamentoAprovado: false,
          status: StatusOS.AGUARDANDO_APROVACAO,
        },
      });

      await tx.historicoStatusOS.create({
        data: {
          osId: parsed.osId,
          statusAnterior: os.status,
          statusNovo: StatusOS.AGUARDANDO_APROVACAO,
          dataHora: new Date(),
        },
      });
    }

    return item;
  });
}

/**
 * Remove um item da OS.
 */
export async function removerItemOS(itemId: string) {
  const item = await prisma.itemOrdemServico.findUnique({
    where: { id: itemId },
    include: { os: true },
  });
  if (!item) throw new Error(`Item não encontrado: ${itemId}`);

  const statusBloqueados: StatusOS[] = [
    StatusOS.ENTREGUE,
    StatusOS.REPROVADO,
  ];
  if (statusBloqueados.includes(item.os.status)) {
    throw new Error(`Não é possível remover itens de uma OS ${item.os.status}.`);
  }

  return prisma.itemOrdemServico.delete({ where: { id: itemId } });
}

/**
 * Calcula o valor total de uma OS (soma de quantidade × valorUnitario de todos os itens).
 */
export function calcularTotalOS(
  itens: Array<{ quantidade: Decimal | number; valorUnitario: Decimal | number }>
): number {
  return itens.reduce((acc, item) => {
    const qtd = typeof item.quantidade === "object" ? item.quantidade.toNumber() : item.quantidade;
    const val = typeof item.valorUnitario === "object" ? item.valorUnitario.toNumber() : item.valorUnitario;
    return acc + qtd * val;
  }, 0);
}

/**
 * Retorna uma OS completa com todos os relacionamentos.
 */
export async function buscarOSPorId(osId: string) {
  const os = await prisma.ordemServico.findUnique({
    where: { id: osId },
    include: {
      veiculo: true,
      cliente: true,
      itens: {
        include: { peca: true },
        orderBy: { criadoEm: "asc" },
      },
      historico: { orderBy: { dataHora: "asc" } },
      pagamentos: { orderBy: { dataPagamento: "asc" } },
      agendamento: true,
    },
  });
  if (!os) throw new Error(`OS não encontrada: ${osId}`);
  return os;
}

/**
 * Lista ordens de serviço com filtros opcionais.
 */
export async function listarOS(filtros?: {
  status?: StatusOS;
  clienteId?: string;
  veiculoId?: string;
}) {
  return prisma.ordemServico.findMany({
    where: {
      status: filtros?.status,
      clienteId: filtros?.clienteId,
      veiculoId: filtros?.veiculoId,
    },
    include: {
      veiculo: true,
      cliente: true,
      _count: { select: { itens: true, pagamentos: true } },
    },
    orderBy: { dataAbertura: "desc" },
  });
}

/**
 * Atualiza o diagnóstico técnico e/ou relato do cliente de uma OS.
 */
export async function atualizarDiagnostico(
  osId: string,
  data: { diagnosticoTecnico?: string; relatoCliente?: string; dataPrevisaoEntrega?: Date }
) {
  return prisma.ordemServico.update({
    where: { id: osId },
    data: {
      diagnosticoTecnico: data.diagnosticoTecnico,
      relatoCliente: data.relatoCliente,
      dataPrevisaoEntrega: data.dataPrevisaoEntrega,
    },
  });
}
