const db = require('../config/bd');

/**
 * Modelo Mineral
 * En este archivo se almacenan metodos para las diferentes consultas a la base de datos.
 */

const MineralModel = {
    async getAll() {
        const [rows] = await db.query('SELECT * FROM mineral');
        return rows;
    },

    async getPaginated(limit, offset, searchColumn, searchTerm) {
        let query = 'SELECT * FROM mineral';
        let countQuery = 'SELECT COUNT(*) as count FROM mineral';
        const queryParams = [];
        const countParams = [];

        // Si el usuario escribió algo en el buscador
        if (searchTerm && searchColumn) {
            // Usamos ?? para inyectar de forma segura el nombre de la columna
            // y ? para el valor a buscar (previene Inyección SQL)
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

    async getById(ID_MINERAL) {
        const [row] = await db.query('SELECT * FROM mineral WHERE ID_MINERAL = ?', [ID_MINERAL]);
        return row;
    },

    async create(data) {
        const { ID_MINERAL, N_BARRANTES, COLECCION, NOMBRE_MINERAL, CANTIDAD, GRUPO_MINERALOGICO, REGION, SUBGRUPO, COMPOSICION,
            CARACTERISTICAS, COLECTOR, OBSERVACIONES, UBICACION, FOTO } = data;

        const query = 'INSERT INTO mineral (ID_MINERAL, N_BARRANTES, COLECCION, NOMBRE_MINERAL, CANTIDAD, GRUPO_MINERALOGICO, REGION, SUBGRUPO, COMPOSICION, CARACTERISTICAS, COLECTOR, OBSERVACIONES, UBICACION, FOTO) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)';

        const [result] = await db.query(query, [ID_MINERAL, N_BARRANTES, COLECCION, NOMBRE_MINERAL, CANTIDAD, GRUPO_MINERALOGICO, REGION, SUBGRUPO, COMPOSICION,
            CARACTERISTICAS, COLECTOR, OBSERVACIONES, UBICACION, FOTO]
        );
        return result;
    },

    async update(ID_MINERALPARAM, data) {
        const { ID_MINERAL, N_BARRANTES, COLECCION, NOMBRE_MINERAL, CANTIDAD, GRUPO_MINERALOGICO, REGION, SUBGRUPO, COMPOSICION,
            CARACTERISTICAS, COLECTOR, OBSERVACIONES, UBICACION, FOTO } = data;

        const query = 'UPDATE mineral SET ID_MINERAL = ?, N_BARRANTES = ?, COLECCION = ?, NOMBRE_MINERAL = ?, CANTIDAD = ?, GRUPO_MINERALOGICO = ?, REGION = ?, SUBGRUPO = ?, COMPOSICION = ?, CARACTERISTICAS = ?, COLECTOR = ?, OBSERVACIONES = ?, UBICACION = ?, FOTO = ? WHERE ID_MINERAL = ?';

        const [result] = await db.query(query, [ID_MINERAL, N_BARRANTES, COLECCION, NOMBRE_MINERAL, CANTIDAD, GRUPO_MINERALOGICO, REGION, SUBGRUPO, COMPOSICION,
            CARACTERISTICAS, COLECTOR, OBSERVACIONES, UBICACION, FOTO, ID_MINERALPARAM]
        );
        return result;
    },

    async delete(ID_MINERAL) {
        const [result] = await db.query('DELETE FROM mineral WHERE ID_MINERAL = ?', [ID_MINERAL]);
        return result;
    },

    async deletePhoto(ID_MINERAL) {
        const [result] = await db.query('UPDATE mineral SET FOTO = "" WHERE ID_MINERAL = ?', [ID_MINERAL]);
        return result;
    },

    async getPhoto(ID_MINERAL) {
        const [result] = await db.query('SELECT FOTO FROM mineral WHERE ID_MINERAL = ?', [ID_MINERAL]);
        return result;
    }
};

module.exports = MineralModel;