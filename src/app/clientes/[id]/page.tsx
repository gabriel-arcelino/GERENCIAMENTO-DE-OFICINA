import Link from "next/link";
import { notFound } from "next/navigation";
import { buscarClientePorId } from "@/services/clientes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BadgeStatus } from "@/components/ordens/badge-status";
import { BotaoExcluirVeiculo } from "@/components/clientes/botao-excluir-veiculo";
import {
  ChevronLeft,
  Plus,
  Car,
  Phone,
  Mail,
  MapPin,
  FileText,
  Edit,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Props {
  params: { id: string };
}

export default async function ClienteDetailPage({ params }: Props) {
  let cliente;
  try {
    cliente = await buscarClientePorId(params.id);
  } catch {
    notFound();
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link href="/clientes">
            <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
            Voltar para Clientes
          </Link>
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{cliente.nome}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Cliente desde {formatDate(cliente.criadoEm)}
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/clientes/${cliente.id}/editar`}>
              <Edit className="mr-2 h-4 w-4" aria-hidden="true" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Dados do cliente */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dados de Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span>{cliente.telefone}</span>
              </div>
              {cliente.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <span>{cliente.email}</span>
                </div>
              )}
              {cliente.endereco && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <span>{cliente.endereco}</span>
                </div>
              )}
              {cliente.documento && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <span>{cliente.documento}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resumo */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold">{cliente._count.veiculos}</p>
                <p className="text-xs text-muted-foreground mt-1">Veículos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold">{cliente._count.ordens}</p>
                <p className="text-xs text-muted-foreground mt-1">Ordens</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Veículos e Ordens */}
        <div className="lg:col-span-2 space-y-6">
          {/* Veículos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Veículos</CardTitle>
              <Button asChild size="sm">
                <Link href={`/clientes/${cliente.id}/veiculos/novo`}>
                  <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
                  Adicionar
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {cliente.veiculos.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <Car className="mb-2 h-8 w-8 text-muted-foreground" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum veículo cadastrado
                  </p>
                  <Button asChild variant="outline" size="sm" className="mt-3">
                    <Link href={`/clientes/${cliente.id}/veiculos/novo`}>
                      Cadastrar Veículo
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cliente.veiculos.map((veiculo) => (
                    <div
                      key={veiculo.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Car className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                        <div>
                          <p className="font-medium">
                            {veiculo.marca} {veiculo.modelo}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {veiculo.placa} · {veiculo.ano}
                            {veiculo.cor ? ` · ${veiculo.cor}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/ordens/nova?veiculoId=${veiculo.id}&clienteId=${cliente.id}`}>
                            Nova OS
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          aria-label={`Editar veículo ${veiculo.placa}`}
                        >
                          <Link href={`/clientes/${cliente.id}/veiculos/${veiculo.id}/editar`}>
                            <Edit className="h-4 w-4" aria-hidden="true" />
                          </Link>
                        </Button>
                        <BotaoExcluirVeiculo
                          veiculoId={veiculo.id}
                          clienteId={cliente.id}
                          placa={veiculo.placa}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Últimas OS */}
          {cliente.ordens.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Últimas Ordens de Serviço</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nº</TableHead>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cliente.ordens.map((os) => (
                      <TableRow key={os.id}>
                        <TableCell>
                          <Link
                            href={`/ordens/${os.id}`}
                            className="font-medium hover:underline"
                          >
                            #{os.numero}
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {os.veiculo.placa}
                        </TableCell>
                        <TableCell>
                          <BadgeStatus status={os.status} />
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(os.dataAbertura)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
