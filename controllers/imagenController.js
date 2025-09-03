const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const IMAGE_CACHE_DIR = path.join(__dirname, "cached_images");

// Crear directorio si no existe
if (!fs.existsSync(IMAGE_CACHE_DIR)) {
    fs.mkdirSync(IMAGE_CACHE_DIR, { recursive: true });
}

const obtenerImagenMarcaAgua = async (req, res) => {
    const { imageId } = req.params;
    const imagePath = path.join(IMAGE_CACHE_DIR, `${imageId}.jpg`);
    const finalImagePath = path.join(IMAGE_CACHE_DIR, `${imageId}_wm.jpg`);     // con watermark

    // Si ya existe con marca de agua, servirla directamente
    if (fs.existsSync(finalImagePath)) {
        return res.sendFile(finalImagePath);
    }
    try {
        // Si no está la imagen original, descargarla
        if (!fs.existsSync(imagePath)) {
            const imageUrl = `https://drive.google.com/uc?export=view&id=${imageId}`;

            const response = await axios({
                url: imageUrl,
                method: "GET",
                responseType: "arraybuffer", // 👈 para usar con Sharp
                headers: {
                    "User-Agent": "Mozilla/5.0",
                },
            });

            fs.writeFileSync(imagePath, response.data);
        }

        // Ruta de tu marca de agua (PNG con transparencia recomendado)
        const watermarkPath = path.join(__dirname, "../uploads/LogoMUIG.png");

         // Obtener metadata de la imagen original
        const base = sharp(imagePath);
        const metadata = await base.metadata();

        // Redimensionar watermark en función del ancho de la imagen original
        const watermarkBuffer = await sharp(watermarkPath)
            .resize({
                width: Math.round(metadata.width * 0.5), // 
                // height se ajusta automáticamente manteniendo proporción
                fit: "contain",
            })
            .toBuffer();

        // Usar sharp para poner la marca de agua sobre la imagen
        await sharp(imagePath)
            .composite([
                {
                    input: watermarkBuffer,
                    gravity: "center",
                    blend: "over",
                },
            ])
            .toFile(finalImagePath);

        // Enviar la imagen procesada
        res.sendFile(finalImagePath);

    } catch (error) {
        console.error("Error al descargar la imagen", error.message);
        res.status(500).json({ error: "No se pudo obtener la imagen." });
    }
};

const obtenerImagen = async (req, res) => {
    const { imageId } = req.params;
    const imagePath = path.join(IMAGE_CACHE_DIR, `${imageId}.jpg`);

    try {
        // Si ya existe la imagen en caché, servirla
        if (fs.existsSync(imagePath)) {
            return res.sendFile(imagePath);
        }

        // Descargar la imagen desde Google Drive
        const imageUrl = `https://drive.google.com/uc?export=view&id=${imageId}`;

        const response = await axios({
            url: imageUrl,
            method: "GET",
            responseType: "arraybuffer",
            headers: {
                "User-Agent": "Mozilla/5.0",
            },
        });

        fs.writeFileSync(imagePath, response.data);

        // Enviar la imagen original
        res.sendFile(imagePath);

    } catch (error) {
        console.error("Error al descargar la imagen", error.message);
        res.status(500).json({ error: "No se pudo obtener la imagen." });
    }
};

module.exports = { obtenerImagen, obtenerImagenMarcaAgua }
