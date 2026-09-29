"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Loader2 } from "lucide-react";
import { abrirOSAction } from "@/actions/ordens";

interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  veiculos: Array<{
    id: string;
    placa: string;
    marca: string;
    modelo: string;
    ano: number;
  }>;
}

interface FormAbrirOSProps {
  clientes: Cliente[];
  clienteIdInicial?: string;
  veiculoIdInicial?: string;
}

export function FormAbrirOS({
  clientes,
  clienteIdInicial,
  veiculoIdInicial,
}: FormAbrirOSProps) {
  const router = useRouter();
  const [clienteId, setClienteId] = useState(clienteIdInicial ?? "");
  const [veiculoId, setVeiculoId] = useState(veiculoIdInicial ?? "");
  const [kmEntrada, setKmEntrada] = useState("");
  const [relatoCliente, setRelatoCliente] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const clienteSelecionado = clientes.find((c) => c.id === clienteId);
  const veiculos = clienteSelecionado?.veiculos ?? [];

  // Reset veículo ao mudar o cliente
  useEffect(() => {
    if (!veiculoIdInicial) {
      setVeiculoId("");
    }
  }, [clienteId, veiculoIdInicial]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    try {
      const result = await abrirOSAction({
        clienteId,
        veiculoId,
        kmEntrada: kmEntrada ? parseInt(kmEntrada) : undefined,
        relatoCliente: relatoCliente || undefined,
      });

      if (result.success && result.data) {
        router.push(`/ordens/${result.data.id}`);
      } else if (!result.success) {
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
        <Label htmlFor="clienteId">
          Cliente <span className="text-destructive" aria-hidden="true">*</span>
        </Label>
        <Select
          value={clienteId}
          onValueChange={setClienteId}
          required
        >
          <SelectTrigger id="clienteId" aria-required="true">
            <SelectValue placeholder="Selecione o cliente" />
          </SelectTrigger>
          <SelectContent>
            {clientes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nome} — {c.telefone}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="veiculoId">
          Veículo <span className="text-destructive" aria-hidden="true">*</span>
        </Label>
        <Select
          value={veiculoId}
          onValueChange={setVeiculoId}
          disabled={!clienteId || veiculos.length === 0}
          required
        >
          <SelectTrigger id="veiculoId" aria-required="true">
            <SelectValue
              placeholder={
                !clienteId
                  ? "Selecione o cliente primeiro"
                  : veiculos.length === 0
                  ? "Cliente sem veículos cadastrados"
                  : "Selecione o veículo"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {veiculos.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.placa} — {v.marca} {v.modelo} ({v.ano})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {clienteId && veiculos.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Este cliente não tem veículos. Cadastre um veículo primeiro.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="kmEntrada">Quilometragem de Entrada</Label>
        <Input
          id="kmEntrada"
          type="number"
          value={kmEntrada}
          onChange={(e) => setKmEntrada(e.target.value)}
          placeholder="Ex: 52000"
          min={0}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="relatoCliente">Relato do Cliente</Label>
        <Textarea
          id="relatoCliente"
          value={relatoCliente}
          onChange={(e) => setRelatoCliente(e.target.value)}
          placeholder="Descreva o problema relatado pelo cliente..."
          rows={3}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={loading || !clienteId || !veiculoId}
          className="flex-1"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
          Abrir Ordem de Serviço
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
