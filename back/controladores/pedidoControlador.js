const db = require('../configuracion/BaseDatos');

const crearPedido = async (req, res) => {
    const id_usuario = req.session.usuarioID; 
    const { productos } = req.body; 

    try {
        const [detalles] = await db.query('SELECT id FROM clientes_detalles WHERE usuario_id = ?', [id_usuario]);
        
        if (detalles.length === 0) {
            return res.status(400).json({ 
                error: 'Falta direccion', 
                mensaje: 'Debes registrar tu dirección de envío en tu perfil antes de comprar.' 
            });
        }

        let total = 0;
        
        for (let item of productos) {
            const [prod] = await db.query('SELECT precio, stock FROM productos WHERE id = ?', [item.id]);
            if (prod.length === 0) return res.status(404).send(`Producto ${item.id} no existe`);
            
            if (prod[0].stock < item.cantidad) {
                return res.status(400).send(`Stock insuficiente para el producto ID: ${item.id}`);
            }
            total += prod[0].precio * item.cantidad;
        }

        const [resPedido] = await db.query('INSERT INTO pedidos (usuario_id, total, estado) VALUES (?, ?, "pendiente")', 
            [id_usuario, total]);
        
        const idPedido = resPedido.insertId;

        for (let item of productos) {
            const [prod] = await db.query('SELECT precio FROM productos WHERE id = ?', [item.id]);
            
            await db.query('INSERT INTO detalles_pedido (pedido_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)', 
                [idPedido, item.id, item.cantidad, prod[0].precio]);
            
            await db.query('UPDATE productos SET stock = stock - ? WHERE id = ?', 
                [item.cantidad, item.id]);
        }

        res.json({ mensaje: 'Compra realizada con exito', pedidoId: idPedido });

    } catch (error) {
        console.error(error);
        res.status(500).send('Error al procesar la compra: ' + error.message);
    }
};

const obtenerPedidosAdmin = async (req, res) => {
    try {
        const sql = `
            SELECT p.id, p.total, p.estado, p.fecha, u.nombre as cliente, 
                   d.direccion_calle, d.ciudad 
            FROM pedidos p
            JOIN usuarios u ON p.usuario_id = u.id
            LEFT JOIN clientes_detalles d ON u.id = d.usuario_id
            ORDER BY p.fecha DESC
        `;
        const [pedidos] = await db.query(sql);
        res.json(pedidos);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error obteniendo pedidos');
    }
};

const obtenerMisPedidos = async (req, res) => {
    const id = req.session.usuarioID;
    try {
        const sql = `
            SELECT id, total, estado, fecha 
            FROM pedidos 
            WHERE usuario_id = ? 
            ORDER BY fecha DESC
        `;
        const [pedidos] = await db.query(sql, [id]);
        res.json(pedidos);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener pedidos');
    }
};

const actualizarEstadoPedido = async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body; 

    try {
        await db.query('UPDATE pedidos SET estado = ? WHERE id = ?', [estado, id]);
        res.send('Estado del pedido actualizado');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error actualizando pedido');
    }
};

module.exports = { crearPedido, obtenerPedidosAdmin, obtenerMisPedidos, actualizarEstadoPedido };