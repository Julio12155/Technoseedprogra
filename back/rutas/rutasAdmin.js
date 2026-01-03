const express = require('express');
const router = express.Router();
const productoCtrl = require('../controladores/productoControlador');
const adminCtrl = require('../controladores/adminControlador');
const pedidoCtrl = require('../controladores/pedidoControlador');
const subirImg = require('../middleware/gestorImagenes');
const { soloAdmin } = require('../middleware/verificarSesion');

router.use(soloAdmin);

router.get('/dashboard-datos', adminCtrl.datosDashboard);

router.get('/usuarios', adminCtrl.verUsuarios); 
router.delete('/usuarios/:id', adminCtrl.borrarUsuario);

router.get('/categorias', productoCtrl.obtenerCategorias); 

router.post('/productos', subirImg.single('foto'), productoCtrl.crearPlanta);
router.put('/productos/:id', subirImg.single('foto'), productoCtrl.editarPlanta);
router.delete('/productos/:id', productoCtrl.eliminarPlanta);
router.put('/productos/reabastecer/:id', productoCtrl.reabastecerStock); 
router.get('/inventario/alertas', productoCtrl.obtenerAlertasStock); 

router.get('/pedidos', pedidoCtrl.obtenerPedidosAdmin); 
router.put('/pedidos/:id', pedidoCtrl.actualizarEstadoPedido); 

module.exports = router;