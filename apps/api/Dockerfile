FROM node:24-alpine
WORKDIR /app

COPY . .
RUN npm ci
RUN npm run build -w @slivapack/api

WORKDIR /app/apps/api
EXPOSE 3001
CMD ["sh", "-c", "npm run prisma:deploy && node dist/main.js"]
