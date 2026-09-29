import Link from "next/link";
import { notFound } from "next/navigation";
import { buscarClientePorId } from "@/services/clientes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FormVeiculo } from "@/components/clientes/form-veiculo";
import { ChevronLeft } from "lucide-react";

interface Props {
  params: { id: string };
}

export default async function NovoVeiculoPage({ params }: Props) {
  let cliente;
  try {
    cliente = await buscarClientePorId(params.id);
  } catch {
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
      <h1 className="mb-6 text-3xl font-bold">Novo Veículo</h1>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Dados do Veículo</CardTitle>
          <CardDescription>
            Cadastrando veículo para: <strong>{cliente.nome}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormVeiculo clienteId={cliente.id} />
        </CardContent>
      </Card>
    </div>
  );
}
