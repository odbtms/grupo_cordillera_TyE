# Etapa de construcción
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar dependencias y resolverlas
COPY package*.json ./
RUN npm ci

# Copiar el resto del código y compilar
COPY . .
RUN npm run build

# Etapa de producción
FROM nginx:alpine

# Copiar los estáticos compilados desde la etapa anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración de nginx para que React funcione al recargar la página
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Exponer puerto 80
EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
