import { Router } from "express";
import { openApiDocument } from "../docs/openapi.js";

const swaggerRoutes = Router()

const swaggerUiVersion = "5.17.14"

const swaggerHtml = `
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Help Desk - Documentação da API</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@${swaggerUiVersion}/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@${swaggerUiVersion}/swagger-ui-bundle.js"></script>
    <script>
      window.onload = function () {
        window.ui = SwaggerUIBundle({
          // Relativo à página, para funcionar também atrás de um prefixo de proxy.
          url: "docs.json",
          dom_id: "#swagger-ui",
          deepLinking: true,
          persistAuthorization: true
        })
      }
    </script>
  </body>
</html>
`

// A página carrega o Swagger UI do unpkg e usa um script inline; o CSP global
// (helmet) bloquearia isso, então esta rota define um CSP próprio e restrito.
const swaggerCsp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://unpkg.com",
  "style-src 'self' 'unsafe-inline' https://unpkg.com",
  "img-src 'self' data: https:",
  "connect-src 'self'",
].join("; ")

swaggerRoutes.get("/docs.json", (_req, res) => {
  res.json(openApiDocument)
})

swaggerRoutes.get("/docs", (_req, res) => {
  res.setHeader("Content-Security-Policy", swaggerCsp)
  res.type("html").send(swaggerHtml)
})

export { swaggerRoutes };
