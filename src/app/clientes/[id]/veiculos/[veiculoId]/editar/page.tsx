import Link from "next/link";
import { notFound } from "next/navigation";
import { buscarClientePorId } from "@/services/clientes";
import { buscarVeiculoPorId } from "@/services/veiculos";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FormVeiculo } from "@/components/clientes/form-veiculo";
import { ChevronLeft } from "lucide-react";

interface Props {
  params: { id: string; veiculoId: string };
}

export default async function EditarVeiculoPage({ params }: Props) {
  let cliente;
  let veiculo;
  try {
    cliente = await buscarClientePorId(params.id);
    veiculo = await buscarVeiculoPorId(params.veiculoId);
  } catch {
    notFound();
  }

  // O veículo da URL precisa pertencer ao cliente da URL.
  if (veiculo.clienteId !== cliente.id) {
    notFound();
  }

  return (
    <div className="p-8">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href={`/clientes/${cliente.id}`}>
          <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
          Voltar para {cliente.nome}
        </Link>
      </Button>
      <h1 className="mb-6 text-3xl font-bold">Editar Veículo</h1>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Dados do Veículo</CardTitle>
          <CardDescription>
            Editando o veículo <strong>{veiculo.placa}</strong> de{" "}
            <strong>{cliente.nome}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormVeiculo
            clienteId={cliente.id}
            veiculo={{
              id: veiculo.id,
              placa: veiculo.placa,
              marca: veiculo.marca,
              modelo: veiculo.modelo,
              ano: veiculo.ano,
              cor: veiculo.cor,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
