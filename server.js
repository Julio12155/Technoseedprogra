const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
// Cargo las variables de entorno para no dejar credenciales quemadas en el código
require('dotenv').config();

const app = express();

// IMPORTANTE: Como voy a hostear esto ,
// necesito que Express confíe en el primer proxy.
// Sin esto, la cookie 'secure' no funcionaría aunque tenga HTTPS, porque Express pensaría que la conexión es insegura.
app.set('trust proxy', 1);

// Habilito CORS para evitar bloqueos básicos del navegador, aunque al servir el front desde aquí mismo, es menos crítico.
app.use(cors());

// Middleware para entender JSON y datos de formularios en las peticiones (req.body)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de la sesión de usuario
app.use(session({
    secret: process.env.SESSION_SECRET || 'vivero_secreto_key', // Llave para firmar la cookie
    resave: false, // No guardar si no hubo cambios (mejora rendimiento)
    saveUninitialized: false, // No crear sesiones vacías a visitantes anónimos
    cookie: { 
        // AQUI ESTA LA MAGIA DEL DEPLOY:
        // Si estoy en 'production', fuerzo que la cookie solo viaje por HTTPS (secure: true).
        // Si estoy en desarrollo (localhost), permito HTTP normal (secure: false).
        secure: process.env.NODE_ENV === 'production' 
    }
}));

// Middleware de Seguridad para la carpeta de Administración
// Intercepto cualquier petición que vaya a /administracion.
// Si no es admin, lo pateo al login. Así protejo los HTMLs estáticos del panel.
app.use('/administracion', (req, res, next) => {
    if (req.session && req.session.usuarioID && req.session.rol === 'admin') {
        next(); // Es admin, pásale
    } else {
        res.redirect('/clientes/login.html'); // Intruso detectado, al login
    }
});

// Sirvo toda la carpeta 'public' como archivos estáticos.
// Esto permite que el navegador acceda directo a las imágenes, CSS y JS del front.
app.use(express.static(path.join(__dirname, 'public')));

// Importo mis rutas de backend (API)
const rutasAuth = require('./back/rutas/rutasAuth');
const rutasAdmin = require('./back/rutas/rutasAdmin');
const rutasPublicas = require('./back/rutas/rutasPublicas');

// Asigno los prefijos a las rutas. Todo lo de auth empieza con /api/auth, etc.
app.use('/api/auth', rutasAuth);
app.use('/api/admin', rutasAdmin);
app.use('/api/public', rutasPublicas);

// Si entran a la raíz (localhost:3000/), no quiero que vean error,
// mejor los redirijo amablemente a la tienda principal.
app.get('/', (req, res) => {
    res.redirect('/tienda/index.html');
});

// Levanto el servidor escuchando en el puerto definido en el .env o el 3000 por defecto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});