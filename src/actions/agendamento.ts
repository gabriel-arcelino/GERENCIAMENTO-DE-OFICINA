"use server";

import { revalidatePath } from "next/cache";
import {
  criarAgendamento,
  cancelarAgendamento,
  converterEmOS,
  AgendamentoInput,
} from "@/services/agendamento";

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

export async function criarAgendamentoAction(
  data: AgendamentoInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const ag = await criarAgendamento(data);
    revalidatePath("/agenda");
    return { success: true, data: { id: ag.id } };
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message };
  }
}

export async function cancelarAgendamentoAction(
  id: string
): Promise<ActionResult> {
  try {
    await cancelarAgendamento(id);
    revalidatePath("/agenda");
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message };
  }
}

export async function converterEmOSAction(
  agendamentoId: string
): Promise<ActionResult<{ osId: string }>> {
  try {
    const os = await converterEmOS(agendamentoId);
    revalidatePath("/agenda");
    revalidatePath("/ordens");
    return { success: true, data: { osId: os.id } };
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message };
  }
}
