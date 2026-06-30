# Executando com Docker

## Subir o projeto completo

1. Copie o arquivo de exemplo de ambiente:

```bash
cp .env.example .env
```

2. Ajuste `ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD` e `JWT_SECRET` no `.env`.

3. Suba a stack:

```bash
docker compose up --build
```

O frontend fica em `http://localhost:5173` e a API em `http://localhost:8080`.

## Credenciais iniciais

Na primeira subida, o backend aplica as migrations e cria um admin com os dados do `.env`.
Os valores padrao sao:

- E-mail: `admin@empresa.com`
- Senha: `admin123`

## Parar a stack

```bash
docker compose down
```

Para remover tambem os dados do banco:

```bash
docker compose down -v
```
