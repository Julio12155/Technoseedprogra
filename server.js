const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PUERTO || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/imagenes', express.static(path.join(__dirname, 'public/imagenes')));
app.use('/admin', express.static(path.join(__dirname, 'public/administracion')));
app.use('/cliente', express.static(path.join(__dirname, 'public/clientes')));
app.use('/', express.static(path.join(__dirname, 'public/tienda')));

const rutasAuth = require('./back/rutas/rutasAuth');
const rutasAdmin = require('./back/rutas/rutasAdmin');
const rutasPublicas = require('./back/rutas/rutasPublicas');

app.use('/api/auth', rutasAuth);
app.use('/api/admin', rutasAdmin);
app.use('/api/publico', rutasPublicas);

app.listen(PORT, () => {
    console.log(`Servidor Vivero Solís corriendo en puerto ${PORT}`);
});