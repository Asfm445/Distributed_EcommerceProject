# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
# If you have static assets like Swagger definitions or templates, copy them here
# COPY --from=builder /app/src/infrastructure/web/swagger.json ./dist/infrastructure/web/

EXPOSE 8000

CMD ["node", "dist/src/main/server.js"]
