# Escopo e Limites do Sistema

Os itens listados abaixo estão **deliberadamente fora do escopo** do sistema. Eles foram registrados para deixar explícito o limite de atuação de cada domínio e não representam pendências, defeitos ou funcionalidades prometidas. Qualquer inclusão futura deve passar por uma nova proposta de mudança.

## Clientes e Veículos

- Histórico de serviços do veículo (tratado pelo domínio de Ordens de Serviço).
- Autenticação e gestão de usuários/permissões.
- Múltiplos proprietários simultâneos por veículo ou fluxo de transferência de propriedade.

## Ordens de Serviço

- Gestão de múltiplos responsáveis/papéis por etapa de execução.
- Agendamento de horário na agenda (tratado pelo domínio de Agendamento).
- Pagamento e controle financeiro (tratado pelo domínio de Faturamento).

## Estoque de Peças

- Emissão e importação de XML de NF-e de fornecedores.
- Inventário físico de estoque com conciliação manual complexa.

## Agendamento

- Gestão fina de horários exatos: o agendamento é agrupado apenas por data, sem controle de horário, elevadores ou boxes de atendimento.
- Alocação dinâmica de mecânicos ou baías/boxes de trabalho.
- Notificação automática por SMS ou WhatsApp para o cliente.

## Faturamento

- Emissão de Notas Fiscais (NF-e / NFS-e).
- DRE (Demonstrativo do Resultado do Exercício) e Contas a Pagar.
- Conciliação bancária automática.

### Ressalva fiscal

O sistema **não realiza emissão de NFS-e nem de NF-e**. Todo o controle financeiro é interno, restrito ao registro de pagamentos, cálculo de saldo devedor e sinalização de pendências; a emissão de documentos fiscais é responsabilidade de sistema externo/contador.
