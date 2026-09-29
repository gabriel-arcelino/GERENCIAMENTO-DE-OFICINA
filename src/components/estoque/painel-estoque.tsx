"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AlertCircle, Loader2, Plus } from "lucide-react";
import { lancarEntradaAction } from "@/actions/estoque";

interface PainelEstoqueProps {
  pecaId: string;
}

export function PainelEstoque({ pecaId }: PainelEstoqueProps) {
  const router = useRouter();
  const [dialogAberto, setDialogAberto] = useState(false);
  const [quantidade, setQuantidade] = useState("1");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleEntrada(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      const result = await lancarEntradaAction(pecaId, parseFloat(quantidade));
      if (!result.success) {
        setErro(result.error);
      } else {
        setDialogAberto(false);
        setQuantidade("1");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Movimentação</CardTitle>
      </CardHeader>
      <CardContent>
        {erro && (
          <Alert variant="destructive" className="mb-3" role="alert">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        )}
        <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Lançar Entrada
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Lançar Entrada de Estoque</DialogTitle>
              <DialogDescription>
                Informe a quantidade recebida de mercadoria.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEntrada} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="qtd-entrada">Quantidade</Label>
                <Input
                  id="qtd-entrada"
                  type="number"
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  min="0.01"
                  step="1"
                  required
                  aria-required="true"
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  )}
                  Confirmar Entrada
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
