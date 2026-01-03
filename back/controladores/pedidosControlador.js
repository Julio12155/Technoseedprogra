const db = require('../configuracion/BaseDatos');

const crearPedido = async (req, res) => {
    const { id_usuario, productos } = req.body; 

    try {
        let total = 0;
        
        for (let item of productos) {
            const [prod] = await db.query('SELECT precio, stock FROM productos WHERE id = ?', [item.id]);
            if (prod.length === 0) return res.status(404).send(`Producto ${item.id} no existe`);
            
            if (prod[0].stock < item.cantidad) {
                return res.status(400).send(`No hay suficiente stock para el producto ID: ${item.id}`);
            }
            total += prod[0].precio * item.cantidad;
        }

        const [resultadoPedido] = await db.query('INSERT INTO pedidos (usuario_id, total, estado, fecha) VALUES (?, ?, "pendiente", NOW())', 
            [id_usuario, total]);
        
        const idPedido = resultadoPedido.insertId;

        for (let item of productos) {
            await db.query('INSERT INTO detalles_pedido (pedido_id, producto_id, cantidad) VALUES (?, ?, ?)', 
                [idPedido, item.id, item.cantidad]);
            
            await db.query('UPDATE productos SET stock = stock - ? WHERE id = ?', 
                [item.cantidad, item.id]);
        }

        res.json({ mensaje: 'Compra realizada con exito', pedidoId: idPedido });

    } catch (error) {
        res.status(500).send('Error al procesar la compra: ' + error.message);
    }
};

const obtenerPedidosAdmin = async (req, res) => {
    try {
        const sql = `
            SELECT p.id, p.total, p.estado, p.fecha, u.nombre as cliente
            FROM pedidos p
            JOIN usuarios u ON p.usuario_id = u.id
            ORDER BY p.fecha DESC
        `;
        const [pedidos] = await db.query(sql);
        res.json(pedidos);
    } catch (error) {
        res.status(500).send('Error obteniendo pedidos');
    }
};

const actualizarEstadoPedido = async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body; 

    try {
        await db.query('UPDATE pedidos SET estado = ? WHERE id = ?', [estado, id]);
        
      
        
        res.send('Estado del pedido actualizado');
    } catch (error) {
        res.status(500).send('Error actualizando pedido');
    }
};

module.exports = { crearPedido, obtenerPedidosAdmin, actualizarEstadoPedido };