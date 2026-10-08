# Production Dockerfile for Google Cloud Run
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Install curl for container health checks
RUN apk add --no-cache curl

# Copy dependency manifests
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy application source code
COPY . .

# Set default environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Cloud Run defaults to container listening on port 8080
EXPOSE 8080

# Start backend application
CMD ["node", "server.js"]
