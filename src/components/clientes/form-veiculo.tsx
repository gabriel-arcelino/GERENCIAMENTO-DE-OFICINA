"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { criarVeiculoAction } from "@/actions/clientes";

interface FormVeiculoProps {
  clienteId: string;
}

export function FormVeiculo({ clienteId }: FormVeiculoProps) {
  const router = useRouter();
  const currentYear = new Date().getFullYear();

  const [placa, setPlaca] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [ano, setAno] = useState(currentYear.toString());
  const [cor, setCor] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    try {
      const result = await criarVeiculoAction({
        placa,
        marca,
        modelo,
        ano: parseInt(ano),
        cor,
        clienteId,
      });

      if (result.success) {
        router.push(`/clientes/${clienteId}`);
      } else {
        setErro(result.error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {erro && (
        <Alert variant="destructive" role="alert">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="placa">
          Placa <span className="text-destructive" aria-hidden="true">*</span>
        </Label>
        <Input
          id="placa"
          value={placa}
          onChange={(e) => setPlaca(e.target.value.toUpperCase())}
          required
          placeholder="ABC1234 ou ABC1D23"
          maxLength={8}
          aria-required="true"
          aria-describedby="placa-hint"
        />
        <p id="placa-hint" className="text-xs text-muted-foreground">
          Padrão antigo (ABC1234) ou Mercosul (ABC1D23)
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="marca">
            Marca <span className="text-destructive" aria-hidden="true">*</span>
          </Label>
          <Input
            id="marca"
            value={marca}
            onChange={(e) => setMarca(e.target.value)}
            required
            placeholder="Toyota"
            aria-required="true"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="modelo">
            Modelo <span className="text-destructive" aria-hidden="true">*</span>
          </Label>
          <Input
            id="modelo"
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
            required
            placeholder="Corolla"
            aria-required="true"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ano">
            Ano <span className="text-destructive" aria-hidden="true">*</span>
          </Label>
          <Input
            id="ano"
            type="number"
            value={ano}
            onChange={(e) => setAno(e.target.value)}
            required
            min={1900}
            max={currentYear + 1}
            aria-required="true"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cor">Cor</Label>
          <Input
            id="cor"
            value={cor}
            onChange={(e) => setCor(e.target.value)}
            placeholder="Branco"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
          Cadastrar Veículo
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
