import { Router } from "express";
import { openApiDocument } from "../docs/openapi.js";

const swaggerRoutes = Router()

const swaggerHtml = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Ticket Management API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.onload = function () {
        window.ui = SwaggerUIBundle({
          url: "/api/docs.json",
          dom_id: "#swagger-ui",
          deepLinking: true,
          persistAuthorization: true
        })
      }
    </script>
  </body>
</html>
`

swaggerRoutes.get("/docs.json", (_req, res) => {
  res.json(openApiDocument)
})

swaggerRoutes.get("/docs", (_req, res) => {
  res.type("html").send(swaggerHtml)
})

export { swaggerRoutes };
