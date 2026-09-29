import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormCliente } from "@/components/clientes/form-cliente";
import { ChevronLeft } from "lucide-react";

export default function NovoClientePage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link href="/clientes">
            <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
            Voltar para Clientes
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Novo Cliente</h1>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Dados do Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <FormCliente />
        </CardContent>
      </Card>
    </div>
  );
}
