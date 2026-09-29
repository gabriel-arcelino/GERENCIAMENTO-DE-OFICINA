"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusOS, TipoItem } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BadgeStatus, labelStatus } from "@/components/ordens/badge-status";
import {
  transicionarStatusAction,
  aprovarOrcamentoAction,
  adicionarItemOSAction,
  removerItemOSAction,
  atualizarDiagnosticoAction,
} from "@/actions/ordens";
import { registrarPagamentoAction } from "@/actions/faturamento";
import { calcularSaldoOS } from "@/services/faturamento";
import { TRANSICOES_VALIDAS } from "@/services/ordemServico";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { AlertCircle, CheckCircle, Plus, Trash2, Loader2, Clock } from "lucide-react";
import { FormaPagamento } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

interface Peca {
  id: string;
  codigo: string;
  descricao: string;
  valorVenda: { toNumber(): number } | number | string;
}

interface ItemOS {
  id: string;
  tipo: TipoItem;
  descricao: string;
  quantidade: { toNumber(): number } | number | string;
  valorUnitario: { toNumber(): number } | number | string;
  pecaId: string | null;
  peca?: { codigo: string; descricao: string } | null;
}

interface Pagamento {
  id: string;
  formaPagamento: FormaPagamento;
  valor: { toNumber(): number } | number | string;
  dataPagamento: Date | string;
}

interface HistoricoItem {
  id: string;
  statusAnterior: StatusOS | null;
  statusNovo: StatusOS;
  dataHora: Date | string;
}

interface OS {
  id: string;
  numero: number;
  status: StatusOS;
  orcamentoAprovado: boolean;
  kmEntrada: number | null;
  relatoCliente: string | null;
  diagnosticoTecnico: string | null;
  dataAbertura: Date | string;
  dataPrevisaoEntrega: Date | string | null;
  dataEntrega: Date | string | null;
  veiculo: { id: string; placa: string; marca: string; modelo: string; ano: number };
  cliente: { id: string; nome: string; telefone: string };
  itens: ItemOS[];
  historico: HistoricoItem[];
  pagamentos: Pagamento[];
}

