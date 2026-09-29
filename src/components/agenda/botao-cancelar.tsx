"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import { cancelarAgendamentoAction } from "@/actions/agendamento";

interface BotaoCancelarProps {
  agendamentoId: string;
}

export function BotaoCancelar({ agendamentoId }: BotaoCancelarProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCancelar() {
    if (!confirm("Cancelar este agendamento?")) return;
    setLoading(true);
    try {
      const result = await cancelarAgendamentoAction(agendamentoId);
      if (result.success) {
        router.refresh();
      } else {
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
      onClick={handleCancelar}
      disabled={loading}
      aria-label="Cancelar agendamento"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <X className="h-4 w-4" aria-hidden="true" />
      )}
    </Button>
  );
}
