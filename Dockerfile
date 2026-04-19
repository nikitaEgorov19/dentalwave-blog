FROM node:18-alpine

# Install font dependencies
RUN apk add --no-cache \
    fontconfig \
    ttf-dejavu \
    ttf-liberation \
    && fc-cache -f -v

WORKDIR /app

# Copy package files and install dependencies as node user
COPY --chown=node:node package*.json ./
RUN npm install --production

# Copy source code with node ownership
COPY --chown=node:node . .

# Ensure data directory has correct permissions
RUN chmod -R 755 /app/data

EXPOSE 3000

# Run as non-root user
USER node

CMD ["node", "server.js"]

# Bump version to force rebuild
