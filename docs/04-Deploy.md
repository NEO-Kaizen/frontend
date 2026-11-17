# Deploy do frontend

Este documento descreve a publicação do frontend SvelteKit com `adapter-node`, atrás de um
proxy reverso e em um subcaminho como `/server03`.

## Topologia

Na implantação atual, as requisições seguem este fluxo:

```text
Navegador
  └─ HTTPS /server03/*
       └─ proxy externo
            └─ Nginx da VM :80
                 ├─ frontend SvelteKit 127.0.0.1:4174
                 └─ backend           127.0.0.1:3000
```

O proxy externo remove o prefixo usado para selecionar a VM. O Nginx da VM encaminha a API ao
backend e recompõe o prefixo antes de encaminhar as demais rotas ao frontend, que foi compilado
conhecendo o mesmo base path.

## Configuração

O `.env` do frontend deve definir:

```dotenv
PUBLIC_API_URL=https://example.org/server03/api
API_INTERNAL_URL=http://127.0.0.1:3000
```

| Variável           | Consumidor                         | Finalidade                                               |
| ------------------ | ---------------------------------- | -------------------------------------------------------- |
| `PUBLIC_API_URL`   | navegador e servidor SvelteKit     | URL pública da API, incluindo o prefixo externo          |
| `API_INTERNAL_URL` | somente o servidor SvelteKit (SSR) | acesso direto ao backend sem retornar pelo proxy público |
| `BASE_PATH`        | build                              | subcaminho onde o frontend será publicado                |
| `ORIGIN`           | runtime                            | origem HTTPS pública usada pelo `adapter-node`           |
| `HOST` e `PORT`    | runtime                            | interface e porta locais do frontend                     |

`BASE_PATH` é uma configuração de build. Uma mudança nesse valor exige um novo build; não basta
reiniciar o processo. Passe-o explicitamente no comando para não alterar o desenvolvimento local.
O valor deve começar com `/` e não deve terminar com `/`.

## Build e execução

Instale as dependências e valide o projeto:

```bash
npm ci
npm run check
```

Gere o build para o subcaminho da implantação:

```bash
BASE_PATH=/server03 npm run build
```

Inicie o servidor Node apenas na interface local, deixando o acesso público a cargo do Nginx:

```bash
HOST=127.0.0.1 \
PORT=4174 \
ORIGIN=https://example.org \
BODY_SIZE_LIMIT=20M \
node --env-file-if-exists=.env build
```

Depois de um novo build, reinicie o processo Node. Um processo antigo pode continuar executando o
bundle de servidor que já estava carregado em memória.

O uso de `tmux` é suficiente para uma VM de laboratório, mas o processo não volta sozinho após uma
reinicialização. Em uma infraestrutura permanente, utilize um gerenciador de processos, como
`systemd`, com reinício automático e logs centralizados.

## Responsabilidades do proxy

O proxy deve:

- encaminhar as rotas da aplicação ao frontend;
- encaminhar `/api/*` ao backend, removendo apenas o prefixo `/api` esperado pela API;
- preservar `Host`, `X-Forwarded-For` e `X-Forwarded-Proto`;
- limitar o tamanho do corpo de forma compatível com `BODY_SIZE_LIMIT`;
- ajustar o `Path` do cookie de sessão para o subcaminho público quando necessário.

O SvelteKit usa `paths.relative: false`. Assim, links, assets e redirects são produzidos como URLs
root-relative que preservam o base path, por exemplo `/server03/login`, inclusive durante as
navegações internas que consultam `__data.json`.

## Checklist pós-deploy

1. Abra `/server03/` e confirme que os assets carregam sem erros 404.
2. Acesse diretamente uma rota protegida estando deslogado; ela deve levar a
   `/server03/login?returnTo=...`.
3. Faça login e confirme que `returnTo` retorna à rota solicitada.
4. Faça logout em uma rota protegida e use o botão Voltar do navegador. O redirecionamento deve
   continuar dentro de `/server03`.
5. Teste uma chamada de API e confirme que a sessão por cookie continua válida.
6. Verifique os logs do frontend, backend e Nginx para respostas 5xx.

Uma verificação rápida do redirect SSR pode ser feita com:

```bash
curl -sS -D - -o /dev/null https://example.org/server03/usuarios
```

O cabeçalho `Location` deve apontar para uma URL dentro de `/server03`. Um destino como `/login`
sem o base path indica build incorreto ou processo antigo ainda em execução.

## Atualização da aplicação

Na branch de deploy:

```bash
git pull --ff-only
npm ci
BASE_PATH=/server03 npm run build
```

Depois, reinicie o processo do frontend e execute o checklist acima. Não altere simultaneamente o
Nginx e o código da aplicação sem necessidade: validar uma camada por vez facilita identificar a
origem de falhas.
