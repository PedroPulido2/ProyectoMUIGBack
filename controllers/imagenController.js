const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const IMAGE_CACHE_DIR = path.join(__dirname, "cached_images");

// Crear directorio si no existe
if (!fs.existsSync(IMAGE_CACHE_DIR)) {
    fs.mkdirSync(IMAGE_CACHE_DIR, { recursive: true });
}

const obtenerImagen = async (req, res) => {
    const { imageId } = req.params;
    const imagePath = path.join(IMAGE_CACHE_DIR, `${imageId}.jpg`);

    // Si la imagen ya está en caché, la servimos directamente
    if (fs.existsSync(imagePath)) {
        return res.sendFile(imagePath);
    }

    try {
        const imageUrl = `https://drive.google.com/uc?export=view&id=${imageId}`; // URL original de Google Drive

        const response = await axios({
            url: imageUrl,
            method: "GET",
            responseType: "stream",
            headers: {
                "User-Agent": "Mozilla/5.0",
            },
        });

        // Guardamos la imagen en caché
        const writer = fs.createWriteStream(imagePath);
        response.data.pipe(writer);

        writer.on("finish", () => {
            res.sendFile(imagePath);
        });

        writer.on("error", (err) => {
            console.error("Error al guardar la imagen", err);
            res.status(500).json({ error: "No se pudo obtener la imagen." });
        });
    } catch (error) {
        console.error("Error al descargar la imagen", error.message);
        res.status(500).json({ error: "No se pudo obtener la imagen." });
    }
};

module.exports = {obtenerImagen}