# Multi-stage build for production
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build Next.js application (static export)
RUN npm run build

# Production stage - Using nginx to serve static files
FROM nginx:alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy custom nginx configuration
COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files from Next.js export
COPY --from=builder /app/out /usr/share/nginx/html

# Create non-root user for nginx
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 \
    && chown -R nodejs:nodejs /usr/share/nginx/html \
    && chown -R nodejs:nodejs /var/cache/nginx \
    && chown -R nodejs:nodejs /var/log/nginx \
    && chown -R nodejs:nodejs /etc/nginx/conf.d \
    && touch /var/run/nginx.pid \
    && chown -R nodejs:nodejs /var/run/nginx.pid

# Switch to non-root user
USER nodejs

# Expose port 3003
EXPOSE 3003

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3003/ || exit 1

# Use dumb-init
ENTRYPOINT ["dumb-init", "--"]

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
