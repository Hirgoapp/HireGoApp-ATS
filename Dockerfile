# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Set ownership
RUN chown -R nestjs:nodejs /app

USER nestjs

# NODE_ENV is always production inside the container.
# PORT is intentionally left unset so Railway's injected PORT env var takes effect at runtime.
# If Railway does not inject PORT, the app falls back to 3001 (see main.ts).
ENV NODE_ENV=production

# Health check – uses the PORT injected at runtime, falling back to 3001.
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3001)+'/health',(r)=>{process.exit(r.statusCode===200?0:1)})"

# Railway dynamically assigns the port; EXPOSE is informational only.
EXPOSE 3001

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application.
# Set RUN_MIGRATIONS=true in Railway env vars to auto-run DB migrations on startup.
CMD ["node", "dist/main"]
