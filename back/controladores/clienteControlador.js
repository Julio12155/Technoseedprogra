const db = require('../configuracion/BaseDatos');

const verPerfil = async (req, res) => {
    const id = req.session.usuarioID;
    if (!id) return res.status(403).send('No autorizado');

    try {
        const [cliente] = await db.query('SELECT nombre, email, fecha_registro FROM usuarios WHERE id = ?', [id]);
        res.json(cliente[0]);
    } catch (error) {
        res.status(500).send('Error recuperando perfil');
    }
};

const actualizarPerfil = async (req, res) => {
    const id = req.session.usuarioID;
    const { nom, correo } = req.body;

    try {
        await db.query('UPDATE usuarios SET nombre = ?, email = ? WHERE id = ?', [nom, correo, id]);
        res.send('Perfil actualizado correctamente');
    } catch (error) {
        res.status(500).send('Error actualizando perfil');
    }
};

module.exports = { verPerfil, actualizarPerfil };