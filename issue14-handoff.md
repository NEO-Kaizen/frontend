## Contexto

A interface da página de login e o service de autenticação serão desenvolvidos separadamente.

Esta tarefa deverá conectar os dois elementos, controlar os estados do formulário e apresentar ao usuário o resultado da tentativa de login.

## Objetivo

Integrar o formulário da página de login ao service de autenticação e implementar os comportamentos de carregamento, sucesso e erro com a API.

## Escopo

### Incluído

- captura dos valores do formulário;
- validação antes do envio;
- chamada do service de login com a API;
- bloqueio de envios duplicados;
- estado de carregamento;
- tratamento de credenciais inválidas;
- tratamento de erro inesperado;
- comportamento após sucesso;
- limpeza ou preservação de mensagens conforme interação;
- uso do contrato definido com o Backend.

### Não incluído

- implementação do endpoint;
- alteração da modelagem de usuário;
- recuperação de senha;
- gerenciamento completo de sessão e permissões;
- funcionalidades da página de destino após o login.

## Entregável

Página de login integrada à API e apresentando os estados esperados durante a autenticação.

## Critérios de aceite

- [ ] O formulário não é enviado com campos obrigatórios vazios.
- [ ] As credenciais são enviadas por meio do service de login.
- [ ] O botão apresenta estado de carregamento durante a requisição.
- [ ] Envios duplicados são impedidos durante o carregamento.
- [ ] Credenciais inválidas apresentam mensagem compreensível.
- [ ] Erros inesperados possuem tratamento visual.
- [ ] O comportamento de sucesso segue a definição da Sprint.
- [ ] A integração utiliza o contrato definido pelo Backend.
- [ ] A lógica HTTP não está duplicada no componente.
- [ ] A aplicação executa localmente.
- [ ] A integração foi validada com a API ou com o ambiente acordado.
- [ ] A alteração foi revisada por outro integrante.

## Dependências

- Interface da página de login concluída.
- Service de login concluído.
- Endpoint de autenticação disponível.
- Contrato da API definido.
- Comportamento de sucesso definido por Produto.

## Evidências esperadas

- tentativa de login;
- evidência do estado de carregamento;
- evidência de credenciais inválidas;
- evidência de sucesso;
- Pull Request relacionada.

## Observações

Caso o endpoint ainda não esteja disponível, a Issue deverá permanecer bloqueada ou utilizar temporariamente o ambiente acordado com o Backend.
