const db = require('../configuracion/BaseDatos');
const fs = require('fs');
const path = require('path');

const obtenerTodas = async (req, res) => {
    try {
        const [plantas] = await db.query('SELECT * FROM productos');
        res.json(plantas);
    } catch (error) {
        res.status(500).send('Error obteniendo plantas');
    }
};

const obtenerUna = async (req, res) => {
    try {
        const [planta] = await db.query('SELECT * FROM productos WHERE id = ?', [req.params.id]);
        if (planta.length === 0) return res.status(404).send('Planta no encontrada');
        res.json(planta[0]);
    } catch (error) {
        res.status(500).send('Error del servidor');
    }
};

const crearPlanta = async (req, res) => {
    const { nom, desc, prec, stock } = req.body;
    const img = req.file ? req.file.filename : null;

    try {
        await db.query('INSERT INTO productos (nombre, descripcion, precio, stock, imagen) VALUES (?, ?, ?, ?, ?)', 
            [nom, desc, prec, stock, img]);
        res.send('Planta agregada al vivero');
    } catch (error) {
        res.status(500).send('Error al guardar planta');
    }
};

const editarPlanta = async (req, res) => {
    const { id } = req.params;
    const { nom, desc, prec, stock } = req.body;
    
    try {
        let query = 'UPDATE productos SET nombre=?, descripcion=?, precio=?, stock=?';
        let datos = [nom, desc, prec, stock];

        if (req.file) {
            query += ', imagen=?';
            datos.push(req.file.filename);
        }

        query += ' WHERE id=?';
        datos.push(id);

        await db.query(query, datos);
        res.send('Datos de la planta actualizados');
    } catch (error) {
        res.status(500).send('Error actualizando');
    }
};

const eliminarPlanta = async (req, res) => {
    try {
        await db.query('DELETE FROM productos WHERE id = ?', [req.params.id]);
        res.send('Planta eliminada del catalogo');
    } catch (error) {
        res.status(500).send('Error eliminando');
    }
};
const reabastecerStock = async (req, res) => {
    const { id } = req.params;
    const { cantidad } = req.body; 

    try {
        await db.query('UPDATE productos SET stock = stock + ? WHERE id = ?', [cantidad, id]);
        res.send('Inventario actualizado');
    } catch (error) {
        res.status(500).send('Error reabasteciendo');
    }
};

const obtenerAlertasStock = async (req, res) => {
    try {
        const [alertas] = await db.query('SELECT * FROM productos WHERE stock < 10 ORDER BY stock ASC');
        res.json(alertas);
    } catch (error) {
        res.status(500).send('Error obteniendo alertas');
    }
};
module.exports = { obtenerTodas, obtenerUna, crearPlanta, editarPlanta, eliminarPlanta, reabastecerStock, obtenerAlertasStock };