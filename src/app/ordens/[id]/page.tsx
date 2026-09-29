import Link from "next/link";
import { notFound } from "next/navigation";
import { buscarOSPorId } from "@/services/ordemServico";
import { listarPecas } from "@/services/estoque";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BadgeStatus } from "@/components/ordens/badge-status";
import { PainelOS } from "@/components/ordens/painel-os";
import { ChevronLeft, Car, User } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Props {
  params: { id: string };
}

export default async function OSDetailPage({ params }: Props) {
  let os;
  try {
    os = await buscarOSPorId(params.id);
  } catch {
    notFound();
  }

  const pecas = await listarPecas();

  const pecasFormatadas = pecas.map((p) => ({
    id: p.id,
    codigo: p.codigo,
    descricao: p.descricao,
    valorVenda: p.valorVenda,
  }));

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link href="/ordens">
            <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
            Voltar para Ordens
          </Link>
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">OS #{os.numero}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Aberta em {formatDate(os.dataAbertura)}
              {os.dataPrevisaoEntrega &&
                ` · Previsão: ${formatDate(os.dataPrevisaoEntrega)}`}
            </p>
          </div>
          <BadgeStatus status={os.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sidebar: info do cliente e veículo */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" aria-hidden="true" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/clientes/${os.cliente.id}`}
                className="font-medium hover:underline"
              >
                {os.cliente.nome}
              </Link>
              <p className="text-sm text-muted-foreground mt-1">{os.cliente.telefone}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Car className="h-4 w-4" aria-hidden="true" />
                Veículo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium font-mono">{os.veiculo.placa}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {os.veiculo.marca} {os.veiculo.modelo} {os.veiculo.ano}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Painel principal */}
        <div className="lg:col-span-2">
          <PainelOS os={os as any} pecasDisponiveis={pecasFormatadas as any} />
        </div>
      </div>
    </div>
  );
}
