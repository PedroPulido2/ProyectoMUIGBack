# 1. Usamos una imagen Alpine (ultra ligera y segura)
FROM node:18-alpine

# Establece el directorio de trabajo
WORKDIR /app

# Copia solo los archivos de dependencias
COPY package*.json ./

# Instala las dependencias de producción de forma limpia y exacta
RUN npm ci --only=production

# Copia el resto del código de la aplicación
COPY . .

# Cambia los permisos del directorio para el usuario 'node' incorporado en la imagen
RUN chown -R node:node /app

# Asegura que el contenedor corra con un usuario sin privilegios
USER node

# Expone el puerto en el que corre tu API
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "start"]