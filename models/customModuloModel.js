const db = require('../config/bd');

/**
 * Modelo CustomModulo
 * En este archivo se almacenan metodos para las diferentes consultas a la base de datos de módulos dinámicos.
 */
const CustomModuloModel = {
    async getAll() {
        const [rows] = await db.query('SELECT id, nombre, columnas, fechaCreacion FROM custom_modulo');
        return rows;
    },

    async getById(id) {
        const [rows] = await db.query('SELECT id, nombre, columnas FROM custom_modulo WHERE id = ?', [id]);
        return rows;
    },

    async create(nombre, columnas) {
        const colsStr = typeof columnas === 'object' ? JSON.stringify(columnas) : columnas;
        const query = 'INSERT INTO custom_modulo (nombre, columnas, fechaCreacion) VALUES (?, ?, CURDATE())';
        const [result] = await db.query(query, [nombre, colsStr]);
        return result;
    },

    async delete(id) {
        const [result] = await db.query('DELETE FROM custom_modulo WHERE id = ?', [id]);
        return result;
    },

    async getPaginatedData(id_modulo, limit, offset, searchColumn, searchTerm) {
        let query = 'SELECT id, id_modulo, data, fechaCreacion FROM custom_modulo_registro WHERE id_modulo = ?';
        let countQuery = 'SELECT COUNT(*) as count FROM custom_modulo_registro WHERE id_modulo = ?';
        const queryParams = [id_modulo];
        const countParams = [id_modulo];

        if (searchColumn && searchTerm) {
            query += " AND JSON_UNQUOTE(JSON_EXTRACT(data, ?)) LIKE ?";
            countQuery += " AND JSON_UNQUOTE(JSON_EXTRACT(data, ?)) LIKE ?";
            queryParams.push(`$.${searchColumn}`, `%${searchTerm}%`);
            countParams.push(`$.${searchColumn}`, `%${searchTerm}%`);
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

    async createRecord(id_modulo, dataJson) {
        const dataStr = typeof dataJson === 'object' ? JSON.stringify(dataJson) : dataJson;
        const query = 'INSERT INTO custom_modulo_registro (id_modulo, data) VALUES (?, ?)';
        const [result] = await db.query(query, [id_modulo, dataStr]);
        return result;
    },

    async updateRecord(recordId, dataJson) {
        const dataStr = typeof dataJson === 'object' ? JSON.stringify(dataJson) : dataJson;
        const query = 'UPDATE custom_modulo_registro SET data = ? WHERE id = ?';
        const [result] = await db.query(query, [dataStr, recordId]);
        return result;
    },

    async deleteRecord(recordId) {
        const query = 'DELETE FROM custom_modulo_registro WHERE id = ?';
        const [result] = await db.query(query, [recordId]);
        return result;
    }
};

module.exports = CustomModuloModel;
