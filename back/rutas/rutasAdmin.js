const express = require('express');
const router = express.Router();

const productoController = require('../controladores/productoControlador');
const adminController = require('../controladores/adminControlador');
const { soloAdmin } = require('../middleware/verificarSesion');
const subirImg = require('../middleware/gestorImagenes');

router.use(soloAdmin);

router.get('/usuarios', adminController.verUsuarios);
router.delete('/usuarios/:id', adminController.borrarUsuario);
router.get('/dashboard-datos', adminController.datosDashboard);

router.post('/productos', subirImg.single('foto'), productoController.crearPlanta);
router.put('/productos/:id', subirImg.single('foto'), productoController.editarPlanta);
router.delete('/productos/:id', productoController.eliminarPlanta);

module.exports = router;