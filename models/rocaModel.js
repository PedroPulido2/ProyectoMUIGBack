const db = require('../config/bd');

/**
 * Modelo Roca
 * En este archivo se almacenan metodos para las diferentes consultas a la base de datos.
 */

const Roca = {
    async obtenerTodasLasRocas() {
        const [rows] = await db.query('SELECT * FROM roca');
        return rows;
    },

    async obtenerRocaPorId(ID_ROCA) {
        const [row] = await db.query('SELECT * FROM roca WHERE ID_ROCA = ?', [ID_ROCA]);
        return row;
    },

    async crearRoca(data) {
        const { ID_ROCA, N_BARRANTES, OTROS, BD_C_VARGAS, TIPO, COLECCION, NOMBRE_PIEZA, DEPARTAMENTO,
            MUNICIPIO, COLECTOR_DONADOR, CARACTERISTICAS, OBSERVACIONES, UBICACION, FOTO } = data;

        const query = 'INSERT INTO roca (ID_ROCA, N_BARRANTES, OTROS, BD_C_VARGAS, TIPO, COLECCION, NOMBRE_PIEZA, DEPARTAMENTO, MUNICIPIO, COLECTOR_DONADOR, CARACTERISTICAS, OBSERVACIONES, UBICACION, FOTO) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)';

        const [result] = await db.query(query, [ID_ROCA, N_BARRANTES, OTROS, BD_C_VARGAS, TIPO, COLECCION, NOMBRE_PIEZA, DEPARTAMENTO,
            MUNICIPIO, COLECTOR_DONADOR, CARACTERISTICAS, OBSERVACIONES, UBICACION, FOTO]);
        return result;
    },

    async actualizarRoca(ID_ROCAPARAM, data) {
        const { ID_ROCA, N_BARRANTES, OTROS, BD_C_VARGAS, TIPO, COLECCION, NOMBRE_PIEZA, DEPARTAMENTO,
            MUNICIPIO, COLECTOR_DONADOR, CARACTERISTICAS, OBSERVACIONES, UBICACION, FOTO } = data;

        const query = 'UPDATE roca SET ID_ROCA = ?, N_BARRANTES = ?, OTROS = ?, BD_C_VARGAS = ?, TIPO = ?, COLECCION = ?, NOMBRE_PIEZA = ?, DEPARTAMENTO = ?, MUNICIPIO = ?, COLECTOR_DONADOR = ?, CARACTERISTICAS = ?, OBSERVACIONES = ?, UBICACION = ?, FOTO = ? WHERE ID_ROCA = ?';

        const [result] = await db.query(query, [ID_ROCA, N_BARRANTES, OTROS, BD_C_VARGAS, TIPO, COLECCION, NOMBRE_PIEZA, DEPARTAMENTO,
            MUNICIPIO, COLECTOR_DONADOR, CARACTERISTICAS, OBSERVACIONES, UBICACION, FOTO, ID_ROCAPARAM]);
        return result;
    },

    async eliminarRoca(ID_ROCA) {
        const [result] = await db.query('DELETE FROM roca WHERE ID_ROCA = ?', [ID_ROCA]);
        return result;
    },

    async eliminarFotoRoca(ID_ROCA) {
        const [result] = await db.query('UPDATE roca SET FOTO = "" WHERE ID_ROCA = ?', [ID_ROCA]);
        return result;
    },

    async obtenerFotoRoca(ID_ROCA) {
        const [result] = await db.query('SELECT FOTO FROM roca WHERE ID_ROCA = ?', [ID_ROCA]);
        return result;
    }
};

module.exports = Roca;