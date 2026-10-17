const db = require('../config/bd');

/**
 * Modelo Login (PostgreSQL)
 * Nota: "user" es palabra reservada en PG, siempre va entre comillas.
 */

const LoginModel = {
    async getAll() {
        const { rows } = await db.query('SELECT "user", "id_Perfil", "estado", "intentos_fallidos" FROM login');
        return rows;
    },

    async create(user, hashedPassword, idProfile) {
        const result = await db.query(
            'INSERT INTO login ("user", "password", "id_Perfil", "estado", "intentos_fallidos") VALUES ($1,$2,$3,$4,$5)',
            [user, hashedPassword, idProfile, 'ACTIVO', 0]
        );
        return result;
    },

    async updateUser(user, id_Perfil) {
        const result = await db.query('UPDATE login SET "user" = $1 WHERE "id_Perfil" = $2',
            [user, id_Perfil]
        );
        return result;
    },

    async delete(user) {
        const result = await db.query('DELETE FROM login WHERE "user" = $1', [user]);
        return result;
    },

    async getByUser(user) {
        const { rows } = await db.query(
            'SELECT login."id_Perfil", login."user", login."password", perfil."isAdmin", perfil."foto", login."estado", login."intentos_fallidos", perfil."perm_fosil", perfil."perm_mineral", perfil."perm_roca", perfil."perm_investigacion", perfil."perm_perfil" FROM login INNER JOIN perfil ON login."id_Perfil" = perfil."id_Perfil" WHERE login."user" = $1',
            [user]
        );
        return rows;
    },

    async getByIdPerfil(id_Perfil) {
        const { rows } = await db.query('SELECT * FROM login WHERE "id_Perfil" = $1', [id_Perfil]);
        return rows;
    },

    async updatePassword(user, hashedPassword) {
        const result = await db.query('UPDATE login SET "password" = $1 WHERE "user" = $2',
            [hashedPassword, user]
        );
        return result;
    },

    async increaseFailedAttempts(user, maxIntentos) {
        const result = await db.query(
            `UPDATE login
             SET "intentos_fallidos" = "intentos_fallidos" + 1,
                 "estado" = CASE WHEN "intentos_fallidos" + 1 >= $1 THEN 'BLOQUEADO' ELSE "estado" END
             WHERE "user" = $2`,
            [maxIntentos, user]
        );
        return result;
    },

    async resetFailedAttempts(user) {
        const result = await db.query(
            'UPDATE login SET "intentos_fallidos" = 0 WHERE "user" = $1',
            [user]
        );
        return result;
    },

    async unlockUser(user) {
        const result = await db.query(`UPDATE login SET "estado" = 'ACTIVO', "intentos_fallidos" = 0 WHERE "user" = $1`,
            [user]
        );
        return result;
    },

    async blockuser(user) {
        const result = await db.query(`UPDATE login SET "estado" = 'BLOQUEADO' WHERE "user" = $1`,
            [user]
        );
        return result;
    }
};

module.exports = LoginModel;
