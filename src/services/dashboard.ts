import { prisma } from "@/lib/prisma";
import { StatusOS, StatusAgendamento } from "@prisma/client";
import { toNumber } from "./estoque";

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

export interface DashboardMetricas {
  /** Contagem de OS por status */
  osPorStatus: Record<string, number>;
  /** Total de OS abertas (não ENTREGUE nem REPROVADO) */
  osAbertas: number;
  /** Faturamento do mês (total pago) */
  faturamentoMes: number;
  /** Total pendente (saldo devedor de OS entregues) */
  totalPendente: number;
  /** Quantidade de peças em alerta de reposição */
  pecasEmAlerta: number;
  /** Agendamentos do dia */
  agendamentosHoje: number;
  /** Total de clientes cadastrados */
  totalClientes: number;
  /** OS recentes (últimas 5) */
  osRecentes: Array<{
    id: string;
    numero: number;
    status: StatusOS;
    clienteNome: string;
    veiculoPlaca: string;
    dataAbertura: Date;
    totalOS: number;
  }>;
  /** Agendamentos do dia com detalhes */
  agendamentosDoDia: Array<{
    id: string;
    clienteNome: string;
    veiculoInfo: string;
    observacao: string | null;
    status: StatusAgendamento;
  }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Funções de serviço
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Carrega todas as métricas do dashboard em uma única chamada.
 * Utiliza Promise.all para paralelizar as queries.
 */
export async function carregarDashboard(): Promise<DashboardMetricas> {
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const fimDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1);

  const [
    todasOS,
    pagamentosMes,
    pecas,
    agendamentosDia,
    totalClientes,
    osRecentes,
  ] = await Promise.all([
    // 1. Todas as OS (para contar por status e calcular pendências)
    prisma.ordemServico.findMany({
      include: { itens: true, pagamentos: true },
    }),

    // 2. Pagamentos do mês corrente
    prisma.pagamento.findMany({
      where: {
        dataPagamento: { gte: inicioMes },
      },
    }),

    // 3. Peças para alerta de reposição
    prisma.peca.findMany(),

    // 4. Agendamentos do dia
    prisma.agendamento.findMany({
      where: {
        dataAgendamento: { gte: inicioDia, lt: fimDia },
        status: StatusAgendamento.AGENDADO,
      },
      include: {
        cliente: true,
        veiculo: true,
      },
    }),

    // 5. Total de clientes
    prisma.cliente.count(),

    // 6. OS recentes
    prisma.ordemServico.findMany({
      take: 5,
      orderBy: { dataAbertura: "desc" },
      include: {
        cliente: true,
        veiculo: true,
        itens: true,
      },
    }),
  ]);

  // ── Contagem de OS por status ──
  const osPorStatus: Record<string, number> = {};
  const statusAbertos = new Set<string>([
    "RECEBIDO",
    "DIAGNOSTICO",
    "AGUARDANDO_APROVACAO",
    "APROVADO",
    "EM_EXECUCAO",
    "CONFERENCIA",
    "PRONTO_PARA_ENTREGA",
  ]);

  let osAbertas = 0;
  for (const os of todasOS) {
    osPorStatus[os.status] = (osPorStatus[os.status] || 0) + 1;
    if (statusAbertos.has(os.status)) osAbertas++;
  }

  // ── Faturamento do mês ──
  const faturamentoMes = pagamentosMes.reduce(
    (acc, p) => acc + toNumber(p.valor),
    0
  );

  // ── Total pendente (OS entregues com saldo devedor) ──
  const osEntregues = todasOS.filter((os) => os.status === "ENTREGUE");
  let totalPendente = 0;
  for (const os of osEntregues) {
    const totalOS = os.itens.reduce(
      (acc, item) =>
        acc + toNumber(item.quantidade) * toNumber(item.valorUnitario),
      0
    );
    const totalPago = os.pagamentos.reduce(
      (acc, p) => acc + toNumber(p.valor),
      0
    );
    const saldo = totalOS - totalPago;
    if (saldo > 0) totalPendente += saldo;
  }

  // ── Peças em alerta ──
  const pecasEmAlerta = pecas.filter(
    (p) => toNumber(p.quantidadeEstoque) <= toNumber(p.estoqueMinimo)
  ).length;

  // ── OS recentes formatadas ──
  const osRecentesFormatadas = osRecentes.map((os) => ({
    id: os.id,
    numero: os.numero,
    status: os.status,
    clienteNome: os.cliente.nome,
    veiculoPlaca: os.veiculo.placa,
    dataAbertura: os.dataAbertura,
    totalOS: os.itens.reduce(
      (acc, item) =>
        acc + toNumber(item.quantidade) * toNumber(item.valorUnitario),
      0
    ),
  }));

  // ── Agendamentos do dia formatados ──
  const agendamentosDoDia = agendamentosDia.map((ag) => ({
    id: ag.id,
    clienteNome: ag.cliente.nome,
    veiculoInfo: `${ag.veiculo.marca} ${ag.veiculo.modelo} — ${ag.veiculo.placa}`,
    observacao: ag.observacao,
    status: ag.status,
  }));

  return {
    osPorStatus,
    osAbertas,
    faturamentoMes,
    totalPendente,
    pecasEmAlerta,
    agendamentosHoje: agendamentosDia.length,
    totalClientes,
    osRecentes: osRecentesFormatadas,
    agendamentosDoDia,
  };
}
