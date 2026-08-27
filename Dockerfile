# Ultra-lightweight Node.js Alpine base image (<50MB)
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy application files
COPY . .

# Expose port (default 3001, dynamically overridable by hosting platforms via PORT env var)
EXPOSE 3001
ENV PORT=3001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:${PORT}/healthz || exit 1

# Start server
CMD ["node", "server.js"]
