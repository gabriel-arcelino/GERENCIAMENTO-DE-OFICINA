import Link from "next/link";
import { listarAgendamentosPorData } from "@/services/agendamento";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BotaoGerarOS } from "@/components/agenda/botao-gerar-os";
import { BotaoCancelar } from "@/components/agenda/botao-cancelar";
import { SeletorData } from "@/components/agenda/seletor-data";
import { Plus, Calendar, Car, User } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Props {
  searchParams: { data?: string };
}

export default async function AgendaPage({ searchParams }: Props) {
  const hoje = new Date();
  const dataFiltro = searchParams.data
    ? new Date(searchParams.data + "T12:00:00")
    : hoje;

  const agendamentos = await listarAgendamentosPorData(dataFiltro);

  const dataStr = dataFiltro.toISOString().split("T")[0];
  const ontem = new Date(dataFiltro);
  ontem.setDate(ontem.getDate() - 1);
  const amanha = new Date(dataFiltro);
  amanha.setDate(amanha.getDate() + 1);

  const isHoje =
    dataFiltro.toDateString() === hoje.toDateString();

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agenda</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isHoje ? "Hoje" : formatDate(dataFiltro)} —{" "}
            {agendamentos.length} agendamento(s)
          </p>
        </div>
        <Button asChild>
          <Link href="/agenda/novo">
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Novo Agendamento
          </Link>
        </Button>
      </div>

      {/* Navegação de datas */}
      <div className="mb-6 flex items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/agenda?data=${ontem.toISOString().split("T")[0]}`}>
            ← Anterior
          </Link>
        </Button>
        <Button asChild variant={isHoje ? "default" : "outline"} size="sm">
          <Link href="/agenda">Hoje</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/agenda?data=${amanha.toISOString().split("T")[0]}`}>
            Próximo →
          </Link>
        </Button>
        <SeletorData defaultValue={dataStr} />
      </div>

      {/* Lista de agendamentos */}
      {agendamentos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="mb-4 h-12 w-12 text-muted-foreground" aria-hidden="true" />
            <p className="text-lg font-medium text-muted-foreground">
              Nenhum agendamento para este dia
            </p>
            <Button asChild className="mt-4">
              <Link href="/agenda/novo">
                <Plus className="mr-2 h-4 w-4" />
                Agendar
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {agendamentos.map((ag) => (
            <Card key={ag.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          ag.status === "AGENDADO"
                            ? "default"
                            : ag.status === "CONVERTIDO_EM_OS"
                            ? "success"
                            : "secondary"
                        }
                      >
                        {ag.status === "AGENDADO"
                          ? "Agendado"
                          : ag.status === "CONVERTIDO_EM_OS"
                          ? "Convertido em OS"
                          : "Cancelado"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(ag.dataAgendamento)}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        <Link
                          href={`/clientes/${ag.cliente.id}`}
                          className="font-medium hover:underline"
                        >
                          {ag.cliente.nome}
                        </Link>
                        <span className="text-muted-foreground">
                          — {ag.cliente.telefone}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-sm">
                      <Car className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      <span className="font-mono">{ag.veiculo.placa}</span>
                      <span className="text-muted-foreground">
                        — {ag.veiculo.marca} {ag.veiculo.modelo} ({ag.veiculo.ano})
                      </span>
                    </div>

                    {ag.observacao && (
                      <p className="text-sm text-muted-foreground">
                        {ag.observacao}
                      </p>
                    )}

                    {ag.osGerada && (
                      <Link
                        href={`/ordens/${ag.osGerada.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        → OS #{ag.osGerada.numero} gerada
                      </Link>
                    )}
                  </div>

                  {ag.status === "AGENDADO" && (
                    <div className="flex gap-2">
                      <BotaoGerarOS agendamentoId={ag.id} />
                      <BotaoCancelar agendamentoId={ag.id} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
