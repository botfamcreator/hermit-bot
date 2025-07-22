# Base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy all files
COPY . .

# Install dependencies
RUN npm install

# Expose port (optional, if bot listens)
EXPOSE 3000

# Start the bot
CMD ["npm", "start"]
