const db = require('../config/bd');

/**
 * Modelo Mineral
 * En este archivo se almacenan metodos para las diferentes consultas a la base de datos.
 */

const Mineral = {
    async obtenerTodosLosMinerales() {
        const [rows] = await db.query('SELECT * FROM mineral');
        return rows;
    },

    async obtenerMineralPorId(ID_MINERAL) {
        const [row] = await db.query('SELECT * FROM mineral WHERE ID_MINERAL = ?', [ID_MINERAL]);
        return row;
    },

    async crearMineral(data) {
        const { ID_MINERAL, N_BARRANTES, COLECCION, NOMBRE_MINERAL, CANTIDAD, GRUPO_MINERALOGICO, REGION, SUBGRUPO, COMPOSICION,
            CARACTERISTICAS, COLECTOR, OBSERVACIONES, UBICACION, FOTO } = data;

        const query = 'INSERT INTO mineral (ID_MINERAL, N_BARRANTES, COLECCION, NOMBRE_MINERAL, CANTIDAD, GRUPO_MINERALOGICO, REGION, SUBGRUPO, COMPOSICION, CARACTERISTICAS, COLECTOR, OBSERVACIONES, UBICACION, FOTO) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)';

        const [result] = await db.query(query, [ID_MINERAL, N_BARRANTES, COLECCION, NOMBRE_MINERAL, CANTIDAD, GRUPO_MINERALOGICO, REGION, SUBGRUPO, COMPOSICION,
            CARACTERISTICAS, COLECTOR, OBSERVACIONES, UBICACION, FOTO]
        );
        return result;
    },

    async actualizarMineral(ID_MINERALPARAM, data) {
        const { ID_MINERAL, N_BARRANTES, COLECCION, NOMBRE_MINERAL, CANTIDAD, GRUPO_MINERALOGICO, REGION, SUBGRUPO, COMPOSICION,
            CARACTERISTICAS, COLECTOR, OBSERVACIONES, UBICACION, FOTO } = data;

        const query = 'UPDATE mineral SET ID_MINERAL = ?, N_BARRANTES = ?, COLECCION = ?, NOMBRE_MINERAL = ?, CANTIDAD = ?, GRUPO_MINERALOGICO = ?, REGION = ?, SUBGRUPO = ?, COMPOSICION = ?, CARACTERISTICAS = ?, COLECTOR = ?, OBSERVACIONES = ?, UBICACION = ?, FOTO = ? WHERE ID_MINERAL = ?';

        const [result] = await db.query(query, [ID_MINERAL, N_BARRANTES, COLECCION, NOMBRE_MINERAL, CANTIDAD, GRUPO_MINERALOGICO, REGION, SUBGRUPO, COMPOSICION,
            CARACTERISTICAS, COLECTOR, OBSERVACIONES, UBICACION, FOTO, ID_MINERALPARAM]
        );
        return result;
    },

    async eliminarMineral(ID_MINERAL) {
        const [result] = await db.query('DELETE FROM mineral WHERE ID_MINERAL = ?', [ID_MINERAL]);
        return result;
    },

    async eliminarFotoMineral(ID_MINERAL) {
        const [result] = await db.query('UPDATE mineral SET FOTO = "" WHERE ID_MINERAL = ?', [ID_MINERAL]);
        return result;
    },

    async obtenerFotoMineral(ID_MINERAL) {
        const [result] = await db.query('SELECT FOTO FROM mineral WHERE ID_MINERAL = ?', [ID_MINERAL]);
        return result;
    }
};

module.exports = Mineral;