"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ChevronLeft, Loader2 } from "lucide-react";
import { criarPecaAction } from "@/actions/estoque";

export default function NovaPecaPage() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [qtdInicial, setQtdInicial] = useState("0");
  const [estoqueMinimo, setEstoqueMinimo] = useState("0");
  const [valorCusto, setValorCusto] = useState("");
  const [valorVenda, setValorVenda] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      const result = await criarPecaAction({
        codigo,
        descricao,
        quantidadeEstoque: parseFloat(qtdInicial),
        estoqueMinimo: parseFloat(estoqueMinimo),
        valorCusto: parseFloat(valorCusto),
        valorVenda: parseFloat(valorVenda),
      });
      if (result.success && result.data) {
        router.push(`/estoque/${result.data.id}`);
      } else if (!result.success) {
        setErro(result.error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href="/estoque">
          <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
          Voltar para Estoque
        </Link>
      </Button>
      <h1 className="mb-6 text-3xl font-bold">Nova Peça</h1>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Dados da Peça</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {erro && (
              <Alert variant="destructive" role="alert">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                <AlertDescription>{erro}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigo">
                  Código <span className="text-destructive" aria-hidden="true">*</span>
                </Label>
                <Input
                  id="codigo"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  required
                  placeholder="FILTRO-001"
                  aria-required="true"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qtd">Estoque Inicial</Label>
                <Input
                  id="qtd"
                  type="number"
                  value={qtdInicial}
                  onChange={(e) => setQtdInicial(e.target.value)}
                  min="0"
                  step="1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">
                Descrição <span className="text-destructive" aria-hidden="true">*</span>
              </Label>
              <Input
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                required
                placeholder="Filtro de óleo..."
                aria-required="true"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="min">Estoque Mínimo</Label>
              <Input
                id="min"
                type="number"
                value={estoqueMinimo}
                onChange={(e) => setEstoqueMinimo(e.target.value)}
                min="0"
                step="1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="custo">
                  Valor de Custo (R$) <span className="text-destructive" aria-hidden="true">*</span>
                </Label>
                <Input
                  id="custo"
                  type="number"
                  value={valorCusto}
                  onChange={(e) => setValorCusto(e.target.value)}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  aria-required="true"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="venda">
                  Valor de Venda (R$) <span className="text-destructive" aria-hidden="true">*</span>
                </Label>
                <Input
                  id="venda"
                  type="number"
                  value={valorVenda}
                  onChange={(e) => setValorVenda(e.target.value)}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  aria-required="true"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                Cadastrar Peça
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
