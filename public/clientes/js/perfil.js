let map = null;
let marker = null;

document.addEventListener('DOMContentLoaded', () => {
    cargarPerfil();
    cargarDirecciones();
    cargarPedidos();
});

function cambiarTab(tabId) {
    document.querySelectorAll('.seccion').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.menu-opciones button').forEach(el => el.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    document.getElementById(`btn-${tabId}`).classList.add('active');
}

async function cargarPerfil() {
    try {
        const res = await fetch('/api/public/mi-perfil');
        if (res.status === 401) {
            console.warn('Sesión no iniciada. Redirigiendo en 3 segundos...');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000);
            return;
        }
        const data = await res.json();

        document.getElementById('nombre-usuario').textContent = data.nombre;
        document.getElementById('email-usuario').textContent = data.email;

        const avatarContainer = document.getElementById('avatar-container');
        if (data.avatar && data.avatar !== 'default.png') {
            avatarContainer.innerHTML = `<img src="/imagenes/productos/${data.avatar}" class="avatar-img" onerror="this.src='https://placehold.co/100x100?text=U'">`;
        } else {
            avatarContainer.innerHTML = `<div class="avatar" id="avatar-letra">${data.nombre.charAt(0).toUpperCase()}</div>`;
        }

        document.getElementById('edit-nombre').value = data.nombre;
        document.getElementById('edit-email').value = data.email;
        document.getElementById('edit-telefono').value = data.telefono || '';
        
        const previewImg = document.getElementById('preview-avatar');
        if (data.avatar && data.avatar !== 'default.png') {
            previewImg.src = `/imagenes/productos/${data.avatar}`;
            previewImg.onerror = () => { previewImg.src = 'https://placehold.co/100x100?text=Foto'; };
        } else {
            previewImg.src = 'https://placehold.co/100x100?text=' + data.nombre.charAt(0).toUpperCase();
        }

    } catch (error) { 
        console.error(error); 
    }
}

function mostrarPrevisualizacion(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('preview-avatar').src = e.target.result;
        }
        reader.readAsDataURL(file);
    }
}

document.getElementById('form-datos').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('nombre', document.getElementById('edit-nombre').value);
    formData.append('telefono', document.getElementById('edit-telefono').value);
    
    const fileInput = document.getElementById('input-avatar');
    if (fileInput.files[0]) {
        formData.append('avatar', fileInput.files[0]);
    }

    try {
        const res = await fetch('/api/public/mi-perfil/actualizar', {
            method: 'PUT',
            body: formData
        });

        if (res.ok) {
            alert('Datos actualizados correctamente');
            location.reload(); 
        } else {
            const mensajeError = await res.text();
            alert('Error: ' + mensajeError);
        }
    } catch (error) {
        console.error(error);
        alert('Error de conexión con el servidor');
    }
});


async function cargarDirecciones() {
    try {
        const res = await fetch('/api/public/direcciones');
        if (!res.ok) return;
        const direcciones = await res.json();
        
        const contenedor = document.getElementById('lista-direcciones');
        contenedor.innerHTML = '';

        const btnNueva = document.getElementById('btn-nueva-dir');
        if (direcciones.length >= 3) {
            btnNueva.style.display = 'none';
        } else {
            btnNueva.style.display = 'block';
        }

        if (direcciones.length === 0) {
            contenedor.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">No tienes direcciones guardadas.</p>';
            return;
        }

        direcciones.forEach(d => {
            const esPrincipal = d.es_principal === 1;
            const claseCard = esPrincipal ? 'address-card principal' : 'address-card';
            const badge = esPrincipal ? '<span class="badge-principal">Predeterminada</span>' : '';
            
            const btnPrincipal = !esPrincipal 
                ? `<button class="action-btn" onclick="hacerPrincipal(${d.id})">★ Fijar</button>` 
                : '';

            const div = document.createElement('div');
            div.className = claseCard;
            div.innerHTML = `
                ${badge}
                <h4>${d.alias}</h4>
                <p style="font-weight:bold; margin: 5px 0;">${d.calle}</p>
                <p style="font-size: 0.9rem;">${d.ciudad}, ${d.estado}, CP: ${d.codigo_postal}</p>
                ${d.instrucciones ? `<p style="font-size: 0.85rem; color: #666; margin-top:5px;"><em>Nota: ${d.instrucciones}</em></p>` : ''}
                
                <div class="card-actions">
                    ${btnPrincipal}
                    <button class="action-btn btn-danger" onclick="eliminarDireccion(${d.id})">Eliminar</button>
                </div>
            `;
            contenedor.appendChild(div);
        });
    } catch (error) { console.error(error); }
}

async function eliminarDireccion(id) {
    if(!confirm('¿Borrar esta dirección?')) return;
    try {
        const res = await fetch(`/api/public/direcciones/${id}`, { method: 'DELETE' });
        if(res.ok) cargarDirecciones();
    } catch(e) { console.error(e); }
}

async function hacerPrincipal(id) {
    try {
        await fetch(`/api/public/direcciones/${id}/predeterminada`, { method: 'PUT' });
        cargarDirecciones();
    } catch(e) { console.error(e); }
}

