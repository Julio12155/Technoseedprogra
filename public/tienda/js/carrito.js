document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('lista-carrito')) {
        renderizarCarrito();
    }
});

let direccionSeleccionadaId = null;

function obtenerCarrito() { return JSON.parse(localStorage.getItem('carritoVivero')) || []; }
function guardarCarrito(carrito) { localStorage.setItem('carritoVivero', JSON.stringify(carrito)); }

function agregarAlCarrito(id, nombre, precio, imagen, stockMaximo, cantidadSolicitada) {
    let carrito = obtenerCarrito();
    const item = carrito.find(p => p.id === id);
    const cant = parseInt(cantidadSolicitada);

    if (item) {
        if (item.cantidad + cant > stockMaximo) return alert('Stock insuficiente');
        item.cantidad += cant;
    } else {
        carrito.push({ id, nombre, precio, imagen, cantidad: cant, stockMax: stockMaximo });
    }
    guardarCarrito(carrito);
    alert('Agregado al carrito');
}

function eliminarDelCarrito(id) {
    let carrito = obtenerCarrito().filter(p => p.id !== id);
    guardarCarrito(carrito);
    renderizarCarrito();
}

function actualizarCantidad(id, cambio) {
    let carrito = obtenerCarrito();
    const item = carrito.find(p => p.id === id);
    if(item) {
        const nueva = item.cantidad + cambio;
        if(nueva > item.stockMax) return alert('Tope de stock alcanzado');
        if(nueva < 1) return eliminarDelCarrito(id);
        item.cantidad = nueva;
        guardarCarrito(carrito);
        renderizarCarrito();
    }
}

function renderizarCarrito() {
    const contenedor = document.getElementById('lista-carrito');
    const elTotal = document.getElementById('total-final');
    const elSub = document.getElementById('subtotal');
    if(!contenedor) return;

    const carrito = obtenerCarrito();
    contenedor.innerHTML = '';
    
    if (carrito.length === 0) {
        contenedor.innerHTML = '<p>Carrito vacío.</p>';
        if(elTotal) elTotal.innerText = '$0.00';
        return;
    }

    let total = 0;
    carrito.forEach(p => {
        total += p.precio * p.cantidad;
        const img = p.imagen ? `/imagenes/productos/${p.imagen}` : 'https://via.placeholder.com/50';
        contenedor.innerHTML += `
            <div class="item-carrito">
                <img src="${img}" alt="${p.nombre}">
                <div class="item-info">
                    <h4>${p.nombre}</h4>
                    <p>$${p.precio}</p>
                </div>
                <div class="item-controles">
                    <button onclick="actualizarCantidad(${p.id}, -1)">-</button>
                    <span>${p.cantidad}</span>
                    <button onclick="actualizarCantidad(${p.id}, 1)">+</button>
                </div>
                <div class="item-subtotal">$${(p.precio * p.cantidad).toFixed(2)}</div>
                <button class="btn-eliminar" onclick="eliminarDelCarrito(${p.id})">&times;</button>
            </div>
        `;
    });
    
    if(elTotal) elTotal.innerText = `$${total.toFixed(2)}`;
    if(elSub) elSub.innerText = `$${total.toFixed(2)}`;
}


async function abrirModalSeleccion() {
    const carrito = obtenerCarrito();
    if(carrito.length === 0) return alert('El carrito está vacío');

    try {
        const res = await fetch('/api/public/direcciones');
        if (res.status === 401) {
            alert('Inicia sesión para continuar');
            window.location.href = '../clientes/login.html';
            return;
        }

        const direcciones = await res.json();
        
        if (direcciones.length === 0) {
            alert('Necesitas registrar al menos una dirección de envío.');
            window.location.href = '../clientes/perfil.html';
            return;
        }

        const contenedor = document.getElementById('lista-direcciones-modal');
        contenedor.innerHTML = '';
        
        direccionSeleccionadaId = direcciones[0].id;

        direcciones.forEach(d => {
            const div = document.createElement('div');
            div.className = `opcion-direccion ${d.id === direccionSeleccionadaId ? 'seleccionada' : ''}`;
            div.onclick = () => seleccionarDireccion(d.id, div);
            div.innerHTML = `
                <strong>${d.alias}</strong>
                <p style="font-size:0.9rem; margin:0;">${d.calle}, ${d.ciudad}</p>
            `;
            contenedor.appendChild(div);
        });

        document.getElementById('modalSeleccion').style.display = 'block';

    } catch (error) {
        console.error(error);
        alert('Error al cargar direcciones');
    }
}

function seleccionarDireccion(id, elemento) {
    direccionSeleccionadaId = id;
    document.querySelectorAll('.opcion-direccion').forEach(el => el.classList.remove('seleccionada'));
    elemento.classList.add('seleccionada');
}

async function confirmarCompra() {
    if (!direccionSeleccionadaId) return alert('Selecciona una dirección');

    const carrito = obtenerCarrito();
    const productos = carrito.map(p => ({ id: p.id, cantidad: p.cantidad }));

    try {
        const res = await fetch('/api/public/comprar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                productos: productos,
                direccion_id: direccionSeleccionadaId 
            })
        });

        const data = await res.json();

        if (res.ok) {
            alert('¡Compra exitosa! Pedido #' + data.pedidoId);
            localStorage.removeItem('carritoVivero');
            window.location.href = '../clientes/perfil.html';
        } else {
            alert(data.mensaje || 'Error en la compra');
        }
    } catch (error) {
        console.error(error);
        alert('Error procesando el pago');
    }
}