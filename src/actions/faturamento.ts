"use server";

import { revalidatePath } from "next/cache";
import { registrarPagamento, PagamentoInput } from "@/services/faturamento";

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

export async function registrarPagamentoAction(data: PagamentoInput): Promise<
  ActionResult<{ alertaOverpayment: boolean; troco?: number }>
> {
  try {
    const { alertaOverpayment, saldo } = await registrarPagamento(data);
    revalidatePath(`/ordens/${data.osId}`);
    revalidatePath("/financeiro/pendencias");
    return {
      success: true,
      data: {
        alertaOverpayment,
        troco: alertaOverpayment ? saldo.troco : undefined,
      },
    };
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message };
  }
}
