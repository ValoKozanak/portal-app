# Frontend Dockerfile
FROM node:18-alpine as build

WORKDIR /app

# Kopírovanie package súborov
COPY package*.json ./
RUN npm ci --only=production

# Kopírovanie zdrojových súborov
COPY . .

# Build aplikácie
RUN npm run build

# Produkčný stage
FROM nginx:alpine

# Kopírovanie build súborov
COPY --from=build /app/build /usr/share/nginx/html

# Kopírovanie nginx konfigurácie
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
