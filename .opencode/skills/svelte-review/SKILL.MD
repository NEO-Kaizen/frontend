---
name: svelte-review
description: Conhecimento especializado para revisão de código e ensino de boas práticas em projetos SvelteKit, Svelte 5 e TypeScript.
metadata:
  version: '2.0'
  tags:
    - svelte 5
    - sveltekit
    - typescript
    - review
---

# Objetivo

Esta Skill auxilia agentes responsáveis por revisar código e ensinar SvelteKit.

Ela complementa a documentação oficial e **não deve substituí-la**.

Sempre priorize respostas fundamentadas em documentação quando houver dúvidas sobre APIs ou comportamento do framework.

---

# Fontes de conhecimento

Utilize a seguinte prioridade:

1. Código do projeto
2. AGENTS.md
3. Documentação do Svelte MCP
4. Context7
5. Conhecimento interno

## Quando utilizar o Svelte MCP

Utilize o Svelte MCP sempre que a dúvida envolver svelte e/ou algum dos tópicos abaixo:

- APIs do Svelte
- APIs do SvelteKit
- runes
- lifecycle
- navegação
- load functions
- form actions
- SSR
- CSR
- hydration
- stores (legado) / estados com runes
- snippets
- breaking changes
- recursos específicos do framework

Nunca tente responder de memória quando existir documentação disponível.

## Quando utilizar o Context7

Quando a dúvida relacionar typescript ou outra tecnologia consulte o Context7.

Principalmente para:

- integração entre SvelteKit e TypeScript;
- bibliotecas externas;
- comportamento do TypeScript;
- APIs Web;
- Node.js;
- padrões recentes da comunidade;
- comparação entre abordagens.

O Context7 é complementar ao Svelte MCP, nunca um substituto.

## TypeScript

Priorize:

- inferência de tipos;
- tipos explícitos em APIs públicas;
- unions discriminadas para estados;
- interfaces para contratos compartilhados;
- generics apenas quando aumentarem reutilização.

Evite:

- any;
- casts para ocultar erros;
- non-null assertion (`!`) sem justificativa;
- tipos duplicados;
- objetos excessivamente opcionais.

Em SvelteKit, prefira utilizar os tipos gerados pelo framework (`PageData`, `PageServerLoad`, `LayoutLoad`, `Actions`, etc.) em vez de recriar contratos manualmente.

---

## Componentes

Procure:

- componentes muito grandes;
- lógica complexa no template;
- repetição de código;
- responsabilidades misturadas.

---

## Performance

Procure:

- recomputações desnecessárias;
- criação repetida de objetos;
- loops custosos;
- listeners não removidos.

Não sugira micro-otimizações sem evidências.

---

## Acessibilidade

Verifique:

- HTML semântico;
- navegação por teclado;
- formulários acessíveis;
- mensagens de erro acessíveis;
- atributos ARIA apenas quando necessários.

---

# Como ensinar

Sempre estruture a resposta em:

1. Problema
2. Motivo
3. Solução
4. Alternativas
5. Referência da documentação (quando utilizada)

Explique primeiro o conceito e depois apresente exemplos.

---

# Limitações

Nunca:

- invente APIs;
- suponha comportamento do framework;
- responda dúvidas de documentação sem consultar o Svelte MCP quando necessário;
- utilize Context7 como primeira fonte para assuntos exclusivos do Svelte;
- gere alterações automáticas ou patches.
