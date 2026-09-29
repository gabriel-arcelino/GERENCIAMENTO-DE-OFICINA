"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  criarCliente,
  atualizarCliente,
  deletarCliente,
  ClienteInput,
} from "@/services/clientes";
import { criarVeiculo, atualizarVeiculo, deletarVeiculo, VeiculoInput } from "@/services/veiculos";

// ─────────────────────────────────────────────────────────────────────────────
// Result type para feedback de erros no cliente
// ─────────────────────────────────────────────────────────────────────────────

type ActionResult =
  | { success: true; id?: string }
  | { success: false; error: string };

// ─────────────────────────────────────────────────────────────────────────────
// Actions de Cliente
// ─────────────────────────────────────────────────────────────────────────────

export async function criarClienteAction(
  data: ClienteInput
): Promise<ActionResult> {
  try {
    const cliente = await criarCliente(data);
    revalidatePath("/clientes");
    return { success: true, id: cliente.id };
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message };
  }
}

export async function atualizarClienteAction(
  id: string,
  data: Partial<ClienteInput>
): Promise<ActionResult> {
  try {
    await atualizarCliente(id, data);
    revalidatePath("/clientes");
    revalidatePath(`/clientes/${id}`);
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message };
  }
}

export async function deletarClienteAction(id: string): Promise<ActionResult> {
  try {
    await deletarCliente(id);
    revalidatePath("/clientes");
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Actions de Veículo
// ─────────────────────────────────────────────────────────────────────────────

export async function criarVeiculoAction(
  data: VeiculoInput
): Promise<ActionResult> {
  try {
    const veiculo = await criarVeiculo(data);
    revalidatePath(`/clientes/${data.clienteId}`);
    revalidatePath("/clientes");
    return { success: true, id: veiculo.id };
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message };
  }
}

/**
 * Atualiza os dados de um veículo.
 * `clienteId` é recebido apenas para revalidar a página do cliente — o vínculo
 * com o cliente não é alterável (um veículo pertence a um cliente por vez).
 */
export async function atualizarVeiculoAction(
  id: string,
  clienteId: string,
  data: Partial<VeiculoInput>
): Promise<ActionResult> {
  try {
    await atualizarVeiculo(id, data);
    revalidatePath(`/clientes/${clienteId}`);
    return { success: true, id };
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message };
  }
}

/**
 * Exclui um veículo. Bloqueado pelo service quando há ordens de serviço
 * vinculadas — o erro é propagado para a UI.
 */
export async function deletarVeiculoAction(
  id: string,
  clienteId: string
): Promise<ActionResult> {
  try {
    await deletarVeiculo(id);
    revalidatePath(`/clientes/${clienteId}`);
    revalidatePath("/clientes");
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message };
  }
}
