const db = require('../config/bd');

/**
 * Modelo Roca
 * En este archivo se almacenan metodos para las diferentes consultas a la base de datos.
 */

const RocaModel = {
    async findAll() {
        const [rows] = await db.query('SELECT * FROM roca');
        return rows;
    },

    async getPaginated(limit, offset, searchColumn, searchTerm) {
        let query = 'SELECT * FROM roca';
        let countQuery = 'SELECT COUNT(*) as count FROM roca';
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

    async findById(ID_ROCA) {
        const [row] = await db.query('SELECT * FROM roca WHERE ID_ROCA = ?', [ID_ROCA]);
        return row;
    },

    async create(data) {
        const { ID_ROCA, N_BARRANTES, OTROS, BD_C_VARGAS, TIPO, COLECCION, NOMBRE_PIEZA, DEPARTAMENTO,
            MUNICIPIO, COLECTOR_DONADOR, CARACTERISTICAS, OBSERVACIONES, UBICACION, FOTO } = data;

        const query = 'INSERT INTO roca (ID_ROCA, N_BARRANTES, OTROS, BD_C_VARGAS, TIPO, COLECCION, NOMBRE_PIEZA, DEPARTAMENTO, MUNICIPIO, COLECTOR_DONADOR, CARACTERISTICAS, OBSERVACIONES, UBICACION, FOTO) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)';

        const [result] = await db.query(query, [ID_ROCA, N_BARRANTES, OTROS, BD_C_VARGAS, TIPO, COLECCION, NOMBRE_PIEZA, DEPARTAMENTO,
            MUNICIPIO, COLECTOR_DONADOR, CARACTERISTICAS, OBSERVACIONES, UBICACION, FOTO]);
        return result;
    },

    async update(ID_ROCAPARAM, data) {
        const { ID_ROCA, N_BARRANTES, OTROS, BD_C_VARGAS, TIPO, COLECCION, NOMBRE_PIEZA, DEPARTAMENTO,
            MUNICIPIO, COLECTOR_DONADOR, CARACTERISTICAS, OBSERVACIONES, UBICACION, FOTO } = data;

        const query = 'UPDATE roca SET ID_ROCA = ?, N_BARRANTES = ?, OTROS = ?, BD_C_VARGAS = ?, TIPO = ?, COLECCION = ?, NOMBRE_PIEZA = ?, DEPARTAMENTO = ?, MUNICIPIO = ?, COLECTOR_DONADOR = ?, CARACTERISTICAS = ?, OBSERVACIONES = ?, UBICACION = ?, FOTO = ? WHERE ID_ROCA = ?';

        const [result] = await db.query(query, [ID_ROCA, N_BARRANTES, OTROS, BD_C_VARGAS, TIPO, COLECCION, NOMBRE_PIEZA, DEPARTAMENTO,
            MUNICIPIO, COLECTOR_DONADOR, CARACTERISTICAS, OBSERVACIONES, UBICACION, FOTO, ID_ROCAPARAM]);
        return result;
    },

    async delete(ID_ROCA) {
        const [result] = await db.query('DELETE FROM roca WHERE ID_ROCA = ?', [ID_ROCA]);
        return result;
    },

    async deletePhoto(ID_ROCA) {
        const [result] = await db.query('UPDATE roca SET FOTO = "" WHERE ID_ROCA = ?', [ID_ROCA]);
        return result;
    },

    async getPhoto(ID_ROCA) {
        const [result] = await db.query('SELECT FOTO FROM roca WHERE ID_ROCA = ?', [ID_ROCA]);
        return result;
    }
};

module.exports = RocaModel;