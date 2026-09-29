import Link from "next/link";
import { buscarClientes } from "@/services/clientes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormAbrirOS } from "@/components/ordens/form-abrir-os";
import { ChevronLeft } from "lucide-react";

interface Props {
  searchParams: { clienteId?: string; veiculoId?: string };
}

export default async function NovaOSPage({ searchParams }: Props) {
  const clientes = await buscarClientes();

  // Formata os clientes com seus veículos para o formulário
  const clientesComVeiculos = clientes.map((c) => ({
    id: c.id,
    nome: c.nome,
    telefone: c.telefone,
    veiculos: c.veiculos.map((v) => ({
      id: v.id,
      placa: v.placa,
      marca: v.marca,
      modelo: v.modelo,
      ano: v.ano,
    })),
  }));

  return (
    <div className="p-8">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href="/ordens">
          <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
          Voltar para Ordens
        </Link>
      </Button>
      <h1 className="mb-6 text-3xl font-bold">Nova Ordem de Serviço</h1>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Dados da OS</CardTitle>
        </CardHeader>
        <CardContent>
          <FormAbrirOS
            clientes={clientesComVeiculos}
            clienteIdInicial={searchParams.clienteId}
            veiculoIdInicial={searchParams.veiculoId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
