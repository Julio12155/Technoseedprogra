document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
    cargarCategorias();
});

let productosGlobal = []; 

async function cargarProductos() {
    try {
        const res = await fetch('/api/public/productos');
        productosGlobal = await res.json();
        renderizarProductos(productosGlobal);
    } catch (error) {
        console.error(error);
    }
}

async function cargarCategorias() {
    try {
        const res = await fetch('/api/public/categorias');
        const categorias = await res.json();
        const nav = document.getElementById('categorias-nav');
        
        if (!nav) return; 

        nav.innerHTML = '<button class="cat-btn active" onclick="filtrarCategoria(\'todas\', this)">Todas</button>';
        
        categorias.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'cat-btn';
            btn.textContent = cat.nombre;
            btn.onclick = () => filtrarCategoria(cat.id, btn);
            nav.appendChild(btn);
        });
    } catch (error) { console.error(error); }
}

function filtrarCategoria(idCategoria, btnElement) {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    if(btnElement) btnElement.classList.add('active');

    if (idCategoria === 'todas') {
        renderizarProductos(productosGlobal);
    } else {
        const filtrados = productosGlobal.filter(p => p.categoria_id === idCategoria);
        renderizarProductos(filtrados);
    }
}

function renderizarProductos(lista) {
    const contenedor = document.getElementById('lista-productos');
    if (!contenedor) return; 

    contenedor.innerHTML = '';
    
    if (lista.length === 0) {
        contenedor.innerHTML = '<p style="text-align:center; width:100%;">No hay productos en esta categoría.</p>';
        return;
    }

    lista.forEach(p => {
        const hayStock = p.stock > 0;
        const textoStock = hayStock ? `Disponibles: ${p.stock}` : 'Agotado';
        const claseStock = hayStock ? 'stock-info' : 'stock-info stock-agotado';
        
        const img = p.imagen ? `/imagenes/productos/${p.imagen}` : 'https://placehold.co/300x250?text=Sin+Imagen';

        const card = document.createElement('div');
        card.className = 'producto-card';
        card.innerHTML = `
            <img src="${img}" alt="${p.nombre}" onerror="this.src='https://placehold.co/300x250?text=Sin+Imagen'">
            <div class="producto-info">
                <h3>${p.nombre}</h3>
                <p style="font-size: 0.8rem; color: #888;">${p.nombre_categoria || 'General'}</p>
                <p class="${claseStock}">${textoStock}</p>
                <p class="precio">$${p.precio}</p>
                
                <div class="controls-compra">
                    <input type="number" id="cant-${p.id}" value="1" min="1" max="${p.stock}" ${!hayStock ? 'disabled hidden' : ''} style="width: 50px; padding: 5px;">
                    <button class="btn-agregar ${!hayStock ? 'disabled' : ''}" 
                        onclick="validarYAgregar(${p.id}, '${p.nombre}', ${p.precio}, '${p.imagen}', ${p.stock})"
                        ${!hayStock ? 'disabled' : ''}>
                        ${hayStock ? 'Agregar' : 'Sin Stock'}
                    </button>
                </div>
            </div>
        `;
        contenedor.appendChild(card);
    });
}

function validarYAgregar(id, nombre, precio, imagen, stock) {
    const input = document.getElementById(`cant-${id}`);
    const cantidad = parseInt(input.value);

    if (isNaN(cantidad) || cantidad < 1) {
        alert("La cantidad debe ser al menos 1");
        return;
    }
    
    agregarAlCarrito(id, nombre, precio, imagen, stock, cantidad);
}