FROM node:18

WORKDIR /app

# Copia solo los archivos necesarios para instalar las dependencias
COPY package*.json ./

# Establece NODE_ENV en producción y optimiza instalación de dependencias
ENV NODE_ENV=production
RUN npm install --only=production

# Instala las dependencias dentro del contenedor
RUN npm install

# Copia el resto de tu aplicación
COPY . .

# Exponer el puerto y ejecutar la aplicación
EXPOSE 3000
CMD ["npm", "start"]
