# Stage 1: Build
FROM node:22.15.0-slim AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first (to leverage Docker cache)
COPY package*.json ./

# Install only production dependencies (omit dev dependencies)
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Stage 2: Production image
FROM node:22.15.0-slim

# Set working directory in the final container
WORKDIR /app

# Copy only the necessary files from the build stage
COPY --from=builder /app /app

# Expose application port (adjust if different)
EXPOSE 3000

# Use non-root user for security (optional)
# RUN useradd -m appuser && chown -R appuser /app
# USER appuser

# Run the app
CMD ["node", "admin.js"]
