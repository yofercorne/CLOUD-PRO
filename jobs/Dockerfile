# Dockerfile para el microservicio de trabajos
FROM node:14

# Crear directorio de la aplicación
WORKDIR /usr/src/app

# Instalar las dependencias
COPY package*.json ./
RUN npm install

# Copiar el código fuente de la aplicación
COPY . .

# Exponer el puerto
EXPOSE 3003

# Comando para correr la aplicación
CMD ["node", "jobs.js"]
