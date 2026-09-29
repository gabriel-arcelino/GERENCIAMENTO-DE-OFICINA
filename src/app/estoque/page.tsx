import Link from "next/link";
import { listarPecas, alertasReposicao, toNumber } from "@/services/estoque";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Plus, Package, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Props {
  searchParams: { q?: string };
}

export default async function EstoquePage({ searchParams }: Props) {
  const termo = searchParams.q ?? "";
  const [pecas, alertas] = await Promise.all([
    listarPecas(termo),
    alertasReposicao(),
  ]);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Estoque de Peças</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {pecas.length} peça(s) cadastrada(s)
          </p>
        </div>
        <Button asChild>
          <Link href="/estoque/nova">
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Nova Peça
          </Link>
        </Button>
      </div>

      {/* Alerta de reposição */}
      {alertas.length > 0 && (
        <Alert variant="warning" className="mb-6">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Atenção — Estoque baixo</AlertTitle>
          <AlertDescription>
            {alertas.length} peça(s) com estoque no mínimo ou abaixo:{" "}
            {alertas
              .slice(0, 3)
              .map((p) => p.descricao)
              .join(", ")}
            {alertas.length > 3 ? ` e mais ${alertas.length - 3}...` : "."}
          </AlertDescription>
        </Alert>
      )}

      {/* Busca */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form method="GET" action="/estoque">
            <div className="flex gap-2">
              <input
                name="q"
                defaultValue={termo}
                placeholder="Buscar por código ou descrição..."
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Buscar peças"
              />
              <Button type="submit" variant="outline">Buscar</Button>
              {termo && (
                <Button asChild variant="ghost"><Link href="/estoque">Limpar</Link></Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {pecas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="mb-4 h-12 w-12 text-muted-foreground" aria-hidden="true" />
            <p className="text-lg font-medium text-muted-foreground">
              {termo ? "Nenhuma peça encontrada" : "Nenhuma peça cadastrada"}
            </p>
            {!termo && (
              <Button asChild className="mt-4">
                <Link href="/estoque/nova">
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar Peça
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Estoque</TableHead>
                <TableHead className="text-right">Mínimo</TableHead>
                <TableHead className="text-right">V. Venda</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pecas.map((peca) => {
                const emAlerta = toNumber(peca.quantidadeEstoque) <= toNumber(peca.estoqueMinimo);
                const saldoNegativo = toNumber(peca.quantidadeEstoque) < 0;
                return (
                  <TableRow key={peca.id} className={emAlerta ? "bg-yellow-50/50" : undefined}>
                    <TableCell className="font-mono text-sm">{peca.codigo}</TableCell>
                    <TableCell className="font-medium">
                      <Link href={`/estoque/${peca.id}`} className="hover:underline">
                        {peca.descricao}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={saldoNegativo ? "text-red-600 font-bold" : emAlerta ? "text-yellow-700 font-medium" : ""}>
                        {toNumber(peca.quantidadeEstoque)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {toNumber(peca.estoqueMinimo)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(toNumber(peca.valorVenda))}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {emAlerta && (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" aria-label="Estoque baixo" />
                        )}
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/estoque/${peca.id}`}>Ver</Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
