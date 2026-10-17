const db = require('../config/bd');

/**
 * Modelo Roca (PostgreSQL)
 */

const ALLOWED_SEARCH_COLUMNS = [
    'ID_ROCA', 'N_BARRANTES', 'OTROS', 'BD_C_VARGAS', 'TIPO', 'COLECCION',
    'NOMBRE_PIEZA', 'DEPARTAMENTO', 'MUNICIPIO', 'COLECTOR_DONADOR',
    'CARACTERISTICAS', 'OBSERVACIONES', 'UBICACION', 'FOTO'
];

const RocaModel = {
    async findAll() {
        const { rows } = await db.query('SELECT * FROM roca');
        return rows;
    },

    async getPaginated(limit, offset, searchColumn, searchTerm) {
        let query = 'SELECT * FROM roca';
        let countQuery = 'SELECT COUNT(*) AS total FROM roca';
        const queryParams = [];
        const countParams = [];

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

    async findById(ID_ROCA) {
        const { rows } = await db.query('SELECT * FROM roca WHERE "ID_ROCA" = $1', [ID_ROCA]);
        return rows;
    },

    async create(data) {
        const { ID_ROCA, N_BARRANTES, OTROS, BD_C_VARGAS, TIPO, COLECCION, NOMBRE_PIEZA, DEPARTAMENTO,
            MUNICIPIO, COLECTOR_DONADOR, CARACTERISTICAS, OBSERVACIONES, UBICACION, FOTO } = data;

        const query = 'INSERT INTO roca ("ID_ROCA", "N_BARRANTES", "OTROS", "BD_C_VARGAS", "TIPO", "COLECCION", "NOMBRE_PIEZA", "DEPARTAMENTO", "MUNICIPIO", "COLECTOR_DONADOR", "CARACTERISTICAS", "OBSERVACIONES", "UBICACION", "FOTO") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)';

        const result = await db.query(query, [ID_ROCA, N_BARRANTES, OTROS, BD_C_VARGAS, TIPO, COLECCION, NOMBRE_PIEZA, DEPARTAMENTO,
            MUNICIPIO, COLECTOR_DONADOR, CARACTERISTICAS, OBSERVACIONES, UBICACION, FOTO]);
        return result;
    },

    async update(ID_ROCAPARAM, data) {
        const { ID_ROCA, N_BARRANTES, OTROS, BD_C_VARGAS, TIPO, COLECCION, NOMBRE_PIEZA, DEPARTAMENTO,
            MUNICIPIO, COLECTOR_DONADOR, CARACTERISTICAS, OBSERVACIONES, UBICACION, FOTO } = data;

        const query = 'UPDATE roca SET "ID_ROCA" = $1, "N_BARRANTES" = $2, "OTROS" = $3, "BD_C_VARGAS" = $4, "TIPO" = $5, "COLECCION" = $6, "NOMBRE_PIEZA" = $7, "DEPARTAMENTO" = $8, "MUNICIPIO" = $9, "COLECTOR_DONADOR" = $10, "CARACTERISTICAS" = $11, "OBSERVACIONES" = $12, "UBICACION" = $13, "FOTO" = $14 WHERE "ID_ROCA" = $15';

        const result = await db.query(query, [ID_ROCA, N_BARRANTES, OTROS, BD_C_VARGAS, TIPO, COLECCION, NOMBRE_PIEZA, DEPARTAMENTO,
            MUNICIPIO, COLECTOR_DONADOR, CARACTERISTICAS, OBSERVACIONES, UBICACION, FOTO, ID_ROCAPARAM]);
        return result;
    },

    async delete(ID_ROCA) {
        const result = await db.query('DELETE FROM roca WHERE "ID_ROCA" = $1', [ID_ROCA]);
        return result;
    },

    async deletePhoto(ID_ROCA) {
        const result = await db.query('UPDATE roca SET "FOTO" = \'\' WHERE "ID_ROCA" = $1', [ID_ROCA]);
        return result;
    },

    async getPhoto(ID_ROCA) {
        const { rows } = await db.query('SELECT "FOTO" FROM roca WHERE "ID_ROCA" = $1', [ID_ROCA]);
        return rows;
    }
};

module.exports = RocaModel;
