import { prisma } from "@/lib/prisma";
import { FormaPagamento } from "@prisma/client";
import { z } from "zod";
import { calcularTotalOS } from "./ordemServico";
import { toNumber } from "./estoque";

// ─────────────────────────────────────────────────────────────────────────────
// Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const PagamentoSchema = z.object({
  osId: z.string().min(1),
  formaPagamento: z.nativeEnum(FormaPagamento),
  valor: z.number().positive("Valor deve ser maior que zero"),
});

export type PagamentoInput = z.infer<typeof PagamentoSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Tipos de retorno
// ─────────────────────────────────────────────────────────────────────────────

export interface SaldoOS {
  totalOS: number;
  totalPago: number;
  saldoDevedor: number;
  quitado: boolean;
  /** Troco quando totalPago > totalOS */
  troco: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Funções de serviço
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Registra um pagamento para uma OS.
 *
 * Regras:
 * - Múltiplos pagamentos são permitidos
 * - Overpayment (pago > total) gera alerta mas é gravado normalmente
 *
 * Retorna `{ pagamento, saldo, alertaOverpayment }`.
 */
export async function registrarPagamento(data: PagamentoInput): Promise<{
  pagamento: Awaited<ReturnType<typeof prisma.pagamento.create>>;
  saldo: SaldoOS;
  alertaOverpayment: boolean;
}> {
  const parsed = PagamentoSchema.parse(data);

  const os = await prisma.ordemServico.findUnique({
    where: { id: parsed.osId },
    include: { itens: true, pagamentos: true },
  });
  if (!os) throw new Error(`OS não encontrada: ${parsed.osId}`);

  const pagamento = await prisma.pagamento.create({
    data: {
      osId: parsed.osId,
      formaPagamento: parsed.formaPagamento,
      valor: parsed.valor,
    },
  });

  const saldo = calcularSaldoOS([...os.pagamentos, pagamento], os.itens);
  const alertaOverpayment = saldo.troco > 0;

  return { pagamento, saldo, alertaOverpayment };
}

/**
 * Calcula o saldo financeiro de uma OS.
 * Pode ser chamado com os dados já carregados (evita nova query).
 */
export function calcularSaldoOS(
  pagamentos: Array<{ valor: unknown }>,
  itens: Array<{ quantidade: unknown; valorUnitario: unknown }>
): SaldoOS {
  const totalOS = itens.reduce((acc, item) => {
    const qtd = toNumber(item.quantidade as Parameters<typeof toNumber>[0]);
    const val = toNumber(item.valorUnitario as Parameters<typeof toNumber>[0]);
    return acc + qtd * val;
  }, 0);
  const totalPago = pagamentos.reduce(
    (acc, p) => acc + toNumber(p.valor as Parameters<typeof toNumber>[0]),
    0
  );
  const saldoDevedor = Math.max(0, totalOS - totalPago);
  const troco = Math.max(0, totalPago - totalOS);
  const quitado = totalPago >= totalOS && totalOS > 0;

  return { totalOS, totalPago, saldoDevedor, quitado, troco };
}

/**
 * Retorna o saldo financeiro atual de uma OS.
 */
export async function calcularSaldo(osId: string): Promise<SaldoOS> {
  const os = await prisma.ordemServico.findUnique({
    where: { id: osId },
    include: { itens: true, pagamentos: true },
  });
  if (!os) throw new Error(`OS não encontrada: ${osId}`);

  return calcularSaldoOS(os.pagamentos, os.itens);
}

/**
 * Lista todas as OS entregues com saldo financeiro em aberto.
 * Filtro opcional por cliente.
 */
export async function listarPendencias(clienteId?: string) {
  const ordens = await prisma.ordemServico.findMany({
    where: {
      status: "ENTREGUE",
      clienteId: clienteId,
    },
    include: {
      cliente: true,
      veiculo: true,
      itens: true,
      pagamentos: true,
    },
    orderBy: { dataEntrega: "desc" },
  });

  // Filtra apenas as que têm saldo devedor
  const pendencias = ordens
    .map((os) => {
      const saldo = calcularSaldoOS(os.pagamentos, os.itens);
      return { ...os, saldo };
    })
    .filter((os) => !os.saldo.quitado && os.saldo.totalOS > 0);

  return pendencias;
}

/**
 * Retorna o histórico completo de pagamentos de uma OS.
 */
export async function listarPagamentosPorOS(osId: string) {
  return prisma.pagamento.findMany({
    where: { osId },
    orderBy: { dataPagamento: "asc" },
  });
}
