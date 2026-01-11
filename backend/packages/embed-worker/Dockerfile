# Use the official Bun image as base
FROM oven/bun:latest

# Set working directory
WORKDIR /app

# Copy root package.json and workspace configs
COPY package.json ./
COPY bun.lock ./
COPY tsconfig.json ./

# Copy packages
COPY packages/shared-db ./packages/shared-db
COPY packages/embed-worker ./packages/embed-worker

# Install dependencies
RUN bun install

# Run migrations and then start the application
CMD ["bun", "run", "embeder"]
