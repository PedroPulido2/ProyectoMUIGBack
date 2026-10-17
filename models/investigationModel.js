const db = require('../config/bd');

/**
 * Modelo Investigacion (PostgreSQL)
 */

const ALLOWED_SEARCH_COLUMNS = [
    'ID_PIEZA', 'COLECCION', 'REPOSITORIO', 'FILO', 'SUBFILO', 'CLASE', 'ORDEN',
    'FAMILIA', 'GENERO', 'NOMBRE', 'PERIODO_GEOLOGICO', 'ERA_GEOLOGICA',
    'FORMACION_GEOLOGICA', 'SECCION_ESTRATIGRAFICA', 'COLECTOR', 'LOCALIDAD',
    'OBSERVACIONES', 'FOTO'
];

const InvestigationModel = {
    async getAll() {
        const { rows } = await db.query('SELECT * FROM investigacion');
        return rows;
    },

    async getPaginated(limit, offset, searchColumn, searchTerm) {
        let query = 'SELECT * FROM investigacion';
        let countQuery = 'SELECT COUNT(*) AS total FROM investigacion';
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

    async findById(ID_PIEZA) {
        const { rows } = await db.query('SELECT * FROM investigacion WHERE "ID_PIEZA" = $1', [ID_PIEZA]);
        return rows;
    },

    async create(data) {
        const { ID_PIEZA, COLECCION, REPOSITORIO, FILO, SUBFILO, CLASE, ORDEN, FAMILIA, GENERO, NOMBRE, PERIODO_GEOLOGICO,
            ERA_GEOLOGICA, FORMACION_GEOLOGICA, SECCION_ESTRATIGRAFICA, COLECTOR, LOCALIDAD, OBSERVACIONES, FOTO } = data;

        const query = 'INSERT INTO investigacion ("ID_PIEZA", "COLECCION", "REPOSITORIO", "FILO", "SUBFILO", "CLASE", "ORDEN", "FAMILIA", "GENERO", "NOMBRE", "PERIODO_GEOLOGICO", "ERA_GEOLOGICA", "FORMACION_GEOLOGICA", "SECCION_ESTRATIGRAFICA", "COLECTOR", "LOCALIDAD", "OBSERVACIONES", "FOTO") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)';

        const result = await db.query(query, [ID_PIEZA, COLECCION, REPOSITORIO, FILO, SUBFILO, CLASE, ORDEN, FAMILIA, GENERO, NOMBRE, PERIODO_GEOLOGICO,
            ERA_GEOLOGICA, FORMACION_GEOLOGICA, SECCION_ESTRATIGRAFICA, COLECTOR, LOCALIDAD, OBSERVACIONES, FOTO]
        );
        return result;
    },

    async update(ID_PIEZAPARAM, data) {
        const { ID_PIEZA, COLECCION, REPOSITORIO, FILO, SUBFILO, CLASE, ORDEN, FAMILIA, GENERO, NOMBRE, PERIODO_GEOLOGICO,
            ERA_GEOLOGICA, FORMACION_GEOLOGICA, SECCION_ESTRATIGRAFICA, COLECTOR, LOCALIDAD, OBSERVACIONES, FOTO } = data;

        const query = 'UPDATE investigacion SET "ID_PIEZA" = $1, "COLECCION" = $2, "REPOSITORIO" = $3, "FILO" = $4, "SUBFILO" = $5, "CLASE" = $6, "ORDEN" = $7, "FAMILIA" = $8, "GENERO" = $9, "NOMBRE" = $10, "PERIODO_GEOLOGICO" = $11, "ERA_GEOLOGICA" = $12, "FORMACION_GEOLOGICA" = $13, "SECCION_ESTRATIGRAFICA" = $14, "COLECTOR" = $15, "LOCALIDAD" = $16, "OBSERVACIONES" = $17, "FOTO" = $18 WHERE "ID_PIEZA" = $19';

        const result = await db.query(query, [ID_PIEZA, COLECCION, REPOSITORIO, FILO, SUBFILO, CLASE, ORDEN, FAMILIA, GENERO, NOMBRE, PERIODO_GEOLOGICO,
            ERA_GEOLOGICA, FORMACION_GEOLOGICA, SECCION_ESTRATIGRAFICA, COLECTOR, LOCALIDAD, OBSERVACIONES, FOTO, ID_PIEZAPARAM]
        );
        return result;
    },

    async delete(ID_PIEZA) {
        const result = await db.query('DELETE FROM investigacion WHERE "ID_PIEZA" = $1', [ID_PIEZA]);
        return result;
    },

    async getPhoto(ID_PIEZA) {
        const { rows } = await db.query('SELECT "FOTO" FROM investigacion WHERE "ID_PIEZA" = $1', [ID_PIEZA]);
        return rows;
    },

    async deletePhoto(ID_PIEZA) {
        const result = await db.query('UPDATE investigacion SET "FOTO" = \'\' WHERE "ID_PIEZA" = $1', [ID_PIEZA]);
        return result;
    }
};

module.exports = InvestigationModel;
