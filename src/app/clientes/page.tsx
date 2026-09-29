import Link from "next/link";
import { buscarClientes } from "@/services/clientes";
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
import { Plus, Search, User, Car } from "lucide-react";

interface Props {
  searchParams: { q?: string };
}

export default async function ClientesPage({ searchParams }: Props) {
  const termo = searchParams.q ?? "";
  const clientes = await buscarClientes(termo);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {clientes.length} cliente(s) encontrado(s)
          </p>
        </div>
        <Button asChild>
          <Link href="/clientes/novo">
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Novo Cliente
          </Link>
        </Button>
      </div>

      {/* Busca */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form method="GET" action="/clientes">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  name="q"
                  defaultValue={termo}
                  placeholder="Buscar por nome, telefone, e-mail ou placa..."
                  className="flex h-10 w-full rounded-md border border-input bg-background py-2 pl-10 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label="Buscar clientes"
                />
              </div>
              <Button type="submit" variant="outline">
                Buscar
              </Button>
              {termo && (
                <Button asChild variant="ghost">
                  <Link href="/clientes">Limpar</Link>
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tabela */}
      {clientes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <User className="mb-4 h-12 w-12 text-muted-foreground" aria-hidden="true" />
            <p className="text-lg font-medium text-muted-foreground">
              {termo ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {termo
                ? "Tente buscar por outro termo"
                : "Cadastre o primeiro cliente para começar"}
            </p>
            {!termo && (
              <Button asChild className="mt-4">
                <Link href="/clientes/novo">
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar Cliente
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
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Veículos</TableHead>
                <TableHead>OS</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/clientes/${cliente.id}`}
                      className="hover:underline"
                    >
                      {cliente.nome}
                    </Link>
                  </TableCell>
                  <TableCell>{cliente.telefone}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {cliente.email ?? "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Car className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                      <span className="text-sm">{cliente._count.veiculos}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{cliente._count.ordens}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/clientes/${cliente.id}`}>Ver</Link>
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
