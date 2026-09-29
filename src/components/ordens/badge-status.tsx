import { StatusOS } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

const statusConfig: Record<
  StatusOS,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" }
> = {
  RECEBIDO: { label: "Recebido", variant: "secondary" },
  DIAGNOSTICO: { label: "Diagnóstico", variant: "info" },
  AGUARDANDO_APROVACAO: { label: "Aguardando Aprovação", variant: "warning" },
  APROVADO: { label: "Aprovado", variant: "success" },
  EM_EXECUCAO: { label: "Em Execução", variant: "default" },
  CONFERENCIA: { label: "Conferência", variant: "info" },
  PRONTO_PARA_ENTREGA: { label: "Pronto para Entrega", variant: "success" },
  ENTREGUE: { label: "Entregue", variant: "outline" },
  REPROVADO: { label: "Reprovado", variant: "destructive" },
};

interface BadgeStatusProps {
  status: StatusOS;
}

export function BadgeStatus({ status }: BadgeStatusProps) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function labelStatus(status: StatusOS): string {
  return statusConfig[status].label;
}
