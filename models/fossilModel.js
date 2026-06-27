const db = require('../config/bd');

/**
 * Modelo Fosil
 * En este archivo se almacenan metodos para las diferentes consultas a la base de datos.
 */
const FosilModel = {
    async findAll() {
        const [rows] = await db.query('SELECT * FROM fosil');
        return rows;
    },

    async getPaginated(limit, offset, searchColumn, searchTerm) {
        let query = 'SELECT * FROM fosil';
        let countQuery = 'SELECT COUNT(*) as count FROM fosil';
        const queryParams = [];
        const countParams = [];

        if (searchTerm && searchColumn) {
            query += ' WHERE ?? LIKE ?';
            countQuery += ' WHERE ?? LIKE ?';

            const searchValue = `%${searchTerm}%`; // El % hace que busque coincidencias parciales

            queryParams.push(searchColumn, searchValue);
            countParams.push(searchColumn, searchValue);
        }

        query += ' LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);

        const [rows] = await db.query(query, queryParams);
        const [totalRows] = await db.query(countQuery, countParams);

        return {
            data: rows,
            total: totalRows[0].count
        };
    },

    async findById(ID_FOSIL) {
        const [row] = await db.query('SELECT * FROM fosil WHERE ID_FOSIL = ?', [ID_FOSIL]);
        return row;
    },

    async create(data) {
        const { ID_FOSIL, N_BARRANTES, COLECCION, UBICACION, FILO, SUBFILO, CLASE, ORDEN,
            FAMILIA, GENERO, NOMBRE_FOSIL, PARTES, TIEMPO_GEOLOGICO, COLECTOR, LOCALIDAD,
            VITRINA, BANDEJA, OBSERVACIONES, FOTO } = data;

        const query = 'INSERT INTO fosil (ID_FOSIL, N_BARRANTES, COLECCION, UBICACION, FILO, SUBFILO, CLASE, ORDEN, FAMILIA, GENERO, NOMBRE_FOSIL, PARTES, TIEMPO_GEOLOGICO, COLECTOR, LOCALIDAD, VITRINA, BANDEJA, OBSERVACIONES, FOTO) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';

        const [result] = await db.query(query, [ID_FOSIL, N_BARRANTES, COLECCION, UBICACION, FILO, SUBFILO, CLASE, ORDEN,
            FAMILIA, GENERO, NOMBRE_FOSIL, PARTES, TIEMPO_GEOLOGICO, COLECTOR, LOCALIDAD, VITRINA, BANDEJA, OBSERVACIONES, FOTO]
        );
        return result;
    },

    async update(ID_FOSILPARAM, data) {
        const { ID_FOSIL, N_BARRANTES, COLECCION, UBICACION, FILO, SUBFILO, CLASE, ORDEN,
            FAMILIA, GENERO, NOMBRE_FOSIL, PARTES, TIEMPO_GEOLOGICO, COLECTOR, LOCALIDAD,
            VITRINA, BANDEJA, OBSERVACIONES, FOTO } = data;

        const query = 'UPDATE fosil SET ID_FOSIL = ?, N_BARRANTES = ?, COLECCION = ?, UBICACION = ?, FILO = ?, SUBFILO = ?, CLASE = ?, ORDEN = ?, FAMILIA = ?, GENERO = ?, NOMBRE_FOSIL = ?, PARTES = ?, TIEMPO_GEOLOGICO = ?, COLECTOR = ?, LOCALIDAD = ?, VITRINA = ?, BANDEJA = ?, OBSERVACIONES = ?, FOTO = ? WHERE ID_FOSIL = ?';

        const [result] = await db.query(query, [ID_FOSIL, N_BARRANTES, COLECCION, UBICACION, FILO, SUBFILO, CLASE, ORDEN,
            FAMILIA, GENERO, NOMBRE_FOSIL, PARTES, TIEMPO_GEOLOGICO, COLECTOR, LOCALIDAD, VITRINA, BANDEJA, OBSERVACIONES, FOTO, ID_FOSILPARAM]
        );
        return result;
    },

    async delete(ID_FOSIL) {
        const [result] = await db.query('DELETE FROM fosil WHERE ID_FOSIL = ?', [ID_FOSIL]);
        return result;
    },

    async getPhoto(ID_FOSIL) {
        const [result] = await db.query('SELECT FOTO FROM fosil WHERE ID_FOSIL = ?', [ID_FOSIL]);
        return result;
    },

    async deletePhoto(ID_FOSIL) {
        const [result] = await db.query('UPDATE fosil SET FOTO = "" WHERE ID_FOSIL = ?', [ID_FOSIL]);
        return result;
    }
};

module.exports = FosilModel;