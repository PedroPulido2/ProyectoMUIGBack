const customModuloModel = require('../models/customModuloModel');
const { logEvent } = require('../middlewares/logger');

const parseJsonField = (field) => {
    if (typeof field === 'string') {
        try {
            return JSON.parse(field);
        } catch (e) {
            return field;
        }
    }
    return field;
};

const getAllModules = async (req, res) => {
    try {
        const rows = await customModuloModel.getAll();
        const parsedRows = rows.map(row => ({
            ...row,
            columnas: parseJsonField(row.columnas)
        }));
        res.status(200).json(parsedRows);
    } catch (error) {
        console.error('Error al obtener los módulos:', error.message);
        res.status(500).json({ error: 'Error al obtener los módulos' });
    }
};

const getModuleById = async (req, res) => {
    const { id } = req.params;
    try {
        const rows = await customModuloModel.getById(id);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'El módulo no existe' });
        }
        const row = rows[0];
        const parsedRow = {
            ...row,
            columnas: parseJsonField(row.columnas)
        };
        res.status(200).json(parsedRow);
    } catch (error) {
        console.error('Error al obtener el módulo:', error.message);
        res.status(500).json({ error: 'Error al obtener el módulo' });
    }
};

const createModule = async (req, res) => {
    const { nombre, columnas, idPerfilAccion, usernameAccion } = req.body;
    try {
        if (!nombre || !columnas) {
            return res.status(400).json({ error: 'Nombre y columnas son obligatorios' });
        }
        await customModuloModel.create(nombre, columnas);

        await logEvent({
            id_user: idPerfilAccion,
            user: usernameAccion,
            activity: 'CUSTOM_MODULO_CREATE',
            ip: req.ip,
            module: 'CUSTOM_MODULO',
            status: 'OK',
            detail: `El usuario: ${usernameAccion || 'anonimo'} registró un nuevo módulo dinámico: ${nombre}`
        });

        res.status(201).json({ message: 'Módulo dinámico creado correctamente' });
    } catch (error) {
        console.error('Error al crear el módulo:', error.message);
        res.status(500).json({ error: 'Error al crear el módulo dinámico' });
    }
};

const deleteModule = async (req, res) => {
    const { id } = req.params;
    const { idPerfilAccion, usernameAccion } = req.body;
    try {
        const rows = await customModuloModel.getById(id);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'El módulo no existe' });
        }
        const nombre = rows[0].nombre;

        await customModuloModel.delete(id);

        await logEvent({
            id_user: idPerfilAccion,
            user: usernameAccion,
            activity: 'CUSTOM_MODULO_DELETE',
            ip: req.ip,
            module: 'CUSTOM_MODULO',
            status: 'OK',
            detail: `El usuario: ${usernameAccion || 'anonimo'} eliminó el módulo dinámico: ${nombre} con ID: ${id}`
        });

        res.status(200).json({ message: 'Módulo dinámico eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar el módulo:', error.message);
        res.status(500).json({ error: 'Error al eliminar el módulo dinámico' });
    }
};

const getModuleData = async (req, res) => {
    const { id } = req.params;
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const searchColumn = req.query.searchColumn || null;
        const searchTerm = req.query.searchTerm || null;

        const offset = (page - 1) * limit;

        const result = await customModuloModel.getPaginatedData(id, limit, offset, searchColumn, searchTerm);
        const totalPages = Math.ceil(result.total / limit);

        const formattedData = result.data.map(row => {
            const recordData = parseJsonField(row.data) || {};
            return {
                id: row.id,
                ...recordData
            };
        });

        res.status(200).json({
            data: formattedData,
            currentPage: page,
            totalPages: totalPages,
            totalRecords: result.total
        });
    } catch (error) {
        console.error('Error al obtener los datos del módulo:', error.message);
        res.status(500).json({ error: 'Error al obtener los datos del módulo' });
    }
};

const createModuleRecord = async (req, res) => {
    const { id } = req.params;
    const { idPerfilAccion, usernameAccion, ...restBody } = req.body;
    const dataJson = req.body.data !== undefined ? req.body.data : restBody;

    try {
        await customModuloModel.createRecord(id, dataJson);

        await logEvent({
            id_user: idPerfilAccion,
            user: usernameAccion,
            activity: 'CUSTOM_MODULO_RECORD_CREATE',
            ip: req.ip,
            module: 'CUSTOM_MODULO_REGISTRO',
            status: 'OK',
            detail: `El usuario: ${usernameAccion || 'anonimo'} registró un nuevo dato en el módulo ID: ${id}`
        });

        res.status(201).json({ message: 'Registro creado correctamente' });
    } catch (error) {
        console.error('Error al registrar datos del módulo:', error.message);
        res.status(500).json({ error: 'Error al insertar los datos en el módulo' });
    }
};

const updateModuleRecord = async (req, res) => {
    const { id, recordId } = req.params;
    const { idPerfilAccion, usernameAccion, ...restBody } = req.body;
    const dataJson = req.body.data !== undefined ? req.body.data : restBody;

    try {
        await customModuloModel.updateRecord(recordId, dataJson);

        await logEvent({
            id_user: idPerfilAccion,
            user: usernameAccion,
            activity: 'CUSTOM_MODULO_RECORD_UPDATE',
            ip: req.ip,
            module: 'CUSTOM_MODULO_REGISTRO',
            status: 'OK',
            detail: `El usuario: ${usernameAccion || 'anonimo'} actualizó el registro ID: ${recordId} del módulo ID: ${id}`
        });

        res.status(200).json({ message: 'Registro actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar registro del módulo:', error.message);
        res.status(500).json({ error: 'Error al actualizar los datos en el módulo' });
    }
};

const deleteModuleRecord = async (req, res) => {
    const { id, recordId } = req.params;
    const { idPerfilAccion, usernameAccion } = req.body;

    try {
        await customModuloModel.deleteRecord(recordId);

        await logEvent({
            id_user: idPerfilAccion,
            user: usernameAccion,
            activity: 'CUSTOM_MODULO_RECORD_DELETE',
            ip: req.ip,
            module: 'CUSTOM_MODULO_REGISTRO',
            status: 'OK',
            detail: `El usuario: ${usernameAccion || 'anonimo'} eliminó el registro ID: ${recordId} del módulo ID: ${id}`
        });

        res.status(200).json({ message: 'Registro eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar registro del módulo:', error.message);
        res.status(500).json({ error: 'Error al eliminar los datos en el módulo' });
    }
};

module.exports = {
    getAllModules,
    getModuleById,
    createModule,
    deleteModule,
    getModuleData,
    createModuleRecord,
    updateModuleRecord,
    deleteModuleRecord
};
