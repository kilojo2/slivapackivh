FROM node:24-alpine
WORKDIR /app

COPY . .
RUN npm ci
RUN npm run prisma:generate -w @slivapack/api
RUN npm run build -w @slivapack/api

WORKDIR /app/apps/api
EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
