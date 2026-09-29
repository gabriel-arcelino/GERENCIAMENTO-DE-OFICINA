import Link from "next/link";
import { listarPendencias } from "@/services/faturamento";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, AlertTriangle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Props {
  searchParams: { clienteId?: string };
}

export default async function PendenciasPage({ searchParams }: Props) {
  const pendencias = await listarPendencias(searchParams.clienteId);

  const totalPendente = pendencias.reduce(
    (acc, p) => acc + p.saldo.saldoDevedor,
    0
  );

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Pendências Financeiras</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          OS entregues com saldo em aberto
        </p>
      </div>

      {/* Resumo */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-50 p-2">
                <AlertTriangle className="h-5 w-5 text-red-600" aria-hidden="true" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendencias.length}</p>
                <p className="text-sm text-muted-foreground">OS com saldo pendente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-50 p-2">
                <DollarSign className="h-5 w-5 text-orange-600" aria-hidden="true" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalPendente)}</p>
                <p className="text-sm text-muted-foreground">Total em aberto</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {pendencias.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <DollarSign className="mb-4 h-12 w-12 text-muted-foreground" aria-hidden="true" />
            <p className="text-lg font-medium text-muted-foreground">
              Nenhuma pendência financeira
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Todas as OS entregues estão quitadas
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>OS</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead>Entregue em</TableHead>
                <TableHead className="text-right">Total OS</TableHead>
                <TableHead className="text-right">Pago</TableHead>
                <TableHead className="text-right">Saldo Devedor</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendencias.map((os) => (
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
                    <p className="text-xs text-muted-foreground">{os.cliente.telefone}</p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {os.veiculo.placa}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(os.dataEntrega)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(os.saldo.totalOS)}
                  </TableCell>
                  <TableCell className="text-right text-green-700">
                    {formatCurrency(os.saldo.totalPago)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-red-600">
                    {formatCurrency(os.saldo.saldoDevedor)}
                  </TableCell>
                  <TableCell>
                    <Button asChild size="sm">
                      <Link href={`/ordens/${os.id}`}>Cobrar</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={6} className="font-bold">
                  Total Pendente
                </TableCell>
                <TableCell className="text-right font-bold text-red-600 text-lg">
                  {formatCurrency(totalPendente)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </Card>
      )}
    </div>
  );
}
