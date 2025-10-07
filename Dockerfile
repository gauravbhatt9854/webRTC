# Use Node 22 base image
FROM node:22

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* yarn.lock* ./

# Install dependencies
RUN npm install

# Copy all source files
COPY . .

# Build the Vite app
RUN npm run build

# Expose port 4173 (Vite preview default)
EXPOSE 4173

# Start the app using Vite preview on all network interfaces
CMD ["npm", "run", "preview", "--", "--port", "4173", "--host"]
