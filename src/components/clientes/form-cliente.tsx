"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import {
  criarClienteAction,
  atualizarClienteAction,
} from "@/actions/clientes";

interface FormClienteProps {
  clienteInicial?: {
    id: string;
    nome: string;
    telefone: string;
    email?: string | null;
    endereco?: string | null;
    documento?: string | null;
  };
}

export function FormCliente({ clienteInicial }: FormClienteProps) {
  const router = useRouter();
  const isEditing = !!clienteInicial;

  const [nome, setNome] = useState(clienteInicial?.nome ?? "");
  const [telefone, setTelefone] = useState(clienteInicial?.telefone ?? "");
  const [email, setEmail] = useState(clienteInicial?.email ?? "");
  const [endereco, setEndereco] = useState(clienteInicial?.endereco ?? "");
  const [documento, setDocumento] = useState(clienteInicial?.documento ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    try {
      const data = { nome, telefone, email, endereco, documento };

      const result = isEditing
        ? await atualizarClienteAction(clienteInicial.id, data)
        : await criarClienteAction(data);

      if (result.success) {
        router.push(
          isEditing ? `/clientes/${clienteInicial.id}` : `/clientes/${result.id}`
        );
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
        <Label htmlFor="nome">
          Nome <span className="text-destructive" aria-hidden="true">*</span>
        </Label>
        <Input
          id="nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          minLength={2}
          placeholder="Nome completo do cliente"
          aria-required="true"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="telefone">
          Telefone <span className="text-destructive" aria-hidden="true">*</span>
        </Label>
        <Input
          id="telefone"
          type="tel"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          required
          placeholder="(11) 99999-9999"
          aria-required="true"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="cliente@email.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="documento">CPF / CNPJ</Label>
        <Input
          id="documento"
          value={documento}
          onChange={(e) => setDocumento(e.target.value)}
          placeholder="000.000.000-00"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="endereco">Endereço</Label>
        <Input
          id="endereco"
          value={endereco}
          onChange={(e) => setEndereco(e.target.value)}
          placeholder="Rua, número, bairro, cidade"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
          {isEditing ? "Salvar Alterações" : "Cadastrar Cliente"}
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
