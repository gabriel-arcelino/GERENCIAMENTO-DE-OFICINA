import { prisma } from "@/lib/prisma";
import { TipoMovimentacao } from "@prisma/client";
import { z } from "zod";
import { Decimal } from "@prisma/client/runtime/library";

// ─────────────────────────────────────────────────────────────────────────────
// Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const PecaSchema = z.object({
  codigo: z.string().min(1, "Código é obrigatório"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  quantidadeEstoque: z.number().min(0).default(0),
  estoqueMinimo: z.number().min(0).default(0),
  valorCusto: z.number().min(0, "Valor de custo inválido"),
  valorVenda: z.number().min(0, "Valor de venda inválido"),
});

export type PecaInput = z.infer<typeof PecaSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Funções de serviço — CRUD de peças
// ─────────────────────────────────────────────────────────────────────────────

export async function criarPeca(data: PecaInput) {
  const parsed = PecaSchema.parse(data);

  // Verifica unicidade do código
  const existente = await prisma.peca.findUnique({
    where: { codigo: parsed.codigo },
  });
  if (existente) {
    throw new Error(`Já existe uma peça com o código "${parsed.codigo}".`);
  }

  return prisma.peca.create({
    data: {
      codigo: parsed.codigo,
      descricao: parsed.descricao,
      quantidadeEstoque: parsed.quantidadeEstoque,
      estoqueMinimo: parsed.estoqueMinimo,
      valorCusto: parsed.valorCusto,
      valorVenda: parsed.valorVenda,
    },
  });
}

export async function atualizarPeca(id: string, data: Partial<PecaInput>) {
  return prisma.peca.update({
    where: { id },
    data: {
      descricao: data.descricao,
      estoqueMinimo: data.estoqueMinimo,
      valorCusto: data.valorCusto,
      valorVenda: data.valorVenda,
    },
  });
}

export async function buscarPecaPorId(id: string) {
  const peca = await prisma.peca.findUnique({
    where: { id },
    include: {
      movimentacoes: {
        orderBy: { dataHora: "desc" },
        take: 50,
      },
    },
  });
  if (!peca) throw new Error(`Peça não encontrada: ${id}`);
  return peca;
}

export async function listarPecas(termo: string = "") {
  return prisma.peca.findMany({
    where: termo
      ? {
          OR: [
            { codigo: { contains: termo, mode: "insensitive" } },
            { descricao: { contains: termo, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { descricao: "asc" },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Funções de serviço — Movimentações
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lança uma entrada manual de estoque (recebimento de mercadoria).
 */
export async function lancarEntrada(pecaId: string, quantidade: number) {
  if (quantidade <= 0) throw new Error("Quantidade deve ser maior que zero.");

  return prisma.$transaction(async (tx) => {
    const peca = await tx.peca.update({
      where: { id: pecaId },
      data: { quantidadeEstoque: { increment: quantidade } },
    });

    await tx.movimentacaoEstoque.create({
      data: {
        pecaId,
        tipo: TipoMovimentacao.ENTRADA,
        quantidade,
      },
    });

    return peca;
  });
}

/**
 * Realiza a baixa automática de estoque ao adicionar uma peça a uma OS.
 *
 * Regra: saldo pode ficar negativo (alerta mas permite).
 * Retorna `{ peca, alertaEstoqueInsuficiente }`.
 */
export async function baixarEstoque(
  pecaId: string,
  quantidade: number,
  osId: string
): Promise<{ peca: Awaited<ReturnType<typeof prisma.peca.update>>; alertaEstoqueInsuficiente: boolean }> {
  if (quantidade <= 0) throw new Error("Quantidade deve ser maior que zero.");

  return prisma.$transaction(async (tx) => {
    const pecaAtual = await tx.peca.findUnique({ where: { id: pecaId } });
    if (!pecaAtual) throw new Error(`Peça não encontrada: ${pecaId}`);

    const estoqueAtual = toNumber(pecaAtual.quantidadeEstoque);
    const alertaEstoqueInsuficiente = estoqueAtual < quantidade;

    const peca = await tx.peca.update({
      where: { id: pecaId },
      data: { quantidadeEstoque: { decrement: quantidade } },
    });

    await tx.movimentacaoEstoque.create({
      data: {
        pecaId,
        tipo: TipoMovimentacao.SAIDA,
        quantidade,
        osId,
      },
    });

    return { peca, alertaEstoqueInsuficiente };
  });
}

/**
 * Estorna todas as saídas de estoque associadas a uma OS.
 * Chamado automaticamente quando uma OS é reprovada ou cancelada.
 */
export async function estornarEstoque(osId: string): Promise<void> {
  const saidas = await prisma.movimentacaoEstoque.findMany({
    where: {
      osId,
      tipo: TipoMovimentacao.SAIDA,
    },
  });

  if (saidas.length === 0) return;

  await prisma.$transaction(async (tx) => {
    for (const saida of saidas) {
      await tx.peca.update({
        where: { id: saida.pecaId },
        data: { quantidadeEstoque: { increment: toNumber(saida.quantidade) } },
      });

      await tx.movimentacaoEstoque.create({
        data: {
          pecaId: saida.pecaId,
          tipo: TipoMovimentacao.ESTORNO,
          quantidade: toNumber(saida.quantidade),
          osId,
        },
      });
    }
  });
}

/**
 * Ajusta o saldo de estoque quando a quantidade de uma peça em uma OS é alterada.
 * `quantidadeAnterior` é a quantidade antes da edição.
 */
export async function ajustarEstoqueOS(
  pecaId: string,
  osId: string,
  quantidadeAnterior: number,
  quantidadeNova: number
) {
  const diferenca = quantidadeNova - quantidadeAnterior;
  if (diferenca === 0) return;

  if (diferenca > 0) {
    // Aumentou a quantidade → baixa da diferença
    return baixarEstoque(pecaId, diferenca, osId);
  } else {
    // Diminuiu → devolve a diferença
    return prisma.$transaction(async (tx) => {
      await tx.peca.update({
        where: { id: pecaId },
        data: { quantidadeEstoque: { increment: Math.abs(diferenca) } },
      });
      await tx.movimentacaoEstoque.create({
        data: {
          pecaId,
          tipo: TipoMovimentacao.ESTORNO,
          quantidade: Math.abs(diferenca),
          osId,
        },
      });
    });
  }
}

/**
 * Retorna a lista de peças com estoque em alerta (quantidade <= estoque mínimo).
 */
export async function alertasReposicao() {
  const pecas = await prisma.peca.findMany({
    orderBy: { descricao: "asc" },
  });

  return pecas.filter(
    (p) => toNumber(p.quantidadeEstoque) <= toNumber(p.estoqueMinimo)
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function toNumber(value: Decimal | number | string): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value);
  return value.toNumber();
}
