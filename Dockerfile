# Use the official Node.js 20 image
FROM node:20

# Set working directory inside the container
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the bot source code
COPY . .

# Expose required ports (not needed for a Discord bot)
# EXPOSE 3000

# Start the bot
CMD ["npm", "run", "dev"]
