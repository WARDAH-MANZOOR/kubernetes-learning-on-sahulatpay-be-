# # ===============================
# # Stage 1: Build
# # ===============================
# FROM node:18 AS builder

# WORKDIR /app

# # Copy package.json first for caching
# COPY package*.json ./

# # Install dependencies
# RUN npm install

# # Copy all source code
# COPY . .

# # Prisma generate without --sql (no DB needed)
# RUN npx prisma generate --schema src/prisma/schema.prisma && npx tsc

# # ===============================
# # Stage 2: Production image
# # ===============================
# FROM node:18

# WORKDIR /app

# # Copy built code and package.json
# COPY --from=builder /app/dist ./dist
# COPY --from=builder /app/package*.json ./

# # Install only production dependencies
# RUN npm install --production

# EXPOSE 3000

# CMD ["node","dist/bin/www.js"]
FROM node:20

WORKDIR /app

# Copy package.json first (for caching npm install)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client (does NOT require DB)
RUN npx prisma generate --schema src/prisma/schema.prisma

# Compile TypeScript
RUN npx tsc

# Start the server
CMD ["node", "dist/bin/www.js"]