# Help Desk

Sistema de tickets de suporte: abertura, acompanhamento, atribuição de responsáveis, comentários, histórico de alterações e um dashboard com indicadores.

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4 e Material UI.
- **Backend:** Node.js 22, Express 5, TypeScript, Prisma 7 e PostgreSQL 16.
- **Autenticação:** JWT (HS256) com senhas em bcrypt.

## Funcionalidades

- Tickets com título, descrição, prioridade, status, departamento e responsável.
- Histórico automático de cada mudança (status, prioridade, departamento, responsável, título, descrição) e comentários.
- Dashboard com totais, variação contra o período anterior, série diária e filtros.
- Gestão de usuários para administradores; cada pessoa troca a própria senha em **Configurações**.
- Documentação interativa da API em `/api/docs` (Swagger UI).

## Perfis e permissões

| Ação                                        | Administrador | Solicitante | Responsável | Outros usuários |
| ------------------------------------------- | :-----------: | :---------: | :---------: | :-------------: |
| Ver tickets, histórico e dashboard          |       ✅       |      ✅      |      ✅      |        ✅        |
| Comentar                                    |       ✅       |      ✅      |      ✅      |        ✅        |
| Editar ticket (status, responsável, etc.)   |       ✅       |      ✅      |      ✅      |        ❌        |
| Excluir ticket (apaga o histórico)          |       ✅       |      ✅      |      ❌      |        ❌        |
| Abrir ticket em nome de outra pessoa        |       ✅       |      ❌      |      ❌      |        ❌        |
| Criar, editar e excluir usuários            |       ✅       |      ❌      |      ❌      |        ❌        |

Todo usuário autenticado vê todos os tickets (a fila é compartilhada). As regras ficam em `backend/src/domain/policies/ticket.policy.ts`; o frontend as replica só para esconder ações indisponíveis.

## Como rodar

### Com Docker (mais simples)

Veja [DOCKER.md](DOCKER.md). Resumo:

```bash
cp .env.example .env      # defina JWT_SECRET (openssl rand -hex 32) e ADMIN_PASSWORD
docker compose up --build
```

Frontend em <http://localhost:5173>, API em <http://localhost:8080>, docs em <http://localhost:8080/api/docs>.

### Em desenvolvimento

Pré-requisitos: Node.js 22+ e um PostgreSQL (há um `backend/docker-compose.yml` só com o banco).

```bash
# 1. Banco
docker compose -f backend/docker-compose.yml up -d

# 2. API
cd backend
cp .env.example .env            # ajuste JWT_SECRET
npm install
npm run prisma:generate
npm run prisma:deploy           # aplica as migrations
npm run seed                    # cria o administrador do .env
npm run dev                     # http://localhost:8080

# 3. Frontend (em outro terminal)
cd frontend
npm install
npm run dev                     # http://localhost:5173 (o Vite encaminha /api-backend para a API)
```

## Variáveis de ambiente (backend)

| Variável                | Obrigatória | Descrição                                                                                  |
| ----------------------- | :---------: | ------------------------------------------------------------------------------------------ |
| `DATABASE_URL`          |     sim     | Conexão PostgreSQL.                                                                        |
| `JWT_SECRET`            |     sim     | Segredo dos tokens. Use um valor longo e aleatório; a API avisa se parecer fraco.          |
| `PORT`                  |     não     | Porta da API (padrão `3000`; os exemplos usam `8080`).                                     |
| `FRONTEND_URL`          |     não     | Origens liberadas no CORS, separadas por vírgula. Vazio libera todas.                      |
| `TRUST_PROXY`           |     não     | Número de proxies à frente da API (ex.: `1` atrás do nginx), para o limite de login usar o IP real. |
| `LOGIN_RATE_LIMIT_MAX` / `LOGIN_RATE_LIMIT_WINDOW_MINUTES` | não | Tentativas de login malsucedidas por IP em cada janela (padrão: 10 a cada 15 min).  |
| `ADMIN_EMAIL/NAME/PASSWORD` |  não    | Administrador criado por `npm run seed`.                                                   |
| `TEST_DATABASE_URL`     |  testes     | Banco **descartável** dos testes de integração (nome com `test`; as tabelas são apagadas). |

## Testes

```bash
# Backend: testes unitários (não precisam de banco)
cd backend && npm run test:unit

# Backend: testes de integração, contra um PostgreSQL descartável
createdb helpdesk_test   # ou crie o banco como preferir
TEST_DATABASE_URL="postgresql://ticket_user:ticket_password@localhost:5432/helpdesk_test?schema=public" \
  npm run test:integration

# Frontend
cd frontend && npm test
```

`npm run typecheck` (backend e frontend) valida os tipos. O GitHub Actions (`.github/workflows/ci.yml`) roda tudo a cada push e pull request.

## Estrutura

```
backend/
  prisma/               schema e migrations
  src/
    domain/             entidades, enums, erros e políticas de autorização (sem dependências de framework)
    infrastructure/     repositórios (Prisma) e casos de uso
    http/               rotas, validação (zod), middlewares, erros e documentação OpenAPI
    config/             leitura e validação do ambiente
    app.ts / server.ts  montagem do Express / inicialização com encerramento gracioso
  tests/                unit/ e integration/
frontend/
  src/
    pages/              uma página por rota (carregadas sob demanda)
    components/         layout e peças reutilizáveis
    api/                cliente HTTP (axios)
    state/              contextos de autenticação e preferências
    utils/ hooks/       funções puras e hooks
```

## Decisões e limitações conhecidas

- **Datas em UTC:** o dashboard agrupa e filtra por dia em UTC, independente do fuso do servidor. Perto da meia-noite de fusos como o de Brasília, um ticket pode cair no dia seguinte do gráfico.
- **Sem paginação no servidor:** a listagem de tickets e usuários devolve tudo e o frontend pagina/filtra. Isso atende volumes moderados; se a base crescer muito, o próximo passo é paginar e filtrar na API.
- **Sem envio de e-mails:** a preferência de notificações por e-mail em Configurações está desativada por esse motivo, e **Relatórios** ainda é um espaço reservado.
- **Exclusão de usuários:** quem já abriu tickets ou deixou registros no histórico não pode ser excluído (para não perder o rastro); a API responde 409 com uma mensagem clara.
- **Sessão:** o token dura 24 horas e é validado no banco a cada requisição, então contas removidas e mudanças de perfil valem imediatamente.
