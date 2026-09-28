FROM node:20-alpine AS base

# Instalar dependencias necesarias para compilar better-sqlite3 si es necesario
RUN apk add --no-cache python3 make g++ gcc sqlite-dev

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY server.js ./

# Crear directorio de datos persistentes
RUN mkdir -p /app/data && chown -R node:node /app

USER node
EXPOSE 4000
ENV NODE_ENV=production
ENV PORT=4000
ENV DATA_DIR=/app/data

CMD ["node", "server.js"]
