document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
    cargarCategorias();
});

async function cargarProductos() {
    try {
        const res = await fetch('/api/public/productos');
        const productos = await res.json();
        renderizarProductos(productos);
    } catch (error) {
        console.error(error);
    }
}

async function cargarCategorias() {
    try {
        const res = await fetch('/api/public/categorias');
        const categorias = await res.json();
        const nav = document.getElementById('categorias-nav');
        nav.innerHTML = '<button class="cat-btn active" onclick="filtrarCategoria(\'todas\')">Todas</button>';
        
        categorias.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'cat-btn';
            btn.textContent = cat.nombre;
            btn.onclick = () => filtrarCategoria(cat.id);
            nav.appendChild(btn);
        });
    } catch (error) { console.error(error); }
}

function renderizarProductos(lista) {
    const contenedor = document.getElementById('lista-productos');
    contenedor.innerHTML = '';
    
    lista.forEach(p => {
        const img = p.imagen ? `/imagenes/productos/${p.imagen}` : 'https://placehold.co/300';
        
        const card = document.createElement('div');
        card.className = 'producto-card';
        card.innerHTML = `
            <img src="${img}" alt="${p.nombre}" onerror="this.src='https://placehold.co/300'">
            <div class="producto-info">
                <h3>${p.nombre}</h3>
                <p class="precio">$${p.precio}</p>
                <button class="btn-agregar" onclick="agregarAlCarrito(${p.id}, '${p.nombre}', ${p.precio}, '${p.imagen}', ${p.stock}, 1)">
                    Añadir al Carrito
                </button>
                <a href="detalle.html?id=${p.id}" style="display:block; text-align:center; margin-top:0.5rem; color:var(--verde-oscuro)">Ver Detalle</a>
            </div>
        `;
        contenedor.appendChild(card);
    });
}

function filtrarCategoria(catId) {
    alert('Filtro en construcción'); 
}