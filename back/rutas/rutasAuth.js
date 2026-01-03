const express = require('express');
const router = express.Router();
const authController = require('../controladores/authControlador');

router.post('/registro', authController.registrar);
router.post('/login', authController.login);
router.get('/logout', authController.cerrarSesion);

module.exports = router;