const soloUsuarios = (req, res, next) => {
    if (req.session.usuarioID) {
        next();
    } else {
        res.status(401).send('Debes iniciar sesion primero');
    }
};

const soloAdmin = (req, res, next) => {
    if (req.session.usuarioID && req.session.rol === 'admin') {
        next();
    } else {
        res.status(403).send('Acceso denegado: Solo administradores');
    }
};

module.exports = { soloUsuarios, soloAdmin };