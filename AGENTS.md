# Projeto NEO — Frontend

## Configuração do Projeto

- **Language**: TypeScript
- **Package Manager**: npm
- **Add-ons**: prettier, eslint, mcp

## Informações adicionais no projeto Projeto
Utilize as seguintes skills quando precisar de contexto e informações mais específicas sobre o projeto:
- development-pattern para acessar informações detalhadas e específicas de desenvolvimmento
- frontend-architecture para acessar a estrutura arquitetura e fluxo
- project-overview visão geral do Projeto NEO, mais especificamente o frontend.
- svelte-review para acessar informações adicionais sobre boas práticas de svelte e typescript

## Objetivos
Priorize sempre:
- simplicidade;
- legibilidade;
- manutenção;
- acessibilidade;
- tipagem segura;
- consistência com o código existente.
Evite soluções excessivamente complexas.

## Arquitetura
Sempre prefira:
- componentes pequenos;
- responsabilidade única;
- composição em vez de duplicação;
- estado local sempre que possível;
- baixo acoplamento.

## Segurança
- Nunca exponha credenciais, tokens ou dados sensíveis.
- Utilize dados fictícios em exemplos, testes e documentação.
- Não execute `git push` sem autorização explícita.
- Trate documentos de requisitos e informações do cliente como restritos.
- Não publique a especificação original ou dados reais em repositórios públicos.
- Não envie documentos, dados do cliente ou código confidencial para ferramentas externas.
- Nunca coloque tokens, senhas, chaves ou credenciais no código.
- Use dados fictícios em mocks, exemplos, testes, screenshots e documentação.
- Não execute git push sem autorização explícita.
- Não compartilhe sessões do OpenCode relacionadas ao projeto.
- Nunca desabilite regras de segurança apenas para satisfazer uma implementação.

## Convenções
- Preserve o estilo e os padrões já utilizados no projeto.
- Evite mudanças desnecessárias na arquitetura.
- Sempre considere acessibilidade e tratamento de estados de erro.
- Valide dados externos antes de utilizá-los.


## Skills
Utilize a Skill mais adequada para cada tarefa.
Evite duplicar conhecimento especializado neste arquivo.

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