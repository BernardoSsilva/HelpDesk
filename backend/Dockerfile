FROM node:22-alpine

WORKDIR /app

# O processo roda sem privilégios de root.
RUN chown node:node /app
USER node

# tsx (para iniciar) e prisma (migrations) são devDependencies, então instalamos tudo.
# NODE_ENV=production só é definido depois, senão o npm ignoraria as devDependencies.
COPY --chown=node:node package*.json ./
RUN npm ci

COPY --chown=node:node . .

# O prisma generate só valida o formato da URL; a conexão real vem do ambiente em tempo de execução.
RUN DATABASE_URL="postgresql://usuario:senha@localhost:5432/banco" npm run prisma:generate

ENV NODE_ENV=production
EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=45s --retries=5 \
  CMD wget -qO- "http://127.0.0.1:${PORT:-8080}/health" || exit 1

# Forma "exec": o Node vira o PID 1 e recebe o SIGTERM do `docker stop`, encerrando de forma graciosa.
# (Com `CMD ["npm", "run", ...]` o npm morre ao receber o sinal e deixa o Node órfão, sem encerramento limpo.)
CMD ["sh", "-c", "npm run prisma:deploy && npm run seed && exec node --import tsx src/server.ts"]
