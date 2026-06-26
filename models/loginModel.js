const db = require('../config/bd');

/**
 * Modelo Login
 * En este archivo se almacenan metodos para las diferentes consultas a la base de datos.
 */

const LoginModel = {
    async getAll() {
        const [rows] = await db.query('SELECT user, id_Perfil, estado, intentos_fallidos FROM login');
        return rows;
    },

    async create(user, hashedPassword, idProfile) {
        const [result] = await db.query('INSERT INTO login (user, password, id_Perfil, estado, intentos_fallidos) VALUES (?,?,?,?,?)',
            [user, hashedPassword, idProfile, 'ACTIVO', 0]
        );
        return result;
    },

    async updateUser(user, id_Perfil) {
        const [result] = await db.query('UPDATE login SET user = ? WHERE id_Perfil = ?',
            [user, id_Perfil]
        );
        return result;
    },

    async delete(user) {
        const [result] = await db.query('DELETE FROM login WHERE user = ?', [user]);
        return result;
    },

    async getByUser(user) {
        const [row] = await db.query('SELECT login.id_Perfil, user , password, isAdmin, foto, estado, intentos_fallidos, perm_fosil, perm_mineral, perm_roca, perm_investigacion, perm_perfil FROM login INNER JOIN perfil USING (id_Perfil) WHERE user = ?', [user]);
        return row;
    },

    async getByIdPerfil(id_Perfil) {
        const [row] = await db.query('SELECT * FROM login WHERE id_Perfil = ?', [id_Perfil]);
        return row;
    },

    async updatePassword(user, hashedPassword) {
        const [result] = await db.query('UPDATE login SET password = ? WHERE user = ?',
            [hashedPassword, user]
        );
        return result;
    },

    async increaseFailedAttempts(user, maxIntentos) {
        const [result] = await db.query(
            `UPDATE login 
             SET intentos_fallidos = intentos_fallidos + 1,
                 estado = CASE WHEN intentos_fallidos + 1 >= ? THEN 'BLOQUEADO' ELSE estado END
             WHERE user = ?`,
            [maxIntentos, user]
        );
        return result;
    },

    async resetFailedAttempts(user) {
        const [result] = await db.query(
            'UPDATE login SET intentos_fallidos = 0 WHERE user = ?',
            [user]
        );
        return result;
    },

    async unlockUser(user) {
        const [result] = await db.query(`UPDATE login SET estado = 'ACTIVO', intentos_fallidos = 0 WHERE user = ?`,
            [user]
        );
        return result;
    },

    async blockuser(user) {
        const [result] = await db.query(`UPDATE login SET estado = 'BLOQUEADO' WHERE user = ?`,
            [user]
        );
        return result;
    }
};

module.exports = LoginModel;