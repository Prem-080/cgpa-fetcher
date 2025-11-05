# Use the official Node.js image (Debian-based, not alpine/slim)
FROM mcr.microsoft.com/playwright:v1.43.1-jammy

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy the rest of your application
COPY . .

# Set environment variables
ENV NODE_ENV=production

# Expose port (Railway automatically maps)
EXPOSE 5000

# Start your app
CMD ["npm", "start"]
