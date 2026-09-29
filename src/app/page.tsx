import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  ClipboardList,
  Calendar,
  Package,
  DollarSign,
  ArrowRight,
  TriangleAlert,
  Clock,
  CheckCircle2,
  Wrench
} from "lucide-react";
import { carregarDashboard } from "@/services/dashboard";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default async function HomePage() {
  const metricas = await carregarDashboard();

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Painel de Controle
        </h1>
        <p className="mt-2 text-muted-foreground">
          Visão geral da oficina em tempo real
        </p>
      </div>

      {/* Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/ordens" className="block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-xl">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">OS Abertas</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metricas.osAbertas}</div>
              <p className="text-xs text-muted-foreground">
                Em andamento na oficina
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/ordens" className="block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-xl">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Faturamento do Mês</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(metricas.faturamentoMes)}
              </div>
              <p className="text-xs text-muted-foreground">
                Recebido este mês
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/financeiro/pendencias" className="block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-xl">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Inadimplência</CardTitle>
              <TriangleAlert className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(metricas.totalPendente)}
              </div>
              <p className="text-xs text-muted-foreground">
                Saldo pendente de OS entregues
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/agenda" className="block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-xl">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Agendamentos Hoje</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {metricas.agendamentosHoje}
              </div>
              <p className="text-xs text-muted-foreground">
                Veículos agendados para hoje
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* OS Recentes */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Ordens de Serviço Recentes</CardTitle>
            <CardDescription>
              As 5 últimas ordens de serviço abertas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {metricas.osRecentes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma OS encontrada.</p>
            ) : (
              <div className="space-y-4">
                {metricas.osRecentes.map(os => (
                  <div key={os.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        #{os.numero} - {os.clienteNome}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {os.veiculoPlaca} • {formatDateTime(os.dataAbertura)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">{os.status}</Badge>
                      <span className="font-bold">{formatCurrency(os.totalOS)}</span>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/ordens/${os.id}`}>
                          Ver
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-6">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/ordens">
                  Ver Todas as Ordens
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Agendamentos do Dia & Alertas */}
        <div className="col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agendamentos de Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              {metricas.agendamentosDoDia.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum agendamento para hoje.</p>
              ) : (
                <div className="space-y-4">
                  {metricas.agendamentosDoDia.map(ag => (
                    <div key={ag.id} className="flex flex-col gap-1 pb-4 border-b last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{ag.clienteNome}</p>
                        <Badge>{ag.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{ag.veiculoInfo}</p>
                      {ag.observacao && (
                        <p className="text-xs text-muted-foreground truncate">
                          Obs: {ag.observacao}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/agenda">
                    Acessar Agenda
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Alertas de Estoque */}
          <Card className={metricas.pecasEmAlerta > 0 ? "border-yellow-200 bg-yellow-50/50" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Estoque
              </CardTitle>
            </CardHeader>
            <CardContent>
              {metricas.pecasEmAlerta > 0 ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3 text-yellow-700">
                    <AlertTriangle className="h-8 w-8" />
                    <div>
                      <p className="font-bold">{metricas.pecasEmAlerta} Peças em Alerta</p>
                      <p className="text-sm">No mínimo ou abaixo do nível recomendado</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full border-yellow-300 hover:bg-yellow-100 text-yellow-800" asChild>
                    <Link href="/estoque">
                      Ver Itens
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3 text-green-700">
                    <CheckCircle2 className="h-8 w-8" />
                    <div>
                      <p className="font-bold">Estoque Saudável</p>
                      <p className="text-sm">Nenhuma peça precisando de reposição</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/estoque">
                      Acessar Estoque
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}
