# Executando com Docker

## Subir o projeto completo

1. Copie o arquivo de exemplo de ambiente:

```bash
cp .env.example .env
```

2. Edite o `.env` e defina **`JWT_SECRET`** (obrigatório; sem ele o `docker compose` recusa subir) e a senha do administrador (`ADMIN_PASSWORD`). Para gerar um segredo forte:

```bash
openssl rand -hex 32
```

3. Suba a stack:

```bash
docker compose up --build
```

O frontend fica em `http://localhost:5173`, a API em `http://localhost:8080` e a documentação interativa da API em `http://localhost:8080/api/docs`.

O frontend só inicia depois que a API responde ao healthcheck (`GET /health`), que também confere a conexão com o banco.

## Credenciais iniciais

Na primeira subida, o backend aplica as migrations e cria um administrador com os dados do `.env`. Os valores padrão são:

- E-mail: `admin@empresa.com`
- Senha: `admin123`

Troque a senha do administrador (Configurações → Alterar senha) antes de usar fora de um ambiente de teste.

## Segurança

- O PostgreSQL só é publicado em `127.0.0.1` (a API o acessa pela rede interna do Docker).
- O processo da API roda como usuário sem privilégios, e o login tem limite de tentativas por IP.
- Se a API for exposta diretamente na internet (sem o nginx do frontend na frente), ajuste `TRUST_PROXY` conforme o seu proxy.

## Parar a stack

```bash
docker compose down
```

Para remover também os dados do banco:

```bash
docker compose down -v
```
