const db = require('../config/bd');

/**
 * Modelo Mineral (PostgreSQL)
 */

const ALLOWED_SEARCH_COLUMNS = [
    'ID_MINERAL', 'N_BARRANTES', 'COLECCION', 'NOMBRE_MINERAL', 'CANTIDAD',
    'GRUPO_MINERALOGICO', 'REGION', 'SUBGRUPO', 'COMPOSICION',
    'CARACTERISTICAS', 'COLECTOR', 'OBSERVACIONES', 'UBICACION', 'FOTO'
];

const MineralModel = {
    async getAll() {
        const { rows } = await db.query('SELECT * FROM mineral');
        return rows;
    },

    async getPaginated(limit, offset, searchColumn, searchTerm) {
        let query = 'SELECT * FROM mineral';
        let countQuery = 'SELECT COUNT(*) AS total FROM mineral';
        const queryParams = [];
        const countParams = [];

        // Si el usuario escribió algo en el buscador (columna validada contra lista blanca)
        if (searchTerm && searchColumn && ALLOWED_SEARCH_COLUMNS.includes(searchColumn)) {
            query += ` WHERE "${searchColumn}"::TEXT LIKE $1`;
            countQuery += ` WHERE "${searchColumn}"::TEXT LIKE $1`;

            const searchValue = `%${searchTerm}%`;

            queryParams.push(searchValue);
            countParams.push(searchValue);
        }

        const lim = parseInt(limit, 10) || 10;
        const off = parseInt(offset, 10) || 0;

        query += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        queryParams.push(lim, off);

        const { rows } = await db.query(query, queryParams);
        const { rows: totalRows } = await db.query(countQuery, countParams);

        return {
            data: rows,
            total: parseInt(totalRows[0]?.total ?? '0', 10)
        };
    },

    async getById(ID_MINERAL) {
        const { rows } = await db.query('SELECT * FROM mineral WHERE "ID_MINERAL" = $1', [ID_MINERAL]);
        return rows;
    },

    async create(data) {
        const { ID_MINERAL, N_BARRANTES, COLECCION, NOMBRE_MINERAL, CANTIDAD, GRUPO_MINERALOGICO, REGION, SUBGRUPO, COMPOSICION,
            CARACTERISTICAS, COLECTOR, OBSERVACIONES, UBICACION, FOTO } = data;

        const query = 'INSERT INTO mineral ("ID_MINERAL", "N_BARRANTES", "COLECCION", "NOMBRE_MINERAL", "CANTIDAD", "GRUPO_MINERALOGICO", "REGION", "SUBGRUPO", "COMPOSICION", "CARACTERISTICAS", "COLECTOR", "OBSERVACIONES", "UBICACION", "FOTO") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)';

        const result = await db.query(query, [ID_MINERAL, N_BARRANTES, COLECCION, NOMBRE_MINERAL, CANTIDAD, GRUPO_MINERALOGICO, REGION, SUBGRUPO, COMPOSICION,
            CARACTERISTICAS, COLECTOR, OBSERVACIONES, UBICACION, FOTO]
        );
        return result;
    },

    async update(ID_MINERALPARAM, data) {
        const { ID_MINERAL, N_BARRANTES, COLECCION, NOMBRE_MINERAL, CANTIDAD, GRUPO_MINERALOGICO, REGION, SUBGRUPO, COMPOSICION,
            CARACTERISTICAS, COLECTOR, OBSERVACIONES, UBICACION, FOTO } = data;

        const query = 'UPDATE mineral SET "ID_MINERAL" = $1, "N_BARRANTES" = $2, "COLECCION" = $3, "NOMBRE_MINERAL" = $4, "CANTIDAD" = $5, "GRUPO_MINERALOGICO" = $6, "REGION" = $7, "SUBGRUPO" = $8, "COMPOSICION" = $9, "CARACTERISTICAS" = $10, "COLECTOR" = $11, "OBSERVACIONES" = $12, "UBICACION" = $13, "FOTO" = $14 WHERE "ID_MINERAL" = $15';

        const result = await db.query(query, [ID_MINERAL, N_BARRANTES, COLECCION, NOMBRE_MINERAL, CANTIDAD, GRUPO_MINERALOGICO, REGION, SUBGRUPO, COMPOSICION,
            CARACTERISTICAS, COLECTOR, OBSERVACIONES, UBICACION, FOTO, ID_MINERALPARAM]
        );
        return result;
    },

    async delete(ID_MINERAL) {
        const result = await db.query('DELETE FROM mineral WHERE "ID_MINERAL" = $1', [ID_MINERAL]);
        return result;
    },

    async deletePhoto(ID_MINERAL) {
        const result = await db.query('UPDATE mineral SET "FOTO" = \'\' WHERE "ID_MINERAL" = $1', [ID_MINERAL]);
        return result;
    },

    async getPhoto(ID_MINERAL) {
        const { rows } = await db.query('SELECT "FOTO" FROM mineral WHERE "ID_MINERAL" = $1', [ID_MINERAL]);
        return rows;
    }
};

module.exports = MineralModel;
