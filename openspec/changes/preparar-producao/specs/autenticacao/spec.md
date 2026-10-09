# Spec Delta

## Purpose

Autenticar o atendente e restringir o acesso ao sistema, para que dados pessoais de clientes e registros financeiros não fiquem expostos a qualquer pessoa que alcance o endereço da aplicação.

## ADDED Requirements

### Requirement: Acesso restrito a usuário autenticado

O sistema SHALL exigir sessão válida para acessar qualquer página ou rota de API, exceto a própria tela de login.

#### Scenario: Acesso anônimo a página protegida é redirecionado

- **WHEN** um visitante sem sessão solicita qualquer página do sistema
- **THEN** o sistema o redireciona para a tela de login, sem exibir nenhum dado de negócio

#### Scenario: Acesso anônimo a rota de API é recusado

- **WHEN** uma requisição sem sessão é feita a uma rota de API do sistema
- **THEN** o sistema responde com status 401 e nenhum dado

#### Scenario: Tela de login permanece acessível

- **WHEN** um visitante sem sessão solicita a tela de login
- **THEN** o sistema a exibe normalmente

### Requirement: Autenticação por credenciais

O sistema SHALL autenticar o atendente por e-mail e senha, aceitando apenas credenciais válidas de um usuário ativo.

#### Scenario: Login com credenciais válidas

- **WHEN** o atendente informa e-mail e senha corretos de um usuário ativo
- **THEN** o sistema estabelece a sessão e o encaminha ao painel inicial

#### Scenario: Recusa de senha incorreta

- **WHEN** o atendente informa uma senha incorreta
- **THEN** o sistema recusa o acesso com mensagem genérica, sem revelar se o e-mail existe

#### Scenario: Recusa de usuário inativo

- **WHEN** o atendente informa credenciais válidas de um usuário marcado como inativo
- **THEN** o sistema recusa o acesso com a mesma mensagem genérica

### Requirement: Sessão mantida e encerrável

O sistema SHALL manter a sessão do atendente entre requisições, sem exigir novo login a cada ação, e SHALL invalidá-la quando ele encerrar a sessão.

#### Scenario: Sessão mantida entre requisições

- **WHEN** o atendente autenticado navega para outra página do sistema
- **THEN** o sistema o reconhece sem solicitar credenciais novamente

#### Scenario: Encerramento de sessão

- **WHEN** o atendente aciona o encerramento de sessão
- **THEN** a sessão é invalidada e requisições seguintes voltam a exigir login

### Requirement: Senhas armazenadas de forma irreversível

O sistema SHALL armazenar a senha apenas como hash, nunca em texto puro, e SHALL NOT permitir recuperar a senha original a partir do valor armazenado.

#### Scenario: Senha não é recuperável do armazenamento

- **WHEN** um usuário é cadastrado com uma senha
- **THEN** o valor persistido é um hash, e a senha original não é recuperável a partir dele

#### Scenario: Autenticação compara hash, não texto

- **WHEN** o atendente se autentica
- **THEN** o sistema valida a senha informada contra o hash armazenado, sem jamais comparar ou persistir a senha em texto puro

### Requirement: Alteração da própria senha

O sistema SHALL permitir que o atendente autenticado altere a própria senha, exigindo a confirmação da senha atual.

#### Scenario: Alteração com senha atual correta

- **WHEN** o atendente autenticado informa a senha atual correta e uma nova senha válida
- **THEN** o sistema substitui o hash armazenado e mantém a sessão ativa

#### Scenario: Recusa quando a senha atual está incorreta

- **WHEN** o atendente informa a senha atual incorreta
- **THEN** o sistema recusa a alteração e mantém o hash anterior inalterado

### Requirement: Permissões uniformes entre usuários

O sistema SHALL conceder o mesmo conjunto de permissões a todo usuário autenticado, não havendo perfis, papéis ou níveis de permissão diferenciados.

#### Scenario: Sem distinção de acesso entre usuários

- **WHEN** dois usuários distintos estão autenticados na mesma instalação
- **THEN** ambos têm acesso às mesmas telas e podem executar as mesmas ações
