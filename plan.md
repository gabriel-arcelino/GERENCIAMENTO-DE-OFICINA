# Plano: Multi-tenancy e operação offline

## Problema e abordagem

O sistema atual é single-tenant: uma aplicação Next.js acessa diretamente um PostgreSQL
compartilhado por instalação, e os serviços Prisma não recebem contexto de oficina. O plano é
evoluir para SaaS multi-tenant com banco compartilhado e isolamento obrigatório por `tenantId`,
preservando os domínios existentes (clientes, veículos, OS, estoque, agenda e faturamento).

Para indisponibilidade de internet, o plano prioriza uma instalação local na mesma máquina/rede,
capaz de registrar operações durante a queda e sincronizá-las depois com a nuvem. Como o sistema
atual é server-side e depende diretamente de PostgreSQL, a sincronização bidirecional será tratada
como uma prova técnica antes da implementação ampla, com resolução humana de conflitos nos dados
sensíveis.

## Decisões confirmadas

- Multi-tenancy inicial em banco compartilhado, com `tenantId` nas entidades de negócio e filtros
  obrigatórios em todas as leituras, escritas, atualizações e exclusões.
- Cada tenant representa uma oficina; usuários pertencem a um tenant.
- Oficinas são criadas por administrador da plataforma e os usuários são convidados.
- Offline prioritário: mesma máquina/rede local, com sincronização quando a internet retornar.
- Conflitos de sincronização devem ser detectados e apresentados para decisão humana, especialmente
  em OS, estoque e pagamentos.
- Este ciclo é de planejamento; não haverá alteração no código do repositório.

## Escopo planejado

### 1. Descoberta e contrato de tenancy

- Definir entidades de identidade e administração: `Tenant`, `Usuario`, convite, status e vínculo
  usuário-tenant.
- Definir contexto de tenant por requisição/sessão e impedir que `tenantId` venha confiavelmente
  do cliente.
- Mapear todas as entidades atuais e classificar quais são tenant-scoped, globais ou de auditoria.
- Definir autorização mínima para administrador da plataforma, administrador da oficina e usuário
  operacional, sem misturar isso às regras de negócio existentes.

### 2. Isolamento no banco e nos serviços

- Adicionar `tenantId` às tabelas de negócio, criar índices compostos e revisar unicidades globais
  (`placa`, `codigo`, `numero`) para o escopo correto.
- Criar uma estratégia centralizada de acesso tenant-aware para evitar filtros esquecidos nos
  serviços e actions atuais.
- Definir migração dos dados single-tenant existentes para um tenant inicial.
- Cobrir isolamento negativo: um usuário de uma oficina nunca lê, edita, exclui ou referencia dados
  de outra oficina, inclusive por IDs previsíveis ou relações indiretas.

### 3. Provisionamento e autenticação

- Planejar o fluxo administrativo de criação de oficina e convite de usuários.
- Integrar o tenant ativo à sessão autenticada, validar usuário ativo e impedir troca arbitrária
  de tenant.
- Definir expiração/revogação de convites, troca de senha, encerramento de sessão e recuperação de
  acesso como decisões de produto separadas, caso não caibam no primeiro incremento.

### 4. Prova técnica de offline-first

- Comparar as opções: PostgreSQL local com agente de sincronização, SQLite local com camada de
  sincronização, ou PWA com armazenamento local e API de sync.
- Definir o dispositivo autoritativo, o identificador estável de operações, outbox/inbox, cursor de
  sincronização, idempotência, reenvio e detecção de divergências.
- Modelar sincronização por eventos/operações, não por simples cópia de tabelas, para preservar
  auditoria e permitir reprocessamento.
- Testar queda durante gravação, reconexão, duplicação de envio, exclusão, alterações relacionadas,
  estoque e pagamentos.
- Criar uma tela/fluxo de conflitos com trilha de auditoria; não aplicar “última alteração vence”
  automaticamente em dados financeiros ou de estoque.

### 5. Operação e segurança

- Definir como a aplicação local é instalada, atualizada, descoberta na rede e protegida.
- Planejar criptografia em trânsito e em repouso, backup local, retenção, restauração e limpeza
  segura de dados de um tenant.
- Definir observabilidade de sincronização: última sincronização, itens pendentes, falhas,
  conflitos e estado de saúde.
- Atualizar documentação de arquitetura, modelo de dados, limites e procedimentos operacionais.

### 6. Estratégia de entrega e validação

- Entregar primeiro tenancy online sem alterar regras funcionais dos domínios existentes.
- Executar migração/backfill e testes de isolamento antes de habilitar múltiplos tenants.
- Implementar o offline apenas após o spike validar a estratégia de sincronização.
- Adicionar testes unitários, integração, e2e e testes de segurança de isolamento; validar build,
  migrações, restauração e cenários de perda de conectividade.

## Fora do escopo inicial

- Vários dispositivos operando offline simultaneamente sem uma autoridade local definida.
- Resolução automática de conflitos em estoque, pagamentos ou transições de OS.
- Portal completo de billing, planos, cobrança e marketplace.
- Compartilhamento de clientes entre oficinas.
- Prometer “offline” apenas com cache de leitura: isso não atende ao requisito de continuar
  registrando operações.

## Riscos e pontos a validar

- O PostgreSQL atual é remoto em produção e o Next.js não possui runtime local; offline exigirá
  componente local adicional ou uma arquitetura cliente-first.
- `numero` da OS com autoincremento e unicidades atuais podem gerar colisões ou dependência de
  sequência durante sincronização.
- Operações de estoque e pagamentos não são comutativas; sincronizar linhas finais pode perder
  intenção e quebrar saldos.
- Relações entre cliente, veículo, OS, itens, movimentações, agendamento e pagamento precisam de
  ordem/idempotência e tratamento de dependências.
- O plano deve incluir estratégia de migração reversível e backup antes de introduzir `tenantId`.

## Próximo passo

Transformar este plano em uma proposta de mudança formal após validar o spike offline e fechar o
contrato de identidade/autorização. A implementação deve começar pelo isolamento online e pela
migração segura, deixando a sincronização offline atrás de uma decisão baseada nos resultados do
spike.
