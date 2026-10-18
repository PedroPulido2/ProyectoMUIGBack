const db = require('../config/bd');

/**
 * Modelo Perfil (PostgreSQL)
 */


const ProfileModel = {
    async getAll() {
        const { rows } = await db.query('SELECT perfil."id_Perfil" AS "ID_PERFIL", perfil."nombre" AS "NOMBRE", perfil."apellido" AS "APELLIDO", perfil."genero" AS "GENERO", perfil."foto" AS "FOTO", perfil."isAdmin" AS "IS_ADMIN", login."estado" AS "ESTADO" FROM login INNER JOIN perfil ON login."id_Perfil" = perfil."id_Perfil"');
        return rows;
    },

    async getById(id_Perfil) {
        const { rows } = await db.query('SELECT perfil."id_Perfil", perfil."tipoIdentificacion", perfil."nombre", perfil."apellido", perfil."fechaNacimiento", perfil."genero", perfil."correo", perfil."telefono", perfil."foto", perfil."fechaCreacion", perfil."isAdmin", perfil."perm_fosil", perfil."perm_mineral", perfil."perm_roca", perfil."perm_investigacion", perfil."perm_perfil", login."estado" FROM perfil INNER JOIN login ON perfil."id_Perfil" = login."id_Perfil" WHERE perfil."id_Perfil" = $1', [id_Perfil]);
        return rows;
    },

    async create(data) {
        const { id_Perfil, tipoIdentificacion, nombre, apellido, fechaNacimiento, genero, correo, telefono, foto, isAdmin } = data;

        const query = 'INSERT INTO perfil ("id_Perfil", "tipoIdentificacion", "nombre", "apellido", "fechaNacimiento", "genero", "correo", "telefono", "foto", "isAdmin") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)';

        const result = await db.query(query, [id_Perfil, tipoIdentificacion, nombre, apellido, fechaNacimiento, genero, correo, telefono, foto, isAdmin]);
        return result;
    },

    async update(id_PerfilPARAM, data) {
        const { id_Perfil, tipoIdentificacion, nombre, apellido, fechaNacimiento, genero, correo, telefono, foto, isAdmin } = data;

        const query = `UPDATE perfil SET
            "id_Perfil" = $1, "tipoIdentificacion" = $2, "nombre" = $3, "apellido" = $4,
            "fechaNacimiento" = $5, "genero" = $6, "correo" = $7, "telefono" = $8, "foto" = $9, "isAdmin" = $10
            WHERE "id_Perfil" = $11`;

        const result = await db.query(query, [
            id_Perfil, tipoIdentificacion, nombre, apellido, fechaNacimiento,
            genero, correo, telefono, foto, isAdmin,
            id_PerfilPARAM
        ]);
        return result;
    },

    async updatePermissions(id_Perfil, data) {
        const { perm_fosil, perm_mineral, perm_roca, perm_investigacion, perm_perfil } = data;
        const query = `UPDATE perfil SET
            "perm_fosil" = $1, "perm_mineral" = $2, "perm_roca" = $3, "perm_investigacion" = $4, "perm_perfil" = $5
            WHERE "id_Perfil" = $6`;
        const result = await db.query(query, [perm_fosil, perm_mineral, perm_roca, perm_investigacion, perm_perfil, id_Perfil]);
        return result;
    },

    async delete(id_Perfil) {
        const result = await db.query('DELETE FROM perfil WHERE "id_Perfil" = $1', [id_Perfil]);
        return result;
    },

    async deleteImage(id_Perfil) {
        const result = await db.query('UPDATE perfil SET "foto" = \'\' WHERE "id_Perfil" = $1', [id_Perfil]);
        return result;
    },

    async getImage(id_Perfil) {
        const { rows } = await db.query('SELECT "foto" FROM perfil WHERE "id_Perfil" = $1', [id_Perfil]);
        return rows;
    },

    async getByCorreo(correo) {
        const { rows } = await db.query(
            'SELECT "id_Perfil", "correo", "nombre" FROM perfil WHERE LOWER("correo") = LOWER($1)',
            [correo]
        );
        return rows;
    },

    async saveResetToken(id_Perfil, tokenHash) {
        // La expiración se calcula en la BD para evitar desfases de reloj del servidor de la app.
        const result = await db.query(
            'UPDATE perfil SET "reset_token_hash" = $1, "reset_token_expires_at" = NOW() + INTERVAL \'1 hour\' WHERE "id_Perfil" = $2',
            [tokenHash, id_Perfil]
        );
        return result;
    },

    async getByResetHash(tokenHash) {
        const { rows } = await db.query(
            'SELECT "id_Perfil", "correo", "reset_token_expires_at" FROM perfil WHERE "reset_token_hash" = $1 AND "reset_token_expires_at" > NOW()',
            [tokenHash]
        );
        return rows;
    },

    async getResetRowByHash(tokenHash) {
        // Solo para diagnóstico en logs del servidor (no expone nada al cliente).
        const { rows } = await db.query(
            'SELECT "id_Perfil", "reset_token_expires_at" FROM perfil WHERE "reset_token_hash" = $1',
            [tokenHash]
        );
        return rows;
    },

    async clearResetToken(id_Perfil) {
        const result = await db.query(
            'UPDATE perfil SET "reset_token_hash" = NULL, "reset_token_expires_at" = NULL WHERE "id_Perfil" = $1',
            [id_Perfil]
        );
        return result;
    }
};

module.exports = ProfileModel;
