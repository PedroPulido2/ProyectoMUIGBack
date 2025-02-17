const db = require('../config/bd');

/**
 * Modelo Perfil
 * En este archivo se almacenan metodos para las diferentes consultas a la base de datos.
 */


const Profile = {
    async getAllProfiles() {
        const [rows] = await db.query('SELECT * FROM perfil');
        return rows;
    },

    async getProfileById(id_Perfil) {
        const [rows] = await db.query('SELECT * FROM perfil WHERE id_Perfil = ?', [id_Perfil]);
        return rows;
    },

    async createProfile(data) {
        const { id_Perfil, tipoIdentificacion, nombre, apellido, fechaNacimiento, genero, correo, telefono, foto, isAdmin } = data;

        const query = 'INSERT INTO perfil (id_Perfil, tipoIdentificacion, nombre, apellido, fechaNacimiento, genero, correo, telefono, foto, isAdmin) VALUES (?,?,?,?,?,?,?,?,?,?)';

        const [result] = await db.query(query, [id_Perfil, tipoIdentificacion, nombre, apellido, fechaNacimiento, genero, correo, telefono, foto, isAdmin]);
        return result;
    },

    async updateProfile(id_PerfilPARAM, data) {
        const { id_Perfil, tipoIdentificacion, nombre, apellido, fechaNacimiento, genero, correo, telefono, foto, isAdmin, } = data;

        const query = 'UPDATE perfil SET id_Perfil = ?, tipoIdentificacion = ?, nombre = ?, apellido = ?, fechaNacimiento = ?, genero = ?, correo = ?, telefono = ?, foto = ?, isAdmin = ? WHERE id_Perfil = ?';

        const [result] = await db.query(query, [id_Perfil, tipoIdentificacion, nombre, apellido, fechaNacimiento, genero, correo, telefono, foto, isAdmin, id_PerfilPARAM]);
        return result;
    },

    async deleteProfile(id_Perfil) {
        const [result] = await db.query('DELETE FROM perfil WHERE id_Perfil = ?', [id_Perfil]);
        return result;
    },

    async deleteImageProfile(id_Perfil) {
        const [result] = await db.query('UPDATE perfil SET foto = "" WHERE id_Perfil = ?', [id_Perfil]);
        return result;
    },

    async getImageProfile(id_Perfil) {
        const [result] = await db.query('SELECT foto FROM perfil WHERE id_Perfil = ?', [id_Perfil]);
        return result;
    }
};

module.exports = Profile;