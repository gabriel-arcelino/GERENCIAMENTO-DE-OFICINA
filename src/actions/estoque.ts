"use server";

import { revalidatePath } from "next/cache";
import {
  criarPeca,
  atualizarPeca,
  lancarEntrada,
  PecaInput,
} from "@/services/estoque";

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

export async function criarPecaAction(
  data: PecaInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const peca = await criarPeca(data);
    revalidatePath("/estoque");
    return { success: true, data: { id: peca.id } };
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message };
  }
}

export async function atualizarPecaAction(
  id: string,
  data: Partial<PecaInput>
): Promise<ActionResult> {
  try {
    await atualizarPeca(id, data);
    revalidatePath("/estoque");
    revalidatePath(`/estoque/${id}`);
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message };
  }
}

export async function lancarEntradaAction(
  pecaId: string,
  quantidade: number
): Promise<ActionResult> {
  try {
    await lancarEntrada(pecaId, quantidade);
    revalidatePath(`/estoque/${pecaId}`);
    revalidatePath("/estoque");
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message };
  }
}
