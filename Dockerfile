FROM node:18

# Establece el directorio de trabajo
WORKDIR /app

# Copia solo los archivos de dependencias
COPY package*.json ./

# Instala las dependencias (evita instalar dependencias de desarrollo en producción)
RUN npm install --only=production

# Copia el resto del código de la aplicación
COPY . .

# Expone el puerto en el que corre la aplicación
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "start"]
