# ---- Stage 1: Build ----
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./
RUN npm install

# Copy source, config, and prisma schema
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

# Generate Prisma client and compile TypeScript
RUN npx prisma generate
RUN npm run build

# ---- Stage 2: Runtime ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy production deps
COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled output (includes generated prisma client) + prisma schema + source (for Swagger route scanning)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src

CMD ["node", "dist/server.js"]