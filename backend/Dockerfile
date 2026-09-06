# Legalyze Backend - An Open-Source Structure-Aware Agentic RAG Platform for High-Precision Legal Intelligence
# Backend API Server Dockerfile - Node.js + Express
FROM node:20-alpine

# Set working directory
WORKDIR /app/backend

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p temp uploads logs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start the server
CMD ["node", "server.js"]
