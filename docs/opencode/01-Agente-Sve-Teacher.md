# Sve Teacher

O **Sve Teacher** é um agente especializado em **Svelte 5**, **SvelteKit** e **TypeScript**.

ele atua como um professor: explica o problema, apresenta alternativas e fundamenta as respostas na documentação oficial sempre que necessário.

---
# Quando utilizar
Utilize o **Sve Teacher** quando quiser:
- entender um conceito do Svelte ou TypeScript;
- aprender uma API do SvelteKit;
- descobrir por que um código não funciona;
- revisar um componente antes de abrir um Pull Request;
- validar uma abordagem de implementação;
- entender mensagens de erro;
- comparar duas soluções.

Não utilize este agente para implementar funcionalidades ou editar arquivos do projeto.
---

# O que esperar das respostas

As respostas normalmente incluem:
- explicação do problema;
- motivo do comportamento observado;
- possíveis soluções;
- vantagens e desvantagens de cada abordagem;
- referências à documentação quando pertinente.

O objetivo é que você compreenda **o motivo da solução**, e não apenas copie um trecho de código.
---

# Exemplos de prompts

### Entendendo um conceito

```text
Explique como funcionam as runes do Svelte 5 e quando devo utilizar cada uma delas.
```
---

### Revisando um componente
```text
Revise este componente.

Procure bugs, problemas de reatividade, acessibilidade, performance e tipagem. Explique cada sugestão sem modificar o código.
```
---

### Tirando uma dúvida
```text
Estou utilizando um $derived, mas ele não atualiza quando espero.

Explique o motivo e mostre qual seria a abordagem recomendada.
```
---
# Dicas

- Faça perguntas específicas. Quanto mais contexto você fornecer, melhor será a resposta.
- Sempre envie o componente completo quando a dúvida depender do contexto.
- Peça para o agente explicar **por que** uma abordagem é recomendada, em vez de apenas solicitar a solução.

> O objetivo do Sve Teacher não é escrever código por você, mas ajudá-lo a compreender Svelte e evoluir tecnicamente durante o desenvolvimento.