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
COPY packages/server ./packages/server

# Install dependencies
RUN bun install

# Expose the port your app runs on
EXPOSE 3000

# Run migrations and then start the application
CMD ["bun", "run", "server"]
