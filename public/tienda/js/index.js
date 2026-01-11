document.addEventListener('DOMContentLoaded', async () => {
    const contenedor = document.getElementById('contenedor-productos');
    try {
        const res = await fetch('/api/public/productos/top'); 
        const productos = await res.json();
        
        contenedor.innerHTML = '';
        
        if (productos.length === 0) {
            contenedor.innerHTML = '<p>Pronto tendremos novedades.</p>';
            return;
        }

        productos.forEach(p => {
            const imgUrl = p.imagen ? `/imagenes/productos/${p.imagen}` : 'https://via.placeholder.com/300x250?text=Sin+Imagen';
            const card = document.createElement('div');
            card.className = 'producto-card';
            card.innerHTML = `
                <img src="${imgUrl}" class="producto-img" alt="${p.nombre}" onerror="this.src='https://via.placeholder.com/300x250?text=Error+Imagen'">
                <div class="producto-info">
                    <h3>${p.nombre}</h3>
                    <p class="producto-precio">$${p.precio}</p>
                    <a href="catalogo.html" class="btn-login" style="display:block; text-align:center; margin-top:10px;">Ver en Catálogo</a>
                </div>
            `;
            contenedor.appendChild(card);
        });
    } catch (error) {
        console.error(error);
        contenedor.innerHTML = '<p style="color:red">Error cargando destacados</p>';
    }
});