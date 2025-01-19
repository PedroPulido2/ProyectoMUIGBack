const db = require('../config/bd');

/**
 * Modelo Login
 * En este archivo se almacenan metodos para las diferentes consultas a la base de datos.
 */

const Login = {
    async getAllUsers() {
        const [rows] = await db.query('SELECT * FROM login');
        return rows;
    },

    async createUser(user, hashedPassword) {
        const [result] = await db.query('INSERT INTO login (user, password) VALUES (?,?)',
            [user, hashedPassword]
        );
        return result;
    },

    async updateUser(user, hashedPassword, userParam) {
        const [result] = await db.query('UPDATE login SET user = ?, password = ? WHERE user = ?',
            [user, hashedPassword, userParam]
        );
        return result;
    },

    async deleteUser(user) {
        const [result] = await db.query('DELETE FROM login WHERE user = ?', [user]);
        return result;
    },

    async getUserById(user) {
        const [row] = await db.query('SELECT * FROM login WHERE user = ?', [user]);
        return row;
    }
};

module.exports = Login;