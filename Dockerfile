FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p backups logs data

EXPOSE 3000

CMD ["node", "main.js"]
