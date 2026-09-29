"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, ClipboardList } from "lucide-react";
import { converterEmOSAction } from "@/actions/agendamento";

interface BotaoGerarOSProps {
  agendamentoId: string;
}

export function BotaoGerarOS({ agendamentoId }: BotaoGerarOSProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleGerar() {
    setLoading(true);
    try {
      const result = await converterEmOSAction(agendamentoId);
      if (result.success && result.data) {
        router.push(`/ordens/${result.data.osId}`);
      } else if (!result.success) {
        alert(result.error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" onClick={handleGerar} disabled={loading}>
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <ClipboardList className="mr-2 h-4 w-4" aria-hidden="true" />
      )}
      Gerar OS
    </Button>
  );
}
