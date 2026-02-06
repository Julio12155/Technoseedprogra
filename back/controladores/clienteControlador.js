const db = require('../configuracion/BaseDatos');

const esTextoSeguro = (texto) => {
    const regex = /^[a-zA-ZÀ-ÿ0-9\s.,#-]+$/;
    return texto && regex.test(texto);
};

const esNombreValido = (nombre) => {
    const regex = /^[a-zA-ZÀ-ÿ\s]{2,50}$/;
    return nombre && regex.test(nombre);
};

const esTelefonoValido = (tel) => {
    const regex = /^\d{10,15}$/;
    return tel && regex.test(tel);
};

const obtenerPerfil = async (req, res) => {
    const id = req.session.usuarioID;
    try {
        const query = `
            SELECT u.nombre, u.email, u.avatar, d.telefono 
            FROM usuarios u 
            LEFT JOIN clientes_detalles d ON u.id = d.usuario_id 
            WHERE u.id = ?
        `;
        const [datos] = await db.query(query, [id]);
        res.json(datos[0]);
    } catch (error) {
        res.status(500).send('Error recuperando perfil');
    }
};

const guardarTelefono = async (req, res) => {
    const id = req.session.usuarioID;
    const { telefono } = req.body;

    if (!esTelefonoValido(telefono)) {
        return res.status(400).send('El teléfono debe contener solo números (10-15 dígitos).');
    }

    try {
        const [existe] = await db.query('SELECT id FROM clientes_detalles WHERE usuario_id = ?', [id]);

        if (existe.length > 0) {
            await db.query('UPDATE clientes_detalles SET telefono=? WHERE usuario_id=?', [telefono, id]);
        } else {
            await db.query('INSERT INTO clientes_detalles (usuario_id, telefono) VALUES (?, ?)', [id, telefono]);
        }
        res.send('Teléfono actualizado');
    } catch (error) {
        res.status(500).send('Error guardando teléfono');
    }
};

const obtenerDirecciones = async (req, res) => {
    const id = req.session.usuarioID;
    try {
        const [dirs] = await db.query('SELECT * FROM direcciones WHERE usuario_id = ? ORDER BY es_principal DESC', [id]);
        res.json(dirs);
    } catch (error) {
        res.status(500).send('Error obteniendo direcciones');
    }
};

const agregarDireccion = async (req, res) => {
    const id = req.session.usuarioID;
    const { alias, calle, ciudad, estado, cp, lat, lng, instrucc } = req.body;

    if (!esTextoSeguro(alias)) return res.status(400).send('El Alias contiene caracteres inválidos (<, >, ;, etc).');
    if (!esTextoSeguro(calle)) return res.status(400).send('La Calle contiene caracteres inválidos.');
    if (!esTextoSeguro(ciudad)) return res.status(400).send('La Ciudad contiene caracteres inválidos.');
    if (!esTextoSeguro(estado)) return res.status(400).send('El Estado contiene caracteres inválidos.');
    if (!esTextoSeguro(cp)) return res.status(400).send('Código Postal inválido.');
    
    if (instrucc && !esTextoSeguro(instrucc)) {
        return res.status(400).send('Las instrucciones contienen caracteres no permitidos.');
    }

    try {
        const [conteo] = await db.query('SELECT COUNT(*) as total FROM direcciones WHERE usuario_id = ?', [id]);
        if (conteo[0].total >= 3) {
            return res.status(400).send('Límite de 3 direcciones alcanzado');
        }

        const esPrincipal = conteo[0].total === 0; 

        await db.query(
            `INSERT INTO direcciones (usuario_id, alias, calle, ciudad, estado, codigo_postal, latitud, longitud, instrucciones, es_principal) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, alias, calle, ciudad, estado, cp, lat, lng, instrucc || '', esPrincipal]
        );

        res.send('Dirección agregada');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error interno agregando dirección');
    }
};

const eliminarDireccion = async (req, res) => {
    const usuarioId = req.session.usuarioID;
    const direccionId = req.params.id;

    try {
        await db.query('DELETE FROM direcciones WHERE id = ? AND usuario_id = ?', [direccionId, usuarioId]);
        
        const [restantes] = await db.query('SELECT id FROM direcciones WHERE usuario_id = ? ORDER BY id ASC', [usuarioId]);
        if (restantes.length > 0) {
            const [tienePrincipal] = await db.query('SELECT id FROM direcciones WHERE usuario_id = ? AND es_principal = 1', [usuarioId]);
            if (tienePrincipal.length === 0) {
                await db.query('UPDATE direcciones SET es_principal = 1 WHERE id = ?', [restantes[0].id]);
            }
        }

        res.send('Dirección eliminada');
    } catch (error) {
        res.status(500).send('Error eliminando dirección');
    }
};

const establecerPredeterminada = async (req, res) => {
    const usuarioId = req.session.usuarioID;
    const direccionId = req.params.id;

    try {
        await db.query('UPDATE direcciones SET es_principal = 0 WHERE usuario_id = ?', [usuarioId]);
        await db.query('UPDATE direcciones SET es_principal = 1 WHERE id = ? AND usuario_id = ?', [direccionId, usuarioId]);
        res.send('Dirección predeterminada actualizada');
    } catch (error) {
        res.status(500).send('Error actualizando preferencia');
    }
};

const actualizarDatosPersonales = async (req, res) => {
    const id = req.session.usuarioID;
    const { nombre, telefono } = req.body;
    const nuevaAvatar = req.file ? req.file.filename : null;

    if (!esNombreValido(nombre)) {
        return res.status(400).send('Nombre inválido: Solo letras y espacios, sin símbolos raros.');
    }
    if (!esTelefonoValido(telefono)) {
        return res.status(400).send('Teléfono inválido: Solo números (10-15 dígitos).');
    }

    try {
        if (nuevaAvatar) {
            await db.query('UPDATE usuarios SET nombre = ?, avatar = ? WHERE id = ?', [nombre, nuevaAvatar, id]);
        } else {
            await db.query('UPDATE usuarios SET nombre = ? WHERE id = ?', [nombre, id]);
        }

        const [existeDetalle] = await db.query('SELECT id FROM clientes_detalles WHERE usuario_id = ?', [id]);
        if (existeDetalle.length > 0) {
            await db.query('UPDATE clientes_detalles SET telefono = ? WHERE usuario_id = ?', [telefono, id]);
        } else {
            await db.query('INSERT INTO clientes_detalles (usuario_id, telefono) VALUES (?, ?)', [id, telefono]);
        }

        res.send('Datos actualizados correctamente');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al actualizar datos');
    }
};

module.exports = { 
    obtenerPerfil, 
    guardarTelefono, 
    obtenerDirecciones, 
    agregarDireccion, 
    eliminarDireccion, 
    establecerPredeterminada,
    actualizarDatosPersonales
};