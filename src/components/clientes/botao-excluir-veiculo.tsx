"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { deletarVeiculoAction } from "@/actions/clientes";

interface BotaoExcluirVeiculoProps {
  veiculoId: string;
  clienteId: string;
  placa: string;
}

export function BotaoExcluirVeiculo({
  veiculoId,
  clienteId,
  placa,
}: BotaoExcluirVeiculoProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleExcluir() {
    if (!confirm(`Excluir o veículo de placa ${placa}?`)) return;
    setLoading(true);
    try {
      const result = await deletarVeiculoAction(veiculoId, clienteId);
      if (result.success) {
        router.refresh();
      } else {
        // Ex.: veículo com ordens de serviço vinculadas
        alert(result.error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleExcluir}
      disabled={loading}
      aria-label={`Excluir veículo ${placa}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      )}
    </Button>
  );
}
