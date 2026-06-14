# Multi-stage, non-root. Runs the HTTP entry; for a stdio-only server, drop EXPOSE and change CMD.
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src ./src
RUN npm run build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
USER node
EXPOSE 8080
# Secrets are injected at runtime by the orchestrator — never baked into the image.
CMD ["node", "--enable-source-maps", "dist/http.js"]
