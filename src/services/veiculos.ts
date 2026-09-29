import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Validação de placa — padrões brasileiro e Mercosul
// ─────────────────────────────────────────────────────────────────────────────

/** Padrão antigo: ABC-1234 ou ABC1234 */
const REGEX_PLACA_ANTIGA = /^[A-Z]{3}[0-9]{4}$/;

/** Padrão Mercosul: ABC1D23 */
const REGEX_PLACA_MERCOSUL = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;

/**
 * Valida e normaliza uma placa (remove hífens, converte para maiúsculas).
 * Retorna `{ valida: true, placa }` ou `{ valida: false, mensagem }`.
 */
export function validarPlaca(placa: string): { valida: true; placa: string } | { valida: false; mensagem: string } {
  const normalizada = placa.toUpperCase().replace(/[^A-Z0-9]/g, "");

  if (REGEX_PLACA_ANTIGA.test(normalizada) || REGEX_PLACA_MERCOSUL.test(normalizada)) {
    return { valida: true, placa: normalizada };
  }

  return {
    valida: false,
    mensagem: `Placa inválida. Use o padrão antigo (ABC1234) ou Mercosul (ABC1D23).`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Schema de validação
// ─────────────────────────────────────────────────────────────────────────────

export const VeiculoSchema = z.object({
  placa: z.string().transform((v) => v.toUpperCase().replace(/[^A-Z0-9]/g, "")),
  marca: z.string().min(1, "Marca é obrigatória"),
  modelo: z.string().min(1, "Modelo é obrigatório"),
  ano: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  cor: z.string().optional(),
  clienteId: z.string().min(1, "Cliente é obrigatório"),
});

export type VeiculoInput = z.infer<typeof VeiculoSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Funções de serviço
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cadastra um veículo.
 * Valida o formato da placa e garante unicidade.
 * Lança erro se a placa já estiver cadastrada, informando o proprietário atual.
 */
export async function criarVeiculo(data: VeiculoInput) {
  const parsed = VeiculoSchema.parse(data);

  const validacao = validarPlaca(parsed.placa);
  if (!validacao.valida) {
    throw new Error(validacao.mensagem);
  }

  // Verifica unicidade da placa
  const existente = await prisma.veiculo.findUnique({
    where: { placa: validacao.placa },
    include: { cliente: true },
  });

  if (existente) {
    throw new Error(
      `A placa ${validacao.placa} já está cadastrada para o cliente "${existente.cliente.nome}" (${existente.cliente.telefone}).`
    );
  }

  return prisma.veiculo.create({
    data: {
      placa: validacao.placa,
      marca: parsed.marca,
      modelo: parsed.modelo,
      ano: parsed.ano,
      cor: parsed.cor || null,
      clienteId: parsed.clienteId,
    },
    include: { cliente: true },
  });
}

/**
 * Atualiza os dados de um veículo.
 * Se a placa for alterada, valida o novo valor e garante unicidade.
 */
export async function atualizarVeiculo(id: string, data: Partial<VeiculoInput>) {
  if (data.placa) {
    const validacao = validarPlaca(data.placa);
    if (!validacao.valida) throw new Error(validacao.mensagem);

    const existente = await prisma.veiculo.findUnique({
      where: { placa: validacao.placa },
    });
    if (existente && existente.id !== id) {
      throw new Error(`A placa ${validacao.placa} já está em uso por outro veículo.`);
    }
    data.placa = validacao.placa;
  }

  return prisma.veiculo.update({
    where: { id },
    data: {
      placa: data.placa,
      marca: data.marca,
      modelo: data.modelo,
      ano: data.ano,
      cor: data.cor ?? null,
    },
    include: { cliente: true },
  });
}

/**
 * Retorna um veículo pelo ID.
 */
export async function buscarVeiculoPorId(id: string) {
  const veiculo = await prisma.veiculo.findUnique({
    where: { id },
    include: {
      cliente: true,
      ordens: {
        orderBy: { dataAbertura: "desc" },
        take: 20,
      },
    },
  });
  if (!veiculo) throw new Error(`Veículo não encontrado: ${id}`);
  return veiculo;
}

/**
 * Lista todos os veículos de um cliente.
 */
export async function listarVeiculosPorCliente(clienteId: string) {
  return prisma.veiculo.findMany({
    where: { clienteId },
    orderBy: { criadoEm: "desc" },
  });
}

/**
 * Deleta um veículo.
 * Bloqueia se o veículo tiver ordens de serviço vinculadas.
 */
export async function deletarVeiculo(id: string) {
  const veiculo = await prisma.veiculo.findUnique({
    where: { id },
    include: { _count: { select: { ordens: true } } },
  });

  if (!veiculo) throw new Error(`Veículo não encontrado: ${id}`);

  if (veiculo._count.ordens > 0) {
    throw new Error(
      `Não é possível excluir o veículo ${veiculo.placa} pois ele possui ${veiculo._count.ordens} ordem(s) de serviço associada(s).`
    );
  }

  return prisma.veiculo.delete({ where: { id } });
}
