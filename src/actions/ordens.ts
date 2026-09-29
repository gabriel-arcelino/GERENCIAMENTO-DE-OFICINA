"use server";

import { revalidatePath } from "next/cache";
import { StatusOS } from "@prisma/client";
import {
  abrirOS,
  transicionarStatus,
  aprovarOrcamento,
  adicionarItemOS,
  removerItemOS,
  atualizarDiagnostico,
  AbrirOSInput,
  ItemOSInput,
} from "@/services/ordemServico";
import { baixarEstoque, estornarEstoque, toNumber } from "@/services/estoque";

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

export async function abrirOSAction(
  data: AbrirOSInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const os = await abrirOS(data);
    revalidatePath("/ordens");
    return { success: true, data: { id: os.id } };
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message };
  }
}

export async function transicionarStatusAction(
  osId: string,
  novoStatus: StatusOS
): Promise<ActionResult> {
  try {
    // Se REPROVADO, estorna o estoque antes
    if (novoStatus === StatusOS.REPROVADO) {
      await estornarEstoque(osId);
    }
    await transicionarStatus(osId, novoStatus);
    revalidatePath(`/ordens/${osId}`);
    revalidatePath("/ordens");
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message };
  }
}

export async function aprovarOrcamentoAction(osId: string): Promise<ActionResult> {
  try {
    await aprovarOrcamento(osId);
    revalidatePath(`/ordens/${osId}`);
    revalidatePath("/ordens");
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message };
  }
}

export async function adicionarItemOSAction(data: ItemOSInput): Promise<
  ActionResult<{ alertaEstoqueInsuficiente: boolean; saldoAtual?: number }>
> {
  try {
    // Se for peça, baixa o estoque automaticamente.
    // O retorno de baixarEstoque precisa ser capturado: descartá-lo fazia o
    // alerta de saldo insuficiente ser calculado e jogado fora, de modo que o
    // usuário nunca era avisado (ver docs/pendencias.md).
    let alertaEstoqueInsuficiente = false;
    let saldoAtual: number | undefined;

    if (data.tipo === "PECA" && data.pecaId) {
      const baixa = await baixarEstoque(data.pecaId, data.quantidade, data.osId);
      alertaEstoqueInsuficiente = baixa.alertaEstoqueInsuficiente;
      // quantidadeEstoque já reflete a baixa recém-aplicada
      saldoAtual = toNumber(baixa.peca.quantidadeEstoque);
    }

    await adicionarItemOS(data);
    revalidatePath(`/ordens/${data.osId}`);
    revalidatePath("/estoque");
    return {
      success: true,
      data: {
        alertaEstoqueInsuficiente,
        saldoAtual: alertaEstoqueInsuficiente ? saldoAtual : undefined,
      },
    };
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message };
  }
}

export async function removerItemOSAction(
  itemId: string,
  osId: string
): Promise<ActionResult> {
  try {
    await removerItemOS(itemId);
    revalidatePath(`/ordens/${osId}`);
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message };
  }
}

export async function atualizarDiagnosticoAction(
  osId: string,
  data: { diagnosticoTecnico?: string; relatoCliente?: string; dataPrevisaoEntrega?: Date }
): Promise<ActionResult> {
  try {
    await atualizarDiagnostico(osId, data);
    revalidatePath(`/ordens/${osId}`);
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message };
  }
}
