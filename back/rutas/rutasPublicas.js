const express = require('express');
const router = express.Router();

const productoController = require('../controladores/productoControlador');
const clienteController = require('../controladores/clienteControlador');
const { soloUsuarios } = require('../middleware/verificarSesion');

router.get('/productos', productoController.obtenerTodas);
router.get('/productos/:id', productoController.obtenerUna);

router.get('/mi-perfil', soloUsuarios, clienteController.verPerfil);
router.put('/mi-perfil', soloUsuarios, clienteController.actualizarPerfil);
router.post('/comprar', soloUsuarios, pedidoCtrl.crearPedido);
module.exports = router;