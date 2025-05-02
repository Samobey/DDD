FROM node:18

WORKDIR /app

# Copy dependency and config files
COPY package*.json tsconfig.json ./

# Install dependencies
RUN npm install

# Copy your source files
COPY src ./src

# Build the app
RUN npm run build

# Expose app port
EXPOSE 3000

# Start the app
CMD ["node", "dist/server.js"]
