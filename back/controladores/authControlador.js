const db = require('../configuracion/BaseDatos');
const bcrypt = require('bcryptjs');

const registrar = async (req, res) => {
    const { nom, correo, contra, rol } = req.body;

    try {
        const [existe] = await db.query('SELECT * FROM usuarios WHERE email = ?', [correo]);
        if (existe.length > 0) return res.status(400).send('El correo ya esta registrado');

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(contra, salt);

        await db.query('INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)', 
            [nom, correo, hash, rol || 'cliente']);
        
        res.send('Registro exitoso');
    } catch (error) {
        res.status(500).send('Error en el servidor: ' + error.message);
    }
};

const login = async (req, res) => {
    const { correo, contra } = req.body;

    try {
        const [user] = await db.query('SELECT * FROM usuarios WHERE email = ?', [correo]);

        if (user.length === 0) {
            return res.status(401).send('Credenciales incorrectas');
        }

        const valida = await bcrypt.compare(contra, user[0].password);
        
        if (!valida) {
            return res.status(401).send('Credenciales incorrectas');
        }

        req.session.usuarioID = user[0].id;
        req.session.rol = user[0].rol;
        req.session.nombre = user[0].nombre;

        res.json({ 
            mensaje: 'Entrando...', 
            rol: user[0].rol,
            usuario: user[0].nombre 
        });

    } catch (error) {
        res.status(500).send('Error al iniciar sesion');
    }
};

const cerrarSesion = (req, res) => {
    req.session.destroy();
    res.send('Adios');
};

module.exports = { registrar, login, cerrarSesion };