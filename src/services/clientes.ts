import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Schemas de validação
// ─────────────────────────────────────────────────────────────────────────────

export const ClienteSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  telefone: z.string().min(8, "Telefone inválido"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  endereco: z.string().optional(),
  documento: z.string().optional(),
});

export type ClienteInput = z.infer<typeof ClienteSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Funções de serviço
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cria um novo cliente.
 * Retorna o cliente criado.
 */
export async function criarCliente(data: ClienteInput) {
  const parsed = ClienteSchema.parse(data);
  return prisma.cliente.create({
    data: {
      nome: parsed.nome,
      telefone: parsed.telefone,
      email: parsed.email || null,
      endereco: parsed.endereco || null,
      documento: parsed.documento || null,
    },
  });
}

/**
 * Atualiza os dados de um cliente existente.
 */
export async function atualizarCliente(id: string, data: Partial<ClienteInput>) {
  const parsed = ClienteSchema.partial().parse(data);
  return prisma.cliente.update({
    where: { id },
    data: {
      ...parsed,
      email: parsed.email || null,
    },
  });
}

/**
 * Busca clientes por nome, telefone ou email.
 * Busca case-insensitive via ILIKE.
 */
export async function buscarClientes(termo: string = "") {
  return prisma.cliente.findMany({
    where: termo
      ? {
          OR: [
            { nome: { contains: termo, mode: "insensitive" } },
            { telefone: { contains: termo } },
            { email: { contains: termo, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: {
      veiculos: true,
      _count: {
        select: { veiculos: true, ordens: true },
      },
    },
    orderBy: { nome: "asc" },
  });
}

/**
 * Retorna um cliente pelo ID com seus veículos.
 * Lança erro se não encontrado.
 */
export async function buscarClientePorId(id: string) {
  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: {
      veiculos: true,
      ordens: {
        orderBy: { dataAbertura: "desc" },
        take: 10,
        include: {
          veiculo: true,
        },
      },
      _count: {
        select: { veiculos: true, ordens: true },
      },
    },
  });
  if (!cliente) throw new Error(`Cliente não encontrado: ${id}`);
  return cliente;
}

/**
 * Busca cliente pela placa de um de seus veículos.
 */
export async function buscarClientePorPlaca(placa: string) {
  const placaNormalizada = placa.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const veiculo = await prisma.veiculo.findUnique({
    where: { placa: placaNormalizada },
    include: { cliente: true },
  });
  return veiculo ?? null;
}

/**
 * Remove um cliente.
 * Lança erro se o cliente possuir veículos vinculados (proteção de integridade histórica).
 */
export async function deletarCliente(id: string) {
  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: { _count: { select: { veiculos: true } } },
  });

  if (!cliente) throw new Error(`Cliente não encontrado: ${id}`);

  if (cliente._count.veiculos > 0) {
    throw new Error(
      `Não é possível excluir o cliente "${cliente.nome}" pois ele possui ${cliente._count.veiculos} veículo(s) cadastrado(s). Remova os veículos primeiro.`
    );
  }

  return prisma.cliente.delete({ where: { id } });
}
