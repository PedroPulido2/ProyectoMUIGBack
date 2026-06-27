const db = require('../config/bd');

/**
 * Modelo Perfil
 * En este archivo se almacenan metodos para las diferentes consultas a la base de datos.
 */


const ProfileModel = {
    async getAll() {
        const [rows] = await db.query('SELECT id_Perfil AS ID_PERFIL, nombre AS NOMBRE, apellido AS APELLIDO, genero AS GENERO, foto AS FOTO, isAdmin AS IS_ADMIN, estado AS ESTADO FROM login INNER JOIN perfil USING(id_perfil)');
        return rows;
    },

    async getById(id_Perfil) {
        const [rows] = await db.query('SELECT id_Perfil, tipoIdentificacion, nombre, apellido, fechaNacimiento, genero, correo, telefono, foto, fechaCreacion, isAdmin, perm_fosil, perm_mineral, perm_roca, perm_investigacion, perm_perfil, estado FROM perfil INNER JOIN login USING (id_perfil) WHERE id_Perfil = ?', [id_Perfil]);
        return rows;
    },

    async create(data) {
        const { id_Perfil, tipoIdentificacion, nombre, apellido, fechaNacimiento, genero, correo, telefono, foto, isAdmin } = data;

        const query = 'INSERT INTO perfil (id_Perfil, tipoIdentificacion, nombre, apellido, fechaNacimiento, genero, correo, telefono, foto, isAdmin) VALUES (?,?,?,?,?,?,?,?,?,?)';

        const [result] = await db.query(query, [id_Perfil, tipoIdentificacion, nombre, apellido, fechaNacimiento, genero, correo, telefono, foto, isAdmin]);
        return result;
    },

    async update(id_PerfilPARAM, data) {
        const { id_Perfil, tipoIdentificacion, nombre, apellido, fechaNacimiento, genero, correo, telefono, foto, isAdmin } = data;

        const query = `UPDATE perfil SET 
            id_Perfil = ?, tipoIdentificacion = ?, nombre = ?, apellido = ?, 
            fechaNacimiento = ?, genero = ?, correo = ?, telefono = ?, foto = ?, isAdmin = ?
            WHERE id_Perfil = ?`;

        const [result] = await db.query(query, [
            id_Perfil, tipoIdentificacion, nombre, apellido, fechaNacimiento,
            genero, correo, telefono, foto, isAdmin,
            id_PerfilPARAM
        ]);
    },

    async updatePermissions(id_Perfil, data) {
        const { perm_fosil, perm_mineral, perm_roca, perm_investigacion, perm_perfil } = data;
        const query = `UPDATE perfil SET 
            perm_fosil = ?, perm_mineral = ?, perm_roca = ?, perm_investigacion = ?, perm_perfil = ?
            WHERE id_Perfil = ?`;
        const [result] = await db.query(query, [perm_fosil, perm_mineral, perm_roca, perm_investigacion, perm_perfil, id_Perfil]);
    },

    async delete(id_Perfil) {
        const [result] = await db.query('DELETE FROM perfil WHERE id_Perfil = ?', [id_Perfil]);
        return result;
    },

    async deleteImage(id_Perfil) {
        const [result] = await db.query('UPDATE perfil SET foto = "" WHERE id_Perfil = ?', [id_Perfil]);
        return result;
    },

    async getImage(id_Perfil) {
        const [result] = await db.query('SELECT foto FROM perfil WHERE id_Perfil = ?', [id_Perfil]);
        return result;
    }
};

module.exports = ProfileModel;