FROM node:24-alpine
WORKDIR /app

# NEXT_PUBLIC_* встраиваются в бандл на этапе сборки
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_MEDIA_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_MEDIA_URL=$NEXT_PUBLIC_MEDIA_URL

COPY . .
RUN npm ci
RUN npm run build -w @slivapack/web

WORKDIR /app/apps/web
EXPOSE 3000
CMD ["npm", "start"]
