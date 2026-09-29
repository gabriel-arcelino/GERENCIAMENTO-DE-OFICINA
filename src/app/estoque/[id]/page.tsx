import Link from "next/link";
import { notFound } from "next/navigation";
import { buscarPecaPorId, toNumber } from "@/services/estoque";
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
import { PainelEstoque } from "@/components/estoque/painel-estoque";
import { ChevronLeft, AlertTriangle } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface Props {
  params: { id: string };
}

export default async function PecaDetailPage({ params }: Props) {
  let peca;
  try {
    peca = await buscarPecaPorId(params.id);
  } catch {
    notFound();
  }

  const emAlerta = toNumber(peca.quantidadeEstoque) <= toNumber(peca.estoqueMinimo);
  const saldoNegativo = toNumber(peca.quantidadeEstoque) < 0;

  return (
    <div className="p-8">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href="/estoque">
          <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
          Voltar para Estoque
        </Link>
      </Button>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{peca.descricao}</h1>
          <p className="mt-1 text-sm text-muted-foreground font-mono">
            {peca.codigo}
          </p>
        </div>
        {emAlerta && (
          <Badge variant="warning" className="gap-1">
            <AlertTriangle className="h-3 w-3" aria-hidden="true" />
            Estoque Baixo
          </Badge>
        )}
      </div>

      {saldoNegativo && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Saldo Negativo</AlertTitle>
          <AlertDescription>
            Este produto está com saldo negativo ({toNumber(peca.quantidadeEstoque)} unidades).
            Faça um lançamento de entrada para regularizar o estoque.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info da peça */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estoque atual</span>
                <span className={`font-bold ${saldoNegativo ? "text-red-600" : emAlerta ? "text-yellow-700" : ""}`}>
                  {toNumber(peca.quantidadeEstoque)} un.
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estoque mínimo</span>
                <span>{toNumber(peca.estoqueMinimo)} un.</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor de custo</span>
                <span>{formatCurrency(toNumber(peca.valorCusto))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor de venda</span>
                <span className="font-medium">{formatCurrency(toNumber(peca.valorVenda))}</span>
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          <PainelEstoque pecaId={peca.id} />
        </div>

        {/* Histórico de movimentações */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Histórico de Movimentações ({peca.movimentacoes.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {peca.movimentacoes.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Nenhuma movimentação registrada
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead>OS</TableHead>
                      <TableHead>Data/Hora</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {peca.movimentacoes.map((mov) => (
                      <TableRow key={mov.id}>
                        <TableCell>
                          <Badge
                            variant={
                              mov.tipo === "ENTRADA"
                                ? "success"
                                : mov.tipo === "ESTORNO"
                                ? "warning"
                                : "secondary"
                            }
                          >
                            {mov.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={
                              mov.tipo === "SAIDA"
                                ? "text-red-600"
                                : "text-green-700"
                            }
                          >
                            {mov.tipo === "SAIDA" ? "-" : "+"}
                            {toNumber(mov.quantidade)}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {mov.osId ? (
                            <Link
                              href={`/ordens/${mov.osId}`}
                              className="hover:underline"
                            >
                              OS #{mov.osId.slice(0, 8)}...
                            </Link>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDateTime(mov.dataHora)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
