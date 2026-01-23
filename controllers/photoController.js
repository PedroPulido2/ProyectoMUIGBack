const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const IMAGE_CACHE_DIR = path.join(__dirname, "cached_images");

const getPhotoWatermark = async (req, res) => {
    const { imageId } = req.params;

    try {
        const imageUrl = `https://drive.google.com/uc?export=view&id=${imageId}`;

        const response = await axios({
            url: imageUrl,
            method: "GET",
            responseType: "arraybuffer",
            headers: {
                "User-Agent": "Mozilla/5.0",
            },
        });

        // Ruta de tu marca de agua (PNG con transparencia recomendado)
        const watermarkPath = path.join(__dirname, "../uploads/LogoMUIG.png");

        // Obtener metadata de la imagen original
        const base = sharp(response.data);
        const metadata = await base.metadata();

        // Redimensionar watermark en función del ancho de la imagen original
        const watermarkBuffer = await sharp(watermarkPath)
            .resize({
                width: Math.round(metadata.width * 0.5),
                fit: "contain",
            })
            .toBuffer();

        // Usar sharp para poner la marca de agua sobre la imagen
        const finalImageBuffer = await base
            .composite([
                {
                    input: watermarkBuffer,
                    gravity: "center",
                    blend: "over",
                    opacity: 0.5,
                },
            ])
            .toBuffer();

        res.set("Content-Type", "image/jpeg");
        res.send(finalImageBuffer);

    } catch (error) {
        console.error("Error al descargar la imagen", error.message);
        res.status(500).json({ error: "No se pudo obtener la imagen." });
    }
};

const getPhoto = async (req, res) => {
    const { imageId } = req.params;

    try {
        // Descargar la imagen desde Google Drive
        const imageUrl = `https://drive.google.com/uc?export=view&id=${imageId}`;

        const response = await axios({
            url: imageUrl,
            method: "GET",
            responseType: "stream",
            headers: {
                "User-Agent": "Mozilla/5.0",
            },
        });

        res.set("Content-Type", "image/jpeg");
        response.data.pipe(res);

    } catch (error) {
        console.error("Error al descargar la imagen", error.message);
        res.status(500).json({ error: "No se pudo obtener la imagen." });
    }
};

module.exports = { getPhoto, getPhotoWatermark };
