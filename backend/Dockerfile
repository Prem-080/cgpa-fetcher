# Use the slim version of Node.js
FROM node:20-slim

# Set working directory
WORKDIR /app



# Install Playwright dependencies and browsers
RUN apt-get update && apt-get install -y wget ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --omit=dev
RUN npx playwright install --with-deps





# Copy the rest of your code
COPY . .


# Set environment variables
ENV NODE_ENV=production


# Playwright runs as root by default in Docker for simplicity

# Expose the port your server runs on
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
