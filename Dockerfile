# Use the official Node.js 20 image
FROM node:20

# Set working directory inside the container
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the bot source code
COPY . .

# Set a volume to persist the database
VOLUME /app/data

# Start the bot
CMD ["npm", "run", "dev"]
