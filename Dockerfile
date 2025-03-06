FROM node:20-alpine as base

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the application
FROM base as build
RUN npm run build

# Production stage
FROM node:20-alpine as production

WORKDIR /app

# Copy package files for production
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built application from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/.env ./.env

# Expose the port the app runs on
EXPOSE 5000

# Command to run the app
CMD ["node", "dist/index.js"]

# Development stage
FROM base as development

# Command to run the app in development mode
CMD ["npm", "run", "dev"] 