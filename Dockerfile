# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (including devDependencies for build)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Runtime Stage
FROM node:20-alpine

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built assets from builder
COPY --from=builder /app/dist ./dist

# Copy backend source
COPY server.js ./

# Copy database (Pre-populated)
COPY database ./database

ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]
