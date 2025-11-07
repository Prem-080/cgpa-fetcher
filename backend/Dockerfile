# Use Ubuntu 22.04 (Jammy) as the base image
FROM ubuntu:22.04

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install Node.js and npm
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Install required dependencies for Playwright
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libexpat1 \
    libxcb1 \
    libxkbcommon0 \
    libx11-6 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    libxss1 \
    libxtst6 \
    fonts-liberation \
    fonts-noto-color-emoji \
    xdg-utils \
    wget \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Install Playwright browsers and deps
RUN npx playwright install chromium --with-deps
RUN npm install --omit=dev

# Copy the rest of your application
COPY . .

# Set environment variables
ENV NODE_ENV=production

# Expose port (Railway automatically maps)
EXPOSE 5000

# Start your app
CMD ["npm", "start"]
