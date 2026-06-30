FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV DATABASE_URL="postgresql://ticket_user:ticket_password@postgres:5432/ticket_management?schema=public"

RUN npm run prisma:generate

EXPOSE 8080

CMD ["npm", "run", "docker:start"]
