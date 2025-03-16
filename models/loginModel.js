const db = require('../config/bd');

/**
 * Modelo Login
 * En este archivo se almacenan metodos para las diferentes consultas a la base de datos.
 */

const Login = {
    async getAllLogins() {
        const [rows] = await db.query('SELECT user, id_Perfil FROM login');
        return rows;
    },

    async createLogin(user, hashedPassword, idProfile) {
        const [result] = await db.query('INSERT INTO login (user, password, id_Perfil) VALUES (?,?,?)',
            [user, hashedPassword, idProfile]
        );
        return result;
    },

    async updateLogin(user, hashedPassword, id_Perfil, userParam) {
        const [result] = await db.query('UPDATE login SET user = ?, password = ?, id_Perfil = ? WHERE user = ?',
            [user, hashedPassword, id_Perfil, userParam]
        );
        return result;
    },

    async deleteLogin(user) {
        const [result] = await db.query('DELETE FROM login WHERE user = ?', [user]);
        return result;
    },

    async getLoginByUser(user) {
        const [row] = await db.query('SELECT login.id_Perfil, user , password, isAdmin, foto FROM login JOIN perfil WHERE user = ?', [user]);
        return row;
    },

    async getLoginByIdPerfil(id_Perfil){
        const [row] = await db.query('SELECT * FROM login WHERE id_Perfil = ?',[id_Perfil]);
        return row;
    },

    async changePassword(user, hashedPassword){
        const [result] = await db.query('UPDATE login SET password = ? WHERE user = ?',
            [hashedPassword, user]
        );
        return result;
    }

};

module.exports = Login;