const express = require('express');
const router = express.Router();
const productoCtrl = require('../controladores/productoControlador');
const clienteCtrl = require('../controladores/clienteControlador');
const pedidoCtrl = require('../controladores/pedidoControlador');
const { soloUsuarios } = require('../middleware/verificarSesion');
const subir = require('../middleware/gestorImagenes');

router.get('/productos', productoCtrl.obtenerTodas);
router.get('/productos/top', productoCtrl.obtenerTopStock);
router.get('/productos/:id', productoCtrl.obtenerUna);
router.get('/categorias', productoCtrl.obtenerCategorias);

router.get('/mi-perfil', soloUsuarios, clienteCtrl.obtenerPerfil);
router.put('/mi-perfil/telefono', soloUsuarios, clienteCtrl.guardarTelefono);
router.put('/mi-perfil/actualizar', soloUsuarios, subir.single('avatar'), clienteCtrl.actualizarDatosPersonales);

router.get('/direcciones', soloUsuarios, clienteCtrl.obtenerDirecciones);
router.post('/direcciones', soloUsuarios, clienteCtrl.agregarDireccion);
router.delete('/direcciones/:id', soloUsuarios, clienteCtrl.eliminarDireccion);
router.put('/direcciones/:id/predeterminada', soloUsuarios, clienteCtrl.establecerPredeterminada);

router.get('/geocodificacion', soloUsuarios, clienteCtrl.consultarDireccionAPI);

router.get('/mis-pedidos', soloUsuarios, pedidoCtrl.obtenerMisPedidos);
router.get('/mis-pedidos/:id', soloUsuarios, pedidoCtrl.obtenerDetallesPedido);

router.post('/comprar', soloUsuarios, pedidoCtrl.crearPedido);

module.exports = router;