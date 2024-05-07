# Stage 1: Build the application
FROM node:16 AS builder

# Set working directory
WORKDIR /usr/src/app

# Copy all project files
COPY . .

# Install dependencies and build the static files
RUN yarn install --frozen-lockfile && yarn build

# Stage 2: Serve the static files with Nginx
FROM nginx:alpine

# Remove the default Nginx website configuration
RUN rm -rf /usr/share/nginx/html/*

# Copy built files from the builder stage
COPY --from=builder /usr/src/app/build /usr/share/nginx/html

# Copy a custom Nginx configuration file (if needed)
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]