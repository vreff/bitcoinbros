# Use official Node.js LTS image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy bot code
COPY bot.js ./

# Start the bot
CMD ["node", "bot.js"]
