# Dockerfile para el microservicio de usuarios
FROM node:14

# Crear directorio de la aplicación
WORKDIR /usr/src/app

# Instalar las dependencias
COPY package*.json ./
RUN npm install

# Copiar el código fuente de la aplicación
COPY . .

# Exponer el puerto
EXPOSE 3001

# Comando para correr la aplicación
CMD ["node", "usuarios.js"]