function abrirModalDireccion() {
    document.getElementById('modalDireccion').style.display = 'block';
    
    if (!map) {
        map = L.map('mapa').setView([19.4326, -99.1332], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        map.on('click', async function(e) {
            const { lat, lng } = e.latlng;
            
            if (marker) {
                marker.setLatLng([lat, lng]);
            } else {
                marker = L.marker([lat, lng]).addTo(map);
            }

            document.getElementById('calle').value = 'Buscando dirección...';
            
            try {
                const url = `/api/public/geocodificacion?lat=${lat}&lon=${lng}`;
                const response = await fetch(url);
                const data = await response.json();

                const addr = data.address;
                document.getElementById('calle').value = `${addr.road || ''} ${addr.house_number || ''}`;
                document.getElementById('ciudad').value = addr.city || addr.town || addr.village || '';
                document.getElementById('estado').value = addr.state || '';
                document.getElementById('cp').value = addr.postcode || '';
                document.getElementById('lat').value = lat;
                document.getElementById('lng').value = lng;

            } catch (error) {
                document.getElementById('calle').value = '';
                alert('No se pudo obtener la dirección automática.');
            }
        });
    } else {
        setTimeout(() => map.invalidateSize(), 100);
    }
}

function cerrarModalDireccion() {
    document.getElementById('modalDireccion').style.display = 'none';
    document.getElementById('form-nueva-direccion').reset();
    if(marker) map.removeLayer(marker);
    marker = null;
}

document.getElementById('form-nueva-direccion').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const datos = {
        alias: document.getElementById('alias').value,
        calle: document.getElementById('calle').value,
        ciudad: document.getElementById('ciudad').value,
        estado: document.getElementById('estado').value,
        cp: document.getElementById('cp').value,
        lat: document.getElementById('lat').value,
        lng: document.getElementById('lng').value,
        instrucc: document.getElementById('instrucc').value
    };

    if(!datos.calle) return alert('Debes seleccionar una ubicación en el mapa o escribir la calle');

    try {
        const res = await fetch('/api/public/direcciones', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(datos)
        });

        if (res.ok) {
            cerrarModalDireccion();
            cargarDirecciones();
        } else {
            alert(await res.text());
        }
    } catch (e) { alert('Error de conexión'); }
});

async function cargarPedidos() {
    try {
        const res = await fetch('/api/public/mis-pedidos');
        if (!res.ok) return;
        const pedidos = await res.json();
        const contenedor = document.getElementById('lista-pedidos');
        contenedor.innerHTML = '';
        
        if (pedidos.length === 0) {
            contenedor.innerHTML = '<p>No tienes pedidos.</p>'; 
            return;
        }

        pedidos.forEach(p => {
            const div = document.createElement('div');
            div.className = 'pedido-item';
            div.innerHTML = `
                <div>
                    <strong>Pedido #${p.id}</strong>
                    <br><span style="font-size: 0.9rem; color: #666;">$${p.total}</span>
                </div>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <span class="status-badge status-${p.estado}">${p.estado}</span>
                    <button class="action-btn" onclick="verDetallesPedido(${p.id})">Ver Detalles</button>
                </div>
            `;
            contenedor.appendChild(div);
        });
    } catch (e) { console.error(e); }
}

async function verDetallesPedido(id) {
    try {
        const res = await fetch(`/api/public/mis-pedidos/${id}`);
        if (!res.ok) return alert('No se pudieron cargar los detalles');

        const data = await res.json();
        const pedido = data.info;
        const items = data.items;

        const contenido = document.getElementById('detalle-contenido');
        
        let htmlItems = '';
        items.forEach(item => {
            const subtotal = item.cantidad * item.precio_unitario;
            const imagen = item.imagen ? `/imagenes/productos/${item.imagen}` : 'https://placehold.co/50';
            
            htmlItems += `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="${imagen}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">
                        <div>
                            <p style="font-weight: bold; margin: 0;">${item.nombre}</p>
                            <p style="font-size: 0.85rem; margin: 0; color: #666;">$${item.precio_unitario} x ${item.cantidad}</p>
                        </div>
                    </div>
                    <div style="font-weight: bold;">$${subtotal.toFixed(2)}</div>
                </div>
            `;
        });

        contenido.innerHTML = `
            <div style="background-color: #f9f9f9; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                <p><strong>Pedido #${pedido.id}</strong></p>
                <p>Estado: <span class="status-badge status-${pedido.estado}">${pedido.estado}</span></p>
                <p>Fecha: ${new Date(pedido.fecha).toLocaleString()}</p>
            </div>
            
            <h4 style="margin-bottom: 1rem;">Productos</h4>
            ${htmlItems}
            
            <div style="text-align: right; margin-top: 1rem; padding-top: 1rem; border-top: 2px solid #eee;">
                <h3>Total: $${pedido.total}</h3>
            </div>
        `;

        document.getElementById('modalDetalle').style.display = 'block';

    } catch (error) {
        console.error(error);
        alert('Error al obtener detalles');
    }
}