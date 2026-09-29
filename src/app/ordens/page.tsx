import Link from "next/link";
import { listarOS } from "@/services/ordemServico";
import { StatusOS } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BadgeStatus } from "@/components/ordens/badge-status";
import { Plus, ClipboardList } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Props {
  searchParams: { status?: string };
}

const statusFiltros = [
  { label: "Todas", value: "" },
  { label: "Recebido", value: "RECEBIDO" },
  { label: "Diagnóstico", value: "DIAGNOSTICO" },
  { label: "Aguard. Aprovação", value: "AGUARDANDO_APROVACAO" },
  { label: "Em Execução", value: "EM_EXECUCAO" },
  { label: "Pronto", value: "PRONTO_PARA_ENTREGA" },
  { label: "Entregue", value: "ENTREGUE" },
  { label: "Reprovado", value: "REPROVADO" },
];

export default async function OrdensPage({ searchParams }: Props) {
  const statusFiltro = searchParams.status as StatusOS | undefined;
  const ordens = await listarOS(statusFiltro ? { status: statusFiltro } : undefined);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ordens de Serviço</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {ordens.length} ordem(ns) encontrada(s)
          </p>
        </div>
        <Button asChild>
          <Link href="/ordens/nova">
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Nova OS
          </Link>
        </Button>
      </div>

      {/* Filtros de status */}
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar por status">
        {statusFiltros.map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/ordens?status=${f.value}` : "/ordens"}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              (statusFiltro ?? "") === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {ordens.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ClipboardList className="mb-4 h-12 w-12 text-muted-foreground" aria-hidden="true" />
            <p className="text-lg font-medium text-muted-foreground">
              Nenhuma ordem encontrada
            </p>
            <Button asChild className="mt-4">
              <Link href="/ordens/nova">
                <Plus className="mr-2 h-4 w-4" />
                Nova Ordem de Serviço
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Abertura</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead className="w-20">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordens.map((os) => (
                <TableRow key={os.id}>
                  <TableCell className="font-mono font-medium">
                    <Link href={`/ordens/${os.id}`} className="hover:underline">
                      #{os.numero}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/clientes/${os.clienteId}`} className="hover:underline">
                      {os.cliente.nome}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {os.veiculo.placa} — {os.veiculo.marca} {os.veiculo.modelo}
                  </TableCell>
                  <TableCell>
                    <BadgeStatus status={os.status} />
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(os.dataAbertura)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {os._count.itens}
                  </TableCell>
                  <TableCell>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/ordens/${os.id}`}>Ver</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
