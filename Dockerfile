FROM node:18

WORKDIR /app

# Copia el archivo .env al contenedor
# COPY .env .env

# Copia solo los archivos necesarios para instalar las dependencias
COPY package*.json ./

# Instala las dependencias dentro del contenedor
RUN npm install

# Copia el resto de tu aplicación
COPY . .

# Exponer el puerto y ejecutar la aplicación
EXPOSE 3000
CMD ["npm", "start"]
