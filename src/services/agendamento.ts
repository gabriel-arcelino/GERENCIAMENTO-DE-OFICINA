import { prisma } from "@/lib/prisma";
import { StatusAgendamento, StatusOS } from "@prisma/client";
import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const AgendamentoSchema = z.object({
  clienteId: z.string().min(1, "Cliente é obrigatório"),
  veiculoId: z.string().min(1, "Veículo é obrigatório"),
  dataAgendamento: z.date(),
  observacao: z.string().optional(),
});

export type AgendamentoInput = z.infer<typeof AgendamentoSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Funções de serviço
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cria um novo agendamento.
 */
export async function criarAgendamento(data: AgendamentoInput) {
  const parsed = AgendamentoSchema.parse(data);
  return prisma.agendamento.create({
    data: {
      clienteId: parsed.clienteId,
      veiculoId: parsed.veiculoId,
      dataAgendamento: parsed.dataAgendamento,
      observacao: parsed.observacao,
      status: StatusAgendamento.AGENDADO,
    },
    include: {
      cliente: true,
      veiculo: true,
    },
  });
}

/**
 * Cancela um agendamento.
 * Só é possível cancelar agendamentos com status AGENDADO.
 */
export async function cancelarAgendamento(id: string) {
  const agendamento = await prisma.agendamento.findUnique({ where: { id } });
  if (!agendamento) throw new Error(`Agendamento não encontrado: ${id}`);

  if (agendamento.status !== StatusAgendamento.AGENDADO) {
    throw new Error(
      `Só é possível cancelar agendamentos com status AGENDADO. Status atual: ${agendamento.status}`
    );
  }

  return prisma.agendamento.update({
    where: { id },
    data: { status: StatusAgendamento.CANCELADO },
  });
}

/**
 * Converte um agendamento em Ordem de Serviço.
 *
 * - Cria a OS com status RECEBIDO e dados do cliente/veículo pré-preenchidos
 * - Marca o agendamento como CONVERTIDO_EM_OS
 * - Vincula a OS ao agendamento
 * - Registra o histórico inicial de status da OS
 */
export async function converterEmOS(agendamentoId: string) {
  const agendamento = await prisma.agendamento.findUnique({
    where: { id: agendamentoId },
    include: { cliente: true, veiculo: true },
  });

  if (!agendamento) throw new Error(`Agendamento não encontrado: ${agendamentoId}`);

  if (agendamento.status !== StatusAgendamento.AGENDADO) {
    throw new Error(
      `Apenas agendamentos com status AGENDADO podem ser convertidos em OS. Status atual: ${agendamento.status}`
    );
  }

  return prisma.$transaction(async (tx) => {
    // Cria a OS
    const os = await tx.ordemServico.create({
      data: {
        veiculoId: agendamento.veiculoId,
        clienteId: agendamento.clienteId,
        status: StatusOS.RECEBIDO,
        relatoCliente: agendamento.observacao,
      },
    });

    // Registra histórico inicial
    await tx.historicoStatusOS.create({
      data: {
        osId: os.id,
        statusAnterior: null,
        statusNovo: StatusOS.RECEBIDO,
      },
    });

    // Atualiza o agendamento vinculando à OS e marcando como convertido
    await tx.agendamento.update({
      where: { id: agendamentoId },
      data: {
        status: StatusAgendamento.CONVERTIDO_EM_OS,
        osGeradaId: os.id,
      },
    });

    return os;
  });
}

/**
 * Lista agendamentos por data (formato YYYY-MM-DD).
 * Se a data for omitida, retorna todos os agendamentos com status AGENDADO.
 */
export async function listarAgendamentosPorData(data?: Date) {
  if (!data) {
    return prisma.agendamento.findMany({
      where: { status: StatusAgendamento.AGENDADO },
      include: { cliente: true, veiculo: true, osGerada: true },
      orderBy: { dataAgendamento: "asc" },
    });
  }

  // Início e fim do dia
  const inicio = new Date(data);
  inicio.setHours(0, 0, 0, 0);
  const fim = new Date(data);
  fim.setHours(23, 59, 59, 999);

  return prisma.agendamento.findMany({
    where: {
      dataAgendamento: { gte: inicio, lte: fim },
      status: { not: StatusAgendamento.CANCELADO },
    },
    include: { cliente: true, veiculo: true, osGerada: true },
    orderBy: { dataAgendamento: "asc" },
  });
}

/**
 * Busca um agendamento pelo ID.
 */
export async function buscarAgendamentoPorId(id: string) {
  const agendamento = await prisma.agendamento.findUnique({
    where: { id },
    include: { cliente: true, veiculo: true, osGerada: true },
  });
  if (!agendamento) throw new Error(`Agendamento não encontrado: ${id}`);
  return agendamento;
}
