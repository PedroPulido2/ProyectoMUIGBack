const db = require('../config/bd');

/**
 * Modelo CustomModulo (PostgreSQL)
 * JSON MySQL (JSON_EXTRACT/JSON_UNQUOTE) -> PostgreSQL (data->>clave).
 */

const isSafeKey = (k) => /^[A-Za-z0-9_]+$/.test(k || '');

const CustomModuloModel = {
    async getAll() {
        const { rows } = await db.query('SELECT "id", "nombre", "columnas", "fechaCreacion" FROM custom_modulo');
        return rows;
    },

    async getById(id) {
        const { rows } = await db.query('SELECT "id", "nombre", "columnas" FROM custom_modulo WHERE "id" = $1', [id]);
        return rows;
    },

    async create(nombre, columnas) {
        const colsStr = typeof columnas === 'object' ? JSON.stringify(columnas) : columnas;
        const query = 'INSERT INTO custom_modulo ("nombre", "columnas", "fechaCreacion") VALUES ($1, $2::jsonb, CURRENT_DATE)';
        const result = await db.query(query, [nombre, colsStr]);
        return result;
    },

    async delete(id) {
        const result = await db.query('DELETE FROM custom_modulo WHERE "id" = $1', [id]);
        return result;
    },

    async getPaginatedData(id_modulo, limit, offset, searchColumn, searchTerm) {
        let query = 'SELECT "id", "id_modulo", "data", "fechaCreacion" FROM custom_modulo_registro WHERE "id_modulo" = $1';
        let countQuery = 'SELECT COUNT(*) AS total FROM custom_modulo_registro WHERE "id_modulo" = $1';
        const queryParams = [parseInt(id_modulo, 10)];
        const countParams = [parseInt(id_modulo, 10)];

        if (searchColumn && searchTerm && isSafeKey(searchColumn)) {
            query += ' AND "data"->>$2 LIKE $3';
            countQuery += ' AND "data"->>$2 LIKE $3';
            queryParams.push(searchColumn, `%${searchTerm}%`);
            countParams.push(searchColumn, `%${searchTerm}%`);
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

    async createRecord(id_modulo, dataJson) {
        const dataStr = typeof dataJson === 'object' ? JSON.stringify(dataJson) : dataJson;
        const query = 'INSERT INTO custom_modulo_registro ("id_modulo", "data") VALUES ($1, $2::jsonb)';
        const result = await db.query(query, [parseInt(id_modulo, 10), dataStr]);
        return result;
    },

    async updateRecord(recordId, dataJson) {
        const dataStr = typeof dataJson === 'object' ? JSON.stringify(dataJson) : dataJson;
        const query = 'UPDATE custom_modulo_registro SET "data" = $1::jsonb WHERE "id" = $2';
        const result = await db.query(query, [dataStr, recordId]);
        return result;
    },

    async deleteRecord(recordId) {
        const query = 'DELETE FROM custom_modulo_registro WHERE "id" = $1';
        const result = await db.query(query, [recordId]);
        return result;
    }
};

module.exports = CustomModuloModel;
