# Use Node.js 20 as required by @google/genai
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Copy data folder to dist
RUN node -e "const fs = require('fs'); if (fs.existsSync('data')) fs.cpSync('data', 'dist/data', {recursive: true});"

# Expose port 3000
EXPOSE 3000

# Start the application using the server
CMD ["node", "server.mjs"]