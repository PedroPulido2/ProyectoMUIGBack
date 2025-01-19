const db = require('../config/bd');

/**
 * Modelo Fosil
 * En este archivo se almacenan metodos para las diferentes consultas a la base de datos.
 */
const Fosil = {
    async obtenerTodosLosFosiles() {
        const [rows] = await db.query('SELECT * FROM fosil');
        return rows;
    },

    async obtenerFosilPorId(ID_FOSIL) {
        const [row] = await db.query('SELECT * FROM fosil WHERE ID_FOSIL = ?', ID_FOSIL);
        return row;
    },

    async crearFosil(data) {
        const { ID_FOSIL, N_BARRANTES, COLECCION, UBICACION, FILO, SUBFILO, CLASE, ORDEN,
            FAMILIA, GENERO, NOMBRE_FOSIL, PARTES, TIEMPO_GEOLOGICO, COLECTOR, LOCALIDAD,
            VITRINA, BANDEJA, OBSERVACIONES, FOTO } = data;

        const query = 'INSERT INTO fosil (ID_FOSIL, N_BARRANTES, COLECCION, UBICACION, FILO, SUBFILO, CLASE, ORDEN, FAMILIA, GENERO, NOMBRE_FOSIL, PARTES, TIEMPO_GEOLOGICO, COLECTOR, LOCALIDAD, VITRINA, BANDEJA, OBSERVACIONES, FOTO) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';

        const [result] = await db.query(query, [ID_FOSIL, N_BARRANTES, COLECCION, UBICACION, FILO, SUBFILO, CLASE, ORDEN,
            FAMILIA, GENERO, NOMBRE_FOSIL, PARTES, TIEMPO_GEOLOGICO, COLECTOR, LOCALIDAD, VITRINA, BANDEJA, OBSERVACIONES, FOTO]
        );
        return result;
    },

    async actualizarFosil(ID_FOSILPARAM, data) {
        const { ID_FOSIL, N_BARRANTES, COLECCION, UBICACION, FILO, SUBFILO, CLASE, ORDEN,
            FAMILIA, GENERO, NOMBRE_FOSIL, PARTES, TIEMPO_GEOLOGICO, COLECTOR, LOCALIDAD,
            VITRINA, BANDEJA, OBSERVACIONES, FOTO } = data;

        const query = 'UPDATE fosil SET ID_FOSIL = ?, N_BARRANTES = ?, COLECCION = ?, UBICACION = ?, FILO = ?, SUBFILO = ?, CLASE = ?, ORDEN = ?, FAMILIA = ?, GENERO = ?, NOMBRE_FOSIL = ?, PARTES = ?, TIEMPO_GEOLOGICO = ?, COLECTOR = ?, LOCALIDAD = ?, VITRINA = ?, BANDEJA = ?, OBSERVACIONES = ?, FOTO = ? WHERE ID_FOSIL = ?';

        const [result] = await db.query(query, [ID_FOSIL, N_BARRANTES, COLECCION, UBICACION, FILO, SUBFILO, CLASE, ORDEN,
            FAMILIA, GENERO, NOMBRE_FOSIL, PARTES, TIEMPO_GEOLOGICO, COLECTOR, LOCALIDAD, VITRINA, BANDEJA, OBSERVACIONES, FOTO, ID_FOSILPARAM]
        );
        return result;
    },

    async eliminarFosil(ID_FOSIL) {
        const [result] = await db.query('DELETE FROM fosil WHERE ID_FOSIL = ?', [ID_FOSIL]);
        return result;
    },

    async obtenerFotoFosil(ID_FOSIL) {
        const [result] = await db.query('SELECT FOTO FROM fosil WHERE ID_FOSIL = ?', [ID_FOSIL]);
        return result;
    },

    async eliminarFotoFosil(ID_FOSIL) {
        const [result] = await db.query('UPDATE fosil SET FOTO = "" WHERE ID_FOSIL = ?', [ID_FOSIL]);
        return result;
    }
};

module.exports = Fosil;