const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const IMAGE_CACHE_DIR = path.join(__dirname, "cached_images");

const watermarkPath = path.join(__dirname, "../uploads/LogoMUIG.png");
let watermarkBufferCache = null;

const getWatermarkBuffer = async () => {
    if (watermarkBufferCache) return watermarkBufferCache;
    watermarkBufferCache = await sharp(watermarkPath)
        .resize({ width: 600, fit: "contain" })
        .toBuffer();
    return watermarkBufferCache;
};

const getPhotoWatermark = async (req, res) => {
    const { imageId } = req.params;

    let width = parseInt(req.query.width) || 800;
    if (width > 1920) width = 1920;

    try {
        const imageUrl = `https://drive.google.com/uc?export=view&id=${imageId}`;

        const response = await axios({
            url: imageUrl,
            method: "GET",
            responseType: "stream",
            headers: {
                "User-Agent": "Mozilla/5.0",
            },
        });

        let transform;

        if (width <= 300) {
            transform = sharp()
                .resize({
                    width: width,
                    withoutEnlargement: true
                })
                .jpeg({ quality: 80 });
        } else {
            const watermark = await getWatermarkBuffer();

            transform = sharp()
                .resize({
                    width: width,
                    withoutEnlargement: true
                })
                .composite([
                    {
                        input: watermark,
                        gravity: "center",
                        blend: "over",
                        opacity: 0.5,
                    },
                ])
                .jpeg({ quality: 80 });
        }

        res.set("Content-Type", "image/jpeg");

        response.data
            .pipe(transform)
            .pipe(res)
            .on('error', (err) => {
                console.error("Error en el procesamiento de imagen:", err.message);
                // Evitar crashear si el header ya se envió
                if (!res.headersSent) res.end();
            });
        4
    } catch (error) {
        console.error("Error al descargar la imagen con marca de agua", error.message);
        if (!res.headersSent) {
            res.status(500).json({ error: "No se pudo obtener la imagen." });
        }
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