interface PainelOSProps {
  os: OS;
  pecasDisponiveis: Peca[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function toNum(v: { toNumber(): number } | number | string | null | undefined): number {
  if (!v) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v);
  return v.toNumber();
}

const formasPagamento: { value: FormaPagamento; label: string }[] = [
  { value: "DINHEIRO", label: "Dinheiro" },
  { value: "PIX", label: "PIX" },
  { value: "CARTAO_DEBITO", label: "Cartão de Débito" },
  { value: "CARTAO_CREDITO", label: "Cartão de Crédito" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────

export function PainelOS({ os, pecasDisponiveis }: PainelOSProps) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  // Dialog: adicionar item
  const [dialogItemAberto, setDialogItemAberto] = useState(false);
  const [tipoItem, setTipoItem] = useState<TipoItem>("MAO_DE_OBRA");
  const [descricaoItem, setDescricaoItem] = useState("");
  const [quantidadeItem, setQuantidadeItem] = useState("1");
  const [valorItem, setValorItem] = useState("");
  const [pecaIdItem, setPecaIdItem] = useState("");
  const [alertaEstoque, setAlertaEstoque] = useState<string | null>(null);

  // Dialog: pagamento
  const [dialogPagAberto, setDialogPagAberto] = useState(false);
  const [formaPag, setFormaPag] = useState<FormaPagamento>("PIX");
  const [valorPag, setValorPag] = useState("");
  const [alertaPag, setAlertaPag] = useState<string | null>(null);

  // Dialog: diagnóstico
  const [dialogDiagAberto, setDialogDiagAberto] = useState(false);
  const [diagnostico, setDiagnostico] = useState(os.diagnosticoTecnico ?? "");
  const [relato, setRelato] = useState(os.relatoCliente ?? "");

  const totalOS = os.itens.reduce(
    (acc, i) => acc + toNum(i.quantidade) * toNum(i.valorUnitario),
    0
  );
  const saldo = calcularSaldoOS(os.pagamentos as any, os.itens as any);
  const proximosStatus = TRANSICOES_VALIDAS[os.status];

  async function handleTransicao(novoStatus: StatusOS) {
    setErro(null);
    setLoading(`transicao-${novoStatus}`);
    try {
      const result = await transicionarStatusAction(os.id, novoStatus);
      if (!result.success) setErro(result.error);
      else router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleAprovar() {
    setErro(null);
    setLoading("aprovar");
    try {
      const result = await aprovarOrcamentoAction(os.id);
      if (!result.success) setErro(result.error);
      else router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleAdicionarItem(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setAlertaEstoque(null);
    setLoading("item");
    try {
      const result = await adicionarItemOSAction({
        osId: os.id,
        tipo: tipoItem,
        descricao: descricaoItem,
        quantidade: parseFloat(quantidadeItem),
        valorUnitario: parseFloat(valorItem),
        pecaId: tipoItem === "PECA" ? pecaIdItem : undefined,
      });
      if (!result.success) {
        setErro(result.error);
      } else {
        if (result.data?.alertaEstoqueInsuficiente) {
          setAlertaEstoque(
            `Estoque insuficiente. Saldo atual: ${result.data.saldoAtual ?? 0}. ` +
              "A peça foi lançada mesmo assim e o saldo ficou negativo."
          );
        }
        setDialogItemAberto(false);
        setDescricaoItem("");
        setQuantidadeItem("1");
        setValorItem("");
        setPecaIdItem("");
        router.refresh();
      }
    } finally {
      setLoading(null);
    }
  }

  async function handleRemoverItem(itemId: string) {
    setErro(null);
    setLoading(`remove-${itemId}`);
    try {
      const result = await removerItemOSAction(itemId, os.id);
      if (!result.success) setErro(result.error);
      else router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handlePagamento(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setAlertaPag(null);
    setLoading("pagamento");
    try {
      const result = await registrarPagamentoAction({
        osId: os.id,
        formaPagamento: formaPag,
        valor: parseFloat(valorPag),
      });
      if (!result.success) {
        setErro(result.error);
      } else {
        if (result.data?.alertaOverpayment && result.data.troco) {
          setAlertaPag(`Valor pago é maior que o total. Troco: ${formatCurrency(result.data.troco)}`);
        }
        setDialogPagAberto(false);
        setValorPag("");
        router.refresh();
      }
    } finally {
      setLoading(null);
    }
  }

  async function handleSalvarDiagnostico(e: React.FormEvent) {
    e.preventDefault();
    setLoading("diagnostico");
    try {
      await atualizarDiagnosticoAction(os.id, { diagnosticoTecnico: diagnostico, relatoCliente: relato });
      setDialogDiagAberto(false);
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  const podeAdicionarItem = !(
    os.status === StatusOS.ENTREGUE || os.status === StatusOS.REPROVADO
  );

  const podeRegistrarPagamento =
    os.status === StatusOS.APROVADO ||
    os.status === StatusOS.EM_EXECUCAO ||
    os.status === StatusOS.CONFERENCIA ||
    os.status === StatusOS.PRONTO_PARA_ENTREGA ||
    os.status === StatusOS.ENTREGUE;

  return (
    <div className="space-y-6">
      {erro && (
        <Alert variant="destructive" role="alert">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}

      {alertaPag && (
        <Alert variant="warning" role="status">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>{alertaPag}</AlertDescription>
        </Alert>
      )}

      {alertaEstoque && (
        <Alert variant="warning" role="status">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>{alertaEstoque}</AlertDescription>
        </Alert>
      )}

      {/* Status & ações */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Status da OS</CardTitle>
            <BadgeStatus status={os.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Gate de aprovação */}
          {os.status === StatusOS.AGUARDANDO_APROVACAO && !os.orcamentoAprovado && (
            <Alert variant="warning">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertTitle>Aguardando aprovação do cliente</AlertTitle>
              <AlertDescription className="flex items-center gap-3 mt-2">
                O orçamento precisa ser aprovado formalmente.
                <Button size="sm" onClick={handleAprovar} disabled={loading === "aprovar"}>
                  {loading === "aprovar" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Registrar Aprovação
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Botão de reprovar (se aguardando aprovação) */}
          {os.status === StatusOS.AGUARDANDO_APROVACAO && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleTransicao(StatusOS.REPROVADO)}
              disabled={!!loading}
            >
              Reprovar Orçamento
            </Button>
          )}

          {/* Próximas transições (exceto APROVADO que tem fluxo próprio e REPROVADO) */}
          <div className="flex flex-wrap gap-2">
            {proximosStatus
              .filter((s) => s !== StatusOS.APROVADO && s !== StatusOS.REPROVADO)
              .map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant="outline"
                  onClick={() => handleTransicao(status)}
                  disabled={!!loading}
                >
                  {loading === `transicao-${status}` && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Avançar: {labelStatus(status)}
                </Button>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Diagnóstico / Relato */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Diagnóstico</CardTitle>
          {!(os.status === StatusOS.ENTREGUE || os.status === StatusOS.REPROVADO) && (
            <Dialog open={dialogDiagAberto} onOpenChange={setDialogDiagAberto}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">Editar</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Diagnóstico e Relato</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSalvarDiagnostico} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="relato">Relato do Cliente</Label>
                    <Textarea id="relato" value={relato} onChange={(e) => setRelato(e.target.value)} rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="diag">Diagnóstico Técnico</Label>
                    <Textarea id="diag" value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} rows={4} />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={loading === "diagnostico"}>
                      {loading === "diagnostico" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Salvar
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium text-muted-foreground">Relato do cliente</p>
            <p className="mt-1">{os.relatoCliente || "—"}</p>
          </div>
          <Separator />
          <div>
            <p className="font-medium text-muted-foreground">Diagnóstico técnico</p>
            <p className="mt-1">{os.diagnosticoTecnico || "—"}</p>
          </div>
          {os.kmEntrada && (
            <>
              <Separator />
              <div>
                <p className="font-medium text-muted-foreground">KM de entrada</p>
                <p className="mt-1">{os.kmEntrada.toLocaleString("pt-BR")} km</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Itens */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">
            Itens ({os.itens.length})
          </CardTitle>
          {podeAdicionarItem && (
            <Dialog open={dialogItemAberto} onOpenChange={setDialogItemAberto}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                  Adicionar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Item</DialogTitle>
                  <DialogDescription>
                    Peça do estoque ou mão de obra
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAdicionarItem} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo</Label>
                    <Select value={tipoItem} onValueChange={(v) => setTipoItem(v as TipoItem)}>
                      <SelectTrigger id="tipo">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MAO_DE_OBRA">Mão de Obra</SelectItem>
                        <SelectItem value="PECA">Peça do Estoque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {tipoItem === "PECA" && (
                    <div className="space-y-2">
                      <Label htmlFor="peca">Peça</Label>
                      <Select value={pecaIdItem} onValueChange={(v) => {
                        setPecaIdItem(v);
                        const peca = pecasDisponiveis.find((p) => p.id === v);
                        if (peca) {
                          setDescricaoItem(peca.descricao);
                          setValorItem(toNum(peca.valorVenda).toFixed(2));
                        }
                      }}>
                        <SelectTrigger id="peca">
                          <SelectValue placeholder="Selecione a peça" />
                        </SelectTrigger>
                        <SelectContent>
                          {pecasDisponiveis.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.codigo} — {p.descricao}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="desc">Descrição</Label>
                    <Input id="desc" value={descricaoItem} onChange={(e) => setDescricaoItem(e.target.value)} required />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="qtd">Quantidade</Label>
                      <Input id="qtd" type="number" value={quantidadeItem} onChange={(e) => setQuantidadeItem(e.target.value)} min="0.01" step="0.01" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="valor">Valor Unitário (R$)</Label>
                      <Input id="valor" type="number" value={valorItem} onChange={(e) => setValorItem(e.target.value)} min="0.01" step="0.01" required />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="submit" disabled={loading === "item"}>
                      {loading === "item" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Adicionar Item
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          {os.itens.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Nenhum item adicionado
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">V. Unit.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  {podeAdicionarItem && <TableHead className="w-10" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {os.itens.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.descricao}</TableCell>
                    <TableCell>
                      <Badge variant={item.tipo === "PECA" ? "default" : "secondary"} className="text-xs">
                        {item.tipo === "PECA" ? "Peça" : "Mão de Obra"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{toNum(item.quantidade)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(toNum(item.valorUnitario))}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(toNum(item.quantidade) * toNum(item.valorUnitario))}
                    </TableCell>
                    {podeAdicionarItem && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoverItem(item.id)}
                          disabled={loading === `remove-${item.id}`}
                          aria-label={`Remover ${item.descricao}`}
                        >
                          {loading === `remove-${item.id}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-destructive" />
                          )}
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={podeAdicionarItem ? 4 : 3} className="font-bold">
                    Total
                  </TableCell>
                  <TableCell className="text-right font-bold text-lg">
                    {formatCurrency(totalOS)}
                  </TableCell>
                  {podeAdicionarItem && <TableCell />}
                </TableRow>
              </TableFooter>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Financeiro */}
      {podeRegistrarPagamento && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Financeiro</CardTitle>
            <Dialog open={dialogPagAberto} onOpenChange={setDialogPagAberto}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={saldo.quitado}>
                  <Plus className="mr-2 h-4 w-4" />
                  Registrar Pagamento
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Pagamento</DialogTitle>
                  <DialogDescription>
                    Saldo devedor: {formatCurrency(saldo.saldoDevedor)}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handlePagamento} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forma">Forma de Pagamento</Label>
                    <Select value={formaPag} onValueChange={(v) => setFormaPag(v as FormaPagamento)}>
                      <SelectTrigger id="forma">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {formasPagamento.map((f) => (
                          <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valor-pag">Valor (R$)</Label>
                    <Input
                      id="valor-pag"
                      type="number"
                      value={valorPag}
                      onChange={(e) => setValorPag(e.target.value)}
                      min="0.01"
                      step="0.01"
                      placeholder={saldo.saldoDevedor.toFixed(2)}
                      required
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={loading === "pagamento"}>
                      {loading === "pagamento" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Confirmar
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-3">
            {os.pagamentos.length > 0 && (
              <div className="space-y-2">
                {os.pagamentos.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {p.formaPagamento.replace("_", " ")} · {formatDateTime(p.dataPagamento)}
                    </span>
                    <span className="font-medium text-green-700">{formatCurrency(toNum(p.valor))}</span>
                  </div>
                ))}
                <Separator />
              </div>
            )}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Total OS</span>
                <span className="font-medium">{formatCurrency(saldo.totalOS)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total pago</span>
                <span className="font-medium text-green-700">{formatCurrency(saldo.totalPago)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>{saldo.quitado ? "Quitado" : "Saldo devedor"}</span>
                <span className={saldo.quitado ? "text-green-700" : "text-red-600"}>
                  {saldo.quitado ? "✓" : formatCurrency(saldo.saldoDevedor)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico de status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3" aria-label="Histórico de status da OS">
            {os.historico.map((h) => (
              <li key={h.id} className="flex items-start gap-3 text-sm">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div>
                  <p className="font-medium">
                    {h.statusAnterior
                      ? `${labelStatus(h.statusAnterior)} → ${labelStatus(h.statusNovo)}`
                      : `OS aberta em ${labelStatus(h.statusNovo)}`}
                  </p>
                  <p className="text-muted-foreground">{formatDateTime(h.dataHora)}</p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
