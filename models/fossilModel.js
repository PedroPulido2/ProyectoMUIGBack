const db = require('../config/bd');

/**
 * Modelo Fosil (PostgreSQL)
 */

const ALLOWED_SEARCH_COLUMNS = [
    'ID_FOSIL', 'N_BARRANTES', 'COLECCION', 'UBICACION', 'FILO', 'SUBFILO',
    'CLASE', 'ORDEN', 'FAMILIA', 'GENERO', 'NOMBRE_FOSIL', 'PARTES',
    'TIEMPO_GEOLOGICO', 'COLECTOR', 'LOCALIDAD', 'VITRINA', 'BANDEJA',
    'OBSERVACIONES', 'FOTO'
];

const FosilModel = {
    async findAll() {
        const { rows } = await db.query('SELECT * FROM fosil');
        return rows;
    },

    async getPaginated(limit, offset, searchColumn, searchTerm) {
        let query = 'SELECT * FROM fosil';
        let countQuery = 'SELECT COUNT(*) AS total FROM fosil';
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

    async findById(ID_FOSIL) {
        const { rows } = await db.query('SELECT * FROM fosil WHERE "ID_FOSIL" = $1', [ID_FOSIL]);
        return rows;
    },

    async create(data) {
        const { ID_FOSIL, N_BARRANTES, COLECCION, UBICACION, FILO, SUBFILO, CLASE, ORDEN,
            FAMILIA, GENERO, NOMBRE_FOSIL, PARTES, TIEMPO_GEOLOGICO, COLECTOR, LOCALIDAD,
            VITRINA, BANDEJA, OBSERVACIONES, FOTO } = data;

        const query = 'INSERT INTO fosil ("ID_FOSIL", "N_BARRANTES", "COLECCION", "UBICACION", "FILO", "SUBFILO", "CLASE", "ORDEN", "FAMILIA", "GENERO", "NOMBRE_FOSIL", "PARTES", "TIEMPO_GEOLOGICO", "COLECTOR", "LOCALIDAD", "VITRINA", "BANDEJA", "OBSERVACIONES", "FOTO") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)';

        const result = await db.query(query, [ID_FOSIL, N_BARRANTES, COLECCION, UBICACION, FILO, SUBFILO, CLASE, ORDEN,
            FAMILIA, GENERO, NOMBRE_FOSIL, PARTES, TIEMPO_GEOLOGICO, COLECTOR, LOCALIDAD, VITRINA, BANDEJA, OBSERVACIONES, FOTO]
        );
        return result;
    },

    async update(ID_FOSILPARAM, data) {
        const { ID_FOSIL, N_BARRANTES, COLECCION, UBICACION, FILO, SUBFILO, CLASE, ORDEN,
            FAMILIA, GENERO, NOMBRE_FOSIL, PARTES, TIEMPO_GEOLOGICO, COLECTOR, LOCALIDAD,
            VITRINA, BANDEJA, OBSERVACIONES, FOTO } = data;

        const query = 'UPDATE fosil SET "ID_FOSIL" = $1, "N_BARRANTES" = $2, "COLECCION" = $3, "UBICACION" = $4, "FILO" = $5, "SUBFILO" = $6, "CLASE" = $7, "ORDEN" = $8, "FAMILIA" = $9, "GENERO" = $10, "NOMBRE_FOSIL" = $11, "PARTES" = $12, "TIEMPO_GEOLOGICO" = $13, "COLECTOR" = $14, "LOCALIDAD" = $15, "VITRINA" = $16, "BANDEJA" = $17, "OBSERVACIONES" = $18, "FOTO" = $19 WHERE "ID_FOSIL" = $20';

        const result = await db.query(query, [ID_FOSIL, N_BARRANTES, COLECCION, UBICACION, FILO, SUBFILO, CLASE, ORDEN,
            FAMILIA, GENERO, NOMBRE_FOSIL, PARTES, TIEMPO_GEOLOGICO, COLECTOR, LOCALIDAD, VITRINA, BANDEJA, OBSERVACIONES, FOTO, ID_FOSILPARAM]
        );
        return result;
    },

    async delete(ID_FOSIL) {
        const result = await db.query('DELETE FROM fosil WHERE "ID_FOSIL" = $1', [ID_FOSIL]);
        return result;
    },

    async getPhoto(ID_FOSIL) {
        const { rows } = await db.query('SELECT "FOTO" FROM fosil WHERE "ID_FOSIL" = $1', [ID_FOSIL]);
        return rows;
    },

    async deletePhoto(ID_FOSIL) {
        const result = await db.query('UPDATE fosil SET "FOTO" = \'\' WHERE "ID_FOSIL" = $1', [ID_FOSIL]);
        return result;
    }
};

module.exports = FosilModel;
