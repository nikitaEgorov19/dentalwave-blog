FROM node:18-alpine

# Install font dependencies
RUN apk add --no-cache \
    fontconfig \
    ttf-dejavu \
    && fc-cache -f -v

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
