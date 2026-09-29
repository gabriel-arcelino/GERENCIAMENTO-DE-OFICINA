"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, ChevronLeft, Loader2 } from "lucide-react";
import { criarAgendamentoAction } from "@/actions/agendamento";

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

export default function NovoAgendamentoPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState("");
  const [veiculoId, setVeiculoId] = useState("");
  const [dataAgendamento, setDataAgendamento] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [observacao, setObservacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingClientes, setLoadingClientes] = useState(true);

  useEffect(() => {
    // Em produção, isso seria via Server Component ou API Route
    // Por simplicidade no MVP, buscamos via fetch
    fetch("/api/clientes")
      .then((r) => r.json())
      .then(setClientes)
      .catch(() => setLoadingClientes(false))
      .finally(() => setLoadingClientes(false));
  }, []);

  const clienteSelecionado = clientes.find((c) => c.id === clienteId);
  const veiculos = clienteSelecionado?.veiculos ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      const result = await criarAgendamentoAction({
        clienteId,
        veiculoId,
        dataAgendamento: new Date(dataAgendamento + "T12:00:00"),
        observacao: observacao || undefined,
      });
      if (result.success) {
        router.push("/agenda");
      } else {
        setErro(result.error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href="/agenda">
          <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
          Voltar para Agenda
        </Link>
      </Button>
      <h1 className="mb-6 text-3xl font-bold">Novo Agendamento</h1>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Dados do Agendamento</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {erro && (
              <Alert variant="destructive" role="alert">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                <AlertDescription>{erro}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="data">
                Data <span className="text-destructive" aria-hidden="true">*</span>
              </Label>
              <Input
                id="data"
                type="date"
                value={dataAgendamento}
                onChange={(e) => setDataAgendamento(e.target.value)}
                required
                aria-required="true"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cliente">
                Cliente <span className="text-destructive" aria-hidden="true">*</span>
              </Label>
              {loadingClientes ? (
                <p className="text-sm text-muted-foreground">Carregando clientes...</p>
              ) : (
                <Select value={clienteId} onValueChange={setClienteId} required>
                  <SelectTrigger id="cliente" aria-required="true">
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
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="veiculo">
                Veículo <span className="text-destructive" aria-hidden="true">*</span>
              </Label>
              <Select
                value={veiculoId}
                onValueChange={setVeiculoId}
                disabled={!clienteId || veiculos.length === 0}
                required
              >
                <SelectTrigger id="veiculo" aria-required="true">
                  <SelectValue
                    placeholder={
                      !clienteId
                        ? "Selecione o cliente primeiro"
                        : veiculos.length === 0
                        ? "Cliente sem veículos"
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="obs">Observação</Label>
              <Textarea
                id="obs"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Descreva o motivo do agendamento..."
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
                Confirmar Agendamento
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
        </CardContent>
      </Card>
    </div>
  );
}
