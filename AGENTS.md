# Projeto NEO — Frontend

## Project Configuration

- **Language**: TypeScript
- **Package Manager**: npm
- **Add-ons**: prettier, eslint, mcp
---

## Contexto do projeto

Este repositório contém o frontend de uma aplicação web interna para
recebimento, organização, triagem, priorização e acompanhamento de
solicitações.

## Segurança e confidencialidade

- Trate documentos de requisitos e informações do cliente como restritos.
- Não publique a especificação original ou dados reais em repositórios públicos.
- Não envie documentos, dados do cliente ou código confidencial para ferramentas externas.
- Nunca coloque tokens, senhas, chaves ou credenciais no código.
- Use dados fictícios em mocks, exemplos, testes, screenshots e documentação.
- Não execute git push sem autorização explícita.
- Não compartilhe sessões do OpenCode relacionadas ao projeto.

## TypeScript

- Evite any.
- Não use type assertions para esconder problemas de tipagem.
- Modele estados inválidos de forma explícita.
- Valide dados recebidos de APIs, formulários e armazenamento.

## Svelte

- Utilize a versão e os padrões definidos pelo package.json.
- Consulte Context7 antes de introduzir APIs ou padrões cuja versão seja incerta.
- Mantenha componentes pequenos e com responsabilidade clara.
- Evite stores globais para estados que podem permanecer locais.
- Trate loading, erro, sucesso, vazio e ausência de permissão.
- Preserve acessibilidade semântica e navegação por teclado.



Você pode usar o servidor Svelte MCP, onde terá acesso à documentação completa do Svelte 5 e do SvelteKit. Veja como usar as ferramentas disponíveis de forma eficaz:

## Ferramentas disponíveis no Svelte MCP:

### 1. list-sections

Use esta ferramenta PRIMEIRO para descobrir todas as seções de documentação disponíveis. Retorna uma lista estruturada com títulos, casos de uso e caminhos.

Ao ser questionado sobre tópicos do Svelte ou do SvelteKit, SEMPRE use esta ferramenta no início do chat para encontrar as seções relevantes.

### 2. get-documentation

Recupera o conteúdo completo da documentação para seções específicas. Aceita uma ou várias seções.

Após chamar a ferramenta list-sections, você DEVE analisar as seções de documentação retornadas (especialmente o campo use_cases) e, em seguida, usar a ferramenta get-documentation para obter TODAS as seções de documentação relevantes para a tarefa do usuário.

### 3. svelte-autofixer

Analisa o código Svelte e retorna problemas e sugestões.

Você DEVE usar esta ferramenta sempre que escrever código Svelte antes de enviá-lo ao usuário. Continue chamando-a até que nenhum problema ou sugestão seja retornado.

### 4. playground-link

Gera um link para o Playground do Svelte com o código fornecido.

Após concluir o código, pergunte ao usuário se ele deseja um link para o Playground. Chame esta ferramenta somente após a confirmação do usuário e NUNCA se o código tiver sido escrito em arquivos do projeto dele.