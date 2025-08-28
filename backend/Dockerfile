# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Kopírovanie package súborov
COPY package*.json ./
RUN npm ci --only=production

# Kopírovanie zdrojových súborov
COPY . .

# Vytvorenie uploads adresára
RUN mkdir -p uploads

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

CMD ["npm", "start"]
