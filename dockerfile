# Stage 1: Build with dependencies
FROM node:22-slim AS build
WORKDIR /app

# Install dependencies without dev packages
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the rest of the code
COPY . .

# Stage 2: Production image
FROM node:22-slim
WORKDIR /app

# Copy from the build stage
COPY --from=build /app /app

# Create non-root user
RUN useradd -m appuser

# Set permissions for log directory
RUN mkdir -p /app/log && chown -R appuser:appuser /app/log

# Use the non-root user
USER appuser

# Set environment
ENV NODE_ENV=production

# Expose the app port
EXPOSE 3000

# Start the app
CMD ["node", "admin.js"]
