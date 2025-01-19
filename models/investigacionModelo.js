const db = require('../config/bd');

/**
 * Modelo Investigacion
 * En este archivo se almacenan metodos para las diferentes consultas a la base de datos.
 */

const Investigacion = {
    async obtenerTodasLasInvestigaciones() {
        const [rows] = await db.query('SELECT * FROM investigacion');
        return rows;
    },

    async obteneInvestigacionPorId(ID_PIEZA) {
        const [row] = await db.query('SELECT * FROM investigacion WHERE ID_PIEZA = ?', [ID_PIEZA]);
        return row;
    },

    async crearInvestigacion(data) {
        const { ID_PIEZA, COLECCION, REPOSITORIO, FILO, SUBFILO, CLASE, ORDEN, FAMILIA, GENERO, NOMBRE, PERIODO_GEOLOGICO,
            ERA_GEOLOGICA, FORMACION_GEOLOGICA, SECCION_ESTRATIGRAFICA, COLECTOR, LOCALIDAD, OBSERVACIONES, FOTO } = data;

        const query = 'INSERT INTO investigacion (ID_PIEZA, COLECCION, REPOSITORIO, FILO, SUBFILO, CLASE, ORDEN, FAMILIA, GENERO, NOMBRE, PERIODO_GEOLOGICO, ERA_GEOLOGICA, FORMACION_GEOLOGICA, SECCION_ESTRATIGRAFICA, COLECTOR, LOCALIDAD, OBSERVACIONES, FOTO) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';

        const [result] = await db.query(query, [ID_PIEZA, COLECCION, REPOSITORIO, FILO, SUBFILO, CLASE, ORDEN, FAMILIA, GENERO, NOMBRE, PERIODO_GEOLOGICO,
            ERA_GEOLOGICA, FORMACION_GEOLOGICA, SECCION_ESTRATIGRAFICA, COLECTOR, LOCALIDAD, OBSERVACIONES, FOTO]
        );
        return result;
    },

    async actualizarInvestigacion(ID_PIEZAPARAM, data) {
        const { ID_PIEZA, COLECCION, REPOSITORIO, FILO, SUBFILO, CLASE, ORDEN, FAMILIA, GENERO, NOMBRE, PERIODO_GEOLOGICO,
            ERA_GEOLOGICA, FORMACION_GEOLOGICA, SECCION_ESTRATIGRAFICA, COLECTOR, LOCALIDAD, OBSERVACIONES, FOTO } = data;

        const query = 'UPDATE investigacion SET ID_PIEZA = ?, COLECCION = ?, REPOSITORIO = ?, FILO = ?, SUBFILO = ?, CLASE = ?, ORDEN = ?, FAMILIA = ?, GENERO = ?, NOMBRE = ?, PERIODO_GEOLOGICO = ?, ERA_GEOLOGICA = ?, FORMACION_GEOLOGICA = ?, SECCION_ESTRATIGRAFICA = ?, COLECTOR = ?, LOCALIDAD = ?, OBSERVACIONES = ?, FOTO = ? WHERE ID_PIEZA = ?';

        const [result] = await db.query(query, [ID_PIEZA, COLECCION, REPOSITORIO, FILO, SUBFILO, CLASE, ORDEN, FAMILIA, GENERO, NOMBRE, PERIODO_GEOLOGICO,
            ERA_GEOLOGICA, FORMACION_GEOLOGICA, SECCION_ESTRATIGRAFICA, COLECTOR, LOCALIDAD, OBSERVACIONES, FOTO, ID_PIEZAPARAM]
        );
        return result;
    },

    async eliminarInvestigacion(ID_PIEZA) {
        const [result] = await db.query('DELETE FROM investigacion WHERE ID_PIEZA = ?', [ID_PIEZA]);
        return result;
    },

    async obtenerFotoInvestigacion(ID_PIEZA) {
        const [result] = await db.query('SELECT FOTO FROM investigacion WHERE ID_PIEZA = ?', [ID_PIEZA]);
        return result;
    },

    async eliminarFotoInvestigacion(ID_PIEZA) {
        const [result] = await db.query('UPDATE investigacion SET FOTO = "" WHERE ID_PIEZA = ?', [ID_PIEZA]);
        return result;
    }
};

module.exports = Investigacion;