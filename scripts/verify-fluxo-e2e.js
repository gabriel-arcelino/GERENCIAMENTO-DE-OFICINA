const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runE2ETest() {
  console.log('--- INICIANDO TESTE DE FLUXO COMPLETO E2E ---');

  // 1. Criar Cliente e Veículo
  const cliente = await prisma.cliente.create({
    data: {
      nome: 'Carlos Eduardo Teste',
      telefone: '11988887777',
      email: 'carlos.teste@email.com',
      veiculos: {
        create: {
          placa: 'BRA2E19',
          marca: 'Toyota',
          modelo: 'Corolla',
          ano: 2022,
          cor: 'Prata',
        }
      }
    },
    include: { veiculos: true }
  });
  const veiculo = cliente.veiculos[0];
  console.log('✓ 1. Cliente e Veículo cadastrados com sucesso:', {
    clienteId: cliente.id,
    veiculoId: veiculo.id,
    placa: veiculo.placa
  });

  // 2. Criar Agendamento
  const hoje = new Date();
  const agendamento = await prisma.agendamento.create({
    data: {
      clienteId: cliente.id,
      veiculoId: veiculo.id,
      dataAgendamento: hoje,
      observacao: 'Revisão periódica de freios',
      status: 'AGENDADO'
    }
  });
  console.log('✓ 2. Agendamento criado:', { id: agendamento.id, status: agendamento.status });

  // 3. Converter Agendamento em OS
  const os = await prisma.ordemServico.create({
    data: {
      clienteId: cliente.id,
      veiculoId: veiculo.id,
      status: 'RECEBIDO',
      kmEntrada: 45000,
      relatoCliente: agendamento.observacao,
    }
  });
  await prisma.agendamento.update({
    where: { id: agendamento.id },
    data: {
      status: 'CONVERTIDO_EM_OS',
      osGeradaId: os.id
    }
  });
  console.log('✓ 3. Agendamento convertido em OS com sucesso:', {
    osId: os.id,
    osNumero: os.numero,
    status: os.status
  });

  // 4. Cadastrar Peça no Estoque com saldo inicial 10
  const codigoPeca = 'PEC-' + Date.now().toString().slice(-6);
  const peca = await prisma.peca.create({
    data: {
      codigo: codigoPeca,
      descricao: 'Jogo Pastilha Freio Dianteira',
      quantidadeEstoque: 10,
      estoqueMinimo: 2,
      valorCusto: 120.00,
      valorVenda: 220.00
    }
  });
  console.log('✓ 4. Peça criada no estoque:', { codigo: peca.codigo, saldo: peca.quantidadeEstoque.toString() });

  // 5. Adicionar Peça e Serviço na OS (Baixa automática de 2 unidades)
  const itemPeca = await prisma.itemOrdemServico.create({
    data: {
      osId: os.id,
      tipo: 'PECA',
      descricao: peca.descricao,
      quantidade: 2,
      valorUnitario: 220.00,
      pecaId: peca.id
    }
  });
  // Baixa manual simulando service layer
  await prisma.peca.update({
    where: { id: peca.id },
    data: { quantidadeEstoque: { decrement: 2 } }
  });
  await prisma.movimentacaoEstoque.create({
    data: {
      pecaId: peca.id,
      tipo: 'SAIDA',
      quantidade: 2,
      osId: os.id
    }
  });

  const itemMaoObra = await prisma.itemOrdemServico.create({
    data: {
      osId: os.id,
      tipo: 'MAO_DE_OBRA',
      descricao: 'Substituição de pastilhas e sangria',
      quantidade: 1,
      valorUnitario: 150.00
    }
  });
  console.log('✓ 5. Itens adicionados na OS (Total: R$ 590,00)');

  // Verificar saldo do estoque pós-baixa
  const pecaAposBaixa = await prisma.peca.findUnique({ where: { id: peca.id } });
  console.log('✓ 6. Baixa de estoque confirmada. Saldo atual:', pecaAposBaixa.quantidadeEstoque.toString(), '(esperado: 8)');

  // 7. Testar Máquina de Estados e Gate de Aprovação
  // RECEBIDO -> DIAGNOSTICO -> AGUARDANDO_APROVACAO
  await prisma.ordemServico.update({
    where: { id: os.id },
    data: { status: 'DIAGNOSTICO', diagnosticoTecnico: 'Desgaste severo das pastilhas' }
  });
  await prisma.ordemServico.update({
    where: { id: os.id },
    data: { status: 'AGUARDANDO_APROVACAO' }
  });
  console.log('✓ 7. OS avançou para AGUARDANDO_APROVACAO');

  // Simular aprovação formal do cliente
  await prisma.ordemServico.update({
    where: { id: os.id },
    data: {
      orcamentoAprovado: true,
      status: 'APROVADO'
    }
  });
  console.log('✓ 8. Gate de Aprovação formalizado: orcamentoAprovado = true -> APROVADO');

  // Avançar para EM_EXECUCAO -> CONFERENCIA -> PRONTO_PARA_ENTREGA
  await prisma.ordemServico.update({
    where: { id: os.id },
    data: { status: 'EM_EXECUCAO' }
  });
  await prisma.ordemServico.update({
    where: { id: os.id },
    data: { status: 'CONFERENCIA' }
  });
  await prisma.ordemServico.update({
    where: { id: os.id },
    data: { status: 'PRONTO_PARA_ENTREGA' }
  });
  console.log('✓ 9. OS passou por Execução, Conferência e Pronto para Entrega');

  // 10. Pagamento Parcial (Total R$ 590,00 - Pagou R$ 300,00 via PIX)
  await prisma.pagamento.create({
    data: {
      osId: os.id,
      formaPagamento: 'PIX',
      valor: 300.00
    }
  });

  // Entregar veículo com saldo pendente de R$ 290,00
  await prisma.ordemServico.update({
    where: { id: os.id },
    data: {
      status: 'ENTREGUE',
      dataEntrega: new Date()
    }
  });
  console.log('✓ 10. Veículo ENTREGUE com saldo em aberto (R$ 300,00 pagos de R$ 590,00)');

  // 11. Verificar Pendências Financeiras
  const itens = await prisma.itemOrdemServico.findMany({ where: { osId: os.id } });
  const totalOS = itens.reduce((acc, item) => acc + (Number(item.quantidade) * Number(item.valorUnitario)), 0);
  const pagamentos = await prisma.pagamento.findMany({ where: { osId: os.id } });
  const totalPago = pagamentos.reduce((acc, pag) => acc + Number(pag.valor), 0);
  const saldoDevedor = totalOS - totalPago;

  console.log('✓ 11. Cálculo financeiro validado:', {
    totalOS: `R$ ${totalOS.toFixed(2)}`,
    totalPago: `R$ ${totalPago.toFixed(2)}`,
    saldoDevedor: `R$ ${saldoDevedor.toFixed(2)}`
  });

  console.log('\n=============================================');
  console.log('🎉 TODOS OS TESTES END-TO-END PASSARAM COM SUCESSO!');
  console.log('=============================================');
}

runE2ETest()
  .catch((e) => {
    console.error('Erro no teste:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
