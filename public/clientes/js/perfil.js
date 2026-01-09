document.addEventListener('DOMContentLoaded', () => {
    cargarPerfil();
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
            window.location.href = 'login.html';
            return;
        }
        const data = await res.json();

        document.getElementById('nombre-usuario').textContent = data.nombre;
        document.getElementById('email-usuario').textContent = data.email;
        document.getElementById('avatar-letra').textContent = data.nombre.charAt(0).toUpperCase();

        document.getElementById('tel').value = data.telefono || '';
        document.getElementById('calle').value = data.direccion_calle || '';
        document.getElementById('ciudad').value = data.ciudad || '';
        document.getElementById('estado').value = data.estado || '';
        document.getElementById('cp').value = data.codigo_postal || '';
        document.getElementById('instrucc').value = data.instrucciones_envio || '';

    } catch (error) {
        console.error(error);
    }
}

document.getElementById('form-direccion').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const datos = {
        tel: document.getElementById('tel').value,
        calle: document.getElementById('calle').value,
        ciudad: document.getElementById('ciudad').value,
        estado: document.getElementById('estado').value,
        cp: document.getElementById('cp').value,
        instrucc: document.getElementById('instrucc').value
    };

    try {
        const res = await fetch('/api/public/mi-perfil/direccion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        if (res.ok) {
            alert('Dirección guardada correctamente');
        } else {
            alert('Error al guardar');
        }
    } catch (error) {
        console.error(error);
    }
});

async function cargarPedidos() {
    try {
        const res = await fetch('/api/public/mis-pedidos');
        const pedidos = await res.json();
        
        const contenedor = document.getElementById('lista-pedidos');
        contenedor.innerHTML = '';

        if (pedidos.length === 0) {
            contenedor.innerHTML = '<p>No tienes pedidos aún.</p>';
            return;
        }

        pedidos.forEach(p => {
            const fecha = new Date(p.fecha).toLocaleDateString();
            let clase = 'status-pendiente';
            if (p.estado === 'entregado') clase = 'status-entregado';

            const div = document.createElement('div');
            div.className = 'pedido-item';
            div.innerHTML = `
                <div>
                    <strong>Pedido #${p.id}</strong>
                    <p style="font-size: 0.9rem; color: #666;">${fecha}</p>
                </div>
                <div style="text-align: right;">
                    <p style="font-weight: bold; font-size: 1.1rem;">$${p.total}</p>
                    <span class="status-badge ${clase}">${p.estado}</span>
                </div>
            `;
            contenedor.appendChild(div);
        });
    } catch (error) {
        console.error(error);
    }
}